/**
 * HealEffect - 治疗效果模块
 * 处理所有恢复相关：治疗、吸取、再生
 */
(() => {
    const HealEffect = {
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

            // 触发 SoulEffect 的恢复事件，通知自身与队友的魂印
            try {
                if (window.SoulEffect && window.SoulEffect.run) {
                    // 自身恢复事件
                    window.SoulEffect.run(target.key, window.SoulEffect.Phases.ON_HEAL, game, { target, amount: healed, source });

                    // 队友恢复事件（通知同队其他精灵）
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
                console.error('HealEffect: failed to notify SoulEffect', err);
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
            // 检查控制状态
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

    window.HealEffect = HealEffect;
})();
