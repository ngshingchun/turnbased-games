/**
 * 艾夏拉 (Aishala) - 精灵定义
 * 魂印: 常
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
        key: 'aishala',
        name: '艾夏拉',
        element: '常',
        maxHp: 800,
        maxPp: 100,
        attack: 100,
        defense: 110,
        spAttack: 130,
        spDefense: 110,
        speed: 100,
        resist: { fixed: 0, percent: 0, trueDmg: 0 }
    };

    // =========================================================================
    // 魂印定义
    // =========================================================================
    /**
     * 【魂印】常
     * [常之罚] 先出手时攻击伤害+50%，后出手时受击伤害-50% (BOSS无效)
     * [常之劫] 回合开始对手有强化则消除+睡眠，无强化则当回合先制+1 (BOSS无效)
     * [常之悲] 死亡时消除对手回合效果+强化，成功则睡眠 (BOSS无效)
     */
    const SOULBUFF = {
        name: '常',
        desc: '【魂印】常\n[常之罚]：自身先出手时当回合攻击伤害+50%，后出手时受击伤害-50%（BOSS无效）\n[常之劫]：回合开始时消除对手强化并睡眠，或先制+1（BOSS无效）\n[常之悲]：死亡时消除对手效果并睡眠（BOSS无效）',
        
        effects: [
            // ─────────────────────────────────────────────────────────────────
            // [常之罚] 先攻伤害加成
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'aishala_first_move_boost',
                name: '常之罚·先攻',
                trigger: NODE.FIRST_BEFORE_DAMAGE,
                condition: (ctx) => ctx.self.key === 'aishala' && !ctx.opponent.flags?.isBoss,
                calls: [
                    // DAMAGE.MODIFY - 伤害+50%
                    { system: 'DAMAGE', func: 'MODIFY', multiplier: 1.5 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [常之罚] 后手减伤
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'aishala_second_move_reduction',
                name: '常之罚·后守',
                trigger: NODE.SECOND_BEFORE_DAMAGE,
                condition: (ctx) => ctx.target?.key === 'aishala' && !ctx.attacker?.flags?.isBoss,
                calls: [
                    // DAMAGE.MODIFY - 受伤-50%
                    { system: 'DAMAGE', func: 'MODIFY', multiplier: 0.5 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [常之劫] 回合开始消除强化或先制加成
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'aishala_calamity',
                name: '常之劫',
                trigger: NODE.TURN_START,
                condition: (ctx) => ctx.self.key === 'aishala' && !ctx.opponent.flags?.isBoss,
                calls: [
                    {
                        system: 'BRANCH',
                        condition: (ctx) => ctx.opponent.hasStatUp(),
                        onTrue: [
                            // STATS.CLEAR_UPS - 消除对手强化
                            { system: 'STATS', func: 'CLEAR_UPS', target: 'opponent' },
                            // STATUS.APPLY - 令对手睡眠
                            { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'sleep', turns: 2 }
                        ],
                        onFalse: [
                            // PRIO.ADD - 当回合先制+1
                            { system: 'PRIO', func: 'ADD', target: 'self', value: 1, turns: 1 }
                        ]
                    }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [常之悲] 死亡时反击
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'aishala_sorrow',
                name: '常之悲',
                trigger: NODE.NOT_DEFEATED,
                condition: (ctx) => ctx.self.key === 'aishala' && ctx.self.hp <= 0 && !ctx.opponent.flags?.isBoss,
                calls: [
                    // TURN.DISPEL - 消除对手回合效果
                    { system: 'TURN', func: 'DISPEL', target: 'opponent', recordSuccess: 'dispelSuccess' },
                    // STATS.CLEAR_UPS - 消除对手强化
                    { system: 'STATS', func: 'CLEAR_UPS', target: 'opponent', recordSuccess: 'clearSuccess' },
                    // 条件: 任一成功则睡眠
                    {
                        system: 'BRANCH',
                        condition: (ctx) => ctx.vars?.dispelSuccess || ctx.vars?.clearSuccess,
                        onTrue: [
                            { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'sleep', turns: 2 }
                        ]
                    }
                ]
            }
        ]
    };

    // =========================================================================
    // 技能定义
    // =========================================================================
    const SKILLS = [
        // ─────────────────────────────────────────────────────────────────────
        // 技能1: 常·天劫余生 (第五技能)
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'aishala_skill_1',
            name: '常·天劫余生',
            type: 'ultimate',
            element: '常',
            category: 'special',
            power: 160,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '第五技能\n消除对手回合类效果，消除成功则己方免疫下1次异常；\n2回合内对手无法通过自身技能恢复体力；\n附加自身特攻值与速度值总和20%的百分比伤害，每次使用增加10%，最高40%',
            
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
                        // TEAM.COUNT - 己方免疫下1次异常
                        { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'status_immune', value: 1 }
                    ]
                },
                // TURN.ADD - 2回合对手禁疗
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    effectId: 'heal_block',
                    turns: 2,
                    flags: { blockSelfHeal: true }
                },
                // DAMAGE.ATTACK - 基础伤害
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 160
                },
                // DAMAGE.FIXED - 附加百分比伤害 (特攻+速度)*20%~40%
                {
                    system: 'DAMAGE',
                    func: 'FIXED',
                    node: NODE.AFTER_ATTACK,
                    target: 'opponent',
                    value: (ctx) => {
                        const useCount = ctx.self.flags?.skill1UseCount || 0;
                        const percent = Math.min(40, 20 + useCount * 10);
                        return Math.floor((ctx.self.spAttack + ctx.self.speed) * percent / 100);
                    }
                },
                // TEAM.FLAG - 使用次数+1
                {
                    system: 'TEAM',
                    func: 'FLAG',
                    node: NODE.AFTER_ATTACK,
                    target: 'self',
                    flag: 'skill1UseCount',
                    action: 'set',
                    value: (ctx) => (ctx.self.flags?.skill1UseCount || 0) + 1
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能2: 天蛇之难
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'aishala_skill_2',
            name: '天蛇之难',
            type: 'buff',
            element: '常',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n全属性+1，先出手时自身强化效果翻倍；\n4回合每回合吸取对手最大体力的1/3(低血翻倍)；\n下2回合先制+2；\n下2回合攻击必暴击',
            
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
                // STATS.MODIFY - 全属性+1 (先出手翻倍)
                {
                    system: 'STATS',
                    func: 'MODIFY',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    stats: { atk: 1, def: 1, spAtk: 1, spDef: 1, speed: 1 },
                    modifier: (ctx) => ctx.isFirstMover ? 2 : 1
                },
                // TURN.ADD - 4回合吸取效果
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'serpent_drain',
                    turns: 4,
                    onTick: [
                        // HP.DRAIN_PERCENT - 吸取1/3最大体力 (低血翻倍)
                        { 
                            system: 'HP', 
                            func: 'DRAIN_PERCENT', 
                            target: 'opponent', 
                            percent: 33, 
                            ofMax: true,
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
                },
                // TURN.ADD - 下2回合必暴击
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'guaranteed_crit',
                    turns: 2,
                    flags: { guaranteedCrit: true }
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能3: 虚妄幻境
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'aishala_skill_3',
            name: '虚妄幻境',
            type: 'buff',
            element: '常',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n4回合免疫并反弹异常；\n3回合受击则对手睡眠，未触发则对手全属性-1；\n3回合80%闪避攻击，未触发则对手随机2技能PP归零',
            
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
                // TURN.ADD - 4回合免疫反弹异常
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'status_reflect',
                    turns: 4,
                    flags: { immuneStatus: true, reflectStatus: true }
                },
                // TURN.ADD - 3回合受击睡眠/减属性
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'counter_sleep',
                    turns: 3,
                    onHit: [
                        { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'sleep', turns: 2 }
                    ],
                    onTurnEndNoTrigger: [
                        { system: 'STATS', func: 'MODIFY', target: 'opponent', stats: { atk: -1, def: -1, spAtk: -1, spDef: -1, speed: -1 } }
                    ]
                },
                // TURN.ADD - 3回合80%闪避/清PP
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'illusion_dodge',
                    turns: 3,
                    onBeforeHit: [
                        {
                            system: 'BRANCH',
                            condition: () => Math.random() < 0.8,
                            onTrue: [
                                { system: 'BLOCK', func: 'DODGE' }
                            ],
                            onFalse: [
                                { system: 'PP', func: 'CLEAR_RANDOM', target: 'opponent', count: 2 }
                            ]
                        }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能4: 净灵咒
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'aishala_skill_4',
            name: '净灵咒',
            type: 'attack',
            element: '常',
            category: 'special',
            power: 90,
            pp: 5,
            maxPp: 5,
            priority: 3,
            accuracy: 100,
            flags: { ignoreDamageLimit: true, ignoreAttackImmune: true },
            desc: '特殊攻击 先制+3\n无视伤害限制效果；无视攻击免疫效果；\n消除对手回合类效果；\n命中后80%令对手睡眠（每损失20%体力概率+5%）',
            
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
                    target: 'opponent'
                },
                // DAMAGE.ATTACK - 造成伤害
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 90,
                    flags: { ignoreDamageLimit: true, ignoreAttackImmune: true }
                },
                // STATUS.APPLY - 80%+睡眠
                {
                    system: 'STATUS',
                    func: 'APPLY',
                    node: NODE.AFTER_ATTACK,
                    target: 'opponent',
                    status: 'sleep',
                    turns: 2,
                    chance: (ctx) => {
                        const lostPercent = 100 - ctx.self.hpPercent;
                        const bonusChance = Math.floor(lostPercent / 20) * 5;
                        return 80 + bonusChance;
                    }
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能5: 灵剑封魂
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'aishala_skill_5',
            name: '灵剑封魂',
            type: 'attack',
            element: '常',
            category: 'special',
            power: 85,
            pp: 20,
            maxPp: 20,
            priority: 3,
            accuracy: 100,
            desc: '特殊攻击 先制+3\n将自身能力下降反馈给对手，成功则全属性+1，失败则解除自身能力下降；\n每次使用当回合伤害额外+25%，最高额外+100%',
            
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
                // STATS.TRANSFER_DOWNS - 反馈能力下降
                {
                    system: 'STATS',
                    func: 'TRANSFER_DOWNS',
                    node: NODE.SKILL_EFFECT,
                    from: 'self',
                    to: 'opponent',
                    onSuccess: [
                        // STATS.MODIFY - 成功则全属性+1
                        { system: 'STATS', func: 'MODIFY', target: 'self', stats: { atk: 1, def: 1, spAtk: 1, spDef: 1, speed: 1 } }
                    ],
                    onFail: [
                        // STATS.CLEAR_DOWNS - 失败则解除自身能力下降
                        { system: 'STATS', func: 'CLEAR_DOWNS', target: 'self' }
                    ]
                },
                // DAMAGE.ATTACK - 造成伤害 (累计加成)
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 85,
                    modifier: (ctx) => {
                        const useCount = ctx.self.flags?.skill5UseCount || 0;
                        return 1 + Math.min(1, useCount * 0.25);
                    }
                },
                // TEAM.FLAG - 使用次数+1
                {
                    system: 'TEAM',
                    func: 'FLAG',
                    node: NODE.AFTER_ATTACK,
                    target: 'self',
                    flag: 'skill5UseCount',
                    action: 'set',
                    value: (ctx) => (ctx.self.flags?.skill5UseCount || 0) + 1
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
