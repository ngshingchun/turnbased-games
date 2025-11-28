/**
 * STATUS System - 异常状态系统
 * 
 * 处理所有异常状态相关操作
 * 格式: STATUS.SUBFUNC(node(s), handler)
 * 
 * 子函数列表:
 * - STATUS.APPLY(nodes, statusId, turns, options)              施加状态
 * - STATUS.REMOVE(nodes, statusId)                             移除状态
 * - STATUS.CHECK_CONTROL(nodes)                                检查控制状态
 * - STATUS.CHECK_IMMUNE(nodes, statusId)                       检查免疫
 * - STATUS.TICK(nodes)                                         状态递减
 * - STATUS.CLEAR_ALL(nodes)                                    清除所有状态
 * - STATUS.CLEAR_CONTROL(nodes)                                清除控制状态
 * - STATUS.CLEAR_DEBUFF(nodes)                                 清除负面状态
 * - STATUS.ADD_IMMUNE(nodes, statusId, turns)                  添加免疫
 * - STATUS.TRANSFER(nodes, statusId)                           转移状态
 * - STATUS.HAS(nodes, statusId)                                检查是否有状态
 * 
 * 每个函数返回一个效果对象，包含在指定节点执行的逻辑
 */
(() => {
    // 异常状态定义
    const STATUS_DEFS = {
        // 控制类 (无法行动)
        sleep: { name: '睡眠', type: 'control', desc: '无法行动' },
        freeze: { name: '冰冻', type: 'control', desc: '无法行动' },
        paralyze: { name: '麻痹', type: 'control', desc: '无法行动' },
        fear: { name: '害怕', type: 'control', desc: '无法行动' },
        exhaust: { name: '疲惫', type: 'control', desc: '无法行动' },
        stone: { name: '石化', type: 'control', desc: '无法行动' },
        confuse: { name: '混乱', type: 'control', desc: '无法行动' },
        immolate: { name: '焚烬', type: 'control', desc: '无法行动，结束后转为烧伤' },
        curse: { name: '诅咒', type: 'control', desc: '无法行动，结束后转化' },
        infect: { name: '感染', type: 'control', desc: '无法行动，结束后转为中毒' },
        
        // 持续伤害类
        poison: { name: '中毒', type: 'dot', desc: '每回合扣除1/8最大体力' },
        burn: { name: '烧伤', type: 'dot', desc: '每回合扣除1/8最大体力' },
        frostbite: { name: '冻伤', type: 'dot', desc: '每回合扣除1/8最大体力' },
        bleed: { name: '流血', type: 'dot', desc: '每回合扣除80点体力' },
        parasite: { name: '寄生', type: 'dot', desc: '每回合吸取1/8最大体力' },
        water_curse: { name: '水厄', type: 'dot', desc: '每回合扣除百分比体力' },
        silence: { name: '沉默', type: 'dot', desc: '每回合扣除体力，无法使用第五技能' },
        
        // 限制类
        bind: { name: '束缚', type: 'restrict', desc: '无法切换精灵' },
        stagnant: { name: '凝滞', type: 'restrict', desc: '无法切换，免疫控制' },
        daze: { name: '失神', type: 'restrict', desc: '属性技能50%失效' },
        blind: { name: '失明', type: 'restrict', desc: '攻击技能50%miss' },
        submit: { name: '臣服', type: 'restrict', desc: '无法造成伤害' },
        flammable: { name: '易燃', type: 'restrict', desc: '命中率降低30%' },
        
        // 诅咒子类
        curse_fire: { name: '烈焰诅咒', type: 'curse', desc: '每回合1/8伤害' },
        curse_fatal: { name: '致命诅咒', type: 'curse', desc: '受伤害提升50%' },
        curse_weak: { name: '虚弱诅咒', type: 'curse', desc: '造成伤害降低50%' },
        
        // 功能类
        block_attr: { name: '封属', type: 'block', desc: '无法使用属性技能' },
        block_attack: { name: '封攻', type: 'block', desc: '无法使用攻击技能' },
        heal_block: { name: '禁疗', type: 'block', desc: '无法恢复体力' }
    };

    // 控制状态列表
    const CONTROL_STATUSES = ['sleep', 'freeze', 'paralyze', 'fear', 'exhaust', 'stone', 'confuse', 'immolate', 'curse', 'infect'];
    
    // 异常状态列表（可被免疫）
    const ABNORMAL_STATUSES = Object.keys(STATUS_DEFS);
    
    // 切换限制状态
    const SWITCH_BLOCK_STATUSES = ['bind', 'stagnant'];

    const STATUS = {
        /**
         * 施加状态
         * STATUS.APPLY(node, statusId, turns, options)
         */
        APPLY(nodes, statusId, turns = 2, options = {}) {
            return {
                type: 'STATUS.APPLY',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                statusId,
                turns,
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    const def = STATUS_DEFS[this.statusId];
                    if (!def) return { success: false, reason: 'unknown_status' };
                    
                    // 检查免疫
                    if (!this.options.ignoreImmune) {
                        // 异常免疫
                        if (target.countEffects.has('abnormalImmunity')) {
                            target.countEffects.consume('abnormalImmunity');
                            if (engine) engine.log(`${target.name} 免疫了${def.name}！`);
                            return { success: false, reason: 'immune' };
                        }
                        
                        // 回合免疫
                        if (target.turnEffects.has('immune_abnormal')) {
                            if (engine) engine.log(`${target.name} 免疫了${def.name}！`);
                            return { success: false, reason: 'immune' };
                        }
                        
                        // 凝滞免疫控制
                        if (CONTROL_STATUSES.includes(this.statusId) && target.status.has('stagnant')) {
                            if (engine) engine.log(`${target.name} 处于凝滞，免疫控制！`);
                            return { success: false, reason: 'stagnant' };
                        }
                        
                        // 特定状态免疫
                        if (target.status.isImmune(this.statusId)) {
                            if (engine) engine.log(`${target.name} 免疫了${def.name}！`);
                            return { success: false, reason: 'specific_immune' };
                        }
                    }
                    
                    // 检查反弹
                    if (target.turnEffects.has('reflect_status') && !this.options.noReflect) {
                        const { opponent } = context;
                        if (opponent && engine) {
                            engine.log(`${target.name} 反弹了${def.name}！`);
                            // 对对手施加状态
                            return STATUS.APPLY(this.nodes, this.statusId, this.turns, { ...this.options, noReflect: true })
                                .execute({ ...context, target: opponent });
                        }
                    }
                    
                    // 施加状态
                    const result = target.status.apply(this.statusId, def.name, this.turns, this.options.source);
                    
                    if (result.applied && engine) {
                        engine.log(`${target.name} 陷入了${def.name}状态！`);
                    }
                    
                    return { success: result.applied, statusId: this.statusId, name: def.name };
                }
            };
        },

        /**
         * 移除状态
         * STATUS.REMOVE(node, statusId, options)
         */
        REMOVE(nodes, statusId, options = {}) {
            return {
                type: 'STATUS.REMOVE',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                statusId,
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    const had = target.status.has(this.statusId);
                    target.status.remove(this.statusId);
                    
                    if (had && engine) {
                        const def = STATUS_DEFS[this.statusId];
                        engine.log(`${target.name} 的${def?.name || this.statusId}状态解除了！`);
                    }
                    
                    return { success: had };
                }
            };
        },

        /**
         * 清除所有异常状态
         * STATUS.CLEAR(node, options)
         */
        CLEAR(nodes, options = {}) {
            return {
                type: 'STATUS.CLEAR',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                options,
                clearType: options.clearType || 'all',  // all, control, dot, curse
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    const before = target.status.current.length;
                    
                    if (this.clearType === 'all') {
                        target.status.clear();
                    } else {
                        target.status.current = target.status.current.filter(s => {
                            const def = STATUS_DEFS[s.id];
                            return def?.type !== this.clearType;
                        });
                    }
                    
                    const cleared = before - target.status.current.length;
                    
                    if (cleared > 0 && engine) {
                        engine.log(`${target.name} 的异常状态被解除了！`);
                    }
                    
                    return { success: cleared > 0, cleared };
                }
            };
        },

        /**
         * 检查是否有状态
         * STATUS.HAS(node, statusId)
         */
        HAS(nodes, statusId) {
            return {
                type: 'STATUS.HAS',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                statusId,
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { has: false };
                    
                    return { has: target.status.has(this.statusId) };
                }
            };
        },

        /**
         * 检查是否被控制
         * STATUS.IS_CONTROLLED(node)
         */
        IS_CONTROLLED(nodes) {
            return {
                type: 'STATUS.IS_CONTROLLED',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                
                execute(context) {
                    const { target } = context;
                    if (!target) return { controlled: false };
                    
                    return { 
                        controlled: target.status.isControlled(),
                        status: target.status.getControlStatus()
                    };
                }
            };
        },

        /**
         * 添加状态免疫
         * STATUS.ADD_IMMUNITY(node, statusId, turns, options)
         */
        ADD_IMMUNITY(nodes, statusId, turns, options = {}) {
            return {
                type: 'STATUS.ADD_IMMUNITY',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                statusId,
                turns,
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    target.status.addImmunity(this.statusId, this.turns);
                    
                    if (engine) {
                        const def = STATUS_DEFS[this.statusId];
                        engine.log(`${target.name} 获得了${def?.name || this.statusId}免疫！`);
                    }
                    
                    return { success: true };
                }
            };
        },

        /**
         * 转化状态（如焚烬转烧伤）
         * STATUS.TRANSFORM(node, fromId, toId, options)
         */
        TRANSFORM(nodes, fromId, toId, options = {}) {
            return {
                type: 'STATUS.TRANSFORM',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                fromId,
                toId,
                options,
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    if (!target.status.has(this.fromId)) {
                        return { success: false, reason: 'no_source_status' };
                    }
                    
                    target.status.remove(this.fromId);
                    const toDef = STATUS_DEFS[this.toId];
                    target.status.apply(this.toId, toDef?.name || this.toId, this.options.turns || 2);
                    
                    if (engine) {
                        const fromDef = STATUS_DEFS[this.fromId];
                        engine.log(`${target.name} 的${fromDef?.name}转化为${toDef?.name}！`);
                    }
                    
                    return { success: true };
                }
            };
        },

        /**
         * 在指定节点执行自定义状态处理
         * STATUS.EXEC(node, handler)
         */
        EXEC(nodes, handler) {
            return {
                type: 'STATUS.EXEC',
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
    window.STATUS = STATUS;
    window.STATUS_DEFS = STATUS_DEFS;
    window.CONTROL_STATUSES = CONTROL_STATUSES;
    window.ABNORMAL_STATUSES = ABNORMAL_STATUSES;
    window.SWITCH_BLOCK_STATUSES = SWITCH_BLOCK_STATUSES;
})();
