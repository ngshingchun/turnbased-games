/**
 * StatEffect - 属性效果模块
 * 处理所有能力等级变化：提升、下降、反转、清除、吸取、同步
 */
(() => {
    const StatEffect = {
        STATS: ['attack', 'defense', 'speed', 'specialAttack', 'specialDefense', 'accuracy'],

        LABELS: {
            attack: '攻',
            defense: '防',
            speed: '速',
            specialAttack: '特攻',
            specialDefense: '特防',
            accuracy: '准'
        },

        /**
         * 获取属性显示名称
         */
        getLabel(stat) {
            return this.LABELS[stat] || stat;
        },

        /**
         * 修改属性等级
         * @param {Object} changes - { attack: 1, defense: -1, ... }
         */
        modify(game, target, changes, options = {}) {
            const { source, ignoreImmune = false, silent = false } = options;
            let modified = false;

            for (const [stat, delta] of Object.entries(changes)) {
                if (!this.STATS.includes(stat) || delta === 0) continue;

                // 检查免疫下降
                if (delta < 0 && !ignoreImmune) {
                    if (target.buffs.immuneStatDrop > 0) {
                        if (!silent) game.log(`${target.name} 免疫了能力下降！`);
                        continue;
                    }
                    // 检查封强（无法提升）
                    if (target.buffs.turnEffects.some(e => e.id === 'immune_stat_up') && delta > 0) {
                        if (!silent) game.log(`${target.name} 无法进行能力提升！`);
                        continue;
                    }
                }

                const before = target.buffs.statUps[stat] || 0;
                const after = Math.max(-6, Math.min(6, before + delta));
                target.buffs.statUps[stat] = after;

                if (before !== after) {
                    modified = true;
                    if (!silent) {
                        const label = this.getLabel(stat);
                        const action = delta > 0 ? '提升' : '下降';
                        game.log(`${target.name} 的${label}${action}了${Math.abs(delta)}级！`);
                    }
                }
            }

            if (modified) game.updateUI();
            return modified;
        },

        /**
         * 全属性修改
         */
        modifyAll(game, target, delta, options = {}) {
            const changes = {};
            this.STATS.forEach(stat => changes[stat] = delta);
            return this.modify(game, target, changes, options);
        },

        /**
         * 清除正面属性（提升）
         * @returns {boolean} 是否有清除
         */
        clearUps(game, target, silent = false) {
            let cleared = false;
            for (const stat of this.STATS) {
                if (target.buffs.statUps[stat] > 0) {
                    target.buffs.statUps[stat] = 0;
                    cleared = true;
                }
            }
            if (cleared) {
                if (!silent) game.log(`${target.name} 的能力提升被清除了！`);
                game.updateUI();
            }
            return cleared;
        },

        /**
         * 清除负面属性（下降）
         */
        clearDowns(game, target, silent = false) {
            let cleared = false;
            for (const stat of this.STATS) {
                if (target.buffs.statUps[stat] < 0) {
                    target.buffs.statUps[stat] = 0;
                    cleared = true;
                }
            }
            if (cleared) {
                if (!silent) game.log(`${target.name} 的能力下降被清除了！`);
                game.updateUI();
            }
            return cleared;
        },

        /**
         * 清除所有属性变化
         */
        clearAll(game, target, silent = false) {
            let cleared = false;
            for (const stat of this.STATS) {
                if (target.buffs.statUps[stat] !== 0) {
                    target.buffs.statUps[stat] = 0;
                    cleared = true;
                }
            }
            if (cleared) {
                if (!silent) game.log(`${target.name} 的所有能力变化被清除了！`);
                game.updateUI();
            }
            return cleared;
        },

        /**
         * 反转属性（正变负，负变正）
         * @param {boolean} upsOnly - 仅反转正面属性
         */
        reverse(game, target, upsOnly = false, silent = false) {
            let reversed = false;
            for (const stat of this.STATS) {
                const val = target.buffs.statUps[stat];
                if (upsOnly && val <= 0) continue;
                if (val !== 0) {
                    target.buffs.statUps[stat] = -val;
                    reversed = true;
                }
            }
            if (reversed) {
                if (!silent) game.log(`${target.name} 的能力变化被反转了！`);
                game.updateUI();
            }
            return reversed;
        },

        /**
         * 吸取对手正面属性
         */
        steal(game, source, target, silent = false) {
            let stolen = false;
            for (const stat of this.STATS) {
                if (target.buffs.statUps[stat] > 0) {
                    source.buffs.statUps[stat] = (source.buffs.statUps[stat] || 0) + target.buffs.statUps[stat];
                    target.buffs.statUps[stat] = 0;
                    stolen = true;
                }
            }
            if (stolen) {
                if (!silent) game.log(`${source.name} 吸取了 ${target.name} 的能力提升！`);
                game.updateUI();
            }
            return stolen;
        },

        /**
         * 复制属性到自身
         */
        copy(game, source, target, silent = false) {
            let copied = false;
            for (const stat of this.STATS) {
                if (target.buffs.statUps[stat] > 0) {
                    source.buffs.statUps[stat] = (source.buffs.statUps[stat] || 0) + target.buffs.statUps[stat];
                    copied = true;
                }
            }
            if (copied) {
                if (!silent) game.log(`${source.name} 复制了 ${target.name} 的能力提升！`);
                game.updateUI();
            }
            return copied;
        },

        /**
         * 同步属性（使对手属性不超过自身）
         */
        sync(game, source, target, silent = false) {
            let synced = false;
            for (const stat of this.STATS) {
                if (target.buffs.statUps[stat] > source.buffs.statUps[stat]) {
                    target.buffs.statUps[stat] = source.buffs.statUps[stat];
                    synced = true;
                }
            }
            if (synced) {
                if (!silent) game.log(`${source.name} 同步了 ${target.name} 的能力等级！`);
                game.updateUI();
            }
            return synced;
        },

        /**
         * 转移负面属性到对手
         */
        transferDowns(game, source, target, silent = false) {
            let transferred = false;
            const drops = {};
            for (const stat of this.STATS) {
                if (source.buffs.statUps[stat] < 0) {
                    drops[stat] = source.buffs.statUps[stat];
                    source.buffs.statUps[stat] = 0;
                    transferred = true;
                }
            }
            if (transferred) {
                this.modify(game, target, drops, { silent: true });
                if (!silent) game.log(`${source.name} 将能力下降转移给了 ${target.name}！`);
                game.updateUI();
            }
            return transferred;
        },

        /**
         * 检查是否有正面属性
         */
        hasUps(target) {
            return this.STATS.some(stat => target.buffs.statUps[stat] > 0);
        },

        /**
         * 检查是否有负面属性
         */
        hasDowns(target) {
            return this.STATS.some(stat => target.buffs.statUps[stat] < 0);
        },

        /**
         * 计算正面属性数量
         */
        countUps(target) {
            return this.STATS.filter(stat => target.buffs.statUps[stat] > 0).length;
        },

        /**
         * 计算属性等级加成（用于伤害计算）
         */
        getMultiplier(target, stat) {
            const stage = target.buffs.statUps[stat] || 0;
            if (stage > 0) return (stage + 2) / 2;
            if (stage < 0) return 2 / (Math.abs(stage) + 2);
            return 1;
        },

        // ========== 伤害加成相关（原 DamageBoostEffect） ==========

        /**
         * 添加伤害提升（次数）
         */
        addDamageBoost(game, target, count, percent = 100, source = "伤害提升") {
            target.buffs.damageBoostNext = (target.buffs.damageBoostNext || 0) + count;
            target.buffs.damageBoostVal = percent;
            game.log(`${target.name} 下 ${count} 次攻击伤害+${percent}%！(${source})`);
            game.updateUI();
        },

        /**
         * 添加易伤状态（路由到 TurnEffect）
         */
        addVulnerability(game, target, turns, percent = 100, source = "易伤") {
            game.addTurnEffect(target, '易伤', turns, 'vulnerability', `受到伤害+${percent}%`, { params: [turns, percent] });
            game.log(`${target.name} ${turns} 回合受到伤害+${percent}%！(${source})`);
        },

        /**
         * 计算攻击者伤害倍率
         */
        getAttackerDamageMultiplier(game, attacker) {
            let multiplier = 1;

            // 伤害提升 buff
            if (attacker.buffs.damageBoostNext > 0) {
                const boostVal = attacker.buffs.damageBoostVal || 100;
                multiplier *= (1 + boostVal / 100);
            }

            // 星皇伤害翻倍
            if (game.isStarSovereign?.(attacker) && attacker.buffs.starRageDamageBuffTurns > 0) {
                multiplier *= 2;
            }

            // 怒涛沧岚叠加
            if (attacker.name === "怒涛·沧岚" && attacker.buffs.damageStack > 0) {
                multiplier *= (1 + attacker.buffs.damageStack * 0.25);
            }

            // 重生之翼6层
            if (attacker.name === "重生之翼" && attacker.buffs.godlyGloryEnergy >= 6) {
                multiplier *= 1.6;
            }

            // 虚弱诅咒（减少伤害）
            if (attacker.buffs.turnEffects?.some(e => e.id === 'curse_weak')) {
                multiplier *= 0.5;
            }

            // 烧伤（减少伤害）
            if (attacker.buffs.turnEffects?.some(e => e.id === 'burn')) {
                multiplier *= 0.5;
            }

            return multiplier;
        },

        /**
         * 计算防御者受伤倍率
         */
        getDefenderDamageMultiplier(game, target) {
            let multiplier = 1;

            // 易伤状态
            const vulnEffect = target.buffs.turnEffects?.find(e => e.id === 'vulnerability');
            if (vulnEffect) {
                const pct = vulnEffect.params?.[1] || 100;
                multiplier *= (1 + pct / 100);
            } else if (target.buffs.vulnerability > 0) {
                multiplier *= 2;
            }

            // 致命诅咒
            if (target.buffs.turnEffects?.some(e => e.id === 'curse_fatal')) {
                multiplier *= 1.5;
            }

            // 衰弱状态
            const weakenStatus = target.buffs.turnEffects?.find(e => e.id === 'weaken');
            if (weakenStatus) {
                const stacks = weakenStatus.stacks || 1;
                multiplier *= (1 + stacks * 0.25);
            }

            return multiplier;
        },

        /**
         * 计算减伤倍率
         */
        getDamageReduction(game, target) {
            let reduction = 1;

            // 星皇减伤
            if (game.isStarSovereign?.(target) && target.buffs.starRageDmgReduceCount > 0) {
                reduction *= 0.5;
            }

            // 重生之翼减伤
            if (target.name === "重生之翼" && target.buffs.godlyGloryEnergy >= 1) {
                const layers = target.buffs.godlyGloryEnergy;
                reduction *= (1 - 0.08 * layers);
            }

            // 索伦森减伤
            if (target.name === "混沌魔君索伦森" && target.buffs.solensenGuardReduction) {
                reduction *= 0.5;
            }

            return reduction;
        },

        // ========== 反弹相关（原 ReflectEffect） ==========

        /**
         * 添加伤害反弹（次数）
         */
        addDamageReflect(game, target, count, multiplier = 100, source = "反弹") {
            target.buffs.reflectDamage = (target.buffs.reflectDamage || 0) + count;
            target.buffs.reflectDamageMultiplier = multiplier;
            game.log(`${target.name} 将反弹下 ${count} 次受到伤害的 ${multiplier}%！(${source})`);
            game.updateUI();
        },

        /**
         * 检查并执行伤害反弹
         */
        checkAndReflect(game, target, damage, attacker) {
            if (target.buffs.reflectDamage > 0 && damage > 0) {
                const multiplier = target.buffs.reflectDamageMultiplier || 100;
                const reflectAmount = Math.floor(damage * multiplier / 100);
                
                target.buffs.reflectDamage--;
                
                if (reflectAmount > 0) {
                    window.DamageEffect?.fixed(game, attacker, reflectAmount, "反弹伤害", { source: target });
                    game.log(`${target.name} 反弹了 ${reflectAmount} 点伤害！`);
                }
                
                game.updateUI();
                return true;
            }
            return false;
        }
    };

    window.StatEffect = StatEffect;
})();
