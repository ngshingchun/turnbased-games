/**
 * SOULBUFF System v2.0 - 魂印系统
 * 
 * 处理所有魂印相关操作，包含独立的状态管理和UI支持
 * 格式: SOULBUFF.SUBFUNC(node(s), handler)
 * 
 * 魂印是精灵的被动效果，在特定节点触发
 * 支持UI显示: 类似 TurnEffect/CountEffect 的红/蓝点显示
 * 
 * 子函数列表:
 * - SOULBUFF.REGISTER(key, definition)         注册魂印定义
 * - SOULBUFF.TRIGGER(nodes, {})                触发魂印效果
 * - SOULBUFF.DISABLE(nodes, {turns})           禁用魂印
 * - SOULBUFF.ENABLE(nodes, {})                 启用魂印
 * - SOULBUFF.IS_ACTIVE(nodes, {})              检查魂印状态
 * - SOULBUFF.GET(key)                          获取魂印定义
 * - SOULBUFF.EXEC(nodes, handler)              执行自定义处理
 * - SOULBUFF.EFFECT(id, nodes, cond, handler)  创建魂印效果
 * - SOULBUFF.STATE.SET(target, key, value, opts) 设置魂印状态(带UI)
 * - SOULBUFF.STATE.GET(target, key)            获取魂印状态值
 * - SOULBUFF.STATE.ADD(target, key, amount)    增加魂印状态值
 * - SOULBUFF.STATE.TICK(target)                回合结束tick所有状态
 * - SOULBUFF.STATE.CLEAR(target, key)          清除魂印状态
 * - SOULBUFF.STATE.GET_ALL(target)             获取所有魂印状态(用于UI)
 * - SOULBUFF.define(key, name, desc, effects)  定义魂印(辅助)
 * - SOULBUFF.conditions                        条件函数集合
 */
