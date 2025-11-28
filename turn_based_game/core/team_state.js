/**
 * TeamState - 队伍状态容器
 * 
 * 每个玩家有一个队伍，包含最多6只精灵
 * 记录当前出战精灵，以及所有精灵的状态
 */
(() => {
    class TeamState {
        constructor(teamId, spirits = []) {
            this.id = teamId;  // 'A' or 'B'
            this.spirits = [];  // 所有精灵状态 (最多6只)
            this.currentIndex = 0;  // 当前出战精灵索引
            
            // 初始化精灵
            this.init(spirits);
        }

        /**
         * 初始化队伍
         */
        init(spiritDataList) {
            this.spirits = [];
            for (let i = 0; i < Math.min(6, spiritDataList.length); i++) {
                const data = spiritDataList[i];
                const state = window.createSpiritState({
                    ...data,
                    owner: this.id,
                    teamIndex: i
                });
                this.spirits.push(state);
            }
            this.currentIndex = 0;
        }

        /**
         * 获取当前出战精灵
         */
        get current() {
            return this.spirits[this.currentIndex] || null;
        }

        /**
         * 获取所有精灵
         */
        get all() {
            return this.spirits;
        }

        /**
         * 获取所有存活精灵
         */
        get alive() {
            return this.spirits.filter(s => s.isAlive());
        }

        /**
         * 获取所有死亡精灵
         */
        get dead() {
            return this.spirits.filter(s => s.isDead());
        }

        /**
         * 获取指定索引的精灵
         */
        get(index) {
            return this.spirits[index] || null;
        }

        /**
         * 获取精灵数量
         */
        get count() {
            return this.spirits.length;
        }

        /**
         * 获取存活精灵数量
         */
        get aliveCount() {
            return this.alive.length;
        }

        /**
         * 检查队伍是否全灭
         */
        isDefeated() {
            return this.aliveCount === 0;
        }

        /**
         * 切换出战精灵
         */
        switchTo(index) {
            if (index < 0 || index >= this.spirits.length) return false;
            if (this.spirits[index].isDead()) return false;
            if (index === this.currentIndex) return false;
            
            const prevIndex = this.currentIndex;
            this.currentIndex = index;
            
            return {
                prevIndex,
                newIndex: index,
                prevSpirit: this.spirits[prevIndex],
                newSpirit: this.spirits[index]
            };
        }

        /**
         * 强制切换（死亡时）
         */
        forceSwitch(index) {
            if (index < 0 || index >= this.spirits.length) return false;
            if (this.spirits[index].isDead()) return false;
            
            const prevIndex = this.currentIndex;
            this.currentIndex = index;
            
            return {
                prevIndex,
                newIndex: index,
                prevSpirit: this.spirits[prevIndex],
                newSpirit: this.spirits[index],
                forced: true
            };
        }

        /**
         * 自动选择下一只存活精灵（当前精灵死亡时）
         */
        autoSwitchNext() {
            const aliveIndices = this.spirits
                .map((s, i) => ({ s, i }))
                .filter(({ s, i }) => s.isAlive() && i !== this.currentIndex)
                .map(({ i }) => i);
            
            if (aliveIndices.length === 0) return null;
            return aliveIndices[0];  // 返回索引，让UI选择
        }

        /**
         * 检查是否可以切换
         */
        canSwitch() {
            // 检查是否有可切换的精灵
            const available = this.spirits.filter((s, i) => 
                s.isAlive() && i !== this.currentIndex
            );
            if (available.length === 0) return { can: false, reason: 'no_available' };
            
            // 检查当前精灵是否被束缚/凝滞等
            const current = this.current;
            if (current && current.status.has('bind')) return { can: false, reason: 'bound' };
            if (current && current.status.has('stagnant')) return { can: false, reason: 'stagnant' };
            
            return { can: true };
        }

        /**
         * 重置所有精灵的回合标记
         */
        resetAllTurnFlags() {
            for (const spirit of this.spirits) {
                spirit.resetTurnFlags();
            }
        }

        /**
         * 每回合效果tick（所有精灵）
         */
        tickAllEffects() {
            const results = [];
            for (const spirit of this.spirits) {
                if (spirit.isAlive()) {
                    const expired = spirit.turnEffects.tick();
                    const statusExpired = spirit.status.tick();
                    results.push({
                        spirit,
                        expiredTurnEffects: expired,
                        expiredStatus: statusExpired
                    });
                }
            }
            return results;
        }

        /**
         * 获取队伍状态摘要
         */
        getSummary() {
            return {
                id: this.id,
                currentIndex: this.currentIndex,
                current: this.current ? {
                    name: this.current.name,
                    hp: this.current.hp.current,
                    maxHp: this.current.hp.max,
                    pp: this.current.pp.current,
                    maxPp: this.current.pp.max
                } : null,
                spirits: this.spirits.map((s, i) => ({
                    index: i,
                    name: s.name,
                    hp: s.hp.current,
                    maxHp: s.hp.max,
                    isAlive: s.isAlive(),
                    isCurrent: i === this.currentIndex
                })),
                aliveCount: this.aliveCount,
                isDefeated: this.isDefeated()
            };
        }

        /**
         * 创建快照
         */
        snapshot() {
            return {
                id: this.id,
                currentIndex: this.currentIndex,
                spirits: this.spirits.map(s => s.snapshot())
            };
        }

        /**
         * 从快照恢复
         */
        restore(snapshot) {
            this.id = snapshot.id;
            this.currentIndex = snapshot.currentIndex;
            for (let i = 0; i < this.spirits.length && i < snapshot.spirits.length; i++) {
                this.spirits[i].restore(snapshot.spirits[i]);
            }
        }
    }

    // =========================================================================
    // Export
    // =========================================================================
    window.TeamState = TeamState;
    window.createTeamState = (teamId, spirits) => new TeamState(teamId, spirits);
})();
