/**
 * PRIO System - 先制系统
 * 
 * 处理所有先制相关操作
 * 格式: PRIO.SUBFUNC(node(s), handler)
 * 
 * 子函数列表:
 * - PRIO.ADD(nodes, amount, turns, options)                    添加先制等级
 * - PRIO.FORCE(nodes)                                          强制先出
 * - PRIO.DOWN(nodes, amount)                                   降低先制
 * - PRIO.CALCULATE(nodes)                                      计算最终先制
 * - PRIO.BLOCK(nodes, turns)                                   封先制
 * - PRIO.LAST(nodes, turns)                                    强制后出
 * - PRIO.SPEED_TIE(nodes, advantage)                           速度平局处理
 * - PRIO.SWAP(nodes)                                           交换先后手
 * - PRIO.LOCK(nodes, turns)                                    锁定先后手
 * - PRIO.RESET(nodes)                                          重置先制修正
 * 
 * 每个函数返回一个效果对象，包含在指定节点执行的逻辑
 */
(() => {
    const PRIO = {
        /**
         * 增加先制
         * PRIO.ADD(node, amount, turns, options)
         */
        ADD(nodes, amount, turns = 1, options = {}) {
            return {
                type: 'PRIO.ADD',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                amount,
                turns,
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    target.countEffects.add('priorityBonus', this.amount, 10);
                    if (this.turns > 1) {
                        target.turnEffects.add({
                            id: 'priority_bonus',
                            name: `先制+${this.amount}`,
                            turns: this.turns
                        });
                    }
                    
                    if (engine) {
                        engine.log(`${target.name} 获得先制+${this.amount}！(${this.turns}回合)`);
                    }
                    
                    return { success: true, amount: this.amount, turns: this.turns };
                }
            };
        },

        /**
         * 强制先手（绝对先制）
         * PRIO.FORCE(node, turns, options)
         */
        FORCE(nodes, turns = 1, options = {}) {
            return {
                type: 'PRIO.FORCE',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                turns,
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    target.countEffects.set('forcePriority', this.turns);
                    
                    if (engine) {
                        engine.log(`${target.name} 获得必定先手！(${this.turns}回合)`);
                    }
                    
                    return { success: true, turns: this.turns };
                }
            };
        },

        /**
         * 降低先制
         * PRIO.DOWN(node, amount, turns, options)
         */
        DOWN(nodes, amount, turns = 1, options = {}) {
            return {
                type: 'PRIO.DOWN',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                amount,
                turns,
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    target.countEffects.add('priorityPenalty', this.amount, 10);
                    if (this.turns > 1) {
                        target.turnEffects.add({
                            id: 'priority_penalty',
                            name: `先制-${this.amount}`,
                            turns: this.turns
                        });
                    }
                    
                    if (engine) {
                        engine.log(`${target.name} 先制-${this.amount}！(${this.turns}回合)`);
                    }
                    
                    return { success: true, amount: this.amount, turns: this.turns };
                }
            };
        },

        /**
         * 封锁先制（无视先制加成）
         * PRIO.BLOCK(node, turns, options)
         */
        BLOCK(nodes, turns = 1, options = {}) {
            return {
                type: 'PRIO.BLOCK',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                turns,
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    target.turnEffects.add({
                        id: 'priority_block',
                        name: '先制封锁',
                        turns: this.turns,
                        cannotDispel: this.options.cannotDispel
                    });
                    
                    if (engine) {
                        engine.log(`${target.name} 的先制被封锁！(${this.turns}回合)`);
                    }
                    
                    return { success: true, turns: this.turns };
                }
            };
        },

        /**
         * 计算最终先制值
         * PRIO.CALC(node, skill, options)
         */
        CALC(nodes, skill = null, options = {}) {
            return {
                type: 'PRIO.CALC',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                skill,
                options,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { priority: 0 };
                    
                    // 检查强制先手
                    if (target.countEffects.has('forcePriority')) {
                        return { priority: 999, forced: true };
                    }
                    
                    // 基础先制
                    let priority = this.skill?.priority || 0;
                    
                    // 检查先制封锁
                    if (target.turnEffects.has('priority_block')) {
                        return { priority, blocked: true };
                    }
                    
                    // 先制加成
                    priority += target.countEffects.get('priorityBonus') || 0;
                    
                    // 先制惩罚
                    priority -= target.countEffects.get('priorityPenalty') || 0;
                    
                    return { priority, base: this.skill?.priority || 0 };
                }
            };
        },

        /**
         * 比较双方先制，决定先后手
         * PRIO.COMPARE(node, options)
         */
        COMPARE(nodes, options = {}) {
            return {
                type: 'PRIO.COMPARE',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                
                execute(context) {
                    const { stateA, stateB, skillA, skillB, engine } = context;
                    if (!stateA || !stateB) return { first: null };
                    
                    // 计算双方先制
                    const prioA = PRIO.CALC(this.nodes, skillA).execute({ target: stateA });
                    const prioB = PRIO.CALC(this.nodes, skillB).execute({ target: stateB });
                    
                    let first = 'A';
                    let reason = 'priority';
                    
                    // 检查强制先手
                    if (prioA.forced && !prioB.forced) {
                        first = 'A';
                        reason = 'forced';
                    } else if (prioB.forced && !prioA.forced) {
                        first = 'B';
                        reason = 'forced';
                    } else if (prioA.priority !== prioB.priority) {
                        // 先制高的先手
                        first = prioA.priority > prioB.priority ? 'A' : 'B';
                        reason = 'priority';
                    } else {
                        // 先制相同，比速度
                        const speedA = stateA.stats.calc('speed');
                        const speedB = stateB.stats.calc('speed');
                        
                        if (speedA !== speedB) {
                            first = speedA > speedB ? 'A' : 'B';
                            reason = 'speed';
                        } else {
                            // 速度相同，随机
                            first = Math.random() < 0.5 ? 'A' : 'B';
                            reason = 'random';
                        }
                    }
                    
                    if (engine) {
                        const firstName = first === 'A' ? stateA.name : stateB.name;
                        engine.log(`先手方: ${firstName} (${reason})`);
                    }
                    
                    return {
                        first,
                        second: first === 'A' ? 'B' : 'A',
                        reason,
                        prioA: prioA.priority,
                        prioB: prioB.priority
                    };
                }
            };
        },

        /**
         * 重置先制加成
         * PRIO.RESET(node, options)
         */
        RESET(nodes, options = {}) {
            return {
                type: 'PRIO.RESET',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    target.countEffects.clear('priorityBonus');
                    target.countEffects.clear('priorityPenalty');
                    target.countEffects.clear('forcePriority');
                    target.turnEffects.remove('priority_bonus');
                    target.turnEffects.remove('priority_penalty');
                    target.turnEffects.remove('priority_block');
                    
                    if (engine) {
                        engine.log(`${target.name} 的先制效果被重置！`);
                    }
                    
                    return { success: true };
                }
            };
        },

        /**
         * 在指定节点执行自定义先制处理
         * PRIO.EXEC(node, handler)
         */
        EXEC(nodes, handler) {
            return {
                type: 'PRIO.EXEC',
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
    // Export
    // =========================================================================
    window.PRIO = PRIO;
})();
