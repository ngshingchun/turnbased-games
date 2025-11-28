/**
 * PP System - 活力系统
 * 
 * 处理所有PP相关操作
 * 格式: PP.SUBFUNC(node(s), handler)
 * 
 * 子函数列表:
 * - PP.USE(nodes, amount, options)                             消耗PP
 * - PP.RESTORE(nodes, amount, options)                         恢复PP
 * - PP.DRAIN(nodes, amount, options)                           吸取PP
 * - PP.LOCK(nodes, turns)                                      锁定PP
 * - PP.CLEAR(nodes)                                            清空PP
 * - PP.SET(nodes, value)                                       设置PP
 * - PP.COST_MODIFY(nodes, amount)                              修改消耗
 * - PP.REFUND(nodes, ratio)                                    返还PP
 * - PP.BLOCK(nodes, turns)                                     封PP
 * - PP.UNLOCK(nodes)                                           解锁PP
 * 
 * 每个函数返回一个效果对象，包含在指定节点执行的逻辑
 */
(() => {
    const PP = {
        /**
         * 使用/消耗PP
         * PP.USE(node, amount, options)
         */
        USE(nodes, amount, options = {}) {
            return {
                type: 'PP.USE',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                amount,
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    // 检查PP锁
                    if (target.pp.locked && !this.options.ignoreLock) {
                        if (engine) engine.log(`${target.name} 的PP被锁定，无法消耗！`);
                        return { success: false, reason: 'locked' };
                    }
                    
                    const used = target.pp.use(this.amount);
                    
                    return { success: used > 0, used };
                }
            };
        },

        /**
         * 恢复PP
         * PP.RESTORE(node, amount, options)
         */
        RESTORE(nodes, amount, options = {}) {
            return {
                type: 'PP.RESTORE',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                amount,
                options,
                label: options.label || '恢复',
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    let restoreAmount = this.amount;
                    if (typeof this.amount === 'function') {
                        restoreAmount = this.amount(context);
                    }
                    
                    const restored = target.pp.restore(restoreAmount);
                    
                    if (engine && restored > 0) {
                        engine.log(`${target.name} 恢复了 ${restored} 点PP！(${this.label})`);
                    }
                    
                    return { success: restored > 0, restored };
                }
            };
        },

        /**
         * 吸取PP
         * PP.DRAIN(node, amount, options)
         */
        DRAIN(nodes, amount, options = {}) {
            return {
                type: 'PP.DRAIN',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                amount,
                options,
                
                execute(context) {
                    const { attacker, target, engine } = context;
                    if (!attacker || !target) return { success: false };
                    
                    const drained = target.pp.drain(this.amount);
                    const restored = attacker.pp.restore(drained);
                    
                    if (engine && drained > 0) {
                        engine.log(`${attacker.name} 吸取了 ${drained} 点PP！`);
                    }
                    
                    return { success: drained > 0, drained, restored };
                }
            };
        },

        /**
         * 清空PP
         * PP.CLEAR(node, options)
         */
        CLEAR(nodes, options = {}) {
            return {
                type: 'PP.CLEAR',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    const before = target.pp.current;
                    target.pp.current = 0;
                    
                    if (engine) {
                        engine.log(`${target.name} 的PP被清空！`);
                    }
                    
                    return { success: true, cleared: before };
                }
            };
        },

        /**
         * 锁定PP（一定回合内无法消耗）
         * PP.LOCK(node, turns, options)
         */
        LOCK(nodes, turns = 1, options = {}) {
            return {
                type: 'PP.LOCK',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                turns,
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    target.pp.lock(this.turns);
                    
                    if (engine) {
                        engine.log(`${target.name} 的PP被锁定 ${this.turns} 回合！`);
                    }
                    
                    return { success: true, turns: this.turns };
                }
            };
        },

        /**
         * 解除PP锁定
         * PP.UNLOCK(node, options)
         */
        UNLOCK(nodes, options = {}) {
            return {
                type: 'PP.UNLOCK',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    target.pp.unlock();
                    
                    if (engine) {
                        engine.log(`${target.name} 的PP锁定解除！`);
                    }
                    
                    return { success: true };
                }
            };
        },

        /**
         * 设置PP值
         * PP.SET(node, value, options)
         */
        SET(nodes, value, options = {}) {
            return {
                type: 'PP.SET',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                value,
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    const before = target.pp.current;
                    target.pp.current = Math.max(0, Math.min(target.pp.max, this.value));
                    
                    if (engine) {
                        engine.log(`${target.name} 的PP设置为 ${target.pp.current}！`);
                    }
                    
                    return { success: true, before, after: target.pp.current };
                }
            };
        },

        /**
         * 恢复满PP
         * PP.RESTORE_FULL(node, options)
         */
        RESTORE_FULL(nodes, options = {}) {
            return {
                type: 'PP.RESTORE_FULL',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    const before = target.pp.current;
                    target.pp.current = target.pp.max;
                    const restored = target.pp.current - before;
                    
                    if (engine && restored > 0) {
                        engine.log(`${target.name} 的PP完全恢复！`);
                    }
                    
                    return { success: true, restored };
                }
            };
        },

        /**
         * 百分比恢复PP
         * PP.RESTORE_PERCENT(node, ratio, options)
         */
        RESTORE_PERCENT(nodes, ratio, options = {}) {
            return {
                type: 'PP.RESTORE_PERCENT',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                ratio,
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    const amount = Math.floor(target.pp.max * this.ratio);
                    const restored = target.pp.restore(amount);
                    
                    if (engine && restored > 0) {
                        engine.log(`${target.name} 恢复了 ${restored} 点PP！`);
                    }
                    
                    return { success: restored > 0, restored };
                }
            };
        },

        /**
         * 检查PP条件
         * PP.CHECK(node, condition, value, callback)
         */
        CHECK(nodes, condition, value, callback = null) {
            return {
                type: 'PP.CHECK',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                condition,
                value,
                callback,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { pass: false };
                    
                    let pass = false;
                    const current = target.pp.current;
                    const max = target.pp.max;
                    
                    switch (this.condition) {
                        case 'below': pass = current < this.value; break;
                        case 'above': pass = current > this.value; break;
                        case 'equal': pass = current === this.value; break;
                        case 'is_empty': pass = current <= 0; break;
                        case 'is_full': pass = current >= max; break;
                        case 'is_locked': pass = target.pp.locked; break;
                    }
                    
                    if (pass && this.callback) {
                        return this.callback(context);
                    }
                    
                    return { pass, value: current };
                }
            };
        },

        /**
         * 在指定节点执行自定义PP处理
         * PP.EXEC(node, handler)
         */
        EXEC(nodes, handler) {
            return {
                type: 'PP.EXEC',
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
    window.PP = PP;
})();
