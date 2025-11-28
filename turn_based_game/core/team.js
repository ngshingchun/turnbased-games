/**
 * TEAM System - 队伍系统 v4.0 (统一版)
 * 
 * 整合:
 * - spirit_state (精灵状态)
 * - team_state (队伍状态)  
 * - global_state (全局状态)
 * 
 * 每场战斗有 teamA 和 teamB 两个实例
 * 
 * SUBFUNCTIONS:
 * - TEAM.INIT(nodes, handler)         - 初始化队伍
 * - TEAM.GET(nodes, handler)          - 获取精灵/状态
 * - TEAM.SET(nodes, handler)          - 设置状态
 * - TEAM.CURRENT(nodes, handler)      - 当前出战精灵
 * - TEAM.SWITCH(nodes, handler)       - 切换精灵
 * - TEAM.HEAL(nodes, handler)         - 队伍治疗
 * - TEAM.DAMAGE(nodes, handler)       - 队伍伤害
 * - TEAM.GLOBALSTATE(nodes, handler)  - 全局状态 (weather, terrain, fieldEffects, turnCount)
 * - TEAM.FLAG(nodes, handler)         - 标记系统
 * - TEAM.HAS(nodes, handler)          - 检查队伍是否有某精灵
 * - TEAM.FOREACH(nodes, handler)      - 遍历队伍
 * - TEAM.COUNT(nodes, handler)        - 计数效果 (整合 COUNT 系统)
 * - TEAM.SOULBUFF(nodes, handler)     - 魂印效果
 */
