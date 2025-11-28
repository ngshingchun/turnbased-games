/**
 * 怒涛·沧岚 (Surging Canglan) - 精灵定义
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
        key: 'surgingCanglan',
        name: '怒涛·沧岚',
        element: '水',
        maxHp: 950,
        maxPp: 100,
        attack: 100,
        defense: 105,
        spAttack: 125,
        spDefense: 110,
        speed: 110,
        resist: { fixed: 0, percent: 0, trueDmg: 0, statusImmune: { immolate: 0.7 } }  // 70%焚烬免疫
    };

    // =========================================================================
    // 魂印定义
    // =========================================================================
    /**
     * 【魂印】滴
     * 1. 登场附加400护盾，有护盾时先制+1
     * 2. 未受攻击伤害则回合结束恢复250体力并固伤250，受攻击伤害则免疫下1次攻击
     * 3. 使用攻击技能伤害提升25%（最高100%）
     */
    const SOULBUFF = {
        name: '滴',
        desc: '【魂印】滴\n1. 登场附加400护盾，有护盾时先制+1\n2. 未受攻击伤害则回合结束恢复250+固伤250，受攻击伤害则免疫下1次攻击\n3. 使用攻击技能伤害提升25%（最高100%）',
        
        effects: [
            // ─────────────────────────────────────────────────────────────────
            // Point 1.1: 登场附加400护盾
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'canglan_entry_shield',
                name: '水之护盾',
                trigger: NODE.ENTRY,
                calls: [
                    // TEAM.SHIELD - 附加400护盾
                    { system: 'TEAM', func: 'SHIELD', target: 'self', action: 'add', value: 400, shieldType: 'hp' }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // Point 1.2: 有护盾时先制+1
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'canglan_shield_priority',
                name: '水之迅捷',
                trigger: NODE.PRIORITY_CALC,
                condition: (ctx) => ctx.self.shieldHp > 0,
                calls: [
                    // PRIO.ADD - 先制+1
                    { system: 'PRIO', func: 'ADD', target: 'self', value: 1 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // Point 2.1: 未受攻击伤害 - 恢复250体力并固伤250
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'canglan_no_damage_effect',
                name: '静水回流',
                trigger: NODE.TURN_END,
                condition: (ctx) => !ctx.self.tookAttackDamageThisTurn,
                calls: [
                    // HP.HEAL - 恢复250体力
                    { system: 'HP', func: 'HEAL', target: 'self', value: 250 },
                    // DAMAGE.FIXED - 对手固伤250
                    { system: 'DAMAGE', func: 'FIXED', target: 'opponent', value: 250 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // Point 2.2: 受攻击伤害 - 免疫下1次攻击
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'canglan_damage_immunity',
                name: '水之庇护',
                trigger: NODE.TURN_END,
                condition: (ctx) => ctx.self.tookAttackDamageThisTurn,
                calls: [
                    // TEAM.COUNT - 免疫下1次攻击
                    { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'attack_immune', value: 1, flags: { immuneType: 'attack' } }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // Point 3: 使用攻击技能伤害+25% (最高100%)
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'canglan_damage_stack',
                name: '怒涛之力',
                trigger: NODE.AFTER_ATTACK,
                condition: (ctx) => ctx.usedSkill?.type === 'attack',
                calls: [
                    // TEAM.COUNT - 伤害层数+1 (最高4层)
                    { system: 'TEAM', func: 'COUNT', target: 'self', action: 'add', countId: 'damage_stack', value: 1, max: 4 }
                ]
            },
            {
                id: 'canglan_damage_boost',
                name: '怒涛之力(伤害)',
                trigger: NODE.DAMAGE_CALC,
                condition: (ctx) => ctx.self.damageStack > 0,
                calls: [
                    // DAMAGE修饰: 每层+25%
                    { system: 'DAMAGE', func: 'MODIFIER', target: 'self', multiplier: (ctx) => 1 + ctx.self.damageStack * 0.25 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 初始化: 回合开始重置状态
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'canglan_turn_init',
                name: '回合初始化',
                trigger: NODE.TURN_START,
                calls: [
                    // 重置回合状态标记
                    { system: 'FLAG', func: 'SET', target: 'self', flag: 'tookAttackDamageThisTurn', value: false }
                ]
            },
            {
                id: 'canglan_on_hit',
                name: '受击标记',
                trigger: NODE.ON_HIT_RECV,
                condition: (ctx) => ctx.damageType === 'attack',
                calls: [
                    // 标记本回合受到攻击伤害
                    { system: 'FLAG', func: 'SET', target: 'self', flag: 'tookAttackDamageThisTurn', value: true }
                ]
            }
        ]
    };

    // =========================================================================
    // 技能定义
    // =========================================================================
    const SKILLS = [
        // ─────────────────────────────────────────────────────────────────────
        // 技能1: 王·洛水惊鸿 (第五技能)
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'canglan_skill_1',
            name: '王·洛水惊鸿',
            type: 'ultimate',
            element: '水',
            category: 'special',
            power: 160,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            flags: { ignoreWeaken: true, ignoreImmunity: true },  // 无视微弱和免疫
            desc: '第五技能\n必中；无视微弱和免疫；\n消除对手回合效果，成功则冰封，失败则免疫下1次异常；\n附加20%最大体力固伤',
            
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
                // DAMAGE.ATTACK - 造成伤害 (无视微弱和免疫)
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 160,
                    flags: { ignoreWeaken: true, ignoreImmunity: true }
                },
                // TURN.DISPEL - 消除对手回合效果
                {
                    system: 'TURN',
                    func: 'DISPEL',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    onSuccess: [
                        // STATUS.APPLY - 成功则冰封
                        { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'freeze', turns: 2 }
                    ],
                    onFail: [
                        // TEAM.COUNT - 失败则免疫1次异常
                        { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'status_immune', value: 1, flags: { immuneType: 'status' } }
                    ]
                },
                // DAMAGE.PERCENT - 附加20%最大体力固伤
                {
                    system: 'DAMAGE',
                    func: 'PERCENT',
                    node: NODE.AFTER_ATTACK,
                    target: 'opponent',
                    percent: 20,
                    ofMax: true
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能2: 王·碧海潮生
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'canglan_skill_2',
            name: '王·碧海潮生',
            type: 'attack',
            element: '水',
            category: 'special',
            power: 150,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '水系特攻\n必中；100%对手全属性-1；\n反转自身弱化，成功則4回合免弱',
            
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
                    power: 150
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
                // STATS.REVERSE - 反转自身弱化
                {
                    system: 'STATS',
                    func: 'REVERSE',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    onSuccess: [
                        // TURN.ADD - 成功则4回合免弱
                        { system: 'TURN', func: 'ADD', target: 'self', effectId: 'stat_protect', turns: 4, flags: { immuneStatDown: true } }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能3: 浮生若梦
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'canglan_skill_3',
            name: '浮生若梦',
            type: 'buff',
            element: '水',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n必中；全属性+1(有护盾翻倍)；\n4回合免疫并反弹异常；\n下2回合对手受击伤害+100%；下2回合自身先制+2',
            
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
                // STATS.MODIFY - 全属性+1 (有护盾翻倍)
                {
                    system: 'STATS',
                    func: 'MODIFY',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    stats: { atk: 1, def: 1, spAtk: 1, spDef: 1, speed: 1 },
                    modifier: (ctx) => ctx.self.shieldHp > 0 ? 2 : 1
                },
                // TURN.ADD - 4回合免疫并反弹异常
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'status_reflect',
                    turns: 4,
                    flags: { immuneStatus: true, reflectStatus: true }
                },
                // TURN.ADD - 2回合对手受击伤害+100%
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    effectId: 'damage_taken_up',
                    turns: 2,
                    flags: { damageTakenMultiplier: 2 }
                },
                // PRIO.ADD - 2回合先制+2
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
        // 技能4: 沧海永存
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'canglan_skill_4',
            name: '沧海永存',
            type: 'buff',
            element: '水',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 100,
            desc: '属性攻击\n80%冰封，未觸發則下2回合攻擊100%束縛；\n恢復滿體力，體力<1/2則附加等量固傷',
            
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
                // 条件: 80%冰封
                {
                    system: 'BRANCH',
                    node: NODE.SKILL_EFFECT,
                    condition: () => Math.random() < 0.8,
                    onTrue: [
                        // STATUS.APPLY - 冰封
                        { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'freeze', turns: 2 }
                    ],
                    onFalse: [
                        // TURN.ADD - 2回合100%束缚
                        { system: 'TURN', func: 'ADD', target: 'self', effectId: 'bind_attack', turns: 2, onAttack: { applyStatus: { status: 'bind', turns: 2, chance: 100 } } }
                    ]
                },
                // HP.HEAL - 恢复满体力
                {
                    system: 'HP',
                    func: 'SET',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    value: 'max',
                    beforeHeal: (ctx) => {
                        ctx.healAmount = ctx.self.maxHp - ctx.self.hp;
                        ctx.wasLowHp = ctx.self.hpPercent < 50;
                    }
                },
                // 条件: 体力<1/2时附加等量固伤
                {
                    system: 'BRANCH',
                    node: NODE.SKILL_EFFECT,
                    condition: (ctx) => ctx.wasLowHp,
                    onTrue: [
                        // DAMAGE.FIXED - 等量固伤
                        { system: 'DAMAGE', func: 'FIXED', target: 'opponent', valueFrom: 'healAmount' }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能5: 上善若水
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'canglan_skill_5',
            name: '上善若水',
            type: 'attack',
            element: '水',
            category: 'special',
            power: 85,
            pp: 20,
            maxPp: 20,
            priority: 3,
            accuracy: 100,
            desc: '水系特攻\n先制+3；反轉對手強化，成功則複製，失敗則消除；\n傷害<300則附加30%最大體力固傷',
            
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
                // DAMAGE.ATTACK - 造成伤害
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 85
                },
                // STATS.REVERSE - 反转对手强化
                {
                    system: 'STATS',
                    func: 'REVERSE',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    reverseType: 'ups',
                    onSuccess: [
                        // STATS.COPY - 成功则复制
                        { system: 'STATS', func: 'COPY', target: 'self', from: 'opponent', copyType: 'downs' }
                    ],
                    onFail: [
                        // STATS.CLEAR_UPS - 失败则消除
                        { system: 'STATS', func: 'CLEAR_UPS', target: 'opponent' }
                    ]
                },
                // 条件: 伤害<300
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.lastDamage < 300,
                    onTrue: [
                        // DAMAGE.PERCENT - 30%最大体力固伤
                        { system: 'DAMAGE', func: 'PERCENT', target: 'opponent', percent: 30, ofMax: true }
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
