/**
 * TURN System - 回合效果系统
 * 
 * 处理所有基于回合数的效果
 * 格式: TURN.SUBFUNC(node(s), handler)
 * 
 * 子函数列表:
 * - TURN.ADD(nodes, id, name, turns, handler, onExpire, opts)  添加回合效果
 * - TURN.BURN(nodes, turns, damage)                            添加灼烧
 * - TURN.POISON(nodes, turns, damage)                          添加中毒
 * - TURN.HEAL(nodes, turns, amount)                            添加回合治疗
 * - TURN.DISPEL(nodes, count)                                  消除效果
 * - TURN.TICK(nodes)                                           回合递减
 * - TURN.PROTECT(nodes, turns, type)                           添加保护
 * - TURN.REMOVE(nodes, id)                                     移除指定效果
 * - TURN.HAS(nodes, id)                                        检查是否有效果
 * - TURN.GET(nodes, id)                                        获取效果
 * - TURN.CLEAR(nodes)                                          清除所有效果
 * 
 * 每个函数返回一个效果对象，包含在指定节点执行的逻辑
 */
(() => {
    const TURN = {
        /**
         * 添加回合效果
         * TURN.ADD(node, id, name, turns, handler, onExpire)
         */
        ADD(nodes, id, name, turns, handler = null, onExpire = null, options = {}) {
            return {
                type: 'TURN.ADD',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                id,
                name,
                turns,
                handler,
                onExpire,
                cannotDispel: options.cannotDispel || false,
                params: options.params,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { success: false };
                    
                    target.turnEffects.add({
                        id: this.id,
                        name: this.name,
                        turns: this.turns,
                        handler: this.handler,
                        onExpire: this.onExpire,
                        cannotDispel: this.cannotDispel,
                        params: this.params
                    });
                    
                    return { success: true, effectId: this.id, turns: this.turns };
                }
            };
        },

        /**
         * 移除回合效果
         * TURN.REMOVE(node, id)
         */
        REMOVE(nodes, id) {
            return {
                type: 'TURN.REMOVE',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                id,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { success: false };
                    
                    target.turnEffects.remove(this.id);
                    return { success: true, removedId: this.id };
                }
            };
        },

        /**
         * 消除所有可消除效果
         * TURN.DISPEL(node, excludeUndispellable)
         */
        DISPEL(nodes, excludeUndispellable = true) {
            return {
                type: 'TURN.DISPEL',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                excludeUndispellable,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { success: false };
                    
                    const removed = target.turnEffects.dispel(this.excludeUndispellable);
                    return { success: true, removed };
                }
            };
        },

        /**
         * 检查是否有效果
         * TURN.HAS(node, id) - 用于条件判断
         */
        HAS(nodes, id) {
            return {
                type: 'TURN.HAS',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                id,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { has: false };
                    
                    return { has: target.turnEffects.has(this.id) };
                }
            };
        },

        /**
         * 回合开始时tick（通常在 TURN_START 节点）
         * TURN.TICK_START(node)
         */
        TICK_START(nodes) {
            return {
                type: 'TURN.TICK_START',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { success: false };
                    
                    // 触发每个效果的开始逻辑
                    for (const effect of target.turnEffects.list) {
                        if (effect.handler && typeof effect.handler.onStart === 'function') {
                            effect.handler.onStart(context, effect);
                        }
                    }
                    return { success: true };
                }
            };
        },

        /**
         * 回合结束时tick（通常在 TURN_END 节点）
         * TURN.TICK_END(node)
         */
        TICK_END(nodes) {
            return {
                type: 'TURN.TICK_END',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    // 触发每个效果的tick逻辑
                    for (const effect of target.turnEffects.list) {
                        if (effect.handler && typeof effect.handler.onTick === 'function') {
                            effect.handler.onTick(context, effect);
                        }
                    }
                    
                    // 执行tick，处理到期效果
                    const expired = target.turnEffects.tick();
                    for (const effect of expired) {
                        if (effect.onExpire && typeof effect.onExpire === 'function') {
                            effect.onExpire(context, effect);
                        }
                        if (engine) engine.log(`${target.name} 的 ${effect.name} 效果结束`);
                    }
                    
                    return { success: true, expired };
                }
            };
        },

        /**
         * 刷新效果回合数
         * TURN.REFRESH(node, id, turns)
         */
        REFRESH(nodes, id, turns) {
            return {
                type: 'TURN.REFRESH',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                id,
                turns,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { success: false };
                    
                    const effect = target.turnEffects.get(this.id);
                    if (effect) {
                        effect.turns = this.turns;
                        return { success: true, refreshed: true };
                    }
                    return { success: false, refreshed: false };
                }
            };
        },

        /**
         * 在指定节点执行自定义回合效果处理
         * TURN.EXEC(node, handler)
         */
        EXEC(nodes, handler) {
            return {
                type: 'TURN.EXEC',
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
    // 内置回合效果处理器
    // =========================================================================
    const TURN_HANDLERS = {
        // 毒伤害
        poison: {
            onTick(context, effect) {
                const { target, engine } = context;
                const dmg = Math.floor(target.hp.max / 8);
                target.hp.damage(dmg);
                if (engine) engine.log(`${target.name} 受到中毒伤害 ${dmg}`);
            }
        },
        
        // 烧伤
        burn: {
            onTick(context, effect) {
                const { target, engine } = context;
                const dmg = Math.floor(target.hp.max / 8);
                target.hp.damage(dmg);
                if (engine) engine.log(`${target.name} 受到烧伤伤害 ${dmg}`);
            }
        },
        
        // 冻伤
        frostbite: {
            onTick(context, effect) {
                const { target, engine } = context;
                const dmg = Math.floor(target.hp.max / 8);
                target.hp.damage(dmg);
                if (engine) engine.log(`${target.name} 受到冻伤伤害 ${dmg}`);
            }
        },
        
        // 流血
        bleed: {
            onTick(context, effect) {
                const { target, engine } = context;
                const dmg = 80;
                target.hp.damage(dmg);
                if (engine) engine.log(`${target.name} 受到流血伤害 ${dmg}`);
            }
        },
        
        // 焚烬
        immolate: {
            onTick(context, effect) {
                const { target, engine } = context;
                const dmg = Math.floor(target.hp.max / 8);
                target.hp.damage(dmg);
                if (engine) engine.log(`${target.name} 受到焚烬伤害 ${dmg}`);
            }
        },
        
        // 寄生
        parasite: {
            onTick(context, effect) {
                const { target, opponent, engine } = context;
                const dmg = Math.floor(target.hp.max / 8);
                target.hp.damage(dmg);
                if (opponent) opponent.hp.heal(dmg);
                if (engine) engine.log(`${target.name} 被寄生吸取 ${dmg}`);
            }
        },
        
        // 水厄
        water_curse: {
            onTick(context, effect) {
                const { target, engine } = context;
                const stacks = effect.params?.stacks || 1;
                const dmg = Math.floor(target.hp.max * 0.2 * stacks);
                target.hp.damage(dmg);
                if (engine) engine.log(`${target.name} 受到水厄伤害 ${dmg} (${stacks}层)`);
            }
        },
        
        // 再生
        regen: {
            onTick(context, effect) {
                const { target, engine } = context;
                if (target.status.isControlled()) return;
                const heal = Math.floor(target.hp.max / 8);
                target.hp.heal(heal);
                if (engine) engine.log(`${target.name} 再生恢复 ${heal}`);
            }
        }
    };

    // =========================================================================
    // 注册处理器
    // =========================================================================
    TURN.registerHandler = function(id, handler) {
        TURN_HANDLERS[id] = handler;
    };

    TURN.getHandler = function(id) {
        return TURN_HANDLERS[id] || null;
    };

    // =========================================================================
    // Export
    // =========================================================================
    window.TURN = TURN;
    window.TURN_HANDLERS = TURN_HANDLERS;
})();
