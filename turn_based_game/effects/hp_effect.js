/**
 * HpEffect - 体力效果模块
 * 整合原 DamageEffect 和 HealEffect
 * 处理所有体力变化：伤害、治疗、吸取、反弹
 */
(() => {
    const HpEffect = {
        // ========== 伤害相关 ==========

        /**
         * 造成固定伤害
         */
        fixed(game, target, amount, label = "固定伤害", options = {}) {
            return game.damageSystem.apply({
                type: 'fixed',
                source: options.source || null,
                target,
                amount,
                label,
                options
            });
        },

        /**
         * 造成百分比伤害（基于最大生命）
         */
        percent(game, target, ratio, label = "百分比伤害", options = {}) {
            const amount = Math.floor(target.maxHp * ratio);
            return game.damageSystem.apply({
                type: 'percent',
                source: options.source || null,
                target,
                amount,
                label,
                options
            });
        },

        /**
         * 造成百分比伤害（基于当前生命）
         */
        percentCurrent(game, target, ratio, label = "百分比伤害", options = {}) {
            const amount = Math.floor(target.hp * ratio);
            return game.damageSystem.apply({
                type: 'percent',
                source: options.source || null,
                target,
                amount,
                label,
                options
            });
        },

        /**
         * 造成真实伤害（无视抗性）
         */
        trueDamage(game, target, amount, label = "真实伤害", options = {}) {
            return game.damageSystem.apply({
                type: 'true',
                source: options.source || null,
                target,
                amount,
                label,
                options
            });
        },

        /**
         * 吸取伤害（造成伤害并恢复）
         */
        drain(game, source, target, amount, label = "吸取", options = {}) {
            const dealt = this.fixed(game, target, amount, label, { ...options, source });
            if (dealt > 0) {
                this.heal(game, source, dealt, "吸取");
            }
            return dealt;
        },

        /**
         * 吸取百分比生命
         */
        drainPercent(game, source, target, ratio, label = "吸取", options = {}) {
            const amount = Math.floor(target.maxHp * ratio);
            return this.drain(game, source, target, amount, label, options);
        },

        /**
         * 反弹伤害
         */
        reflect(game, source, target, amount, multiplier = 100, label = "反弹伤害") {
            const reflectAmount = Math.floor(amount * multiplier / 100);
            return this.trueDamage(game, target, reflectAmount, label, { source });
        },

        /**
         * 检查臣服状态（无法造成伤害）
         */
        checkSubmit(game, attacker) {
            if (attacker.buffs.turnEffects.some(e => e.id === 'submit')) {
                game.log(`${attacker.name} 处于臣服状态，无法造成任何伤害！`);
                game.showFloatingText('臣服', attacker === game.player, '#f88');
                return true;
            }
            return false;
        },

        /**
         * 状态伤害（毒、烧伤等回合结束伤害）
         */
        statusDamage(game, target, statusId, options = {}) {
            const damageMap = {
                'poison': () => Math.floor(target.maxHp / 8),
                'frostbite': () => Math.floor(target.maxHp / 8),
                'burn': () => Math.floor(target.maxHp / 8),
                'immolate': () => Math.floor(target.maxHp / 8),
                'silence': () => Math.floor(target.maxHp / 8),
                'curse_fire': () => Math.floor(target.maxHp / 8),
                'bleed': () => 80,
                'parasite': () => Math.floor(target.maxHp / 8),
                'confuse': () => Math.random() < 0.05 ? 50 : 0
            };

            const calcDamage = damageMap[statusId];
            if (!calcDamage) return 0;

            const amount = calcDamage();
            if (amount <= 0) return 0;

            const labelMap = {
                'poison': '毒伤害',
                'frostbite': '冻伤伤害',
                'burn': '烧伤伤害',
                'immolate': '焚烬伤害',
                'silence': '沉默伤害',
                'curse_fire': '烈焰诅咒伤害',
                'bleed': '流血伤害',
                'parasite': '寄生伤害',
                'confuse': '混乱自伤'
            };

            return game.damageSystem.apply({
                type: statusId === 'bleed' || statusId === 'confuse' ? 'fixed' : 'percent',
                target,
                amount,
                label: `${target.name} 受到${labelMap[statusId] || statusId}`,
                options: { tag: statusId }
            });
        },

        // ========== 治疗相关 ==========

        /**
         * 基础治疗
         */
        heal(game, target, amount, source = "治疗", options = {}) {
            if (!target || target.hp <= 0) return 0;

            // 检查禁疗状态
            if (this.checkHealBlock(game, target)) {
                game.log(`${target.name} 处于禁疗状态，无法恢复体力！`);
                return 0;
            }

            const before = target.hp;
            target.hp = Math.min(target.maxHp, target.hp + amount);
            const healed = target.hp - before;

            if (healed > 0) {
                game.log(`${target.name} 恢复了 ${healed} 点体力！(${source})`);
                game.showFloatingText(`+${healed}`, target === game.player, '#4f4');
            }

            // 触发 SoulEffect 的恢复事件
            try {
                if (window.SoulEffect && window.SoulEffect.run) {
                    window.SoulEffect.run(target.key, window.SoulEffect.Phases.ON_HEAL, game, { target, amount: healed, source });

                    const teams = [game.playerTeam || [], game.enemyTeam || []];
                    for (const team of teams) {
                        if (team.includes(target)) {
                            for (const member of team) {
                                if (member && member.key && member !== target) {
                                    window.SoulEffect.run(member.key, window.SoulEffect.Phases.ON_TEAM_MEMBER_HEAL, game, { healed: target, amount: healed, source });
                                }
                            }
                            break;
                        }
                    }
                }
            } catch (err) {
                console.error('HpEffect: failed to notify SoulEffect', err);
            }

            game.updateUI();
            return healed;
        },

        /**
         * 百分比治疗（基于最大生命）
         */
        healPercent(game, target, ratio, source = "治疗", options = {}) {
            const amount = Math.floor(target.maxHp * ratio);
            return this.heal(game, target, amount, source, options);
        },

        /**
         * 治疗至满血
         */
        healFull(game, target, source = "治疗", options = {}) {
            return this.heal(game, target, target.maxHp, source, options);
        },

        /**
         * 检查禁疗状态
         */
        checkHealBlock(game, target) {
            return target.buffs.turnEffects.some(e =>
                e.id === 'heal_block' || e.id === 'heal_block_skill'
            );
        },

        /**
         * 再生效果（回合结束触发）
         */
        regen(game, target, amount, source = "再生") {
            if (window.StatusEffect?.isControlled(target)) {
                return 0;
            }
            return this.heal(game, target, amount, source);
        },

        /**
         * 百分比再生
         */
        regenPercent(game, target, ratio, source = "再生") {
            const amount = Math.floor(target.maxHp * ratio);
            return this.regen(game, target, amount, source);
        }
    };

    window.HpEffect = HpEffect;
    // Backward compatibility aliases (optional, but good for transition)
    window.DamageEffect = HpEffect;
    window.HealEffect = HpEffect;
})();
