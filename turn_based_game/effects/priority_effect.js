/**
 * PriorityEffect - 先制效果模块
 * 处理所有先制相关：优先级提升、强制先制、先制下降
 */
(() => {
    const PriorityEffect = {
        /**
         * 添加先制提升（回合数）
         */
        addPriority(game, target, turns, amount = 2, source = "先制") {
            target.buffs.priorityNext = Math.max(target.buffs.priorityNext || 0, turns);
            game.log(`${target.name} 获得 ${turns} 回合先制+${amount}！(${source})`);
            game.updateUI();

            // 路由到 TurnEffect
            if (window.TurnEffect?.run) {
                window.TurnEffect.run('priority_up', game, { target, turns, amount });
            }
        },

        /**
         * 添加强制先制（必定先出手）
         */
        addForcedPriority(game, target, turns, source = "必先制") {
            target.buffs.priorityForceNext = Math.max(target.buffs.priorityForceNext || 0, turns);
            game.log(`${target.name} 获得 ${turns} 回合必定先出手！(${source})`);
            game.updateUI();

            if (window.TurnEffect?.run) {
                window.TurnEffect.run('priority_force', game, { target, turns });
            }
        },

        /**
         * 添加先制下降
         */
        addPriorityDown(game, target, turns, amount = 2, source = "减速") {
            game.addTurnEffect(target, '减速', turns, 'priority_down', `先制-${amount}`);
            game.log(`${target.name} ${turns} 回合先制-${amount}！(${source})`);

            if (window.TurnEffect?.run) {
                window.TurnEffect.run('priority_down', game, { target, turns, amount });
            }
        },

        /**
         * 计算总先制值
         */
        calculate(game, char, skill) {
            let priority = 0;

            // 1. 技能自身先制
            const highPrioritySkills = ["天威力破", "秩序之助", "上善若水", "诸雄之主"];
            if (highPrioritySkills.includes(skill?.name)) {
                priority += 3;
            }

            // 2. 先制 buff
            if (char.buffs.priorityNext > 0) {
                priority += 2;
            }

            // 3. 强制先制
            if (char.buffs.priorityForceNext > 0) {
                priority = Math.max(priority, 100);
            }

            // 4. 星皇先制
            if (game.isStarSovereign(char) && char.buffs.starRagePriorityTurns > 0) {
                priority += 2;
            }

            // 5. 怒涛沧岚护盾先制
            if (char.name === "怒涛·沧岚" && char.buffs.shieldHp > 0) {
                priority += 1;
            }

            // 6. 重生之翼能量先制
            if (char.name === "重生之翼") {
                if (char.buffs.godlyGloryEnergy >= 5) priority += 1;
                if (char.buffs.rebirthWingsResetPriority > 0) priority += 3;
            }

            // 7. 英卡洛斯固有先制
            if (char.name === "光之惩戒·英卡洛斯") {
                priority += 1;
            }

            // 8. 束缚无先制
            if (char.buffs.turnEffects.some(e => e.id === 'bind')) {
                return 0;
            }

            // 9. 先制下降
            if (char.buffs.turnEffects.some(e => e.id === 'priority_down')) {
                priority -= 2;
            }

            return priority;
        },

        /**
         * 回合结束递减
         */
        decrement(game, char) {
            if (char.buffs.priorityNext > 0) {
                char.buffs.priorityNext--;
            }
            if (char.buffs.priorityForceNext > 0) {
                char.buffs.priorityForceNext--;
            }
        }
    };

    window.PriorityEffect = PriorityEffect;
})();
