/**
 * 王·雷伊 (King Ray) - 精灵定义
 * 魂印: 雷
 * 
 * 使用新架构: SYSTEM.SUBFUNC(nodes, handler)
 * 所有技能包含 PP.USE 调用
 */
(() => {
    const NODE = window.TurnPhaseNode;

    // =========================================================================
    // 精灵基础数据
    // =========================================================================
    const SPIRIT = {
        key: 'kingRay',
        name: '王·雷伊',
        element: '电',
        maxHp: 800,
        maxPp: 100,
        attack: 130,
        defense: 90,
        spAttack: 100,
        spDefense: 90,
        speed: 140,
        resist: { fixed: 0, percent: 0, trueDmg: 0 }
    };

    // =========================================================================
    // 魂印定义
    // =========================================================================
    /**
     * 【魂印】雷
     * 每回合开始和结束时吸取对手能力提升状态
     * 回合开始时对手所有回合效果回合数变为1（BOSS无效）
     * 体力>对手时战斗阶段结束攻击+2，体力<对手时回合效果无法被消除（BOSS无效）
     */
    const SOULBUFF = {
        name: '雷',
        desc: '【魂印】雷\n每回合开始和结束时吸取对手能力提升状态\n回合开始时对手所有回合效果回合数变为1（BOSS无效）\n体力>对手时攻击+2，体力<对手时回合效果保护（BOSS无效）',
        
        effects: [
            // ─────────────────────────────────────────────────────────────────
            // 回合开始吸取强化
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'ray_steal_start',
                name: '雷霆吸取',
                trigger: NODE.TURN_START,
                condition: (ctx) => ctx.self.key === 'kingRay',
                calls: [
                    // STATS.STEAL - 吸取对手能力提升
                    { system: 'STATS', func: 'STEAL', from: 'opponent', to: 'self' }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 回合结束吸取强化
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'ray_steal_end',
                name: '雷霆吸取',
                trigger: NODE.TURN_END,
                condition: (ctx) => ctx.self.key === 'kingRay',
                calls: [
                    // STATS.STEAL - 吸取对手能力提升
                    { system: 'STATS', func: 'STEAL', from: 'opponent', to: 'self' }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 回合效果压制
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'ray_turn_suppress',
                name: '雷霆压制',
                trigger: NODE.TURN_START,
                condition: (ctx) => ctx.self.key === 'kingRay' && !ctx.opponent?.flags?.isBoss,
                calls: [
                    // TURN.SUPPRESS - 对手回合效果回合数变为1
                    { system: 'TURN', func: 'SUPPRESS', target: 'opponent', maxTurns: 1 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 体力高于对手时攻击+2
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'ray_dominance_attack',
                name: '雷王威势',
                trigger: NODE.BATTLE_PHASE_END,
                condition: (ctx) => ctx.self.key === 'kingRay' && ctx.self.hp > ctx.opponent.hp && !ctx.opponent?.flags?.isBoss,
                calls: [
                    // STATS.MODIFY - 攻击+2
                    { system: 'STATS', func: 'MODIFY', target: 'self', stats: { atk: 2 } }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 体力低于对手时回合效果保护
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'ray_fortitude_protect',
                name: '雷王守护',
                trigger: NODE.TURN_START,
                condition: (ctx) => ctx.self.key === 'kingRay' && ctx.self.hp < ctx.opponent.hp && !ctx.opponent?.flags?.isBoss,
                calls: [
                    // TURN.ADD - 当回合回合效果无法被消除
                    { system: 'TURN', func: 'ADD', target: 'self', effectId: 'turn_protect', turns: 1, flags: { protectTurnEffects: true } }
                ]
            }
        ]
    };

    // =========================================================================
    // 技能定义
    // =========================================================================
    const SKILLS = [
        // ─────────────────────────────────────────────────────────────────────
        // 技能1: 王·万霆朝宗 (第五技能)
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'ray_skill_1',
            name: '王·万霆朝宗',
            type: 'ultimate',
            element: '电',
            category: 'physical',
            power: 160,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            flags: { ignoreWeaken: true },
            desc: '第五技能\n无视微弱；消除对手回合效果，成功则下回合伤害+100%\n未击败则全属性+1、下回合先制+2',
            
            calls: [
                // PP.USE - 消耗PP
                {
                    system: 'PP',
                    func: 'USE',
                    node: NODE.BEFORE_HIT,
                    target: 'self',
                    skillIndex: 0,
                    amount: 1
                },
                // TURN.DISPEL - 消除对手回合效果
                {
                    system: 'TURN',
                    func: 'DISPEL',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    onSuccess: [
                        // TURN.ADD - 下回合伤害+100%
                        { system: 'TURN', func: 'ADD', target: 'self', effectId: 'damage_boost', turns: 1, flags: { damageBoost: 100 } }
                    ]
                },
                // DAMAGE.ATTACK - 造成伤害
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 160,
                    flags: { ignoreWeaken: true }
                },
                // 条件: 未击败
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.opponent.hp > 0,
                    onTrue: [
                        // STATS.MODIFY - 全属性+1
                        { system: 'STATS', func: 'MODIFY', target: 'self', stats: { atk: 1, def: 1, spAtk: 1, spDef: 1, speed: 1 } },
                        // PRIO.ADD - 下回合先制+2
                        { system: 'PRIO', func: 'ADD', target: 'self', value: 2, turns: 1 }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能2: 传承王意
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'ray_skill_2',
            name: '传承王意',
            type: 'buff',
            element: '电',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n全属性+1（低血翻倍）；\n2回合每回合使用技能满血恢复；\n5回合免疫反弹异常',
            
            calls: [
                // PP.USE - 消耗PP
                {
                    system: 'PP',
                    func: 'USE',
                    node: NODE.BEFORE_HIT,
                    target: 'self',
                    skillIndex: 1,
                    amount: 1
                },
                // STATS.MODIFY - 全属性+1 (低血翻倍)
                {
                    system: 'STATS',
                    func: 'MODIFY',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    stats: { atk: 1, def: 1, spAtk: 1, spDef: 1, speed: 1 },
                    modifier: (ctx) => ctx.self.hp < ctx.opponent.hp ? 2 : 1
                },
                // TURN.ADD - 2回合使用技能满血恢复
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'skill_heal',
                    turns: 2,
                    onSkillUse: [
                        { system: 'HP', func: 'HEAL_FULL', target: 'self' }
                    ]
                },
                // TURN.ADD - 5回合免疫反弹异常
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'status_reflect',
                    turns: 5,
                    flags: { immuneStatus: true, reflectStatus: true }
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能3: 万鸣齐闪
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'ray_skill_3',
            name: '万鸣齐闪',
            type: 'buff',
            element: '电',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n反转自身能力下降；\n造成260点电系伤害，每项强化+10%',
            
            calls: [
                // PP.USE - 消耗PP
                {
                    system: 'PP',
                    func: 'USE',
                    node: NODE.BEFORE_HIT,
                    target: 'self',
                    skillIndex: 2,
                    amount: 1
                },
                // STATS.REVERSE - 反转自身能力下降
                {
                    system: 'STATS',
                    func: 'REVERSE',
                    node: NODE.SKILL_EFFECT,
                    target: 'self'
                },
                // DAMAGE.FIXED - 260固伤 + 每项强化+10%
                {
                    system: 'DAMAGE',
                    func: 'FIXED',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    value: (ctx) => {
                        const statUps = Object.values(ctx.self.stages || {}).filter(v => v > 0).length;
                        return Math.floor(260 * (1 + statUps * 0.1));
                    }
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能4: 金翼剑轮
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'ray_skill_4',
            name: '金翼剑轮',
            type: 'attack',
            element: '电',
            category: 'physical',
            power: 130,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 100,
            desc: '物理攻击\n免疫下1次攻击',
            
            calls: [
                // PP.USE - 消耗PP
                {
                    system: 'PP',
                    func: 'USE',
                    node: NODE.BEFORE_HIT,
                    target: 'self',
                    skillIndex: 3,
                    amount: 1
                },
                // DAMAGE.ATTACK - 造成伤害
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 130
                },
                // TEAM.COUNT - 免疫下1次攻击
                {
                    system: 'TEAM',
                    func: 'COUNT',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    action: 'set',
                    countId: 'attack_immune',
                    value: 1,
                    flags: { immuneType: 'attack' }
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能5: 雷裂残阳
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'ray_skill_5',
            name: '雷裂残阳',
            type: 'attack',
            element: '电',
            category: 'physical',
            power: 85,
            pp: 20,
            maxPp: 20,
            priority: 3,
            accuracy: 100,
            desc: '物理攻击 先制+3\n先出手则对手属性技能无效；\n有强化时伤害+50%；\n100%吸血',
            
            calls: [
                // PP.USE - 消耗PP
                {
                    system: 'PP',
                    func: 'USE',
                    node: NODE.BEFORE_HIT,
                    target: 'self',
                    skillIndex: 4,
                    amount: 1
                },
                // 条件: 先出手则对手属性技能无效
                {
                    system: 'BRANCH',
                    node: NODE.SKILL_EFFECT,
                    condition: (ctx) => ctx.isFirstMover,
                    onTrue: [
                        // TURN.ADD - 当回合对手属性技能无效
                        { system: 'TURN', func: 'ADD', target: 'opponent', effectId: 'block_attribute', turns: 1, flags: { blockAttribute: true } }
                    ]
                },
                // DAMAGE.ATTACK - 造成伤害 (有强化+50%)
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 85,
                    modifier: (ctx) => ctx.self?.hasStatUp?.() ? 1.5 : 1
                },
                // HP.DRAIN - 100%吸血
                {
                    system: 'HP',
                    func: 'DRAIN',
                    node: NODE.AFTER_ATTACK,
                    target: 'self',
                    valueFrom: 'lastDamage',
                    percent: 100
                }
            ]
        }
    ];

    // =========================================================================
    // 注册精灵
    // =========================================================================
    if (window.SOULBUFF?.REGISTER) {
        window.SOULBUFF.REGISTER(SPIRIT.key, SOULBUFF);
    }
    
    window.SpiritRegistry = window.SpiritRegistry || {};
    window.SpiritRegistry[SPIRIT.key] = {
        ...SPIRIT,
        soulbuff: SOULBUFF,
        skills: SKILLS
    };

    console.log(`[Spirit] ${SPIRIT.name} loaded`);
})();
