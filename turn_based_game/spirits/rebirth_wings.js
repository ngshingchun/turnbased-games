/**
 * 重生之翼 (Rebirth Wings) - 精灵定义
 * 魂印: 神
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
        key: 'rebirthWings',
        name: '重生之翼',
        element: '神',
        maxHp: 800,
        maxPp: 100,
        attack: 115,
        defense: 100,
        spAttack: 100,
        spDefense: 100,
        speed: 115,
        resist: { fixed: 0, percent: 0, trueDmg: 0 }
    };

    // =========================================================================
    // 魂印定义
    // =========================================================================
    /**
     * 【魂印】神
     * 自身被击败后100%随机复活出战背包内已被击败的1只精灵（无法复活重生之翼，boss有效）；
     * [神耀能量]:
     * 1层:减少自身受到伤害的8%,每增加1层额外获得8%的减伤
     * 2层:免疫所有异常状态、免疫所有能力下降状态
     * 3层:自身出手起则每回合结束后恢复自身最大体力的1/3
     * 4层:免疫并反弹自身受到的固定伤害
     * 5层:所有攻击技能先制额外+1
     * 6层：自身所有攻击技能伤害提升60%且第五技能威力提升不再消耗自身神耀能量；
     * 赛尔对战中击败对手后自身神耀能量清零且下回合先制额外+3
     */
    const SOULBUFF = {
        name: '神',
        desc: '【魂印】神\n复活已击败的精灵；神耀能量1-6层提供各种增益；击败对手后清零+先制+3',
        
        effects: [
            // ─────────────────────────────────────────────────────────────────
            // 神耀1层: 减伤8%/层
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'rebirth_glory_1',
                name: '神耀·减伤',
                trigger: NODE.ON_HIT_RECV,
                condition: (ctx) => ctx.self.key === 'rebirthWings' && (ctx.self.flags?.godlyGloryEnergy || 0) >= 1,
                calls: [
                    { 
                        system: 'DAMAGE', 
                        func: 'MODIFY', 
                        multiplier: (ctx) => 1 - (ctx.self.flags?.godlyGloryEnergy || 0) * 0.08 
                    }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 神耀2层: 免疫异常和能力下降
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'rebirth_glory_2',
                name: '神耀·免疫',
                trigger: 'PASSIVE',
                condition: (ctx) => ctx.self.key === 'rebirthWings' && (ctx.self.flags?.godlyGloryEnergy || 0) >= 2,
                calls: [
                    { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'abnormal_immune', value: 9999, flags: { immuneType: 'abnormal' } },
                    { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'stat_down_immune', value: 9999, flags: { immuneType: 'stat_down' } }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 神耀3层: 每回合恢复1/3体力
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'rebirth_glory_3',
                name: '神耀·回复',
                trigger: NODE.TURN_END,
                condition: (ctx) => ctx.self.key === 'rebirthWings' && (ctx.self.flags?.godlyGloryEnergy || 0) >= 3 && ctx.self.flags?.hasActed,
                calls: [
                    { system: 'HP', func: 'HEAL_PERCENT', target: 'self', percent: 33, ofMax: true }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 神耀4层: 免疫并反弹固伤
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'rebirth_glory_4',
                name: '神耀·反弹',
                trigger: NODE.BEFORE_HIT_RECV,
                condition: (ctx) => ctx.self.key === 'rebirthWings' && (ctx.self.flags?.godlyGloryEnergy || 0) >= 4 && ctx.damageType === 'fixed',
                calls: [
                    { system: 'DAMAGE', func: 'REFLECT', target: 'opponent', value: (ctx) => ctx.damage },
                    { system: 'BLOCK', func: 'NULLIFY' }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 神耀5层: 攻击技能先制+1
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'rebirth_glory_5',
                name: '神耀·先制',
                trigger: NODE.PRIORITY_CALC,
                condition: (ctx) => ctx.self.key === 'rebirthWings' && (ctx.self.flags?.godlyGloryEnergy || 0) >= 5 && ctx.skill?.type === 'attack',
                calls: [
                    { system: 'PRIO', func: 'ADD', target: 'self', value: 1 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 神耀6层: 攻击伤害+60%
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'rebirth_glory_6',
                name: '神耀·强攻',
                trigger: NODE.DAMAGE_CALC,
                condition: (ctx) => ctx.self.key === 'rebirthWings' && (ctx.self.flags?.godlyGloryEnergy || 0) >= 6 && ctx.skill?.type === 'attack',
                calls: [
                    { system: 'DAMAGE', func: 'MODIFY', multiplier: 1.6 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 击败对手: 神耀清零+先制+3
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'rebirth_ko_reset',
                name: '神耀·清算',
                trigger: NODE.ON_KO,
                condition: (ctx) => ctx.self.key === 'rebirthWings',
                calls: [
                    { system: 'TEAM', func: 'FLAG', target: 'self', flag: 'godlyGloryEnergy', value: 0 },
                    { system: 'PRIO', func: 'ADD', target: 'self', value: 3, turns: 1 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 死亡时: 复活队友
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'rebirth_revive',
                name: '重生之力',
                trigger: NODE.ON_DEATH,
                condition: (ctx) => ctx.self.key === 'rebirthWings',
                calls: [
                    { system: 'TEAM', func: 'REVIVE_RANDOM', target: 'ally', excludeSelf: true, hpPercent: 50 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 出手后标记
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'rebirth_acted',
                name: '出手标记',
                trigger: NODE.AFTER_ATTACK,
                condition: (ctx) => ctx.self.key === 'rebirthWings',
                calls: [
                    { system: 'TEAM', func: 'FLAG', target: 'self', flag: 'hasActed', value: true }
                ]
            }
        ]
    };

    // =========================================================================
    // 技能定义
    // =========================================================================
    const SKILLS = [
        // ─────────────────────────────────────────────────────────────────────
        // 技能1: 正义天启歌 (第五技能)
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'rebirth_skill_1',
            name: '正义天启歌',
            type: 'ultimate',
            element: '神',
            category: 'physical',
            power: 170,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            flags: { ignoreDamageLimit: true },
            desc: '第五技能\n消耗自身所有神耀能量，每消耗1层此技能威力提升50；\n无视伤害限制效果；\n后出手则下1回合令对手使用的攻击技能无效',
            
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
                // DAMAGE.ATTACK - 造成伤害 (消耗神耀加威力，6层时不消耗)
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: (ctx) => {
                        const energy = ctx.self.flags?.godlyGloryEnergy || 0;
                        return 170 + energy * 50;
                    },
                    flags: { ignoreDamageLimit: true },
                    afterCalc: (ctx) => {
                        // 6层时不消耗能量
                        if ((ctx.self.flags?.godlyGloryEnergy || 0) < 6) {
                            ctx.self.flags = ctx.self.flags || {};
                            ctx.self.flags.godlyGloryEnergy = 0;
                        }
                    }
                },
                // 条件: 后出手则对手下1回合攻击无效
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => !ctx.isFirstMover,
                    onTrue: [
                        { system: 'TURN', func: 'ADD', target: 'opponent', effectId: 'attack_block', turns: 1, flags: { blockType: 'attack' } }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能2: 无上天命剑
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'rebirth_skill_2',
            name: '无上天命剑',
            type: 'attack',
            element: '神',
            category: 'physical',
            power: 150,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 100,
            flags: { ignoreAttackImmune: true },
            desc: '物理攻击\n无视攻击免疫效果；\n本回合未击败对手则下1回合反弹受到伤害的1/2；\n击败对手则获得2层神耀能量；\n附加对手上次造成伤害数值的固定伤害',
            
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
                // DAMAGE.ATTACK - 造成伤害
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 150,
                    flags: { ignoreAttackImmune: true }
                },
                // 条件: 击败/未击败
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.opponent.hp <= 0,
                    onTrue: [
                        // 击败: +2层神耀
                        { 
                            system: 'TEAM', 
                            func: 'FLAG', 
                            target: 'self', 
                            flag: 'godlyGloryEnergy', 
                            value: (ctx) => Math.min(6, (ctx.self.flags?.godlyGloryEnergy || 0) + 2)
                        }
                    ],
                    onFalse: [
                        // 未击败: 1回合反弹50%伤害
                        { system: 'TURN', func: 'ADD', target: 'self', effectId: 'damage_reflect', turns: 1, flags: { reflectPercent: 50 } }
                    ]
                },
                // DAMAGE.FIXED - 附加对手上次伤害的固伤
                {
                    system: 'DAMAGE',
                    func: 'FIXED',
                    node: NODE.AFTER_ATTACK,
                    target: 'opponent',
                    value: (ctx) => ctx.opponent.flags?.lastDamageDealt || 0
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能3: 黎羽幻生
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'rebirth_skill_3',
            name: '黎羽幻生',
            type: 'buff',
            element: '神',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n技能使用成功时，全属性+1；\n恢复自身最大体力的1/1；\n获得2层神耀能量；\n下2回合自身攻击技能必定打出致命一击',
            
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
                // STATS.MODIFY - 全属性+1
                {
                    system: 'STATS',
                    func: 'MODIFY',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    stats: { atk: 1, def: 1, spAtk: 1, spDef: 1, speed: 1 }
                },
                // HP.SET - 恢复满体力
                {
                    system: 'HP',
                    func: 'SET',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    value: 'max'
                },
                // TEAM.FLAG - +2层神耀能量
                {
                    system: 'TEAM',
                    func: 'FLAG',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    flag: 'godlyGloryEnergy',
                    value: (ctx) => Math.min(6, (ctx.self.flags?.godlyGloryEnergy || 0) + 2)
                },
                // TURN.ADD - 2回合必致命
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
        // 技能4: 挚金命轮
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'rebirth_skill_4',
            name: '挚金命轮',
            type: 'buff',
            element: '神',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 100,
            desc: '属性攻击\n100%令对手全属性-1；\n4回合内若对手使用属性技能则令对手所有技能降低2点PP值；\n命中后70%令对手失明',
            
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
                // STATS.MODIFY - 100%对手全属性-1
                {
                    system: 'STATS',
                    func: 'MODIFY',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    stats: { atk: -1, def: -1, spAtk: -1, spDef: -1, speed: -1 },
                    chance: 100
                },
                // TURN.ADD - 4回合对手使用属性技能降PP
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    effectId: 'pp_drain',
                    turns: 4,
                    onSkillUse: [
                        {
                            system: 'BRANCH',
                            condition: (ctx) => ctx.usedSkill?.type === 'buff',
                            onTrue: [
                                { system: 'PP', func: 'REDUCE_ALL', target: 'opponent', amount: 2 }
                            ]
                        }
                    ]
                },
                // STATUS.APPLY - 70%失明
                {
                    system: 'STATUS',
                    func: 'APPLY',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    status: 'blind',
                    turns: 2,
                    chance: 70
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能5: 银雾之翼
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'rebirth_skill_5',
            name: '银雾之翼',
            type: 'attack',
            element: '神',
            category: 'physical',
            power: 85,
            pp: 20,
            maxPp: 20,
            priority: 3,
            accuracy: 100,
            crit: '10/16',
            desc: '物理攻击 先制+3\n消除对手回合类效果，消除成功使对手下回合先制-2；\n消除对手能力提升状态，消除成功则令对手下回合所有技能先制-2；\n若打出致命一击则获得2层神耀能量, 否则获得1层',
            
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
                // TURN.DISPEL - 消除回合效果
                {
                    system: 'TURN',
                    func: 'DISPEL',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    onSuccess: [
                        { system: 'PRIO', func: 'ADD', target: 'opponent', value: -2, turns: 1 }
                    ]
                },
                // STATS.CLEAR_UPS - 消除强化
                {
                    system: 'STATS',
                    func: 'CLEAR_UPS',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    onSuccess: [
                        { system: 'PRIO', func: 'ADD', target: 'opponent', value: -2, turns: 1 }
                    ]
                },
                // DAMAGE.ATTACK - 造成伤害
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 85,
                    critRate: '10/16'
                },
                // 致命判定: +2层或+1层神耀
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.wasCrit,
                    onTrue: [
                        { system: 'TEAM', func: 'FLAG', target: 'self', flag: 'godlyGloryEnergy', value: (ctx) => Math.min(6, (ctx.self.flags?.godlyGloryEnergy || 0) + 2) }
                    ],
                    onFalse: [
                        { system: 'TEAM', func: 'FLAG', target: 'self', flag: 'godlyGloryEnergy', value: (ctx) => Math.min(6, (ctx.self.flags?.godlyGloryEnergy || 0) + 1) }
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
