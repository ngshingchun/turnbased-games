/**
 * STATS System - 属性系统
 * 
 * 处理所有属性相关操作
 * 格式: STATS.SUBFUNC(node(s), handler)
 * 
 * 子函数列表:
 * - STATS.MODIFY(nodes, changes, options)                      修改属性阶段
 * - STATS.CLEAR_UPS(nodes)                                     消除强化
 * - STATS.CLEAR_DOWNS(nodes)                                   消除弱化
 * - STATS.REVERSE(nodes)                                       反转属性
 * - STATS.STEAL(nodes, stats)                                  偷取属性
 * - STATS.SYNC(nodes, stats)                                   同步属性
 * - STATS.COPY(nodes)                                          复制属性
 * - STATS.RESET(nodes)                                         重置属性
 * - STATS.LOCK(nodes, stat, turns)                             锁定属性
 * - STATS.SWAP(nodes, stat1, stat2)                            交换属性
 * - STATS.SET(nodes, stat, value)                              设置属性阶段
 * 
 * 每个函数返回一个效果对象，包含在指定节点执行的逻辑
 */
(() => {
    const STATS = {
        /**
         * 修改属性阶段
         * STATS.MODIFY(node, changes, options)
         * changes: { attack: 1, defense: -1, ... }
         */
        MODIFY(nodes, changes, options = {}) {
            return {
                type: 'STATS.MODIFY',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                changes,
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    // 检查免弱/封强
                    const hasImmuneDrop = target.turnEffects.has('immune_stat_drop') || 
                                          target.countEffects.has('immuneStatDrop');
                    const hasBlockUp = target.turnEffects.has('block_stat_up') ||
                                       target.countEffects.has('blockStatUp');
                    
                    const filteredChanges = {};
                    for (const [stat, change] of Object.entries(this.changes)) {
                        if (change < 0 && hasImmuneDrop && !this.options.ignoreImmune) {
                            if (engine) engine.log(`${target.name} 免疫了${this._statName(stat)}下降！`);
                            continue;
                        }
                        if (change > 0 && hasBlockUp && !this.options.ignoreBlock) {
                            if (engine) engine.log(`${target.name} 无法提升${this._statName(stat)}！`);
                            continue;
                        }
                        filteredChanges[stat] = change;
                    }
                    
                    if (Object.keys(filteredChanges).length === 0) {
                        return { success: false, reason: 'all_blocked' };
                    }
                    
                    const results = target.stats.modify(filteredChanges);
                    
                    if (engine) {
                        for (const [stat, result] of Object.entries(results)) {
                            if (result.change > 0) {
                                engine.log(`${target.name} 的${this._statName(stat)}提升了 ${result.change} 级！`);
                            } else if (result.change < 0) {
                                engine.log(`${target.name} 的${this._statName(stat)}下降了 ${Math.abs(result.change)} 级！`);
                            }
                        }
                    }
                    
                    return { success: true, results };
                },
                
                _statName(stat) {
                    const names = {
                        attack: '攻击', defense: '防御', spAttack: '特攻',
                        spDefense: '特防', speed: '速度', accuracy: '命中'
                    };
                    return names[stat] || stat;
                }
            };
        },

        /**
         * 修改全属性
         * STATS.MODIFY_ALL(node, delta, options)
         */
        MODIFY_ALL(nodes, delta, options = {}) {
            return {
                type: 'STATS.MODIFY_ALL',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                delta,
                options,
                
                execute(context) {
                    const changes = {
                        attack: this.delta,
                        defense: this.delta,
                        spAttack: this.delta,
                        spDefense: this.delta,
                        speed: this.delta
                    };
                    if (this.options.includeAccuracy) {
                        changes.accuracy = this.delta;
                    }
                    
                    return STATS.MODIFY(this.nodes, changes, this.options).execute(context);
                }
            };
        },

        /**
         * 清除属性提升
         * STATS.CLEAR_UPS(node, options)
         */
        CLEAR_UPS(nodes, options = {}) {
            return {
                type: 'STATS.CLEAR_UPS',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    // 检查是否有不可消除保护
                    if (target.turnEffects.has('protect_stats') && !this.options.ignoreProtect) {
                        if (engine) engine.log(`${target.name} 的属性提升无法被消除！`);
                        return { success: false, reason: 'protected' };
                    }
                    
                    const before = { ...target.stats.stage };
                    target.stats.clearUps();
                    
                    if (engine) {
                        engine.log(`${target.name} 的属性提升被消除了！`);
                    }
                    
                    return { success: true, before, after: { ...target.stats.stage } };
                }
            };
        },

        /**
         * 清除属性下降
         * STATS.CLEAR_DOWNS(node, options)
         */
        CLEAR_DOWNS(nodes, options = {}) {
            return {
                type: 'STATS.CLEAR_DOWNS',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    const before = { ...target.stats.stage };
                    target.stats.clearDowns();
                    
                    if (engine) {
                        engine.log(`${target.name} 的属性下降被消除了！`);
                    }
                    
                    return { success: true, before, after: { ...target.stats.stage } };
                }
            };
        },

        /**
         * 反转属性阶段
         * STATS.REVERSE(node, options)
         */
        REVERSE(nodes, options = {}) {
            return {
                type: 'STATS.REVERSE',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                upsOnly: options.upsOnly || false,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    const before = { ...target.stats.stage };
                    
                    if (this.upsOnly) {
                        for (const stat in target.stats.stage) {
                            if (target.stats.stage[stat] > 0) {
                                target.stats.stage[stat] = -target.stats.stage[stat];
                            }
                        }
                    } else {
                        target.stats.reverse();
                    }
                    
                    if (engine) {
                        engine.log(`${target.name} 的属性阶段被反转了！`);
                    }
                    
                    return { success: true, before, after: { ...target.stats.stage } };
                }
            };
        },

        /**
         * 重置属性阶段
         * STATS.RESET(node, options)
         */
        RESET(nodes, options = {}) {
            return {
                type: 'STATS.RESET',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    const before = { ...target.stats.stage };
                    target.stats.reset();
                    
                    if (engine) {
                        engine.log(`${target.name} 的属性阶段被重置了！`);
                    }
                    
                    return { success: true, before };
                }
            };
        },

        /**
         * 偷取属性提升
         * STATS.STEAL(node, options)
         */
        STEAL(nodes, options = {}) {
            return {
                type: 'STATS.STEAL',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                
                execute(context) {
                    const { target, opponent, engine } = context;
                    if (!target || !opponent) return { success: false };
                    
                    let stolen = false;
                    for (const stat in opponent.stats.stage) {
                        if (opponent.stats.stage[stat] > 0) {
                            target.stats.stage[stat] = Math.min(6, 
                                target.stats.stage[stat] + opponent.stats.stage[stat]
                            );
                            opponent.stats.stage[stat] = 0;
                            stolen = true;
                        }
                    }
                    
                    if (stolen && engine) {
                        engine.log(`${target.name} 偷取了 ${opponent.name} 的属性提升！`);
                    }
                    
                    return { success: stolen };
                }
            };
        },

        /**
         * 同步属性（使目标属性不高于自身）
         * STATS.SYNC(node, options)
         */
        SYNC(nodes, options = {}) {
            return {
                type: 'STATS.SYNC',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                
                execute(context) {
                    const { target, opponent, engine } = context;
                    if (!target || !opponent) return { success: false };
                    
                    let synced = false;
                    for (const stat in opponent.stats.stage) {
                        if (opponent.stats.stage[stat] > target.stats.stage[stat]) {
                            opponent.stats.stage[stat] = target.stats.stage[stat];
                            synced = true;
                        }
                    }
                    
                    if (synced && engine) {
                        engine.log(`${opponent.name} 的属性被同步了！`);
                    }
                    
                    return { success: synced };
                }
            };
        },

        /**
         * 复制属性
         * STATS.COPY(node, options)
         */
        COPY(nodes, options = {}) {
            return {
                type: 'STATS.COPY',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                
                execute(context) {
                    const { target, opponent, engine } = context;
                    if (!target || !opponent) return { success: false };
                    
                    const from = this.options.fromOpponent ? opponent : target;
                    const to = this.options.fromOpponent ? target : opponent;
                    
                    to.stats.stage = { ...from.stats.stage };
                    
                    if (engine) {
                        engine.log(`${to.name} 复制了 ${from.name} 的属性！`);
                    }
                    
                    return { success: true };
                }
            };
        },

        /**
         * 检查属性条件
         * STATS.CHECK(node, stat, condition, value, callback)
         */
        CHECK(nodes, stat, condition, value, callback = null) {
            return {
                type: 'STATS.CHECK',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                stat,
                condition,
                value,
                callback,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { pass: false };
                    
                    const stage = target.stats.stage[this.stat] || 0;
                    let pass = false;
                    
                    switch (this.condition) {
                        case 'above': pass = stage > this.value; break;
                        case 'below': pass = stage < this.value; break;
                        case 'equal': pass = stage === this.value; break;
                        case 'has_ups': pass = Object.values(target.stats.stage).some(v => v > 0); break;
                        case 'has_downs': pass = Object.values(target.stats.stage).some(v => v < 0); break;
                    }
                    
                    if (pass && this.callback) {
                        return this.callback(context);
                    }
                    
                    return { pass, stage };
                }
            };
        },

        /**
         * 在指定节点执行自定义属性处理
         * STATS.EXEC(node, handler)
         */
        EXEC(nodes, handler) {
            return {
                type: 'STATS.EXEC',
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
    window.STATS = STATS;
})();