(() => {
    // 魂印注册表
    const SOULBUFF_REGISTRY = {};

    // =========================================================================
    // 魂印状态存储 (独立于TEAM，用于UI显示)
    // =========================================================================
    /**
     * 魂印状态类型:
     * - 'stack': 层数类型 (如神耀能量1-6层) - 显示为金色点+数字
     * - 'turn': 回合类型 (如2回合必致命) - 显示为红色点+剩余回合
     * - 'count': 次数类型 (如3次攻击无效) - 显示为蓝色点+剩余次数
     * - 'flag': 标记类型 (如已出手) - 显示为图标
     * - 'value': 数值类型 (如记录的伤害值) - 可选显示
     */
    const SOULBUFF_STATE = new WeakMap();  // target -> { stateKey -> stateData }

    const STATE = {
        /**
         * 设置魂印状态
         * @param {Object} target - 目标精灵
         * @param {string} key - 状态键名
         * @param {*} value - 状态值
         * @param {Object} opts - 选项
         *   - type: 'stack'|'turn'|'count'|'flag'|'value'
         *   - max: 最大值 (用于stack)
         *   - turns: 回合数 (用于turn)
         *   - icon: 图标名
         *   - desc: 描述文本
         *   - color: UI颜色 ('gold'|'red'|'blue'|'green'|'purple')
         */
        SET(target, key, value, opts = {}) {
            if (!target) return { success: false };
            
            let stateMap = SOULBUFF_STATE.get(target);
            if (!stateMap) {
                stateMap = {};
                SOULBUFF_STATE.set(target, stateMap);
            }
            
            const type = opts.type || 'value';
            let finalValue = value;
            
            // 根据类型处理值
            if (type === 'stack' && opts.max) {
                finalValue = Math.min(value, opts.max);
            }
            
            stateMap[key] = {
                value: finalValue,
                type,
                max: opts.max,
                turns: opts.turns,        // 剩余回合
                count: opts.count,        // 剩余次数
                icon: opts.icon || key,
                desc: opts.desc || key,
                color: opts.color || STATE._getDefaultColor(type),
                visible: opts.visible !== false,  // 默认可见
                source: opts.source || 'soulbuff'
            };
            
            return { success: true, key, value: finalValue, state: stateMap[key] };
        },

        /**
         * 获取魂印状态值
         */
        GET(target, key) {
            if (!target) return null;
            const stateMap = SOULBUFF_STATE.get(target);
            if (!stateMap || !stateMap[key]) return null;
            return stateMap[key].value;
        },

        /**
         * 获取完整魂印状态数据
         */
        GET_DATA(target, key) {
            if (!target) return null;
            const stateMap = SOULBUFF_STATE.get(target);
            if (!stateMap) return null;
            return stateMap[key] || null;
        },

        /**
         * 增加魂印状态值 (用于stack/count类型)
         */
        ADD(target, key, amount = 1, opts = {}) {
            if (!target) return { success: false };
            
            const stateMap = SOULBUFF_STATE.get(target);
            if (!stateMap || !stateMap[key]) {
                // 如果不存在，创建新状态
                return STATE.SET(target, key, amount, opts);
            }
            
            const state = stateMap[key];
            let newValue = (state.value || 0) + amount;
            
            // 限制最大值
            if (state.max) {
                newValue = Math.min(newValue, state.max);
            }
            // 不允许负数
            newValue = Math.max(0, newValue);
            
            state.value = newValue;
            
            return { success: true, key, value: newValue, state };
        },

        /**
         * 减少魂印状态值
         */
        REDUCE(target, key, amount = 1) {
            return STATE.ADD(target, key, -amount);
        },

        /**
         * 消耗次数 (用于count类型)
         */
        USE_COUNT(target, key, amount = 1) {
            if (!target) return { success: false, remaining: 0 };
            
            const stateMap = SOULBUFF_STATE.get(target);
            if (!stateMap || !stateMap[key]) return { success: false, remaining: 0 };
            
            const state = stateMap[key];
            if (state.type !== 'count') return { success: false, remaining: state.value };
            
            state.count = Math.max(0, (state.count || 0) - amount);
            state.value = state.count;
            
            // 如果次数用完，清除状态
            if (state.count <= 0) {
                delete stateMap[key];
                return { success: true, remaining: 0, expired: true };
            }
            
            return { success: true, remaining: state.count };
        },

        /**
         * 回合结束tick (减少turn类型的剩余回合)
         */
        TICK(target) {
            if (!target) return { success: false, expired: [] };
            
            const stateMap = SOULBUFF_STATE.get(target);
            if (!stateMap) return { success: true, expired: [] };
            
            const expired = [];
            
            for (const [key, state] of Object.entries(stateMap)) {
                if (state.type === 'turn' && state.turns !== undefined) {
                    state.turns--;
                    state.value = state.turns;
                    
                    if (state.turns <= 0) {
                        expired.push(key);
                        delete stateMap[key];
                    }
                }
            }
            
            return { success: true, expired };
        },

        /**
         * 清除魂印状态
         */
        CLEAR(target, key) {
            if (!target) return { success: false };
            
            const stateMap = SOULBUFF_STATE.get(target);
            if (!stateMap) return { success: true };
            
            if (key) {
                delete stateMap[key];
            } else {
                // 清除所有
                SOULBUFF_STATE.set(target, {});
            }
            
            return { success: true };
        },

        /**
         * 清除所有状态 (换精灵时)
         */
        CLEAR_ALL(target) {
            return STATE.CLEAR(target);
        },

        /**
         * 获取所有魂印状态 (用于UI渲染)
         * 返回格式适合UI显示的数组
         */
        GET_ALL(target) {
            if (!target) return [];
            
            const stateMap = SOULBUFF_STATE.get(target);
            if (!stateMap) return [];
            
            const results = [];
            
            for (const [key, state] of Object.entries(stateMap)) {
                if (!state.visible) continue;
                
                results.push({
                    key,
                    value: state.value,
                    type: state.type,
                    icon: state.icon,
                    desc: state.desc,
                    color: state.color,
                    max: state.max,
                    turns: state.turns,
                    count: state.count
                });
            }
            
            return results;
        },

        /**
         * 获取UI图标数据
         * 返回格式: [{ val, type, desc, color }]
         */
        GET_ICONS(target) {
            const states = STATE.GET_ALL(target);
            return states.map(s => ({
                val: s.type === 'flag' ? s.icon : s.value,
                type: `soulbuff-${s.type}`,
                desc: s.desc,
                color: s.color,
                max: s.max
            }));
        },

        /**
         * 检查是否有某状态
         */
        HAS(target, key) {
            return STATE.GET(target, key) !== null;
        },

        /**
         * 获取默认颜色
         */
        _getDefaultColor(type) {
            switch (type) {
                case 'stack': return 'gold';
                case 'turn': return 'red';
                case 'count': return 'blue';
                case 'flag': return 'green';
                default: return 'gray';
            }
        }
    };

    // =========================================================================
    // 主SOULBUFF对象
    // =========================================================================
    const SOULBUFF = {
        // 状态管理子系统
        STATE,

        /**
         * 注册魂印定义
         * SOULBUFF.REGISTER(spiritKey, definition)
         */
        REGISTER(spiritKey, definition) {
            SOULBUFF_REGISTRY[spiritKey] = definition;
            return { success: true, key: spiritKey };
        },

        /**
         * 在指定节点触发魂印效果
         * SOULBUFF.TRIGGER(node, options)
         */
        TRIGGER(nodes, options = {}) {
            return {
                type: 'SOULBUFF.TRIGGER',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                
                execute(context) {
                    const { target, node, engine } = context;
                    if (!target || !target.soulBuff?.active) return { success: false };
                    
                    const key = target.soulBuff.key;
                    const def = SOULBUFF_REGISTRY[key];
                    
                    if (!def || !def.effects) return { success: false };
                    
                    // 查找当前节点的效果
                    const nodeEffects = def.effects.filter(e => {
                        const triggerNodes = Array.isArray(e.trigger) ? e.trigger : [e.trigger];
                        return triggerNodes.includes(node) || triggerNodes.includes('*');
                    });
                    
                    if (nodeEffects.length === 0) return { success: false };
                    
                    // 执行效果
                    const results = [];
                    for (const effect of nodeEffects) {
                        // 检查条件
                        if (effect.condition && !effect.condition(context)) {
                            continue;
                        }
                        
                        // 执行calls
                        if (effect.calls && Array.isArray(effect.calls)) {
                            for (const call of effect.calls) {
                                const callResult = SOULBUFF._executeCall(call, context);
                                results.push({ effectId: effect.id, call: call.system, result: callResult });
                                
                                if (callResult?.cancel) break;
                            }
                        }
                    }
                    
                    return { success: results.length > 0, results };
                }
            };
        },

        /**
         * 执行单个call
         */
        _executeCall(call, context) {
            // 处理SOULBUFF.STATE相关调用
            if (call.system === 'SOULBUFF' && call.func?.startsWith('STATE.')) {
                const stateFunc = call.func.replace('STATE.', '');
                const target = call.target === 'opponent' ? context.opponent : context.self;
                
                switch (stateFunc) {
                    case 'SET':
                        return STATE.SET(target, call.key, 
                            typeof call.value === 'function' ? call.value(context) : call.value,
                            call
                        );
                    case 'ADD':
                        return STATE.ADD(target, call.key,
                            typeof call.amount === 'function' ? call.amount(context) : call.amount,
                            call
                        );
                    case 'REDUCE':
                        return STATE.REDUCE(target, call.key,
                            typeof call.amount === 'function' ? call.amount(context) : call.amount
                        );
                    case 'CLEAR':
                        return STATE.CLEAR(target, call.key);
                    case 'USE_COUNT':
                        return STATE.USE_COUNT(target, call.key, call.amount || 1);
                }
            }
            
            // 其他系统调用走effect_router
            if (window.EffectRouter?.execute) {
                return window.EffectRouter.execute(call, context);
            }
            
            return { success: false, error: 'no_router' };
        },

        /**
         * 启用魂印
         * SOULBUFF.ENABLE(node, options)
         */
        ENABLE(nodes, options = {}) {
            return {
                type: 'SOULBUFF.ENABLE',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    if (target.soulBuff) {
                        target.soulBuff.active = true;
                    }
                    
                    if (engine) {
                        engine.log(`${target.name} 的魂印效果已启用！`);
                    }
                    
                    return { success: true };
                }
            };
        },

        /**
         * 禁用魂印
         * SOULBUFF.DISABLE(node, options)
         */
        DISABLE(nodes, options = {}) {
            return {
                type: 'SOULBUFF.DISABLE',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    if (target.soulBuff) {
                        target.soulBuff.active = false;
                    }
                    
                    if (engine) {
                        engine.log(`${target.name} 的魂印效果已禁用！`);
                    }
                    
                    return { success: true };
                }
            };
        },

        /**
         * 检查魂印状态
         * SOULBUFF.IS_ACTIVE(node)
         */
        IS_ACTIVE(nodes) {
            return {
                type: 'SOULBUFF.IS_ACTIVE',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { active: false };
                    
                    return { active: target.soulBuff?.active ?? false };
                }
            };
        },

        /**
         * 获取魂印定义
         * SOULBUFF.GET(spiritKey)
         */
        GET(spiritKey) {
            return SOULBUFF_REGISTRY[spiritKey] || null;
        },

        /**
         * 在指定节点执行自定义魂印处理
         * SOULBUFF.EXEC(node, handler)
         */
        EXEC(nodes, handler) {
            return {
                type: 'SOULBUFF.EXEC',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                
                execute(context) {
                    if (this.handler && typeof this.handler === 'function') {
                        return this.handler(context);
                    }
                    return { success: false };
                }
            };
        },

        /**
         * 创建魂印效果定义
         * SOULBUFF.EFFECT(id, nodes, condition, execute, options)
         */
        EFFECT(id, nodes, condition, handler, options = {}) {
            return {
                id,
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                condition,
                handler,
                priority: options.priority || 0,
                
                execute(context) {
                    if (this.handler && typeof this.handler === 'function') {
                        return this.handler(context);
                    }
                    return { success: false };
                }
            };
        }
    };

    // =========================================================================
    // 魂印定义辅助函数
    // =========================================================================
    
    /**
     * 创建魂印定义
     */
    SOULBUFF.define = function(spiritKey, name, desc, effects) {
        const definition = {
            key: spiritKey,
            name,
            desc,
            effects: effects.sort((a, b) => (b.priority || 0) - (a.priority || 0))
        };
        return SOULBUFF.REGISTER(spiritKey, definition);
    };

    /**
     * 创建条件函数
     */
    SOULBUFF.conditions = {
        // HP相关
        hpBelow(ratio) {
            return (ctx) => ctx.self?.hp <= ctx.self?.maxHp * ratio;
        },
        hpAbove(ratio) {
            return (ctx) => ctx.self?.hp > ctx.self?.maxHp * ratio;
        },
        
        // 状态相关
        hasStatus(statusId) {
            return (ctx) => ctx.self?.status?.includes(statusId);
        },
        notControlled() {
            return (ctx) => !['sleep', 'freeze', 'stun', 'fear'].some(s => ctx.self?.status?.includes(s));
        },
        
        // 魂印状态相关 (新增)
        hasState(key, min = 1) {
            return (ctx) => (STATE.GET(ctx.self, key) || 0) >= min;
        },
        stateEquals(key, value) {
            return (ctx) => STATE.GET(ctx.self, key) === value;
        },
        stateBelow(key, max) {
            return (ctx) => (STATE.GET(ctx.self, key) || 0) < max;
        },
        
        // 计数相关 (兼容旧版)
        hasCount(key, min = 1) {
            return (ctx) => (STATE.GET(ctx.self, key) || 0) >= min;
        },
        
        // 回合相关
        isFirstMover() {
            return (ctx) => ctx.isFirstMover;
        },
        isSecondMover() {
            return (ctx) => !ctx.isFirstMover;
        },
        
        // 伤害相关
        tookDamage() {
            return (ctx) => ctx.self?.turnFlags?.tookDamage;
        },
        dealtDamage() {
            return (ctx) => (ctx.self?.turnFlags?.damageDealt || 0) > 0;
        },
        
        // 致死判定
        isFatalHit() {
            return (ctx) => ctx.damage && ctx.self && (ctx.self.hp - ctx.damage) <= 0;
        },
        
        // 击杀相关
        killedEnemy() {
            return (ctx) => ctx.opponent?.hp <= 0;
        },
        wasKilled() {
            return (ctx) => ctx.self?.hp <= 0;
        },
        bothDead() {
            return (ctx) => ctx.self?.hp <= 0 && ctx.opponent?.hp <= 0;
        },
        
        // 强化相关
        hasStatUps() {
            return (ctx) => {
                const mods = ctx.self?.statModifiers;
                if (!mods) return false;
                return ['atk', 'def', 'spAtk', 'spDef', 'speed'].some(s => (mods[s] || 0) > 0);
            };
        },
        noStatUps() {
            return (ctx) => !SOULBUFF.conditions.hasStatUps()(ctx);
        },
        
        // 技能相关
        skillType(type) {
            return (ctx) => ctx.skill?.type === type;
        },
        
        // BOSS相关
        notBoss() {
            return (ctx) => !ctx.opponent?.isBoss;
        },
        
        // 复合条件
        and(...conditions) {
            return (ctx) => conditions.every(c => c(ctx));
        },
        or(...conditions) {
            return (ctx) => conditions.some(c => c(ctx));
        },
        not(condition) {
            return (ctx) => !condition(ctx);
        }
    };

    // 简写别名
    SOULBUFF.cond = SOULBUFF.conditions;

    // =========================================================================
    // Export
    // =========================================================================
    window.SOULBUFF = SOULBUFF;
    window.SOULBUFF_REGISTRY = SOULBUFF_REGISTRY;
    window.SOULBUFF_STATE = STATE;  // 导出状态管理器供其他模块使用
})();
