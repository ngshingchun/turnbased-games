/**
 * CritEffect - 暴击效果模块
 * 处理所有暴击相关：暴击率、必暴击、暴击伤害
 */
(() => {
    const CritEffect = {
        DEFAULT_CRIT_RATE: 0.05,   // 默认5%暴击率
        CRIT_MULTIPLIER: 2,        // 暴击伤害倍率

        /**
         * 添加必暴击（回合数）
         */
        addGuaranteed(game, target, turns, source = "暴击") {
            target.buffs.critNext = Math.max(target.buffs.critNext || 0, turns);
            game.log(`${target.name} 获得 ${turns} 回合必定暴击！(${source})`);
            game.updateUI();

            // 路由到 CountEffect
            if (window.CountEffect?.run) {
                window.CountEffect.run('crit_guaranteed', game, { target, turns });
            }
        },

        /**
         * 检查是否暴击
         */
        check(game, attacker, skill = null) {
            // 1. 必暴击 buff
            if (attacker.buffs.critNext > 0) {
                attacker.buffs.lastHitCrit = true;
                return true;
            }

            // 2. 技能自带暴击率
            let critRate = this.DEFAULT_CRIT_RATE;
            if (skill?.crit) {
                if (typeof skill.crit === 'string' && skill.crit.includes('/')) {
                    const [num, denom] = skill.crit.split('/').map(Number);
                    critRate = num / denom;
                } else {
                    critRate = skill.crit;
                }
            }

            // 3. 随机判定
            if (Math.random() < critRate) {
                attacker.buffs.lastHitCrit = true;
                return true;
            }

            attacker.buffs.lastHitCrit = false;
            return false;
        },

        /**
         * 获取暴击伤害倍率
         */
        getMultiplier(attacker) {
            return this.CRIT_MULTIPLIER;
        },

        /**
         * 回合结束递减
         */
        decrement(game, char) {
            if (char.buffs.critNext > 0) {
                char.buffs.critNext--;
            }
        },

        /**
         * 检查上次攻击是否暴击
         */
        wasLastHitCrit(char) {
            return char.buffs.lastHitCrit === true;
        }
    };

    window.CritEffect = CritEffect;
})();
