/**
 * ShieldEffect - 护盾效果模块
 * 处理所有护盾相关：次数护盾、数值护盾、免疫护盾
 */
(() => {
    const ShieldEffect = {
        /**
         * 添加次数护盾（抵挡N次攻击）
         */
        addCountShield(game, target, count, source = "护盾") {
            target.buffs.shield = (target.buffs.shield || 0) + count;
            game.log(`${target.name} 获得了 ${count} 次护盾！(${source})`);
            game.updateUI();
            return true;
        },

        /**
         * 添加数值护盾（抵挡固定伤害量）
         */
        addHpShield(game, target, amount, source = "护盾") {
            target.buffs.shieldHp = (target.buffs.shieldHp || 0) + amount;
            game.log(`${target.name} 获得了 ${amount} 点护盾！(${source})`);
            game.updateUI();
            return true;
        },

        /**
         * 添加免疫护盾（免疫下N次攻击）
         */
        addImmuneShield(game, target, count, source = "免疫") {
            game.addTurnEffect(target, '免疫', count, 'immune_next_attack', `免疫下${count}次攻击`);
            game.log(`${target.name} 免疫下 ${count} 次攻击！(${source})`);
            return true;
        },

        /**
         * 消耗次数护盾
         * @returns {boolean} 是否有护盾被消耗
         */
        consumeCountShield(game, target) {
            if (target.buffs.shield > 0) {
                target.buffs.shield--;
                game.log(`${target.name} 的护盾抵挡了攻击！`);
                game.updateUI();
                return true;
            }
            return false;
        },

        /**
         * 消耗数值护盾
         * @returns {number} 剩余伤害（护盾吸收后）
         */
        consumeHpShield(game, target, damage) {
            if (target.buffs.shieldHp <= 0) return damage;

            if (target.buffs.shieldHp >= damage) {
                target.buffs.shieldHp -= damage;
                game.log(`护盾抵挡了 ${damage} 点伤害！`);
                game.updateUI();
                return 0;
            } else {
                const absorbed = target.buffs.shieldHp;
                const remaining = damage - absorbed;
                target.buffs.shieldHp = 0;
                game.log(`护盾抵挡了 ${absorbed} 点伤害！`);
                game.updateUI();
                return remaining;
            }
        },

        /**
         * 检查免疫护盾
         * @returns {boolean} 是否免疫
         */
        checkImmuneShield(game, target, ignoreImmune = false) {
            const immuneIdx = target.buffs.turnEffects.findIndex(e => e.id === 'immune_next_attack');
            if (immuneIdx !== -1) {
                if (ignoreImmune) {
                    game.log(`无视免疫效果，攻击继续！`);
                    target.buffs.turnEffects.splice(immuneIdx, 1);
                    return false;
                } else {
                    game.log(`${target.name} 免疫了本次攻击！`);
                    target.buffs.turnEffects.splice(immuneIdx, 1);
                    return true;
                }
            }
            return false;
        },

        /**
         * 检查 Agnes 火种护盾
         */
        checkAgnesShield(game, target, ignoreImmune = false) {
            if (target.buffs.agnesShield) {
                if (ignoreImmune) {
                    game.log(`无视火种保护，攻击继续！`);
                    target.buffs.agnesShield = false;
                    return false;
                } else {
                    game.log(`${target.name} 的火种永存使攻击失效了！`);
                    target.buffs.agnesShield = false;
                    return true;
                }
            }
            return false;
        },

        /**
         * 清除所有护盾
         */
        clearAll(game, target) {
            let cleared = false;
            if (target.buffs.shield > 0) {
                target.buffs.shield = 0;
                cleared = true;
            }
            if (target.buffs.shieldHp > 0) {
                target.buffs.shieldHp = 0;
                cleared = true;
            }
            if (cleared) {
                game.log(`${target.name} 的护盾被清除了！`);
                game.updateUI();
            }
            return cleared;
        },

        /**
         * 检查是否有护盾
         */
        hasShield(target) {
            return (target.buffs.shield > 0) || (target.buffs.shieldHp > 0);
        }
    };

    window.ShieldEffect = ShieldEffect;
})();
