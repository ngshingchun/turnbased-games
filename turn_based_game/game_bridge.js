/**
 * GameBridge v1.0 - 桥接新旧系统
 * 
 * 连接 game.js (旧系统) 和 core/ (新系统)
 * 确保两个系统可以协同工作
 */
(() => {
    // =========================================================================
    // Spirit Registry Bridge - 统一精灵注册
    // =========================================================================
    
    /**
     * 从新系统 (SpiritRegistry) 构建旧系统 (SPIRIT_DEFS) 数据
     */
    function buildSpiritDefs() {
        const registry = window.SpiritRegistry || {};
        const defs = [];
        
        for (const [key, spirit] of Object.entries(registry)) {
            // 转换技能格式
            const skills = (spirit.skills || []).map((skill, index) => ({
                name: skill.name,
                type: skill.type || 'attack',
                power: skill.power || 0,
                pp: skill.pp || skill.maxPp || 10,
                maxPp: skill.maxPp || skill.pp || 10,
                desc: skill.desc || '',
                priority: skill.priority || 0,
                accuracy: skill.accuracy || 100,
                element: skill.element || spirit.element || 'normal',
                category: skill.category || 'physical',
                effects: skill.effects || [],
                calls: skill.calls || []
            }));
            
            // 构建精灵定义
            const def = {
                key: spirit.key || key,
                name: spirit.name,
                element: spirit.element || 'normal',
                maxHp: spirit.maxHp || 1000,
                maxPp: spirit.maxPp || 100,
                attack: spirit.attack || 100,
                defense: spirit.defense || 100,
                spAttack: spirit.spAttack || 100,
                spDefense: spirit.spDefense || 100,
                speed: spirit.speed || 100,
                skills: skills,
                asset: `assets/${key}.png`,
                soulMark: spirit.soulbuff?.name || '魂',
                soulMarkDesc: spirit.soulbuff?.desc || '',
                resist: spirit.resist || { fixed: 0, percent: 0, trueDmg: 0 },
                meta: {
                    isStar: key === 'starSovereign',
                    isBoss: false
                }
            };
            
            defs.push(def);
            
            // 同时注册到旧系统的 Phase Registry
            if (spirit.soulbuff?.effects) {
                window.SPIRIT_PHASE_REGISTRY = window.SPIRIT_PHASE_REGISTRY || [];
                window.SPIRIT_PHASE_REGISTRY.push({
                    key: def.key,
                    register: (timeline, game) => {
                        // 注册魂印效果到 PhaseEngine
                        registerSoulBuffEffects(def.key, spirit.soulbuff, timeline, game);
                    }
                });
            }
        }
        
        return defs;
    }
    
    /**
     * 注册魂印效果到 PhaseEngine
     */
    function registerSoulBuffEffects(spiritKey, soulbuff, timeline, game) {
        if (!soulbuff?.effects || !timeline) return;
        
        for (const effect of soulbuff.effects) {
            const triggers = Array.isArray(effect.trigger) ? effect.trigger : [effect.trigger];
            
            for (const trigger of triggers) {
                // 映射新节点到旧节点
                const oldPhase = mapNodeToPhase(trigger);
                if (!oldPhase) continue;
                
                timeline.on(oldPhase, (ctx) => {
                    // 检查条件
                    if (effect.condition && !effect.condition(ctx)) return;
                    
                    // 检查是否是该精灵
                    const actor = ctx.actor || ctx.self;
                    if (actor?.key !== spiritKey && actor?.name !== spiritKey) return;
                    
                    // 执行 calls
                    if (effect.calls) {
                        executeCalls(effect.calls, ctx, game);
                    }
                });
            }
        }
    }
    
    /**
     * 执行技能/魂印 calls
     */
    function executeCalls(calls, ctx, game) {
        if (!calls || !Array.isArray(calls)) return;
        
        for (const call of calls) {
            try {
                executeCall(call, ctx, game);
            } catch (err) {
                console.error('[GameBridge] Call execution error:', err, call);
            }
        }
    }
    
    /**
     * 执行单个 call
     */
    function executeCall(call, ctx, game) {
        if (!call || !call.system) return;
        
        const system = window[call.system];
        const func = call.func;
        
        if (!system) {
            console.warn(`[GameBridge] System not found: ${call.system}`);
            return;
        }
        
        // 获取目标
        let target = ctx.self || ctx.actor;
        if (call.target === 'opponent') {
            target = ctx.opponent;
        } else if (call.target === 'self') {
            target = ctx.self || ctx.actor;
        }
        
        // 根据系统类型执行
        switch (call.system) {
            case 'HP':
                executeHPCall(call, target, ctx, game);
                break;
            case 'PP':
                executePPCall(call, target, ctx, game);
                break;
            case 'DAMAGE':
                executeDamageCall(call, target, ctx, game);
                break;
            case 'STATS':
                executeStatsCall(call, target, ctx, game);
                break;
            case 'STATUS':
                executeStatusCall(call, target, ctx, game);
                break;
            case 'TURN':
                executeTurnCall(call, target, ctx, game);
                break;
            case 'COUNT':
            case 'TEAM':
                executeCountCall(call, target, ctx, game);
                break;
            case 'PRIO':
                executePrioCall(call, target, ctx, game);
                break;
            case 'BRANCH':
                executeBranchCall(call, ctx, game);
                break;
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 各系统的 call 执行器
    // ─────────────────────────────────────────────────────────────────────────
    
    function executeHPCall(call, target, ctx, game) {
        if (!target || !game) return;
        
        switch (call.func) {
            case 'HEAL':
                let healAmount = call.value || 0;
                if (call.valueType === 'lost_percent') {
                    healAmount = Math.floor((target.maxHp - target.hp) * (call.value / 100));
                } else if (call.valueType === 'max_percent') {
                    healAmount = Math.floor(target.maxHp * (call.value / 100));
                }
                game.heal(target, healAmount, call.label || '恢复');
                break;
                
            case 'DRAIN':
            case 'DRAIN_PERCENT':
                const drainTarget = call.target === 'opponent' ? ctx.opponent : target;
                let drainAmount = call.value || 0;
                if (call.percent) {
                    drainAmount = Math.floor((call.ofMax ? drainTarget.maxHp : drainTarget.hp) * (call.percent / 100));
                }
                if (drainTarget && game.damageSystem) {
                    game.damageSystem.apply({
                        type: 'fixed',
                        source: target,
                        target: drainTarget,
                        amount: drainAmount,
                        label: '吸取'
                    });
                    game.heal(target, drainAmount, '吸取');
                }
                break;
        }
    }
    
    function executePPCall(call, target, ctx, game) {
        if (!target) return;
        
        switch (call.func) {
            case 'USE':
                const skillIdx = call.skillIndex ?? 0;
                if (target.skills && target.skills[skillIdx]) {
                    if (target.skills[skillIdx].pp > 0) {
                        target.skills[skillIdx].pp--;
                    }
                }
                break;
                
            case 'RESTORE':
                if (target.skills) {
                    target.skills.forEach(s => {
                        if (s.pp < s.maxPp) {
                            s.pp = Math.min(s.maxPp, s.pp + (call.amount || 1));
                        }
                    });
                }
                break;
        }
    }
    
    function executeDamageCall(call, target, ctx, game) {
        if (!game || !game.damageSystem) return;
        
        switch (call.func) {
            case 'ATTACK':
                // 伤害在 game.js 中已处理
                break;
                
            case 'FIXED':
                const fixedTarget = call.target === 'opponent' ? ctx.opponent : target;
                game.damageSystem.apply({
                    type: 'fixed',
                    target: fixedTarget,
                    amount: call.amount || 0,
                    label: call.label || '固定伤害'
                });
                break;
                
            case 'MODIFY':
                // 修改伤害倍率 - 存储到 ctx
                ctx.damageMultiplier = (ctx.damageMultiplier || 1) * (call.multiplier || 1);
                break;
                
            case 'REFLECT':
                const reflectAmount = Math.floor((ctx.lastDamageReceived || 0) * (call.percent / 100));
                if (reflectAmount > 0 && ctx.opponent) {
                    game.damageSystem.apply({
                        type: 'fixed',
                        target: ctx.opponent,
                        amount: reflectAmount,
                        label: '反弹伤害'
                    });
                }
                break;
        }
    }
    
    function executeStatsCall(call, target, ctx, game) {
        if (!target || !game) return;
        
        switch (call.func) {
            case 'MODIFY':
                const stats = call.stats || {};
                let modifier = call.modifier ? call.modifier(ctx) : 1;
                
                const statMap = {
                    atk: 'attack', attack: 'attack',
                    def: 'defense', defense: 'defense',
                    spAtk: 'specialAttack', specialAttack: 'specialAttack',
                    spDef: 'specialDefense', specialDefense: 'specialDefense',
                    speed: 'speed', spd: 'speed',
                    accuracy: 'accuracy', acc: 'accuracy'
                };
                
                const modifyObj = {};
                for (const [key, val] of Object.entries(stats)) {
                    const realKey = statMap[key] || key;
                    modifyObj[realKey] = val * modifier;
                }
                game.modifyStats(target, modifyObj);
                break;
                
            case 'RANDOM_MODIFY':
                const statKeys = ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'accuracy'];
                const picked = [];
                const count = call.count || 1;
                
                while (picked.length < count && picked.length < statKeys.length) {
                    const idx = Math.floor(Math.random() * statKeys.length);
                    if (!picked.includes(statKeys[idx])) {
                        picked.push(statKeys[idx]);
                    }
                }
                
                const randomMod = {};
                picked.forEach(k => randomMod[k] = call.value || -1);
                game.modifyStats(target, randomMod);
                break;
                
            case 'REVERSE':
                if (target.buffs?.statUps) {
                    let reversed = false;
                    for (const key in target.buffs.statUps) {
                        if (target.buffs.statUps[key] < 0) {
                            target.buffs.statUps[key] = Math.abs(target.buffs.statUps[key]);
                            reversed = true;
                        }
                    }
                    if (reversed && call.onSuccess) {
                        executeCalls(call.onSuccess, ctx, game);
                    }
                }
                break;
                
            case 'STEAL':
                const from = call.from === 'opponent' ? ctx.opponent : ctx.self;
                const to = call.to === 'self' ? ctx.self : ctx.opponent;
                if (from?.buffs?.statUps && to?.buffs?.statUps) {
                    let stolen = false;
                    for (const key in from.buffs.statUps) {
                        if (from.buffs.statUps[key] > 0) {
                            to.buffs.statUps[key] = (to.buffs.statUps[key] || 0) + from.buffs.statUps[key];
                            from.buffs.statUps[key] = 0;
                            stolen = true;
                        }
                    }
                    if (stolen && call.onSuccess) {
                        executeCalls(call.onSuccess, ctx, game);
                    }
                }
                break;
        }
    }
    
    function executeStatusCall(call, target, ctx, game) {
        if (!target || !game) return;
        
        switch (call.func) {
            case 'APPLY':
                const statusTarget = call.target === 'opponent' ? ctx.opponent : target;
                if (statusTarget) {
                    game.addTurnEffect(statusTarget, call.status, call.turns || 2, call.status);
                }
                break;
                
            case 'REMOVE':
                if (target.buffs?.turnEffects) {
                    target.buffs.turnEffects = target.buffs.turnEffects.filter(e => e.id !== call.status);
                }
                break;
        }
    }
    
    function executeTurnCall(call, target, ctx, game) {
        if (!target || !game) return;
        
        switch (call.func) {
            case 'ADD':
                game.addTurnEffect(target, call.effectId, call.turns || 2, call.effectId, call.desc, call.flags || {});
                break;
                
            case 'DISPEL':
                if (target.buffs?.turnEffects) {
                    const before = target.buffs.turnEffects.length;
                    target.buffs.turnEffects = target.buffs.turnEffects.filter(e => e.cannotDispel);
                    if (target.buffs.turnEffects.length < before && call.onSuccess) {
                        executeCalls(call.onSuccess, ctx, game);
                    }
                }
                break;
        }
    }
    
    function executeCountCall(call, target, ctx, game) {
        if (!target) return;
        
        // 存储到 buffs
        target.buffs = target.buffs || {};
        
        if (call.action === 'set') {
            target.buffs[call.countId] = call.value || 1;
            if (call.onTrigger) {
                target.buffs[`${call.countId}_trigger`] = call.onTrigger;
            }
        } else if (call.action === 'add') {
            target.buffs[call.countId] = (target.buffs[call.countId] || 0) + (call.value || 1);
        }
    }
    
    function executePrioCall(call, target, ctx, game) {
        if (!target) return;
        
        target.buffs = target.buffs || {};
        
        if (call.func === 'ADD') {
            target.buffs.priorityNext = Math.max(target.buffs.priorityNext || 0, call.value || 1);
            target.buffs.priorityTurns = call.turns || 1;
        }
    }
    
    function executeBranchCall(call, ctx, game) {
        if (!call.condition) return;
        
        const conditionResult = call.condition(ctx);
        
        if (conditionResult && call.onTrue) {
            executeCalls(call.onTrue, ctx, game);
        } else if (!conditionResult && call.onFalse) {
            executeCalls(call.onFalse, ctx, game);
        }
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    // 节点映射
    // ─────────────────────────────────────────────────────────────────────────
    
    const NODE_TO_PHASE = {
        'turn_start': 'TURN_START',
        'turn_end': 'TURN_END',
        'on_entry': 'ENTRY',
        'first_before_damage': 'BEFORE_DAMAGE',
        'second_before_damage': 'BEFORE_DAMAGE',
        'first_deal_damage': 'DEAL_DAMAGE',
        'second_deal_damage': 'DEAL_DAMAGE',
        'first_after_attack': 'AFTER_ATTACK',
        'second_after_attack': 'AFTER_ATTACK',
        'first_skill_effect': 'SKILL_EFFECT',
        'second_skill_effect': 'SKILL_EFFECT',
        'death_check_1': 'DEATH_CHECK',
        'battle_phase_end': 'BATTLE_PHASE_END'
    };
    
    function mapNodeToPhase(node) {
        return NODE_TO_PHASE[node] || node?.toUpperCase?.();
    }
    
    // =========================================================================
    // Legacy System Fallbacks
    // =========================================================================
    
    // 如果旧系统文件不存在，创建空壳
    window.DamageSystem = window.DamageSystem || class DamageSystem {
        constructor(game) { this.game = game; }
        apply(opts) {
            const target = opts.target;
            if (!target) return 0;
            const amount = opts.amount || 0;
            target.hp = Math.max(0, target.hp - amount);
            if (this.game) this.game.log(`${target.name} 受到 ${amount} 点伤害`);
            return amount;
        }
    };
    
    window.PhaseEngine = window.PhaseEngine || class PhaseEngine {
        constructor(game) {
            this.game = game;
            this.handlers = {};
        }
        on(phase, handler) {
            this.handlers[phase] = this.handlers[phase] || [];
            this.handlers[phase].push(handler);
        }
        emit(phase, ctx) {
            const handlers = this.handlers[phase] || [];
            handlers.forEach(h => {
                try { h(ctx); } catch (e) { console.error('[PhaseEngine]', e); }
            });
        }
    };
    
    window.TurnPhases = window.TurnPhases || {
        OPEN_TURN: 'OPEN_TURN',
        ENTRY: 'ENTRY',
        TURN_START: 'TURN_START',
        TURN_END: 'TURN_END',
        BEFORE_DAMAGE: 'BEFORE_DAMAGE',
        DEAL_DAMAGE: 'DEAL_DAMAGE',
        AFTER_ATTACK: 'AFTER_ATTACK',
        SKILL_EFFECT: 'SKILL_EFFECT',
        DEATH_CHECK: 'DEATH_CHECK',
        BATTLE_PHASE_END: 'BATTLE_PHASE_END'
    };
    
    // =========================================================================
    // Initialize Bridge
    // =========================================================================
    
    window.GameBridge = {
        version: '1.0.0',
        
        /**
         * 初始化桥接
         */
        init() {
            console.log('[GameBridge] Initializing...');
            
            // 从新系统构建旧系统数据
            const newDefs = buildSpiritDefs();
            
            // 合并到 SPIRIT_DEFS
            window.SPIRIT_DEFS = window.SPIRIT_DEFS || [];
            
            // 去重合并
            const existingKeys = new Set(window.SPIRIT_DEFS.map(d => d.key));
            for (const def of newDefs) {
                if (!existingKeys.has(def.key)) {
                    window.SPIRIT_DEFS.push(def);
                }
            }
            
            console.log(`[GameBridge] Loaded ${window.SPIRIT_DEFS.length} spirits`);
            console.log('[GameBridge] Ready');
            
            return this;
        },
        
        /**
         * 获取所有可用精灵
         */
        getAllSpirits() {
            return window.SPIRIT_DEFS || [];
        },
        
        /**
         * 执行技能 calls
         */
        executeCalls,
        
        /**
         * 执行单个 call
         */
        executeCall
    };
    
    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.GameBridge.init());
    } else {
        window.GameBridge.init();
    }
})();
