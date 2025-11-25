/**
 * ImmuneEffect - 免疫效果模块
 * 处理所有免疫相关：异常免疫、属性下降免疫、伤害免疫
 */
(() => {
    const ImmuneEffect = {
        /**
         * 添加异常免疫（回合数）
         */
        addAbnormalImmune(game, target, turns, source = "免疫") {
            target.buffs.immuneAbnormal = Math.max(target.buffs.immuneAbnormal || 0, turns);
            game.log(`${target.name} 获得 ${turns} 回合免疫异常状态！(${source})`);
            game.updateUI();

            if (window.TurnEffect?.run) {
                window.TurnEffect.run('immune_abnormal', game, { target, turns });
            }
        },

        /**
         * 添加异常免疫（次数）
         */
        addAbnormalImmuneCount(game, target, count, source = "免疫") {
            target.buffs.immuneAbnormalCount = Math.max(target.buffs.immuneAbnormalCount || 0, count);
            game.log(`${target.name} 免疫下 ${count} 次异常状态！(${source})`);
            game.updateUI();

            if (window.CountEffect?.run) {
                window.CountEffect.run('immune_abnormal_count', game, { target, count });
            }
        },

        /**
         * 添加属性下降免疫（回合数）
         */
        addStatDropImmune(game, target, turns, source = "免弱") {
            target.buffs.immuneStatDrop = Math.max(target.buffs.immuneStatDrop || 0, turns);
            game.log(`${target.name} 获得 ${turns} 回合免疫能力下降！(${source})`);
            game.updateUI();

            if (window.TurnEffect?.run) {
                window.TurnEffect.run('immune_stat_drop', game, { target, turns });
            }
        },

        /**
         * 添加攻击免疫（次数）
         */
        addAttackImmune(game, target, count, source = "免疫") {
            game.addTurnEffect(target, '免疫', count, 'immune_next_attack', `免疫下${count}次攻击`);
            game.log(`${target.name} 免疫下 ${count} 次攻击！(${source})`);

            if (window.CountEffect?.run) {
                window.CountEffect.run('immune_attack', game, { target, count });
            }
        },

        /**
         * 检查异常免疫
         */
        checkAbnormal(target) {
            return target.buffs.immuneAbnormal > 0 || target.buffs.immuneAbnormalCount > 0;
        },

        /**
         * 检查属性下降免疫
         */
        checkStatDrop(target) {
            return target.buffs.immuneStatDrop > 0;
        },

        /**
         * 消耗异常免疫次数
         */
        consumeAbnormalCount(game, target) {
            if (target.buffs.immuneAbnormalCount > 0) {
                target.buffs.immuneAbnormalCount--;
                game.updateUI();
                return true;
            }
            return false;
        },

        /**
         * 回合结束递减
         */
        decrement(game, char) {
            if (char.buffs.immuneAbnormal > 0) {
                char.buffs.immuneAbnormal--;
            }
            if (char.buffs.immuneStatDrop > 0) {
                char.buffs.immuneStatDrop--;
            }
        }
    };

    window.ImmuneEffect = ImmuneEffect;
})();
