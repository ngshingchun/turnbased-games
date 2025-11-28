/**
 * HP System - 体力系统
 * 
 * 处理所有体力相关操作
 * 格式: HP.SUBFUNC(node(s), handler)
 * 
 * 子函数列表:
 * - HP.HEAL(nodes, amount, options)                            固定治疗
 * - HP.HEAL_PERCENT(nodes, percent, base, options)             百分比治疗
 * - HP.SET(nodes, value)                                       设置HP
 * - HP.DRAIN(nodes, amount, options)                           吸取HP
 * - HP.DRAIN_PERCENT(nodes, percent, options)                  百分比吸取
 * - HP.BLOCK_HEAL(nodes, turns)                                禁疗
 * - HP.REVIVE(nodes, percent)                                  复活
 * - HP.SHARE(nodes, ratio)                                     HP分摊
 * - HP.LOCK(nodes, min)                                        锁血
 * - HP.SACRIFICE(nodes, amount)                                献祭HP
 * 
 * 每个函数返回一个效果对象，包含在指定节点执行的逻辑
 */
(() => {
    const HP = {
        /**
         * 恢复体力
         * HP.HEAL(node, amount, options)
         */
        HEAL(nodes, amount, options = {}) {
            return {
                type: 'HP.HEAL',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                amount,
                options,
                label: options.label || '恢复',
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    // 检查禁疗
                    if (target.status.has('heal_block') && !this.options.ignoreBlock) {
                        if (engine) engine.log(`${target.name} 处于禁疗状态，无法恢复！`);
                        return { success: false, reason: 'blocked' };
                    }
                    
                    let healAmount = this.amount;
                    if (typeof this.amount === 'function') {
                        healAmount = this.amount(context);
                    }
                    
                    const actualHeal = target.hp.heal(healAmount);
                    target.turnFlags.healed += actualHeal;
                    
                    if (engine && actualHeal > 0) {
                        engine.log(`${target.name} 恢复了 ${actualHeal} 点体力！(${this.label})`);
                    }
                    
                    return { success: true, healed: actualHeal };
                }
            };
        },

        /**
         * 百分比恢复
         * HP.HEAL_PERCENT(node, ratio, options)
         */
        HEAL_PERCENT(nodes, ratio, options = {}) {
            return {
                type: 'HP.HEAL_PERCENT',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                ratio,  // 0.1 = 10%
                options,
                label: options.label || '恢复',
                basedOn: options.basedOn || 'max',  // max, current, lost
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    // 检查禁疗
                    if (target.status.has('heal_block') && !this.options.ignoreBlock) {
                        if (engine) engine.log(`${target.name} 处于禁疗状态，无法恢复！`);
                        return { success: false, reason: 'blocked' };
                    }
                    
                    let base = 0;
                    switch (this.basedOn) {
                        case 'max': base = target.hp.max; break;
                        case 'current': base = target.hp.current; break;
                        case 'lost': base = target.hp.max - target.hp.current; break;
                    }
                    
                    const healAmount = Math.floor(base * this.ratio);
                    const actualHeal = target.hp.heal(healAmount);
                    target.turnFlags.healed += actualHeal;
                    
                    if (engine && actualHeal > 0) {
                        engine.log(`${target.name} 恢复了 ${actualHeal} 点体力！(${this.label})`);
                    }
                    
                    return { success: true, healed: actualHeal };
                }
            };
        },

        /**
         * 恢复满血
         * HP.HEAL_FULL(node, options)
         */
        HEAL_FULL(nodes, options = {}) {
            return {
                type: 'HP.HEAL_FULL',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                label: options.label || '完全恢复',
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    // 检查禁疗
                    if (target.status.has('heal_block') && !this.options.ignoreBlock) {
                        if (engine) engine.log(`${target.name} 处于禁疗状态，无法恢复！`);
                        return { success: false, reason: 'blocked' };
                    }
                    
                    const missing = target.hp.max - target.hp.current;
                    const actualHeal = target.hp.heal(missing);
                    target.turnFlags.healed += actualHeal;
                    
                    if (engine && actualHeal > 0) {
                        engine.log(`${target.name} 体力完全恢复！(${this.label})`);
                    }
                    
                    return { success: true, healed: actualHeal };
                }
            };
        },

        /**
         * 设置体力值
         * HP.SET(node, value, options)
         */
        SET(nodes, value, options = {}) {
            return {
                type: 'HP.SET',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                value,
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    const before = target.hp.current;
                    let newValue = this.value;
                    if (typeof this.value === 'function') {
                        newValue = this.value(context);
                    }
                    
                    target.hp.set(newValue);
                    const diff = target.hp.current - before;
                    
                    if (engine) {
                        if (diff > 0) {
                            engine.log(`${target.name} 体力设置为 ${target.hp.current}！(+${diff})`);
                        } else if (diff < 0) {
                            engine.log(`${target.name} 体力设置为 ${target.hp.current}！(${diff})`);
                        }
                    }
                    
                    return { success: true, before, after: target.hp.current, diff };
                }
            };
        },

        /**
         * 设置为当前体力的百分比
         * HP.SET_PERCENT(node, ratio, options)
         */
        SET_PERCENT(nodes, ratio, options = {}) {
            return {
                type: 'HP.SET_PERCENT',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                ratio,
                options,
                basedOn: options.basedOn || 'max',  // max, current
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    let base = this.basedOn === 'max' ? target.hp.max : target.hp.current;
                    const newValue = Math.floor(base * this.ratio);
                    
                    const before = target.hp.current;
                    target.hp.set(newValue);
                    const diff = target.hp.current - before;
                    
                    if (engine) {
                        engine.log(`${target.name} 体力设置为 ${target.hp.current}！`);
                    }
                    
                    return { success: true, before, after: target.hp.current, diff };
                }
            };
        },

        /**
         * 检查体力条件
         * HP.CHECK(node, condition, value, callback)
         */
        CHECK(nodes, condition, value, callback = null) {
            return {
                type: 'HP.CHECK',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                condition,  // 'below', 'above', 'equal', 'percent_below', 'percent_above'
                value,
                callback,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { pass: false };
                    
                    let pass = false;
                    const current = target.hp.current;
                    const max = target.hp.max;
                    const percent = current / max;
                    
                    switch (this.condition) {
                        case 'below': pass = current < this.value; break;
                        case 'above': pass = current > this.value; break;
                        case 'equal': pass = current === this.value; break;
                        case 'percent_below': pass = percent < this.value; break;
                        case 'percent_above': pass = percent > this.value; break;
                        case 'is_dead': pass = current <= 0; break;
                        case 'is_alive': pass = current > 0; break;
                        case 'is_low': pass = percent <= 0.25; break;
                        case 'is_critical': pass = percent <= 0.1; break;
                    }
                    
                    if (pass && this.callback) {
                        return this.callback(context);
                    }
                    
                    return { pass, value: current, percent };
                }
            };
        },

        /**
         * 保留至少1点体力
         * HP.SURVIVE(node, options)
         */
        SURVIVE(nodes, options = {}) {
            return {
                type: 'HP.SURVIVE',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                minHp: options.minHp || 1,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    if (target.hp.current < this.minHp) {
                        target.hp.set(this.minHp);
                        if (engine) engine.log(`${target.name} 保留了 ${this.minHp} 点体力！`);
                        return { success: true, survived: true };
                    }
                    
                    return { success: true, survived: false };
                }
            };
        },

        /**
         * 增加最大体力
         * HP.MODIFY_MAX(node, amount, options)
         */
        MODIFY_MAX(nodes, amount, options = {}) {
            return {
                type: 'HP.MODIFY_MAX',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                amount,
                options,
                healToMax: options.healToMax || false,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    const before = target.hp.max;
                    target.hp.max = Math.max(1, target.hp.max + this.amount);
                    
                    // 确保当前体力不超过最大值
                    if (target.hp.current > target.hp.max) {
                        target.hp.current = target.hp.max;
                    }
                    
                    // 可选：恢复到新的最大值
                    if (this.healToMax && this.amount > 0) {
                        target.hp.current = target.hp.max;
                    }
                    
                    if (engine) {
                        if (this.amount > 0) {
                            engine.log(`${target.name} 最大体力增加 ${this.amount}！`);
                        } else {
                            engine.log(`${target.name} 最大体力降低 ${Math.abs(this.amount)}！`);
                        }
                    }
                    
                    return { success: true, before, after: target.hp.max };
                }
            };
        },

        /**
         * 在指定节点执行自定义体力处理
         * HP.EXEC(node, handler)
         */
        EXEC(nodes, handler) {
            return {
                type: 'HP.EXEC',
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
    window.HP = HP;
})();
