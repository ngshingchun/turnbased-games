/**
 * 圣甲·盖亚 (Saint Mecha Gaia) - 精灵定义
 * 魂印: 狂 (拦截·恢复)
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
        key: 'saintMechaGaia',
        name: '圣甲·盖亚',
        element: '战',
        maxHp: 800,
        maxPp: 100,
        attack: 120,
        defense: 110,
        spAttack: 100,
        spDefense: 105,
        speed: 95,
        resist: { fixed: 0, percent: 0, trueDmg: 0 }
    };

    // =========================================================================
    // 魂印定义
    // =========================================================================
    /**
     * 【魂印】狂
     * [拦截效果]：受到致死技能伤害时于当回合结束后直接扣除对手等于其造成攻击伤害数值的体力
     *            （若双方同时死亡则自身恢复1点体力）（boss无效）；
     * [恢复效果]：自身出手起则每回合结束后恢复自身最大体力的1/3（boss有效）
     */
    const SOULBUFF = {
        name: '狂',
        desc: '【魂印】狂\n拦截致死伤害反馈给对手；双方同死时自身存活；出手后每回合恢复1/3体力',
        
        effects: [
            // ─────────────────────────────────────────────────────────────────
            // [出手标记] 激活恢复效果
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'mecha_gaia_acted',
                name: '狂之出手',
                trigger: NODE.AFTER_ATTACK,
                condition: (ctx) => ctx.self.key === 'saintMechaGaia',
                calls: [
                    { system: 'TEAM', func: 'FLAG', target: 'self', flag: 'hasActed', value: true }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [拦截效果] 记录致死伤害
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'mecha_gaia_intercept',
                name: '狂之拦截',
                trigger: NODE.ON_HIT_RECV,
                condition: (ctx) => ctx.self.key === 'saintMechaGaia' && ctx.skill?.type === 'attack' && !ctx.attacker?.isBoss && (ctx.self.hp - ctx.damage) <= 0,
                calls: [
                    { system: 'TEAM', func: 'FLAG', target: 'self', flag: 'interceptDamage', value: (ctx) => ctx.damage }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [恢复效果] 每回合恢复1/3体力
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'mecha_gaia_regen',
                name: '狂之回复',
                trigger: NODE.TURN_END,
                condition: (ctx) => ctx.self.key === 'saintMechaGaia' && ctx.self.flags?.hasActed && ctx.self.hp > 0,
                calls: [
                    { system: 'HP', func: 'HEAL_PERCENT', target: 'self', percent: 33, ofMax: true }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [拦截效果] 回合结束反馈伤害
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'mecha_gaia_intercept_apply',
                name: '狂之反击',
                trigger: NODE.TURN_END,
                condition: (ctx) => ctx.self.key === 'saintMechaGaia' && (ctx.self.flags?.interceptDamage || 0) > 0,
                calls: [
                    { 
                        system: 'DAMAGE', 
                        func: 'FIXED', 
                        target: 'opponent', 
                        value: (ctx) => ctx.self.flags?.interceptDamage || 0 
                    },
                    // 清除记录
                    { system: 'TEAM', func: 'FLAG', target: 'self', flag: 'interceptDamage', value: 0 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [不屈] 双方同死时存活
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'mecha_gaia_mutual_ko',
                name: '狂之不屈',
                trigger: NODE.DEATH_CHECK,
                condition: (ctx) => ctx.self.key === 'saintMechaGaia' && ctx.self.hp <= 0 && ctx.opponent.hp <= 0,
                calls: [
                    { system: 'HP', func: 'SET', target: 'self', value: 1 },
                    { system: 'FLAG', func: 'SET', key: 'survived', value: true }
                ]
            }
        ]
    };

    // =========================================================================
    // 技能定义
    // =========================================================================
    const SKILLS = [
        // ─────────────────────────────────────────────────────────────────────
        // 技能1: 破釜沉舟战 (第五技能)
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'mecha_gaia_skill_1',
            name: '破釜沉舟战',
            type: 'ultimate',
            element: '战',
            category: 'physical',
            power: 160,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 100,
            desc: '第五技能\n消除对手回合类效果，消除成功则攻击+2、速度+2；\n附加所造成伤害值40%的固定伤害',
            
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
                // TURN.DISPEL - 消除回合效果
                {
                    system: 'TURN',
                    func: 'DISPEL',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    onSuccess: [
                        { system: 'STATS', func: 'MODIFY', target: 'self', stats: { atk: 2, speed: 2 } }
                    ]
                },
                // DAMAGE.ATTACK - 造成伤害
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 160,
                    storeAs: 'mainDamage'
                },
                // DAMAGE.FIXED - 40%固伤
                {
                    system: 'DAMAGE',
                    func: 'FIXED',
                    node: NODE.AFTER_ATTACK,
                    target: 'opponent',
                    value: (ctx) => Math.floor((ctx.storedValues?.mainDamage || 0) * 0.4)
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能2: 霸威冠宇
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'mecha_gaia_skill_2',
            name: '霸威冠宇',
            type: 'buff',
            element: '战',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n技能使用成功时，攻击+1、防御+1、特攻+1、特防+1、速度+1、命中+1；\n3回合内若对手使用攻击技能则使用后令自身全属性+1；\n5回合内免疫并反弹所有受到的异常状态',
            
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
                // STATS.MODIFY - 全属性+1 (含命中)
                {
                    system: 'STATS',
                    func: 'MODIFY',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    stats: { atk: 1, def: 1, spAtk: 1, spDef: 1, speed: 1, accuracy: 1 }
                },
                // TURN.ADD - 3回合对手攻击后全属性+1
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'counter_stat_up',
                    turns: 3,
                    onOpponentAttack: [
                        { system: 'STATS', func: 'MODIFY', target: 'self', stats: { atk: 1, def: 1, spAtk: 1, spDef: 1, speed: 1 } }
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
        // 技能3: 圣甲气魄
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'mecha_gaia_skill_3',
            name: '圣甲气魄',
            type: 'buff',
            element: '战',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 100,
            desc: '属性攻击\n4回合内每回合都能附加150点固定伤害；\n2回合内令对手使用的属性技能无效；\n吸取对手200点体力，体力低于对手时吸取效果翻倍',
            
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
                // TURN.ADD - 4回合每回合150固伤
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'periodic_damage',
                    turns: 4,
                    onTurnEnd: [
                        { system: 'DAMAGE', func: 'FIXED', target: 'opponent', value: 150 }
                    ]
                },
                // TURN.ADD - 2回合对手属性技能无效
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    effectId: 'block_attribute',
                    turns: 2,
                    flags: { blockType: 'attribute' }
                },
                // HP.DRAIN - 吸取200体力 (低血翻倍)
                {
                    system: 'HP',
                    func: 'DRAIN',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    value: (ctx) => ctx.self.hp < ctx.opponent.hp ? 400 : 200
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能4: 天威凛怒拳
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'mecha_gaia_skill_4',
            name: '天威凛怒拳',
            type: 'attack',
            element: '战',
            category: 'physical',
            power: 150,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 100,
            desc: '物理攻击\n当回合击败对手则下回合开始后随机附加1种异常状态；\n若对手体力不足300则直接秒杀',
            
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
                // 条件: 体力<300秒杀
                {
                    system: 'BRANCH',
                    node: NODE.BEFORE_HIT,
                    condition: (ctx) => ctx.opponent.hp < 300,
                    onTrue: [
                        { system: 'DAMAGE', func: 'EXECUTE', target: 'opponent' }
                    ],
                    onFalse: [
                        // DAMAGE.ATTACK - 造成伤害
                        { system: 'DAMAGE', func: 'ATTACK', target: 'opponent', power: 150 }
                    ]
                },
                // 条件: 击败则下回合随机异常
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.opponent.hp <= 0,
                    onTrue: [
                        { system: 'TURN', func: 'ADD', target: 'self', effectId: 'random_status', turns: 1, 
                          onTurnStart: [
                              { system: 'STATUS', func: 'APPLY_RANDOM', target: 'opponent' }
                          ]
                        }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能5: 狂绝冲撞
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'mecha_gaia_skill_5',
            name: '狂绝冲撞',
            type: 'attack',
            element: '战',
            category: 'physical',
            power: 85,
            pp: 20,
            maxPp: 20,
            priority: 3,
            accuracy: 100,
            desc: '物理攻击 先制+3\n吸取对手能力提升，吸取成功减少对手1/3最大体力；\n下2回合自身造成的攻击伤害翻倍',
            
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
                // STATS.STEAL - 吸取强化
                {
                    system: 'STATS',
                    func: 'STEAL',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    onSuccess: [
                        // 减少对手1/3最大体力
                        { system: 'DAMAGE', func: 'PERCENT', target: 'opponent', percent: 33, ofMax: true }
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
                // TURN.ADD - 2回合攻击伤害翻倍
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.AFTER_ATTACK,
                    target: 'self',
                    effectId: 'damage_boost',
                    turns: 2,
                    flags: { damageMultiplier: 2.0 }
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