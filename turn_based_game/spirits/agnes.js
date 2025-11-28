/**
 * 不灭·艾恩斯 (Agnes) - 精灵定义
 * 
 * 使用新架构: SYSTEM.SUBFUNC(nodes, handler)
 * 所有技能包含 PP.USE 调用
 * 
 * 节点声明格式:
 * - 非战斗阶段效果: node: NODE.TURN_START (单节点，固定)
 * - 战斗阶段效果: node: NODE.BEFORE_HIT (通用节点)
 *   → 运行时由 resolveNode() 解析为 FIRST_BEFORE_HIT 或 SECOND_BEFORE_HIT
 * 
 * 通用战斗节点:
 *   ACTION_START, BEFORE_HIT, ON_HIT, SKILL_EFFECT, 
 *   BEFORE_DAMAGE, DEAL_DAMAGE, AFTER_ATTACK, ACTION_END, AFTER_ACTION
 */
(() => {
    const NODE = window.TurnPhaseNode;

    // =========================================================================
    // 精灵基础数据
    // =========================================================================
    const SPIRIT = {
        key: 'agnes',
        name: '不灭·艾恩斯',
        element: '火',
        maxHp: 900,
        maxPp: 100,
        attack: 120,
        defense: 100,
        spAttack: 110,
        spDefense: 100,
        speed: 105,
        resist: { fixed: 0, percent: 0, trueDmg: 0 }
    };

    // =========================================================================
    // 魂印定义: 【魂印】火
    // =========================================================================
    /**
     * 【魂印】火
     * 1. 受到致命攻击时残留1点体力，消除双方能力提升及回合效果，使对手焚烬2回合（每场1次）
     * 2. 回合开始若体力>对手，当回合受击使对手焚烬，否则消除对手回合效果
     * 3. 回合结束若体力<对手，恢复已损失体力的1/2
     */
    const SOULBUFF = {
        name: '火',
        desc: '【魂印】火\n1. 受到致命攻击时残留1点体力，消除双方能力提升及回合效果，使对手焚烬2回合（每场1次）\n2. 回合开始若体力>对手，当回合受击使对手焚烬，否则消除对手回合效果\n3. 回合结束若体力<对手，恢复已损失体力的1/2',
        
        effects: [
            // ─────────────────────────────────────────────────────────────────
            // Point 1: 不灭火魂 - 致命生存 (每场1次)
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'agnes_fatal_survive',
                name: '不灭火魂',
                trigger: NODE.DEATH_CHECK_1,
                condition: (ctx) => ctx.self.hp <= 0 && ctx.self.getCount('agnes_fatal') > 0,
                calls: [
                    // TEAM.COUNT - 消耗不灭次数
                    { system: 'TEAM', func: 'COUNT', target: 'self', action: 'consume', countId: 'agnes_fatal', value: 1 },
                    // HP.SET - 残留1点体力
                    { system: 'HP', func: 'SET', target: 'self', value: 1 },
                    // STATS.CLEAR_UPS - 消除双方能力提升
                    { system: 'STATS', func: 'CLEAR_UPS', target: 'self' },
                    { system: 'STATS', func: 'CLEAR_UPS', target: 'opponent' },
                    // TURN.DISPEL - 消除双方回合效果
                    { system: 'TURN', func: 'DISPEL', target: 'self' },
                    { system: 'TURN', func: 'DISPEL', target: 'opponent' },
                    // STATUS.APPLY - 对手焚烬
                    { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'immolate', turns: 2 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // Point 2.1: 优势反击 - 体力>对手时受击使对手焚烬
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'agnes_dominance_counter',
                name: '优势反击',
                trigger: NODE.ON_HIT,
                role: 'defender',
                condition: (ctx) => ctx.self.key === 'agnes' && ctx.self.hp > ctx.opponent.hp,
                calls: [
                    // STATUS.APPLY - 对手焚烬
                    { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'immolate', turns: 2 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // Point 2.2: 坚毅净化 - 体力≤对手且对手无焚烬时消除对手回合效果
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'agnes_fortitude_dispel',
                name: '坚毅净化',
                trigger: NODE.TURN_START,
                condition: (ctx) => ctx.self.key === 'agnes' && ctx.self.hp <= ctx.opponent.hp && !ctx.opponent.hasStatus('immolate'),
                calls: [
                    // TURN.DISPEL - 消除对手回合效果
                    { system: 'TURN', func: 'DISPEL', target: 'opponent' }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // Point 3: 不灭之躯 - 回合结束体力<对手时恢复已损失体力1/2
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'agnes_regen',
                name: '不灭之躯',
                trigger: NODE.TURN_END,
                condition: (ctx) => ctx.self.key === 'agnes' && ctx.self.hp < ctx.opponent.hp && ctx.self.hp > 0,
                calls: [
                    // HP.HEAL - 恢复已损失体力的50%
                    { system: 'HP', func: 'HEAL', target: 'self', valueType: 'lost_percent', value: 50 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 初始化: 登场时设置不灭次数
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'agnes_init',
                name: '火魂初始化',
                trigger: NODE.SWITCH_IN_PHASE,
                condition: (ctx) => ctx.self.key === 'agnes' && ctx.self.isFirstDeploy,
                calls: [
                    // TEAM.COUNT - 设置不灭次数
                    { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'agnes_fatal', value: 1, max: 1 }
                ]
            }
        ]
    };

    // =========================================================================
    // 技能定义
    // =========================================================================
    const SKILLS = [
        // ─────────────────────────────────────────────────────────────────────
        // 技能1: 王·酷烈风息
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'agnes_skill_1',
            name: '王·酷烈风息',
            type: 'attack',
            element: '火',
            category: 'physical',
            power: 150,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '火系物攻\n必中；反转自身能力下降，成功则免疫下1次异常；\n伤害<300則對手焚烬，未觸發則自身下次傷害+100%',
            
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
                // STATS.REVERSE - 反转自身能力下降
                {
                    system: 'STATS',
                    func: 'REVERSE',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    onSuccess: [
                        // TEAM.COUNT - 成功则免疫下1次异常
                        { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'status_immune', value: 1 }
                    ]
                },
                // DAMAGE.ATTACK - 造成伤害
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 150
                },
                // BRANCH - 伤害<300判定
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.lastDamage < 300,
                    onTrue: [
                        // STATUS.APPLY - 对手焚烬
                        { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'immolate', turns: 2 }
                    ],
                    onFalse: [
                        // TURN.ADD - 下次伤害+100%
                        { system: 'TURN', func: 'ADD', target: 'self', effectId: 'damage_boost', turns: 1, flags: { damageBoost: 100, onNextAttack: true } }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能2: 火焰精核
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'agnes_skill_2',
            name: '火焰精核',
            type: 'buff',
            element: '火',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n必中；全属性+1(对手异常时翻倍)；\n4回合每回合恢复1/3体力并造成等量固伤(体力<1/2翻倍)；\n下2回合先制+2',
            
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
                // STATS.MODIFY - 全属性+1 (对手异常翻倍)
                {
                    system: 'STATS',
                    func: 'MODIFY',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    stats: { atk: 1, def: 1, spAtk: 1, spDef: 1, speed: 1 },
                    modifier: (ctx) => ctx.opponent.hasAnyStatus() ? 2 : 1
                },
                // TURN.ADD - 4回合恢复+固伤
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'fire_core_regen',
                    turns: 4,
                    onTick: [
                        // HP.HEAL_PERCENT - 恢复1/3最大体力 (低血翻倍)
                        { 
                            system: 'HP', 
                            func: 'HEAL_PERCENT', 
                            target: 'self', 
                            percent: 33, 
                            ofMax: true,
                            modifier: (ctx) => ctx.self.hpPercent < 50 ? 2 : 1 
                        },
                        // DAMAGE.FIXED - 等量固伤 (低血翻倍)
                        { 
                            system: 'DAMAGE', 
                            func: 'FIXED', 
                            target: 'opponent', 
                            valueFrom: 'lastHeal',
                            modifier: (ctx) => ctx.self.hpPercent < 50 ? 2 : 1 
                        }
                    ]
                },
                // PRIO.ADD - 下2回合先制+2
                {
                    system: 'PRIO',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    value: 2,
                    turns: 2
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能3: 火种永存
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'agnes_skill_3',
            name: '火种永存',
            type: 'buff',
            element: '火',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n必中；5回合免疫并反弹异常；\n4回合每回合70%几率对手焚烬，未触发則减少對手1/3最大體力；\n免疫下1次攻击',
            
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
                // TURN.ADD - 5回合免疫反弹异常
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'status_reflect',
                    turns: 5,
                    flags: { immuneStatus: true, reflectStatus: true }
                },
                // TURN.ADD - 4回合焚烬/固伤
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'fire_seed',
                    turns: 4,
                    onTick: [
                        {
                            system: 'BRANCH',
                            condition: () => Math.random() < 0.7,
                            onTrue: [
                                { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'immolate', turns: 2 }
                            ],
                            onFalse: [
                                { system: 'DAMAGE', func: 'PERCENT', target: 'opponent', percent: 33, ofMax: true }
                            ]
                        }
                    ]
                },
                // TEAM.COUNT - 免疫下1次攻击
                {
                    system: 'TEAM',
                    func: 'COUNT',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    action: 'set',
                    countId: 'attack_immune',
                    value: 1
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能4: 秩序之助
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'agnes_skill_4',
            name: '秩序之助',
            type: 'attack',
            element: '火',
            category: 'physical',
            power: 85,
            pp: 20,
            maxPp: 20,
            priority: 3,
            accuracy: 100,
            desc: '火系物攻\n先制+3；消除对手回合效果，成功則對手2回合無法使用屬性技能；\n2回合內對手無法恢復體力',
            
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
                // TURN.DISPEL - 消除对手回合效果
                {
                    system: 'TURN',
                    func: 'DISPEL',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    onSuccess: [
                        // TURN.ADD - 成功则2回合禁属性技能
                        { system: 'TURN', func: 'ADD', target: 'opponent', effectId: 'block_attribute', turns: 2, flags: { blockAttribute: true } }
                    ]
                },
                // DAMAGE.ATTACK - 造成伤害
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 85
                },
                // TURN.ADD - 2回合禁疗
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    effectId: 'heal_block',
                    turns: 2,
                    flags: { blockHeal: true }
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能5: 王·焚世烈焰 (第五技能)
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'agnes_skill_5',
            name: '王·焚世烈焰',
            type: 'ultimate',
            element: '火',
            category: 'physical',
            power: 160,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            flags: { ignoreWeaken: true },
            desc: '第五技能\n必中；無視微弱；\n消除對手能力上升，成功則下1回合先制；\n對手異常時傷害提高75%，否則吸取1/3最大體力',
            
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
                // STATS.CLEAR_UPS - 消除对手能力上升
                {
                    system: 'STATS',
                    func: 'CLEAR_UPS',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    onSuccess: [
                        // PRIO.ADD - 成功则下1回合先制
                        { system: 'PRIO', func: 'ADD', target: 'self', value: 99, turns: 1 }
                    ]
                },
                // DAMAGE.ATTACK - 造成伤害 (对手异常+75%)
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 160,
                    modifier: (ctx) => ctx.opponent.hasAnyStatus() ? 1.75 : 1,
                    flags: { ignoreWeaken: true }
                },
                // BRANCH - 对手无异常则吸血
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => !ctx.opponent.hasAnyStatus(),
                    onTrue: [
                        // HP.DRAIN_PERCENT - 吸取1/3最大体力
                        { system: 'HP', func: 'DRAIN_PERCENT', target: 'opponent', percent: 33, ofMax: true }
                    ]
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
