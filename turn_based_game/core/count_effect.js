/**
 * COUNT System - 计数效果系统
 * 
 * 处理所有基于次数的效果
 * 格式: COUNT.SUBFUNC(node(s), handler)
 * 
 * 子函数列表:
 * - COUNT.SET(nodes, key, value, max)                          设置计数值
 * - COUNT.ADD(nodes, key, amount, max)                         添加计数
 * - COUNT.CONSUME(nodes, key, amount)                          消耗计数
 * - COUNT.SHIELD(nodes, amount, type)                          添加护盾次数
 * - COUNT.REFLECT(nodes, count, ratio)                         添加反弹次数
 * - COUNT.STACK(nodes, key, amount, max)                       叠加计数
 * - COUNT.ABSORB(nodes, count, ratio)                          添加吸收次数
 * - COUNT.IMMUNITY(nodes, count, type)                         添加免疫次数
 * - COUNT.GET(nodes, key)                                      获取计数值
 * - COUNT.HAS(nodes, key)                                      检查是否有计数
 * - COUNT.CLEAR(nodes, key)                                    清除指定计数
 * - COUNT.CLEAR_ALL(nodes)                                     清除所有计数
 * 
 * 每个函数返回一个效果对象，包含在指定节点执行的逻辑
 */
(() => {
    const COUNT = {
        /**
         * 设置计数值
         * COUNT.SET(node, key, value, max)
         */
        SET(nodes, key, value, max = Infinity) {
            return {
                type: 'COUNT.SET',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                key,
                value,
                max,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { success: false };
                    
                    target.countEffects.set(this.key, this.value, this.max);
                    return { success: true, key: this.key, value: this.value };
                }
            };
        },

        /**
         * 增加计数值
         * COUNT.ADD(node, key, amount, max)
         */
        ADD(nodes, key, amount = 1, max = Infinity) {
            return {
                type: 'COUNT.ADD',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                key,
                amount,
                max,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { success: false };
                    
                    const newValue = target.countEffects.add(this.key, this.amount, this.max);
                    return { success: true, key: this.key, newValue };
                }
            };
        },

        /**
         * 消耗计数值
         * COUNT.CONSUME(node, key, amount)
         */
        CONSUME(nodes, key, amount = 1) {
            return {
                type: 'COUNT.CONSUME',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                key,
                amount,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    const consumed = target.countEffects.consume(this.key, this.amount);
                    
                    // 触发消耗回调
                    if (consumed > 0 && COUNT_HANDLERS[this.key]?.onConsume) {
                        COUNT_HANDLERS[this.key].onConsume(context, consumed, target.countEffects.get(this.key));
                    }
                    
                    return { success: consumed > 0, consumed, remaining: target.countEffects.get(this.key) };
                }
            };
        },

        /**
         * 检查是否有计数
         * COUNT.HAS(node, key)
         */
        HAS(nodes, key) {
            return {
                type: 'COUNT.HAS',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                key,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { has: false };
                    
                    return { has: target.countEffects.has(this.key) };
                }
            };
        },

        /**
         * 获取计数值
         * COUNT.GET(node, key)
         */
        GET(nodes, key) {
            return {
                type: 'COUNT.GET',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                key,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { value: 0 };
                    
                    return { value: target.countEffects.get(this.key) };
                }
            };
        },

        /**
         * 清除计数
         * COUNT.CLEAR(node, key) - key为空则清除所有
         */
        CLEAR(nodes, key = null) {
            return {
                type: 'COUNT.CLEAR',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                key,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { success: false };
                    
                    target.countEffects.clear(this.key);
                    return { success: true, clearedKey: this.key };
                }
            };
        },

        /**
         * 条件消耗（有才消耗）
         * COUNT.TRY_CONSUME(node, key, amount, onSuccess, onFail)
         */
        TRY_CONSUME(nodes, key, amount = 1, onSuccess = null, onFail = null) {
            return {
                type: 'COUNT.TRY_CONSUME',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                key,
                amount,
                onSuccess,
                onFail,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { success: false };
                    
                    if (target.countEffects.has(this.key)) {
                        const consumed = target.countEffects.consume(this.key, this.amount);
                        if (consumed > 0) {
                            if (this.onSuccess) this.onSuccess(context, consumed);
                            return { success: true, consumed };
                        }
                    }
                    
                    if (this.onFail) this.onFail(context);
                    return { success: false };
                }
            };
        },

        /**
         * 在指定节点执行自定义计数效果处理
         * COUNT.EXEC(node, handler)
         */
        EXEC(nodes, handler) {
            return {
                type: 'COUNT.EXEC',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                handler,
                
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
    // 内置计数效果处理器
    // =========================================================================
    const COUNT_HANDLERS = {
        // 护盾次数
        shield: {
            onConsume(context, consumed, remaining) {
                const { engine, target } = context;
                if (engine) engine.log(`${target.name} 的护盾抵挡了攻击！(剩余${remaining}次)`);
            }
        },
        
        // 伤害反弹
        reflectDamage: {
            onConsume(context, consumed, remaining) {
                const { engine, target } = context;
                if (engine) engine.log(`${target.name} 反弹伤害！(剩余${remaining}次)`);
            }
        },
        
        // 伤害提升
        damageBoost: {
            onConsume(context, consumed, remaining) {
                const { engine, target } = context;
                const boostVal = target.countEffects.get('damageBoostVal') || 100;
                if (engine) engine.log(`伤害提升 +${boostVal}% 生效！(剩余${remaining}次)`);
            }
        },
        
        // 免疫攻击
        attackImmunity: {
            onConsume(context, consumed, remaining) {
                const { engine, target } = context;
                if (engine) engine.log(`${target.name} 免疫了攻击！(剩余${remaining}次)`);
            }
        },
        
        // 免疫异常
        abnormalImmunity: {
            onConsume(context, consumed, remaining) {
                const { engine, target } = context;
                if (engine) engine.log(`${target.name} 免疫了异常状态！(剩余${remaining}次)`);
            }
        },
        
        // 封锁攻击
        blockAttack: {
            onConsume(context, consumed, remaining) {
                const { engine, target } = context;
                if (engine) engine.log(`${target.name} 的攻击被封锁！(剩余${remaining}次)`);
            }
        },
        
        // 封锁属性
        blockAttribute: {
            onConsume(context, consumed, remaining) {
                const { engine, target } = context;
                if (engine) engine.log(`${target.name} 的属性技能被封锁！(剩余${remaining}次)`);
            }
        },
        
        // 怒涛沧岚伤害叠加
        damageStack: {
            onConsume(context, consumed, remaining) {
                const { engine, target } = context;
                if (engine) engine.log(`伤害叠加消耗！(剩余${remaining}层)`);
            }
        },
        
        // 重生之翼神耀能量
        godlyGloryEnergy: {
            onConsume(context, consumed, remaining) {
                const { engine, target } = context;
                if (engine) engine.log(`神耀能量消耗！(剩余${remaining}层)`);
            }
        },
        
        // 致命次数
        critNext: {
            onConsume(context, consumed, remaining) {
                const { engine } = context;
                if (engine) engine.log(`致命一击！(剩余${remaining}次)`);
            }
        },
        
        // 先制次数
        priorityNext: {
            onConsume(context, consumed, remaining) {
                const { engine } = context;
                if (engine) engine.log(`先制生效！(剩余${remaining}回合)`);
            }
        }
    };

    // =========================================================================
    // 注册处理器
    // =========================================================================
    COUNT.registerHandler = function(key, handler) {
        COUNT_HANDLERS[key] = handler;
    };

    COUNT.getHandler = function(key) {
        return COUNT_HANDLERS[key] || null;
    };

    // =========================================================================
    // Export
    // =========================================================================
    window.COUNT = COUNT;
    window.COUNT_HANDLERS = COUNT_HANDLERS;
})();
