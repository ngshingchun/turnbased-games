/**
 * 瀚宇星皇 (Star Sovereign) - 精灵定义
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
        key: 'starSovereign',
        name: '瀚宇星皇',
        element: '光',
        maxHp: 1050,
        maxPp: 100,
        attack: 130,
        defense: 110,
        spAttack: 120,
        spDefense: 110,
        speed: 100,
        resist: { fixed: 1, percent: 1, trueDmg: 0 }  // 100%免疫固定/百分比伤害
    };

    // =========================================================================
    // 魂印定义
    // =========================================================================
    /**
     * 【魂印】强攻·辅助·免伤
     * 1. 免疫固定/百分比伤害与能力下降，固定/百分比抗性恒定100%
     * 2. 技能无效时，若对手存活则50%追加星皇之怒
     * 3. 在队伍中：己方全员享星皇之赐(每回合行动后恢复1/8体力)
     * 4. 首发享星皇之佑(3回合免疫异常与能力下降)
     * 5. 星皇之怒：以技能50%威力追加攻击并触发对应怒效果
     */
    const SOULBUFF = {
        name: '强攻·辅助·免伤',
        desc: '【魂印】强攻·辅助·免伤\n免疫固定/百分比伤害与能力下降；\n技能无效时50%追加星皇之怒；\n队伍中己方全员每回合恢复1/8体力；\n首发3回合免疫异常与能力下降',
        
        effects: [
            // ─────────────────────────────────────────────────────────────────
            // Point 1: 免疫固定/百分比伤害 (被动, 通过 resist 实现)
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'star_immune_fixed_percent',
                name: '星皇护体',
                trigger: 'PASSIVE',
                calls: [
                    // 被动效果由 resist: { fixed: 1, percent: 1 } 实现
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // Point 1: 免疫能力下降 (永久)
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'star_immune_stat_down',
                name: '星皇威严',
                trigger: NODE.BATTLE_START,
                calls: [
                    // TEAM.COUNT - 永久免疫能力下降
                    { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'stat_down_immune', value: 9999, flags: { immuneType: 'stat_down' } }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // Point 2: 技能无效时50%追加星皇之怒
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'star_rage_on_nullified',
                name: '星皇之怒',
                trigger: NODE.SKILL_NULLIFIED,
                condition: (ctx) => ctx.opponent.hp > 0 && Math.random() < 0.5,
                calls: [
                    // DAMAGE.ATTACK - 50%威力追加攻击
                    { system: 'DAMAGE', func: 'ATTACK', target: 'opponent', powerMod: 0.5, source: '星皇之怒' },
                    // 触发对应怒效果 (由技能的 starRageType 决定)
                    { system: 'SOULBUFF', func: 'TRIGGER', effectId: 'star_rage_effect', param: 'currentSkill.starRageType' }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // Point 3: 星皇之赐 - 队伍中己方全员每回合恢复1/8体力
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'star_gift_aura',
                name: '星皇之赐',
                trigger: NODE.TURN_END,
                condition: (ctx) => ctx.teamHas?.('starSovereign'),
                calls: [
                    // HP.HEAL_PERCENT - 恢复1/8最大体力
                    { system: 'HP', func: 'HEAL_PERCENT', target: 'self', percent: 12.5, ofMax: true }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // Point 4: 星皇之佑 - 首发3回合免疫异常与能力下降
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'star_blessing',
                name: '星皇之佑',
                trigger: NODE.ENTRY,
                condition: (ctx) => ctx.isFirstDeploy,
                calls: [
                    // TURN.ADD - 3回合免疫异常
                    { system: 'TURN', func: 'ADD', target: 'self', effectId: 'star_blessing', turns: 3, flags: { immuneStatus: true, immuneStatDown: true } }
                ]
            }
        ],

        // ─────────────────────────────────────────────────────────────────────
        // 星皇之怒效果定义
        // ─────────────────────────────────────────────────────────────────────
        rageEffects: {
            wanhuang: {
                name: '万皇怒',
                desc: '下2次攻击先制+2',
                calls: [
                    { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'rage_priority', value: 2, onAttack: { priorityBonus: 2 } }
                ]
            },
            shengchen: {
                name: '圣辰怒',
                desc: '50%失明，否则2回合属性技能无效',
                calls: [
                    {
                        system: 'BRANCH',
                        condition: () => Math.random() < 0.5,
                        onTrue: [
                            { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'blind', turns: 2 }
                        ],
                        onFalse: [
                            { system: 'TURN', func: 'ADD', target: 'opponent', effectId: 'block_attribute', turns: 2, flags: { blockAttribute: true } }
                        ]
                    }
                ]
            },
            lunhui: {
                name: '轮回怒',
                desc: '下2回合攻击伤害翻倍且下2次受击再减伤50%',
                calls: [
                    { system: 'TURN', func: 'ADD', target: 'self', effectId: 'rage_damage_double', turns: 2, flags: { damageMultiplier: 2 } },
                    { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'rage_damage_reduce', value: 2, onHit: { damageReduce: 0.5 } }
                ]
            },
            gate: {
                name: '瀚空怒',
                desc: '2回合回合类效果无法被消除；2回合全技能先制+2',
                calls: [
                    { system: 'TURN', func: 'ADD', target: 'self', effectId: 'turn_protect', turns: 2, flags: { protectTurnEffects: true } },
                    { system: 'TURN', func: 'ADD', target: 'self', effectId: 'rage_priority_all', turns: 2, flags: { priorityBonus: 2 } }
                ]
            },
            punish: {
                name: '惩杀怒',
                desc: '若对手无强化则附加1/3最大体力伤害',
                calls: [
                    {
                        system: 'BRANCH',
                        condition: (ctx) => !ctx.opponent?.hasStatUp?.(),
                        onTrue: [
                            { system: 'DAMAGE', func: 'PERCENT', target: 'opponent', percent: 33, ofMax: true }
                        ]
                    }
                ]
            }
        }
    };

    // =========================================================================
    // 技能定义
    // =========================================================================
    const SKILLS = [
        // ─────────────────────────────────────────────────────────────────────
        // 技能1: 万皇宗魄决
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'star_skill_1',
            name: '万皇宗魄决',
            type: 'attack',
            element: '光',
            category: 'physical',
            power: 160,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 100,
            starRageType: 'wanhuang',
            desc: '物理攻击\n致命率每次+20%，最高100%；打出致命则下2次星皇之怒威力不再减少；若对手存活，50%再行动触发星皇之怒（怒：下2次攻击先制+2）',
            
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
                // DAMAGE.ATTACK - 造成伤害
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 160,
                    critMod: (ctx) => Math.min(1, (ctx.self.critStack || 0) * 0.2)
                },
                // TEAM.COUNT - 致命率叠加
                {
                    system: 'TEAM',
                    func: 'COUNT',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    action: 'add',
                    countId: 'crit_stack',
                    value: 1,
                    max: 5
                },
                // 条件: 打出致命
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.wasCrit,
                    onTrue: [
                        // TEAM.COUNT - 下2次怒威力不减
                        { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'rage_full_power', value: 2 }
                    ]
                },
                // 条件: 对手存活50%触发星皇之怒
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.opponent.hp > 0 && Math.random() < 0.5,
                    onTrue: [
                        { system: 'SOULBUFF', func: 'TRIGGER', effectId: 'star_rage_effect', param: 'wanhuang' }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能2: 亘古圣辰决
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'star_skill_2',
            name: '亘古圣辰决',
            type: 'attack',
            element: '光',
            category: 'physical',
            power: 150,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 100,
            starRageType: 'shengchen',
            desc: '物理攻击\n伤害<280则令对手疲惫；未击败则对手下1回合攻击无效；若对手存活，50%再行动触发星皇之怒（怒：50%失明，否则2回合属性技能无效）',
            
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
                // 条件: 伤害<280
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.lastDamage < 280,
                    onTrue: [
                        // STATUS.APPLY - 疲惫
                        { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'fatigue', turns: 2 }
                    ]
                },
                // 条件: 未击败
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.opponent.hp > 0,
                    onTrue: [
                        // TEAM.COUNT - 对手下1回合攻击无效
                        { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'attack_immunity', value: 1, flags: { immuneType: 'attack' } }
                    ]
                },
                // 条件: 对手存活50%触发星皇之怒
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.opponent.hp > 0 && Math.random() < 0.5,
                    onTrue: [
                        { system: 'SOULBUFF', func: 'TRIGGER', effectId: 'star_rage_effect', param: 'shengchen' }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能3: 命宇轮回
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'star_skill_3',
            name: '命宇轮回',
            type: 'buff',
            element: '光',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            starRageType: 'lunhui',
            desc: '属性攻击\n全属性+1(体力<1/2翻倍)；4回合每次出手吸取对手1/3最大体力(自身体力<1/2翻倍)；下2次技能星皇之怒概率翻倍；若对手存活，50%再行动触发星皇之怒（怒：下2回合攻击伤害翻倍且下2次受击再减伤50%）',
            
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
                // STATS.MODIFY - 全属性+1 (体力<1/2翻倍)
                {
                    system: 'STATS',
                    func: 'MODIFY',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    stats: { atk: 1, def: 1, spAtk: 1, spDef: 1, speed: 1 },
                    modifier: (ctx) => ctx.self.hpPercent < 50 ? 2 : 1
                },
                // TURN.ADD - 4回合吸血
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'star_drain',
                    turns: 4,
                    onAction: [
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
                // TEAM.COUNT - 下2次技能怒概率翻倍
                {
                    system: 'TEAM',
                    func: 'COUNT',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    action: 'set',
                    countId: 'rage_double_chance',
                    value: 2
                },
                // 条件: 对手存活50%触发星皇之怒
                {
                    system: 'BRANCH',
                    node: NODE.SKILL_EFFECT,
                    condition: (ctx) => ctx.opponent.hp > 0 && Math.random() < 0.5,
                    onTrue: [
                        { system: 'SOULBUFF', func: 'TRIGGER', effectId: 'star_rage_effect', param: 'lunhui' }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能4: 瀚空之门
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'star_skill_4',
            name: '瀚空之门',
            type: 'buff',
            element: '光',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            starRageType: 'gate',
            desc: '属性攻击\n3回合针对对手技能提供干扰；己方免疫下2次异常；若对手存活，50%再行动触发星皇之怒（怒：2回合回合类效果无法被消除；2回合全技能先制+2）',
            
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
                // TURN.ADD - 3回合干扰
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'star_interference',
                    turns: 3,
                    flags: { interference: true }
                },
                // TEAM.COUNT - 免疫下2次异常
                {
                    system: 'TEAM',
                    func: 'COUNT',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    action: 'set',
                    countId: 'status_immune',
                    value: 2,
                    flags: { immuneType: 'status' }
                },
                // 条件: 对手存活50%触发星皇之怒
                {
                    system: 'BRANCH',
                    node: NODE.SKILL_EFFECT,
                    condition: (ctx) => ctx.opponent.hp > 0 && Math.random() < 0.5,
                    onTrue: [
                        { system: 'SOULBUFF', func: 'TRIGGER', effectId: 'star_rage_effect', param: 'gate' }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能5: 圣世惩杀
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'star_skill_5',
            name: '圣世惩杀',
            type: 'attack',
            element: '光',
            category: 'physical',
            power: 85,
            pp: 20,
            maxPp: 20,
            priority: 3,
            accuracy: 100,
            starRageType: 'punish',
            desc: '物理攻击 先制+3\n消除对手回合效果并清空2项PP；消除对手能力提升成功则下2回合星皇之怒概率+20%；若对手存活，50%再行动触发星皇之怒（怒：若对手无强化则附加1/3最大体力伤害）',
            
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
                // TURN.DISPEL - 消除对手回合效果
                {
                    system: 'TURN',
                    func: 'DISPEL',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent'
                },
                // PP.DRAIN - 清空2项PP
                {
                    system: 'PP',
                    func: 'DRAIN',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    skills: 2,
                    amount: 'all'
                },
                // STATS.CLEAR_UPS - 消除对手能力提升
                {
                    system: 'STATS',
                    func: 'CLEAR_UPS',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    onSuccess: [
                        // TURN.ADD - 成功则下2回合怒概率+20%
                        { system: 'TURN', func: 'ADD', target: 'self', effectId: 'rage_bonus', turns: 2, flags: { rageChanceBonus: 0.2 } }
                    ]
                },
                // 条件: 对手存活50%触发星皇之怒
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.opponent.hp > 0 && Math.random() < 0.5,
                    onTrue: [
                        { system: 'SOULBUFF', func: 'TRIGGER', effectId: 'star_rage_effect', param: 'punish' }
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
