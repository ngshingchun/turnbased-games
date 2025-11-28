/**
 * TEAM A - 玩家队伍实例
 * 
 * 基于 core/team.js 的 TEAM 系统
 * 存储玩家方 (Team A) 的所有数据
 * 
 * 包含:
 * - 6只精灵的完整状态
 * - 当前出战精灵索引
 * - 队伍级别的效果和状态
 * - 全局状态 (天气、场地、回合数等)
 */
(() => {
    // =========================================================================
    // Team A 数据存储
    // =========================================================================
    const TEAM_A = {
        _version: '1.0.0',
        _id: 'A',
        _data: null,
        _initialized: false,

        // ─────────────────────────────────────────────────────────────────────
        // 初始化队伍
        // ─────────────────────────────────────────────────────────────────────
        /**
         * 初始化 Team A
         * @param {Array} spirits - 精灵数据数组 (最多6只)
         * @returns {Object} 队伍数据
         */
        init(spirits = []) {
            if (!window.createTeamData) {
                console.error('[TEAM_A] TEAM system not loaded');
                return null;
            }
            
            this._data = window.createTeamData('A', spirits);
            this._initialized = true;
            
            // 同步到 TEAM 系统
            if (window.TEAM) {
                window.TEAM._teamA = this._data;
            }
            
            console.log(`[TEAM_A] Initialized with ${spirits.filter(s => s).length} spirits`);
            return this._data;
        },

        // ─────────────────────────────────────────────────────────────────────
        // 获取数据
        // ─────────────────────────────────────────────────────────────────────
        /**
         * 获取队伍数据
         */
        getData() {
            return this._data;
        },

        /**
         * 获取当前出战精灵
         */
        current() {
            return this._data?.current() || null;
        },

        /**
         * 获取指定索引的精灵
         */
        get(index) {
            return this._data?.get(index) || null;
        },

        /**
         * 根据 key 获取精灵
         */
        getByKey(key) {
            return this._data?.getByKey(key) || null;
        },

        /**
         * 获取所有精灵
         */
        getAllSpirits() {
            return this._data?.spirits || [];
        },

        /**
         * 获取存活精灵
         */
        getAliveSpirits() {
            return this._data?.spirits.filter(s => s && s.isAlive) || [];
        },

        // ─────────────────────────────────────────────────────────────────────
        // 队伍操作
        // ─────────────────────────────────────────────────────────────────────
        /**
         * 切换精灵
         */
        switch(toIndex, forced = false) {
            if (!this._data) return false;
            
            const target = this._data.get(toIndex);
            if (!target || !target.isAlive) return false;
            if (toIndex === this._data.currentIndex) return false;
            
            const oldSpirit = this._data.current();
            this._data.currentIndex = toIndex;
            target.isFirstDeploy = false;
            this._data.resetTurnFlags();
            
            return { oldSpirit, newSpirit: target, forced };
        },

        /**
         * 检查队伍是否有某精灵
         */
        has(key) {
            return this._data?.has(key) || false;
        },

        /**
         * 检查队伍是否全灭
         */
        isDefeated() {
            return this._data?.isDefeated() || true;
        },

        /**
         * 获取存活精灵数
         */
        aliveCount() {
            return this._data?.aliveCount() || 0;
        },

        /**
         * 获取可切换的精灵索引
         */
        getAvailableSwitches() {
            return this._data?.getAvailableSwitches() || [];
        },

        // ─────────────────────────────────────────────────────────────────────
        // HP/PP 操作
        // ─────────────────────────────────────────────────────────────────────
        /**
         * 治疗当前精灵
         */
        healCurrent(amount) {
            const spirit = this.current();
            if (!spirit || !spirit.isAlive) return 0;
            
            const oldHp = spirit.hp;
            spirit.hp = Math.min(spirit.maxHp, spirit.hp + amount);
            spirit.turnFlags.lastHealAmount = spirit.hp - oldHp;
            return spirit.turnFlags.lastHealAmount;
        },

        /**
         * 治疗指定精灵
         */
        heal(index, amount) {
            const spirit = this.get(index);
            if (!spirit || !spirit.isAlive) return 0;
            
            const oldHp = spirit.hp;
            spirit.hp = Math.min(spirit.maxHp, spirit.hp + amount);
            return spirit.hp - oldHp;
        },

        /**
         * 治疗全队
         */
        healAll(amount) {
            let total = 0;
            this.getAllSpirits().forEach((s, i) => {
                if (s && s.isAlive) {
                    total += this.heal(i, amount);
                }
            });
            return total;
        },

        /**
         * 恢复 PP
         */
        restorePP(index, skillIndex, amount) {
            const spirit = this.get(index);
            if (!spirit || !spirit.skills[skillIndex]) return 0;
            
            const skill = spirit.skills[skillIndex];
            const oldPP = skill.currentPp;
            skill.currentPp = Math.min(skill.maxPp, skill.currentPp + amount);
            return skill.currentPp - oldPP;
        },

        /**
         * 恢复所有技能 PP
         */
        restoreAllPP(index, amount) {
            const spirit = this.get(index);
            if (!spirit) return 0;
            
            let total = 0;
            spirit.skills.forEach((skill, i) => {
                total += this.restorePP(index, i, amount);
            });
            return total;
        },

        // ─────────────────────────────────────────────────────────────────────
        // 全局状态
        // ─────────────────────────────────────────────────────────────────────
        /**
         * 获取全局状态
         */
        getGlobal() {
            return this._data?.global || null;
        },

        /**
         * 获取回合数
         */
        getTurnCount() {
            return this._data?.global?.turnCount || 0;
        },

        /**
         * 增加回合数
         */
        incTurnCount() {
            if (this._data?.global) {
                this._data.global.turnCount++;
                return this._data.global.turnCount;
            }
            return 0;
        },

        /**
         * 获取天气
         */
        getWeather() {
            return this._data?.global?.weather || null;
        },

        /**
         * 设置天气
         */
        setWeather(type, turns, source) {
            if (this._data?.global) {
                this._data.global.weather = { current: type, turns, source };
                return true;
            }
            return false;
        },

        /**
         * 获取场地
         */
        getTerrain() {
            return this._data?.global?.terrain || null;
        },

        /**
         * 设置场地
         */
        setTerrain(type, turns, source) {
            if (this._data?.global) {
                this._data.global.terrain = { current: type, turns, source };
                return true;
            }
            return false;
        },

        // ─────────────────────────────────────────────────────────────────────
        // 回合效果
        // ─────────────────────────────────────────────────────────────────────
        /**
         * 添加回合效果
         */
        addTurnEffect(index, effect) {
            const spirit = this.get(index);
            if (!spirit) return false;
            
            spirit.turnEffects.push({
                id: effect.id,
                name: effect.name,
                turns: effect.turns,
                flags: effect.flags || {},
                onTick: effect.onTick,
                onAction: effect.onAction,
                source: effect.source || 'unknown'
            });
            return true;
        },

        /**
         * 移除回合效果
         */
        removeTurnEffect(index, effectId) {
            const spirit = this.get(index);
            if (!spirit) return false;
            
            const idx = spirit.turnEffects.findIndex(e => e.id === effectId);
            if (idx >= 0) {
                spirit.turnEffects.splice(idx, 1);
                return true;
            }
            return false;
        },

        /**
         * Tick 所有回合效果 (回合结束时调用)
         */
        tickTurnEffects(index) {
            const spirit = this.get(index);
            if (!spirit) return [];
            
            const expired = [];
            spirit.turnEffects = spirit.turnEffects.filter(effect => {
                effect.turns--;
                if (effect.turns <= 0) {
                    expired.push(effect);
                    return false;
                }
                return true;
            });
            return expired;
        },

        // ─────────────────────────────────────────────────────────────────────
        // 计数效果
        // ─────────────────────────────────────────────────────────────────────
        /**
         * 设置计数效果
         */
        setCount(index, countId, value, max = Infinity) {
            const spirit = this.get(index);
            if (!spirit) return false;
            
            spirit.countEffects[countId] = { count: value, max };
            return true;
        },

        /**
         * 获取计数
         */
        getCount(index, countId) {
            const spirit = this.get(index);
            return spirit?.countEffects[countId]?.count || 0;
        },

        /**
         * 增加计数
         */
        addCount(index, countId, amount = 1, max = Infinity) {
            const spirit = this.get(index);
            if (!spirit) return 0;
            
            if (!spirit.countEffects[countId]) {
                spirit.countEffects[countId] = { count: 0, max };
            }
            spirit.countEffects[countId].count = Math.min(
                spirit.countEffects[countId].max,
                spirit.countEffects[countId].count + amount
            );
            return spirit.countEffects[countId].count;
        },

        /**
         * 消耗计数
         */
        useCount(index, countId, amount = 1) {
            const spirit = this.get(index);
            if (!spirit || !spirit.countEffects[countId]) return 0;
            
            const consumed = Math.min(spirit.countEffects[countId].count, amount);
            spirit.countEffects[countId].count -= consumed;
            
            // 清零时自动删除
            if (spirit.countEffects[countId].count <= 0) {
                delete spirit.countEffects[countId];
            }
            return consumed;
        },

        // ─────────────────────────────────────────────────────────────────────
        // 异常状态
        // ─────────────────────────────────────────────────────────────────────
        /**
         * 添加异常状态
         */
        addStatus(index, statusId, turns) {
            const spirit = this.get(index);
            if (!spirit) return false;
            
            // 检查免疫
            if (spirit.statusImmune.includes(statusId)) return false;
            
            // 检查是否已有
            const existing = spirit.statuses.find(s => s.id === statusId);
            if (existing) {
                existing.turns = Math.max(existing.turns, turns);
                return true;
            }
            
            spirit.statuses.push({ id: statusId, turns });
            return true;
        },

        /**
         * 移除异常状态
         */
        removeStatus(index, statusId) {
            const spirit = this.get(index);
            if (!spirit) return false;
            
            const idx = spirit.statuses.findIndex(s => s.id === statusId);
            if (idx >= 0) {
                spirit.statuses.splice(idx, 1);
                return true;
            }
            return false;
        },

        /**
         * 清除所有异常状态
         */
        clearStatuses(index) {
            const spirit = this.get(index);
            if (!spirit) return false;
            
            spirit.statuses = [];
            return true;
        },

        // ─────────────────────────────────────────────────────────────────────
        // 标记系统
        // ─────────────────────────────────────────────────────────────────────
        /**
         * 设置标记
         */
        setFlag(index, flag, value) {
            const spirit = this.get(index);
            if (!spirit) return false;
            
            spirit.flags[flag] = value;
            return true;
        },

        /**
         * 获取标记
         */
        getFlag(index, flag) {
            const spirit = this.get(index);
            return spirit?.flags[flag];
        },

        /**
         * 清除标记
         */
        clearFlag(index, flag) {
            const spirit = this.get(index);
            if (!spirit) return false;
            
            delete spirit.flags[flag];
            return true;
        },

        // ─────────────────────────────────────────────────────────────────────
        // 重置
        // ─────────────────────────────────────────────────────────────────────
        /**
         * 重置回合状态
         */
        resetTurnFlags() {
            this._data?.resetTurnFlags();
        },

        /**
         * 完全重置队伍 (新战斗时调用)
         */
        reset() {
            this._data = null;
            this._initialized = false;
        },

        // ─────────────────────────────────────────────────────────────────────
        // 序列化
        // ─────────────────────────────────────────────────────────────────────
        /**
         * 导出数据 (用于存档)
         */
        export() {
            if (!this._data) return null;
            
            return JSON.parse(JSON.stringify({
                id: this._id,
                currentIndex: this._data.currentIndex,
                spirits: this._data.spirits.map(s => s ? {
                    key: s.key,
                    hp: s.hp,
                    pp: s.pp,
                    stages: s.stages,
                    skills: s.skills.map(sk => ({ currentPp: sk.currentPp })),
                    turnEffects: s.turnEffects,
                    countEffects: s.countEffects,
                    statuses: s.statuses,
                    flags: s.flags,
                    isAlive: s.isAlive
                } : null),
                global: this._data.global
            }));
        },

        /**
         * 导入数据 (用于读档)
         */
        import(data) {
            // 需要配合精灵注册表重建完整数据
            // 这里只是框架，实际实现需要更多逻辑
            console.log('[TEAM_A] Import not fully implemented');
            return false;
        }
    };

    // =========================================================================
    // 导出
    // =========================================================================
    window.TEAM_A = TEAM_A;
    
    console.log('[TEAM_A] Module loaded');
})();
