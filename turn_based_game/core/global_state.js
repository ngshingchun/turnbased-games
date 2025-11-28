/**
 * GlobalState - 全局状态容器
 * 
 * 存储不属于单个精灵的全局状态:
 * - WEATHER: 天气
 * - TERRAIN: 场地
 * - FIELD_EFFECTS: 场地效果
 * - TURN_COUNT: 回合数
 * - BATTLE_LOG: 战斗日志
 */
(() => {
    class GlobalState {
        constructor() {
            this.reset();
        }

        reset() {
            // === WEATHER 天气 ===
            this.weather = {
                current: null,
                turns: 0,
                source: null,
                
                set(weather, turns = 5, source = null) {
                    this.current = weather;
                    this.turns = turns;
                    this.source = source;
                },
                
                clear() {
                    this.current = null;
                    this.turns = 0;
                    this.source = null;
                },
                
                tick() {
                    if (this.current && this.turns > 0) {
                        this.turns--;
                        if (this.turns <= 0) {
                            const expired = this.current;
                            this.clear();
                            return expired;
                        }
                    }
                    return null;
                },
                
                is(weather) {
                    return this.current === weather;
                }
            };

            // === TERRAIN 场地 ===
            this.terrain = {
                current: null,
                turns: 0,
                source: null,
                
                set(terrain, turns = 5, source = null) {
                    this.current = terrain;
                    this.turns = turns;
                    this.source = source;
                },
                
                clear() {
                    this.current = null;
                    this.turns = 0;
                    this.source = null;
                },
                
                tick() {
                    if (this.current && this.turns > 0) {
                        this.turns--;
                        if (this.turns <= 0) {
                            const expired = this.current;
                            this.clear();
                            return expired;
                        }
                    }
                    return null;
                },
                
                is(terrain) {
                    return this.current === terrain;
                }
            };

            // === FIELD_EFFECTS 场地效果 ===
            this.fieldEffects = {
                list: [],  // { id, name, side, turns, handler, source }
                
                add(effect) {
                    this.remove(effect.id, effect.side);
                    this.list.push({
                        id: effect.id,
                        name: effect.name,
                        side: effect.side,  // 'A', 'B', or 'all'
                        turns: effect.turns,
                        handler: effect.handler,
                        source: effect.source
                    });
                },
                
                remove(id, side = null) {
                    this.list = this.list.filter(e => {
                        if (e.id !== id) return true;
                        if (side && e.side !== side) return true;
                        return false;
                    });
                },
                
                has(id, side = null) {
                    return this.list.some(e => {
                        if (e.id !== id) return false;
                        if (side && e.side !== side) return false;
                        return true;
                    });
                },
                
                get(id, side = null) {
                    return this.list.find(e => {
                        if (e.id !== id) return false;
                        if (side && e.side !== side) return false;
                        return true;
                    });
                },
                
                getSide(side) {
                    return this.list.filter(e => e.side === side || e.side === 'all');
                },
                
                tick() {
                    const expired = [];
                    this.list = this.list.filter(e => {
                        if (e.turns > 0) {
                            e.turns--;
                            if (e.turns <= 0) { expired.push(e); return false; }
                        }
                        return true;
                    });
                    return expired;
                },
                
                clear(side = null) {
                    if (side) this.list = this.list.filter(e => e.side !== side);
                    else this.list = [];
                }
            };

            // === TURN_COUNT 回合数 ===
            this.turnCount = 0;

            // === BATTLE_LOG 战斗日志 ===
            this.battleLog = [];

            // === FLAGS 标记 ===
            this.flags = {};
        }

        /**
         * 进入下一回合
         */
        nextTurn() {
            this.turnCount++;
            this.weather.tick();
            this.terrain.tick();
            this.fieldEffects.tick();
        }

        /**
         * 添加日志
         */
        log(message, type = 'info') {
            this.battleLog.push({
                turn: this.turnCount,
                message,
                type,
                timestamp: Date.now()
            });
        }

        /**
         * 设置标记
         */
        setFlag(key, value = true) {
            this.flags[key] = value;
        }

        /**
         * 获取标记
         */
        getFlag(key) {
            return this.flags[key];
        }

        /**
         * 清除标记
         */
        clearFlag(key) {
            delete this.flags[key];
        }
    }

    window.GlobalState = GlobalState;
    window.createGlobalState = () => new GlobalState();
})();
