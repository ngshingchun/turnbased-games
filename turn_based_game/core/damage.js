/**
 * DAMAGE System - 伤害系统
 * 
 * 处理所有伤害计算和应用
 * 格式: DAMAGE.SUBFUNC(node(s), handler)
 * 
 * 子函数列表:
 * - DAMAGE.ATTACK(nodes, power, options)                       攻击伤害(红伤)
 * - DAMAGE.FIXED(nodes, amount, options)                       固定伤害(粉伤)
 * - DAMAGE.PERCENT(nodes, ratio, base, options)                百分比伤害
 * - DAMAGE.TRUE(nodes, amount, options)                        真实伤害(白伤)
 * - DAMAGE.ABSORB(nodes, ratio, options)                       吸取伤害
 * - DAMAGE.REFLECT(nodes, ratio, options)                      反弹伤害
 * - DAMAGE.CHAIN(nodes, count, decay)                          连锁伤害
 * - DAMAGE.EXECUTE(nodes, threshold)                           斩杀伤害
 * - DAMAGE.RECOIL(nodes, ratio)                                反伤(自伤)
 * - DAMAGE.CALC(nodes, formula)                                自定义公式
 * 
 * 每个函数返回一个效果对象，包含在指定节点执行的逻辑
 */
(() => {
    const DAMAGE = {
        /**
         * 攻击伤害（基于威力和属性）
         * DAMAGE.ATTACK(node, power, options)
         */
        ATTACK(nodes, power, options = {}) {
            return {
                type: 'DAMAGE.ATTACK',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                power,
                options,
                
                execute(context) {
                    const { attacker, defender, engine, skill } = context;
                    if (!attacker || !defender) return { success: false };
                    
                    // 基础伤害计算
                    let damage = this.power;
                    
                    // 属性阶段
                    const offStage = attacker.stats.stage.attack;
                    const defStage = defender.stats.stage.defense;
                    
                    const offMult = this._stageMult(offStage);
                    const defMult = this._stageMult(defStage);
                    
                    damage = damage * offMult / defMult;
                    
                    // 暴击
                    if (context.isCrit) {
                        damage *= 2;
                    }
                    
                    // 伤害加成
                    const boostCount = attacker.countEffects.get('damageBoost');
                    if (boostCount > 0) {
                        const boostVal = attacker.countEffects.get('damageBoostVal') || 100;
                        damage *= (1 + boostVal / 100);
                        attacker.countEffects.consume('damageBoost');
                    }
                    
                    // 易伤
                    if (defender.countEffects.has('vulnerability')) {
                        damage *= 2;
                    }
                    
                    // 护盾吸收
                    damage = defender.shield.absorb(damage);
                    
                    // 应用伤害
                    const finalDamage = Math.floor(Math.max(1, damage));
                    const actualDamage = defender.hp.damage(finalDamage);
                    
                    // 更新标记
                    defender.turnFlags.tookDamage = true;
                    defender.turnFlags.damageTaken += actualDamage;
                    attacker.turnFlags.damageDealt += actualDamage;
                    
                    if (engine) {
                        engine.log(`${attacker.name} 对 ${defender.name} 造成 ${actualDamage} 点伤害！`);
                    }
                    
                    return { 
                        success: true, 
                        damage: actualDamage, 
                        isCrit: context.isCrit,
                        blocked: finalDamage - actualDamage
                    };
                },
                
                _stageMult(stage) {
                    const mult = [2/8, 2/7, 2/6, 2/5, 2/4, 2/3, 1, 3/2, 4/2, 5/2, 6/2, 7/2, 8/2];
                    return mult[Math.max(0, Math.min(12, stage + 6))];
                }
            };
        },

        /**
         * 固定伤害
         * DAMAGE.FIXED(node, amount, options)
         */
        FIXED(nodes, amount, options = {}) {
            return {
                type: 'DAMAGE.FIXED',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                amount,
                options,
                label: options.label || '固定伤害',
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    // 检查抗性
                    let finalAmount = this.amount;
                    if (!this.options.ignoreResist) {
                        const resist = target.resist?.fixed || 35;
                        if (resist >= 100) return { success: true, damage: 0, resisted: true };
                        finalAmount = Math.floor(finalAmount * (1 - resist / 100));
                    }
                    
                    const actualDamage = target.hp.damage(finalAmount);
                    target.turnFlags.tookDamage = true;
                    target.turnFlags.damageTaken += actualDamage;
                    
                    if (engine) {
                        engine.log(`${target.name} 受到 ${actualDamage} 点${this.label}！`);
                    }
                    
                    return { success: true, damage: actualDamage };
                }
            };
        },

        /**
         * 百分比伤害
         * DAMAGE.PERCENT(node, ratio, options)
         */
        PERCENT(nodes, ratio, options = {}) {
            return {
                type: 'DAMAGE.PERCENT',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                ratio,  // 0.1 = 10%
                options,
                label: options.label || '百分比伤害',
                basedOn: options.basedOn || 'targetMax',  // targetMax, targetCurrent, attackerMax
                
                execute(context) {
                    const { target, attacker, engine } = context;
                    if (!target) return { success: false };
                    
                    // 计算基数
                    let base = 0;
                    switch (this.basedOn) {
                        case 'targetMax': base = target.hp.max; break;
                        case 'targetCurrent': base = target.hp.current; break;
                        case 'attackerMax': base = attacker?.hp.max || 0; break;
                    }
                    
                    let amount = Math.floor(base * this.ratio);
                    
                    // 检查抗性
                    if (!this.options.ignoreResist) {
                        const resist = target.resist?.percent || 35;
                        if (resist >= 100) return { success: true, damage: 0, resisted: true };
                        amount = Math.floor(amount * (1 - resist / 100));
                    }
                    
                    const actualDamage = target.hp.damage(amount);
                    target.turnFlags.tookDamage = true;
                    target.turnFlags.damageTaken += actualDamage;
                    
                    if (engine) {
                        engine.log(`${target.name} 受到 ${actualDamage} 点${this.label}！`);
                    }
                    
                    return { success: true, damage: actualDamage };
                }
            };
        },

        /**
         * 吸取伤害（造成伤害并恢复）
         * DAMAGE.DRAIN(node, amount, options)
         */
        DRAIN(nodes, amount, options = {}) {
            return {
                type: 'DAMAGE.DRAIN',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                amount,
                options,
                ratio: options.ratio || 1,  // 吸取比例，1 = 100%
                label: options.label || '吸取',
                
                execute(context) {
                    const { attacker, target, engine } = context;
                    if (!attacker || !target) return { success: false };
                    
                    let dmgAmount = this.amount;
                    if (typeof this.amount === 'function') {
                        dmgAmount = this.amount(context);
                    }
                    
                    const actualDamage = target.hp.damage(dmgAmount);
                    const healAmount = Math.floor(actualDamage * this.ratio);
                    const actualHeal = attacker.hp.heal(healAmount);
                    
                    target.turnFlags.tookDamage = true;
                    target.turnFlags.damageTaken += actualDamage;
                    attacker.turnFlags.healed += actualHeal;
                    
                    if (engine) {
                        engine.log(`${attacker.name} 吸取了 ${actualDamage} 点体力！`);
                    }
                    
                    return { success: true, damage: actualDamage, healed: actualHeal };
                }
            };
        },

        /**
         * 百分比吸取
         * DAMAGE.DRAIN_PERCENT(node, ratio, options)
         */
        DRAIN_PERCENT(nodes, ratio, options = {}) {
            return {
                type: 'DAMAGE.DRAIN_PERCENT',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                ratio,
                options,
                basedOn: options.basedOn || 'targetMax',
                drainRatio: options.drainRatio || 1,
                label: options.label || '百分比吸取',
                
                execute(context) {
                    const { attacker, target, engine } = context;
                    if (!attacker || !target) return { success: false };
                    
                    let base = 0;
                    switch (this.basedOn) {
                        case 'targetMax': base = target.hp.max; break;
                        case 'targetCurrent': base = target.hp.current; break;
                        case 'attackerMax': base = attacker.hp.max; break;
                    }
                    
                    const dmgAmount = Math.floor(base * this.ratio);
                    const actualDamage = target.hp.damage(dmgAmount);
                    const healAmount = Math.floor(actualDamage * this.drainRatio);
                    const actualHeal = attacker.hp.heal(healAmount);
                    
                    target.turnFlags.tookDamage = true;
                    target.turnFlags.damageTaken += actualDamage;
                    attacker.turnFlags.healed += actualHeal;
                    
                    if (engine) {
                        engine.log(`${attacker.name} 吸取了 ${actualDamage} 点体力！`);
                    }
                    
                    return { success: true, damage: actualDamage, healed: actualHeal };
                }
            };
        },

        /**
         * 真实伤害（无视抗性）
         * DAMAGE.TRUE(node, amount, options)
         */
        TRUE(nodes, amount, options = {}) {
            return {
                type: 'DAMAGE.TRUE',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                amount,
                options,
                label: options.label || '真实伤害',
                
                execute(context) {
                    const { target, engine } = context;
                    if (!target) return { success: false };
                    
                    const actualDamage = target.hp.damage(this.amount);
                    target.turnFlags.tookDamage = true;
                    target.turnFlags.damageTaken += actualDamage;
                    
                    if (engine) {
                        engine.log(`${target.name} 受到 ${actualDamage} 点${this.label}！`);
                    }
                    
                    return { success: true, damage: actualDamage };
                }
            };
        },

        /**
         * 反弹伤害
         * DAMAGE.REFLECT(node, ratio, options)
         */
        REFLECT(nodes, ratio = 1, options = {}) {
            return {
                type: 'DAMAGE.REFLECT',
                nodes: Array.isArray(nodes) ? nodes : [nodes],
                ratio,
                options,
                
                execute(context) {
                    const { target, attacker, damageTaken, engine } = context;
                    if (!target || !attacker || !damageTaken) return { success: false };
                    
                    const reflectAmount = Math.floor(damageTaken * this.ratio);
                    const actualDamage = attacker.hp.damage(reflectAmount);
                    
                    if (engine) {
                        engine.log(`${target.name} 反弹了 ${actualDamage} 点伤害！`);
                    }
                    
                    return { success: true, reflected: actualDamage };
                }
            };
        },

        /**
         * 在指定节点执行自定义伤害处理
         * DAMAGE.EXEC(node, handler)
         */
        EXEC(nodes, handler) {
            return {
                type: 'DAMAGE.EXEC',
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
    window.DAMAGE = DAMAGE;
})();
