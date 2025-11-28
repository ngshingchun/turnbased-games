/**
 * 光之惩戒·英卡洛斯 (Light Punishment Incalos) - 精灵定义
 * 魂印: 光
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
        key: 'lightPunishmentIncalos',
        name: '光之惩戒·英卡洛斯',
        element: '光',
        maxHp: 880,
        maxPp: 100,
        attack: 130,
        defense: 100,
        spAttack: 110,
        spDefense: 100,
        speed: 120,
        resist: { fixed: 0, percent: 0, trueDmg: 0 }
    };

    // =========================================================================
    // 魂印定义
    // =========================================================================
    /**
     * 【魂印】光
     * 自身所有技能先制+1，免疫所有能力下降状态，攻击技能伤害计算时克制倍数至少为2；
     * 自身使用攻击技能则出手流程结束时，若本次攻击造成的伤害高于280则附加对手最大体力1/3的百分比伤害且令对手下回合使用的属性技能无效，若本次攻击造成的伤害低于280则吸取对手最大体力的1/3且令自身下回合攻击技能必定打出致命一击；
     * 自身首次死亡时有100%的概率得到1次圣光祝福：当回合残留1点体力，同时战斗阶段结束时解除自身异常状态且令自身下3次攻击技能造成的伤害提升150%（boss无效）
     */
    const SOULBUFF = {
        name: '光',
        desc: '【魂印】光\n先制+1；免疫能力下降；克制至少2倍；\n攻击>280则附加1/3%伤害+封属；攻击<=280则吸取1/3+必致命；\n首次死亡时圣光祝福：残留1点+解除异常+3次攻击+150%',
        
        effects: [
            // ─────────────────────────────────────────────────────────────────
            // 被动: 先制+1
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'incalos_priority',
                name: '光之敏捷',
                trigger: NODE.PRIORITY_CALC,
                condition: (ctx) => ctx.self.key === 'lightPunishmentIncalos',
                calls: [
                    { system: 'PRIO', func: 'ADD', target: 'self', value: 1 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 被动: 免疫能力下降
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'incalos_immune_stat_down',
                name: '光之护盾',
                trigger: 'PASSIVE',
                calls: [
                    { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'stat_down_immune', value: 9999, flags: { immuneType: 'stat_down' } }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 被动: 克制倍数至少为2
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'incalos_super_effective',
                name: '光之克制',
                trigger: NODE.DAMAGE_CALC,
                condition: (ctx) => ctx.self?.key === 'lightPunishmentIncalos' && ctx.skill?.type === 'attack',
                calls: [
                    { system: 'DAMAGE', func: 'MIN_EFFECTIVE', value: 2 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 攻击后判定: 高伤/低伤
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'incalos_judgment',
                name: '光之惩戒',
                trigger: NODE.AFTER_ATTACK,
                condition: (ctx) => ctx.self?.key === 'lightPunishmentIncalos' && ctx.skill?.type === 'attack',
                calls: [
                    {
                        system: 'BRANCH',
                        condition: (ctx) => ctx.lastDamage > 280,
                        onTrue: [
                            // 高伤: 附加1/3%伤害 + 封属1回合
                            { system: 'DAMAGE', func: 'PERCENT', target: 'opponent', percent: 33, ofMax: true },
                            { system: 'TURN', func: 'ADD', target: 'opponent', effectId: 'block_attribute', turns: 1, flags: { blockAttribute: true } }
                        ],
                        onFalse: [
                            // 低伤: 吸取1/3体力 + 下回合必致命
                            { system: 'HP', func: 'DRAIN_PERCENT', target: 'opponent', percent: 33, ofMax: true },
                            { system: 'TURN', func: 'ADD', target: 'self', effectId: 'guaranteed_crit', turns: 1, flags: { guaranteedCrit: true } }
                        ]
                    }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 圣光祝福: 首次死亡残留
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'incalos_blessing',
                name: '圣光祝福',
                trigger: NODE.NOT_DEFEATED,
                condition: (ctx) => ctx.self?.key === 'lightPunishmentIncalos' && ctx.self.hp <= 0 && !ctx.self.flags?.blessingTriggered && !ctx.opponent?.flags?.isBoss,
                calls: [
                    // 残留1点体力
                    { system: 'HP', func: 'SET', target: 'self', value: 1 },
                    // 标记已触发
                    { system: 'TEAM', func: 'FLAG', target: 'self', flag: 'blessingTriggered', value: true },
                    // 激活祝福效果
                    { system: 'TEAM', func: 'FLAG', target: 'self', flag: 'blessingActive', value: true }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 圣光祝福效果: 回合结束解除异常+伤害加成
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'incalos_blessing_effect',
                name: '圣光祝福效果',
                trigger: NODE.TURN_END,
                condition: (ctx) => ctx.self?.key === 'lightPunishmentIncalos' && ctx.self.flags?.blessingActive,
                calls: [
                    // 解除异常状态
                    { system: 'STATUS', func: 'CLEANSE', target: 'self' },
                    // 下3次攻击+150%
                    { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'blessing_boost', value: 3, onAttack: { damageMultiplier: 2.5 } },
                    // 关闭激活状态
                    { system: 'TEAM', func: 'FLAG', target: 'self', flag: 'blessingActive', value: false }
                ]
            }
        ]
    };

    // =========================================================================
    // 技能定义
    // =========================================================================
    const SKILLS = [
        // ─────────────────────────────────────────────────────────────────────
        // 技能1: 光·断罪裁决 (第五技能)
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'incalos_skill_1',
            name: '光·断罪裁决',
            type: 'ultimate',
            element: '光',
            category: 'physical',
            power: 160,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '第五技能\n消除对手能力提升，消除成功2回合内对手无法通过自身技能恢复体力；\n击败对手则令对手下1次使用的攻击技能无效；\n当回合若未击败对手则80%令对手疲惫，未触发则令自身全属性+1',
            
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
                // STATS.CLEAR_UPS - 消除对手能力提升
                {
                    system: 'STATS',
                    func: 'CLEAR_UPS',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    onSuccess: [
                        { system: 'TURN', func: 'ADD', target: 'opponent', effectId: 'heal_block', turns: 2, flags: { blockSelfHeal: true } }
                    ]
                },
                // DAMAGE.ATTACK - 造成伤害
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 160
                },
                // 条件: 击败则对手下1次攻击无效
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.opponent.hp <= 0,
                    onTrue: [
                        { system: 'TEAM', func: 'COUNT', target: 'opponent', action: 'set', countId: 'attack_block', value: 1, flags: { blockType: 'attack' } }
                    ],
                    onFalse: [
                        // 未击败: 80%疲惫或全属性+1
                        {
                            system: 'BRANCH',
                            condition: () => Math.random() < 0.8,
                            onTrue: [
                                { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'fatigue', turns: 2 }
                            ],
                            onFalse: [
                                { system: 'STATS', func: 'MODIFY', target: 'self', stats: { atk: 1, def: 1, spAtk: 1, spDef: 1, speed: 1 } }
                            ]
                        }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能2: 天河圣芒斩
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'incalos_skill_2',
            name: '天河圣芒斩',
            type: 'attack',
            element: '光',
            category: 'physical',
            power: 150,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 100,
            desc: '物理攻击\n若对手处于异常状态则自身造成的攻击伤害额外提升50%；\n若对手不处于异常状态则造成的攻击伤害额外提升50%；\n造成的攻击伤害若高于280则自身免疫下1次受到的异常状态',
            
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
                // DAMAGE.ATTACK - 造成伤害 (无论如何都+50%)
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 150,
                    modifier: 1.5  // 无论对手有无异常都+50%
                },
                // 条件: 伤害>280则免疫下1次异常
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.lastDamage > 280,
                    onTrue: [
                        { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'status_immune', value: 1, flags: { immuneType: 'status' } }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能3: 无始源光
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'incalos_skill_3',
            name: '无始源光',
            type: 'buff',
            element: '光',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n技能使用成功时，全属性+1；\n2回合内每回合攻击+1、速度+1；\n4回合内每回合使用技能吸取对手最大体力的1/3，若自身体力低于最大体力的1/2则吸取效果翻倍；\n下2回合攻击必定先出手；下2回合自身造成的攻击伤害翻倍',
            
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
                // TURN.ADD - 2回合每回合攻击+1速度+1
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'source_light_buff',
                    turns: 2,
                    onTick: [
                        { system: 'STATS', func: 'MODIFY', target: 'self', stats: { atk: 1, speed: 1 } }
                    ]
                },
                // TURN.ADD - 4回合吸取效果
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'source_light_drain',
                    turns: 4,
                    onSkillUse: [
                        { system: 'HP', func: 'DRAIN_PERCENT', target: 'opponent', percent: 33, ofMax: true, modifier: (ctx) => ctx.self.hpPercent < 50 ? 2 : 1 }
                    ]
                },
                // PRIO.ADD - 2回合必先手
                {
                    system: 'PRIO',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    value: 99,
                    turns: 2,
                    skillType: 'attack'
                },
                // TURN.ADD - 2回合攻击伤害翻倍
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'source_light_damage',
                    turns: 2,
                    flags: { damageMultiplier: 2, skillType: 'attack' }
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能4: 光之惩戒
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'incalos_skill_4',
            name: '光之惩戒',
            type: 'buff',
            element: '光',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n4回合内免疫并反弹所有受到的异常状态；\n3回合内每回合使用技能则100%令对手失明，未触发则附加对手最大体力1/3的百分比伤害；\n3回合内自身受到攻击则使对手疲惫，未触发则吸取对手最大体力的1/3',
            
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
                // TURN.ADD - 3回合技能使用效果
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'punishment_skill',
                    turns: 3,
                    onSkillUse: [
                        { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'blind', turns: 2, chance: 100 }
                    ],
                    onTurnEndNoTrigger: [
                        { system: 'DAMAGE', func: 'PERCENT', target: 'opponent', percent: 33, ofMax: true }
                    ]
                },
                // TURN.ADD - 3回合受击效果
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'punishment_counter',
                    turns: 3,
                    onHit: [
                        { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'fatigue', turns: 2 }
                    ],
                    onTurnEndNoTrigger: [
                        { system: 'HP', func: 'DRAIN_PERCENT', target: 'opponent', percent: 33, ofMax: true }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能5: 璨星断刃
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'incalos_skill_5',
            name: '璨星断刃',
            type: 'attack',
            element: '光',
            category: 'physical',
            power: 85,
            pp: 20,
            maxPp: 20,
            priority: 3,
            accuracy: 100,
            flags: { ignoreAttackImmune: true },
            desc: '物理攻击 先制+3\n消除对手回合类效果，消除成功则令对手疲惫，未触发则吸取对手最大体力的1/3；\n无视攻击免疫效果；\n若自身为满体力则技能威力提升100%',
            
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
                // TURN.DISPEL - 消除对手回合效果
                {
                    system: 'TURN',
                    func: 'DISPEL',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    onSuccess: [
                        { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'fatigue', turns: 2 }
                    ],
                    onFail: [
                        { system: 'HP', func: 'DRAIN_PERCENT', target: 'opponent', percent: 33, ofMax: true }
                    ]
                },
                // DAMAGE.ATTACK - 造成伤害 (满血威力翻倍)
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 85,
                    modifier: (ctx) => ctx.self.hpPercent >= 100 ? 2 : 1,
                    flags: { ignoreAttackImmune: true }
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