(() => {
    // =========================================================================
    // 精灵状态模板 (整合自 spirit_state.js)
    // =========================================================================
    function createSpiritData(spiritData) {
        return {
            // ─────────────────────────────────────────────────────────────────
            // 基础数据
            // ─────────────────────────────────────────────────────────────────
            key: spiritData.key || '',
            name: spiritData.name || '',
            element: spiritData.element || 'normal',
            
            // ─────────────────────────────────────────────────────────────────
            // HP 系统
            // ─────────────────────────────────────────────────────────────────
            maxHp: spiritData.maxHp || 1000,
            hp: spiritData.hp ?? spiritData.maxHp ?? 1000,
            
            get hpPercent() { return this.maxHp > 0 ? (this.hp / this.maxHp) * 100 : 0; },
            get isLowHp() { return this.hpPercent <= 25; },
            get isCriticalHp() { return this.hpPercent <= 10; },
            get lostHp() { return this.maxHp - this.hp; },
            
            // ─────────────────────────────────────────────────────────────────
            // PP 系统
            // ─────────────────────────────────────────────────────────────────
            maxPp: spiritData.maxPp || 100,
            pp: spiritData.pp ?? spiritData.maxPp ?? 100,
            ppLocked: false,
            ppLockTurns: 0,
            
            get ppPercent() { return this.maxPp > 0 ? (this.pp / this.maxPp) * 100 : 0; },
            
            // ─────────────────────────────────────────────────────────────────
            // 六维属性
            // ─────────────────────────────────────────────────────────────────
            baseStats: {
                attack: spiritData.attack || 100,
                defense: spiritData.defense || 100,
                spAttack: spiritData.spAttack || 100,
                spDefense: spiritData.spDefense || 100,
                speed: spiritData.speed || 100
            },
            
            // 属性阶段 (-6 到 +6)
            stages: {
                attack: 0,
                defense: 0,
                spAttack: 0,
                spDefense: 0,
                speed: 0
            },
            
            // 计算实际属性
            getStat(stat) {
                const base = this.baseStats[stat] || 0;
                const stage = this.stages[stat] || 0;
                const mult = [2/8, 2/7, 2/6, 2/5, 2/4, 2/3, 1, 3/2, 4/2, 5/2, 6/2, 7/2, 8/2];
                return Math.floor(base * mult[Math.max(0, Math.min(12, stage + 6))]);
            },
            
            get attack() { return this.getStat('attack'); },
            get defense() { return this.getStat('defense'); },
            get spAttack() { return this.getStat('spAttack'); },
            get spDefense() { return this.getStat('spDefense'); },
            get speed() { return this.getStat('speed'); },
            
            // ─────────────────────────────────────────────────────────────────
            // 抗性
            // ─────────────────────────────────────────────────────────────────
            resist: spiritData.resist || { fixed: 0, percent: 0, trueDmg: 0 },
            
            // ─────────────────────────────────────────────────────────────────
            // 技能 (带PP)
            // ─────────────────────────────────────────────────────────────────
            skills: (spiritData.skills || []).map((s, i) => ({
                ...s,
                index: i,
                currentPp: s.pp || s.maxPp || 5,
                maxPp: s.maxPp || s.pp || 5
            })),
            
            // ─────────────────────────────────────────────────────────────────
            // 魂印
            // ─────────────────────────────────────────────────────────────────
            soulbuff: spiritData.soulbuff || null,
            soulbuffKey: spiritData.soulbuffKey || spiritData.key,
            soulbuffActive: true,
            
            // ─────────────────────────────────────────────────────────────────
            // 回合效果 [{id, name, turns, flags, onTick, onAction}]
            // ─────────────────────────────────────────────────────────────────
            turnEffects: [],
            
            // ─────────────────────────────────────────────────────────────────
            // 计数效果 { key: { count, max, handler } }
            // ─────────────────────────────────────────────────────────────────
            countEffects: {},
            
            // ─────────────────────────────────────────────────────────────────
            // 异常状态 [{id, name, turns}]
            // ─────────────────────────────────────────────────────────────────
            statuses: [],
            statusImmune: [],  // 免疫列表
            
            // ─────────────────────────────────────────────────────────────────
            // 护盾
            // ─────────────────────────────────────────────────────────────────
            shieldHp: 0,
            shieldCount: 0,
            shieldImmune: 0,
            
            // ─────────────────────────────────────────────────────────────────
            // 标记 (用于条件判断)
            // ─────────────────────────────────────────────────────────────────
            flags: {},
            
            // ─────────────────────────────────────────────────────────────────
            // 本回合状态 (每回合重置)
            // ─────────────────────────────────────────────────────────────────
            turnFlags: {
                tookDamageThisTurn: false,
                tookAttackDamageThisTurn: false,
                usedSkillThisTurn: null,
                lastDamageDealt: 0,
                lastDamageReceived: 0,
                lastHealAmount: 0,
                wasCrit: false,
                acted: false
            },
            
            // ─────────────────────────────────────────────────────────────────
            // 状态
            // ─────────────────────────────────────────────────────────────────
            isAlive: true,
            isFirstDeploy: true,
            
            // ─────────────────────────────────────────────────────────────────
            // 辅助方法
            // ─────────────────────────────────────────────────────────────────
            hasStatus(statusId) {
                return this.statuses.some(s => s.id === statusId);
            },
            
            hasAnyStatus() {
                return this.statuses.length > 0;
            },
            
            hasStatUp() {
                return Object.values(this.stages).some(v => v > 0);
            },
            
            hasStatDown() {
                return Object.values(this.stages).some(v => v < 0);
            },
            
            getCount(countId) {
                return this.countEffects[countId]?.count || 0;
            },
            
            hasTurnEffect(effectId) {
                return this.turnEffects.some(e => e.id === effectId);
            },
            
            isControlled() {
                const controlStatus = ['sleep', 'freeze', 'paralyze', 'confuse', 'fear', 'stone'];
                return this.statuses.some(s => controlStatus.includes(s.id));
            }
        };
    }

    // =========================================================================
    // 全局状态模板 (整合自 global_state.js)
    // =========================================================================
    function createGlobalData() {
        return {
            // 回合数
            turnCount: 0,
            
            // 天气
            weather: {
                current: null,
                turns: 0,
                source: null
            },
            
            // 场地
            terrain: {
                current: null,
                turns: 0,
                source: null
            },
            
            // 场地效果 [{id, name, side, turns, handler}]
            fieldEffects: [],
            
            // 战斗日志
            battleLog: [],
            
            // 自定义变量
            vars: {}
        };
    }

    // =========================================================================
    // 队伍状态
    // =========================================================================
    function createTeamData(teamId, spiritsData = []) {
        const team = {
            id: teamId,  // 'A' 或 'B'
            
            // 6只精灵状态
            spirits: [],
            
            // 当前出战精灵索引 (0-5)
            currentIndex: 0,
            
            // 全局状态 (每队各自维护，但某些如weather是共享的)
            global: createGlobalData(),
            
            // ─────────────────────────────────────────────────────────────────
            // 辅助方法
            // ─────────────────────────────────────────────────────────────────
            
            // 获取当前精灵
            current() {
                return this.spirits[this.currentIndex];
            },
            
            // 获取指定精灵
            get(index) {
                return this.spirits[index];
            },
            
            // 根据 key 获取精灵
            getByKey(key) {
                return this.spirits.find(s => s && s.key === key);
            },
            
            // 检查队伍是否有某精灵
            has(key) {
                return this.spirits.some(s => s && s.key === key);
            },
            
            // 检查队伍是否全灭
            isDefeated() {
                return this.spirits.filter(s => s).every(s => !s.isAlive);
            },
            
            // 获取存活精灵数
            aliveCount() {
                return this.spirits.filter(s => s && s.isAlive).length;
            },
            
            // 获取可切换的精灵索引
            getAvailableSwitches() {
                return this.spirits
                    .map((s, i) => ({ spirit: s, index: i }))
                    .filter(({ spirit, index }) => spirit && spirit.isAlive && index !== this.currentIndex)
                    .map(({ index }) => index);
            },
            
            // 重置回合状态
            resetTurnFlags() {
                const spirit = this.current();
                if (spirit) {
                    spirit.turnFlags = {
                        tookDamageThisTurn: false,
                        tookAttackDamageThisTurn: false,
                        usedSkillThisTurn: null,
                        lastDamageDealt: 0,
                        lastDamageReceived: 0,
                        lastHealAmount: 0,
                        wasCrit: false,
                        acted: false
                    };
                }
            }
        };
        
        // 初始化精灵
        for (let i = 0; i < 6; i++) {
            if (spiritsData[i]) {
                team.spirits.push(createSpiritData(spiritsData[i]));
            } else {
                team.spirits.push(null);
            }
        }
        
        return team;
    }

    // =========================================================================
    // 辅助函数
    // =========================================================================
    function calculateHeal(spirit, opts) {
        const { value, percent, ofMax, ofLost } = opts;
        if (value) return value;
        if (percent) {
            if (ofLost) {
                return Math.floor(spirit.lostHp * percent / 100);
            }
            if (ofMax) {
                return Math.floor(spirit.maxHp * percent / 100);
            }
            return Math.floor(spirit.hp * percent / 100);
        }
        return 0;
    }

    // =========================================================================
    // TEAM 系统函数
    // =========================================================================
    const TEAM = {
        _version: '4.0.0',
        
        // 存储两队数据
        _teamA: null,
        _teamB: null,
        
        // ─────────────────────────────────────────────────────────────────────
        // TEAM.INIT - 初始化队伍
        // ─────────────────────────────────────────────────────────────────────
        INIT(nodes, handler) {
            return {
                type: 'TEAM.INIT',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const { teamId, spirits } = typeof handler === 'function' ? handler(ctx) : handler;
                    const team = createTeamData(teamId, spirits);
                    
                    if (teamId === 'A') {
                        TEAM._teamA = team;
                        ctx.teamA = team;
                    } else {
                        TEAM._teamB = team;
                        ctx.teamB = team;
                    }
                    
                    return team;
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────────
        // TEAM.GET - 获取精灵/状态
        // ─────────────────────────────────────────────────────────────────────
        GET(nodes, handler) {
            return {
                type: 'TEAM.GET',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const { teamId, index, key, property } = typeof handler === 'function' ? handler(ctx) : handler;
                    const team = teamId === 'A' ? (ctx.teamA || TEAM._teamA) : (ctx.teamB || TEAM._teamB);
                    if (!team) return null;
                    
                    let spirit;
                    if (key) {
                        spirit = team.getByKey(key);
                    } else if (index !== undefined) {
                        spirit = team.get(index);
                    } else {
                        spirit = team.current();
                    }
                    
                    if (property && spirit) {
                        return spirit[property];
                    }
                    return spirit;
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────────
        // TEAM.SET - 设置状态
        // ─────────────────────────────────────────────────────────────────────
        SET(nodes, handler) {
            return {
                type: 'TEAM.SET',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const { teamId, index, property, value } = typeof handler === 'function' ? handler(ctx) : handler;
                    const team = teamId === 'A' ? (ctx.teamA || TEAM._teamA) : (ctx.teamB || TEAM._teamB);
                    if (!team) return false;
                    
                    const spirit = index !== undefined ? team.get(index) : team.current();
                    if (spirit && property) {
                        spirit[property] = value;
                        return true;
                    }
                    return false;
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────────
        // TEAM.CURRENT - 当前出战精灵操作
        // ─────────────────────────────────────────────────────────────────────
        CURRENT(nodes, handler) {
            return {
                type: 'TEAM.CURRENT',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const { teamId } = typeof handler === 'function' ? handler(ctx) : handler;
                    const team = teamId === 'A' ? (ctx.teamA || TEAM._teamA) : (ctx.teamB || TEAM._teamB);
                    return team ? team.current() : null;
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────────
        // TEAM.SWITCH - 切换精灵
        // ─────────────────────────────────────────────────────────────────────
        SWITCH(nodes, handler) {
            return {
                type: 'TEAM.SWITCH',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const { teamId, toIndex, forced } = typeof handler === 'function' ? handler(ctx) : handler;
                    const team = teamId === 'A' ? (ctx.teamA || TEAM._teamA) : (ctx.teamB || TEAM._teamB);
                    if (!team) return false;
                    
                    const target = team.get(toIndex);
                    if (!target || !target.isAlive) return false;
                    if (toIndex === team.currentIndex) return false;
                    
                    const oldSpirit = team.current();
                    team.currentIndex = toIndex;
                    target.isFirstDeploy = false;
                    team.resetTurnFlags();
                    
                    return { oldSpirit, newSpirit: target, forced };
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────────
        // TEAM.HEAL - 队伍治疗
        // ─────────────────────────────────────────────────────────────────────
        HEAL(nodes, handler) {
            return {
                type: 'TEAM.HEAL',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const opts = typeof handler === 'function' ? handler(ctx) : handler;
                    const { teamId, target, value, percent, ofMax, ofLost, index } = opts;
                    const team = teamId === 'A' ? (ctx.teamA || TEAM._teamA) : (ctx.teamB || TEAM._teamB);
                    if (!team) return 0;
                    
                    let spirit;
                    if (target === 'current') {
                        spirit = team.current();
                    } else if (target === 'all') {
                        let totalHeal = 0;
                        team.spirits.forEach(s => {
                            if (s && s.isAlive) {
                                const heal = calculateHeal(s, { value, percent, ofMax, ofLost });
                                const oldHp = s.hp;
                                s.hp = Math.min(s.maxHp, s.hp + heal);
                                totalHeal += s.hp - oldHp;
                            }
                        });
                        return totalHeal;
                    } else if (index !== undefined) {
                        spirit = team.get(index);
                    }
                    
                    if (!spirit || !spirit.isAlive) return 0;
                    
                    const heal = calculateHeal(spirit, { value, percent, ofMax, ofLost });
                    const oldHp = spirit.hp;
                    spirit.hp = Math.min(spirit.maxHp, spirit.hp + heal);
                    spirit.turnFlags.lastHealAmount = spirit.hp - oldHp;
                    
                    return spirit.turnFlags.lastHealAmount;
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────────
        // TEAM.DAMAGE - 队伍伤害
        // ─────────────────────────────────────────────────────────────────────
        DAMAGE(nodes, handler) {
            return {
                type: 'TEAM.DAMAGE',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const opts = typeof handler === 'function' ? handler(ctx) : handler;
                    const { teamId, target, value, percent, ofMax, index } = opts;
                    const team = teamId === 'A' ? (ctx.teamA || TEAM._teamA) : (ctx.teamB || TEAM._teamB);
                    if (!team) return 0;
                    
                    let spirit;
                    if (target === 'current') {
                        spirit = team.current();
                    } else if (index !== undefined) {
                        spirit = team.get(index);
                    }
                    
                    if (!spirit || !spirit.isAlive) return 0;
                    
                    let damage = value || 0;
                    if (percent) {
                        damage = Math.floor((ofMax ? spirit.maxHp : spirit.hp) * percent / 100);
                    }
                    
                    const oldHp = spirit.hp;
                    spirit.hp = Math.max(0, spirit.hp - damage);
                    spirit.turnFlags.lastDamageReceived = oldHp - spirit.hp;
                    spirit.turnFlags.tookDamageThisTurn = true;
                    
                    if (spirit.hp <= 0) {
                        spirit.isAlive = false;
                    }
                    
                    return spirit.turnFlags.lastDamageReceived;
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────────
        // TEAM.GLOBALSTATE - 全局状态
        // ─────────────────────────────────────────────────────────────────────
        GLOBALSTATE(nodes, handler) {
            return {
                type: 'TEAM.GLOBALSTATE',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const opts = typeof handler === 'function' ? handler(ctx) : handler;
                    const { teamId, action, key, value } = opts;
                    
                    // 全局状态通常是共享的，使用 teamA 的
                    const team = TEAM._teamA || ctx.teamA;
                    if (!team) return null;
                    
                    switch (action) {
                        case 'get':
                            if (key === 'turnCount') return team.global.turnCount;
                            if (key === 'weather') return team.global.weather;
                            if (key === 'terrain') return team.global.terrain;
                            return team.global.vars[key];
                            
                        case 'set':
                            if (key === 'weather') {
                                team.global.weather = { current: value.type, turns: value.turns, source: value.source };
                                if (TEAM._teamB) TEAM._teamB.global.weather = team.global.weather;
                            } else if (key === 'terrain') {
                                team.global.terrain = { current: value.type, turns: value.turns, source: value.source };
                                if (TEAM._teamB) TEAM._teamB.global.terrain = team.global.terrain;
                            } else {
                                team.global.vars[key] = value;
                            }
                            return true;
                            
                        case 'incTurn':
                            team.global.turnCount++;
                            if (TEAM._teamB) TEAM._teamB.global.turnCount = team.global.turnCount;
                            return team.global.turnCount;
                            
                        case 'log':
                            team.global.battleLog.push({
                                turn: team.global.turnCount,
                                message: value,
                                timestamp: Date.now()
                            });
                            return true;
                            
                        default:
                            return team.global;
                    }
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────────
        // TEAM.FLAG - 标记系统
        // ─────────────────────────────────────────────────────────────────────
        FLAG(nodes, handler) {
            return {
                type: 'TEAM.FLAG',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const opts = typeof handler === 'function' ? handler(ctx) : handler;
                    const { teamId, target, flag, value, action } = opts;
                    const team = teamId === 'A' ? (ctx.teamA || TEAM._teamA) : (ctx.teamB || TEAM._teamB);
                    if (!team) return null;
                    
                    const spirit = target === 'current' ? team.current() : team.get(target);
                    if (!spirit) return null;
                    
                    switch (action || 'set') {
                        case 'set':
                            spirit.flags[flag] = value;
                            return value;
                        case 'get':
                            return spirit.flags[flag];
                        case 'toggle':
                            spirit.flags[flag] = !spirit.flags[flag];
                            return spirit.flags[flag];
                        case 'clear':
                            delete spirit.flags[flag];
                            return true;
                        default:
                            return spirit.flags[flag];
                    }
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────────
        // TEAM.HAS - 检查队伍是否有某精灵
        // ─────────────────────────────────────────────────────────────────────
        HAS(nodes, handler) {
            return {
                type: 'TEAM.HAS',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const opts = typeof handler === 'function' ? handler(ctx) : handler;
                    const { teamId, key, condition } = opts;
                    const team = teamId === 'A' ? (ctx.teamA || TEAM._teamA) : (ctx.teamB || TEAM._teamB);
                    if (!team) return false;
                    
                    if (key) {
                        return team.has(key);
                    }
                    if (condition) {
                        return team.spirits.some(s => s && condition(s));
                    }
                    return false;
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────────
        // TEAM.FOREACH - 遍历队伍
        // ─────────────────────────────────────────────────────────────────────
        FOREACH(nodes, handler) {
            return {
                type: 'TEAM.FOREACH',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const opts = typeof handler === 'function' ? handler(ctx) : handler;
                    const { teamId, filter, action } = opts;
                    const team = teamId === 'A' ? (ctx.teamA || TEAM._teamA) : (ctx.teamB || TEAM._teamB);
                    if (!team) return [];
                    
                    let spirits = team.spirits.filter(s => s !== null);
                    
                    if (filter === 'alive') {
                        spirits = spirits.filter(s => s.isAlive);
                    } else if (filter === 'dead') {
                        spirits = spirits.filter(s => !s.isAlive);
                    } else if (typeof filter === 'function') {
                        spirits = spirits.filter(filter);
                    }
                    
                    if (action) {
                        spirits.forEach(action);
                    }
                    
                    return spirits;
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────────
        // TEAM.COUNT - 计数效果
        // ─────────────────────────────────────────────────────────────────────
        COUNT(nodes, handler) {
            return {
                type: 'TEAM.COUNT',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const opts = typeof handler === 'function' ? handler(ctx) : handler;
                    const { teamId, target, action, countId, value, max } = opts;
                    const team = teamId === 'A' ? (ctx.teamA || TEAM._teamA) : (ctx.teamB || TEAM._teamB);
                    if (!team) return null;
                    
                    const spirit = target === 'current' ? team.current() : team.get(target);
                    if (!spirit) return null;
                    
                    switch (action) {
                        case 'set':
                            spirit.countEffects[countId] = { count: value, max: max || Infinity };
                            return value;
                        case 'add':
                            if (!spirit.countEffects[countId]) {
                                spirit.countEffects[countId] = { count: 0, max: max || Infinity };
                            }
                            spirit.countEffects[countId].count = Math.min(
                                spirit.countEffects[countId].max,
                                spirit.countEffects[countId].count + value
                            );
                            return spirit.countEffects[countId].count;
                        case 'consume':
                            if (!spirit.countEffects[countId]) return 0;
                            const consumed = Math.min(spirit.countEffects[countId].count, value || 1);
                            spirit.countEffects[countId].count -= consumed;
                            return consumed;
                        case 'get':
                            return spirit.countEffects[countId]?.count || 0;
                        case 'clear':
                            delete spirit.countEffects[countId];
                            return true;
                        default:
                            return spirit.countEffects[countId]?.count || 0;
                    }
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────────
        // TEAM.RESET_TURN - 重置回合状态
        // ─────────────────────────────────────────────────────────────────────
        RESET_TURN(nodes, handler) {
            return {
                type: 'TEAM.RESET_TURN',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                execute(ctx) {
                    const opts = typeof handler === 'function' ? handler(ctx) : handler;
                    const { teamId } = opts;
                    const team = teamId === 'A' ? (ctx.teamA || TEAM._teamA) : (ctx.teamB || TEAM._teamB);
                    if (!team) return false;
                    
                    team.resetTurnFlags();
                    return true;
                }
            };
        },
        
        // ─────────────────────────────────────────────────────────────────────
        // 快捷获取方法
        // ─────────────────────────────────────────────────────────────────────
        getTeam(teamId) {
            return teamId === 'A' ? TEAM._teamA : TEAM._teamB;
        },
        
        getSpirit(teamId, index) {
            const team = TEAM.getTeam(teamId);
            return team ? (index !== undefined ? team.get(index) : team.current()) : null;
        },
        
        getCurrentSpirit(teamId) {
            const team = TEAM.getTeam(teamId);
            return team ? team.current() : null;
        }
    };

    // =========================================================================
    // 导出
    // =========================================================================
    window.TEAM = TEAM;
    window.createTeamData = createTeamData;
    window.createSpiritData = createSpiritData;
    window.createGlobalData = createGlobalData;
    // 兼容旧版本
    window.createTeamState = createTeamData;
    window.createSpiritState = createSpiritData;
    
    console.log('[TEAM] System v4.0.0 loaded (unified)');
})();
