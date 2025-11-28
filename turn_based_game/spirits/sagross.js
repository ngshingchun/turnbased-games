/**
 * 圣王·萨格罗斯 (Saint King Sagross) - 精灵定义
 * 魂印: 寰 (PP操控·恢复触发)
 * 
 * 使用新架构: SYSTEM.SUBFUNC(nodes, handler)
 * 使用 SOULBUFF.STATE 管理魂印状态 (支持UI显示)
 * 所有技能包含 PP.USE 调用
 */
(() => {
    const NODE = window.TurnPhaseNode;

    // =========================================================================
    // 精灵基础数据
    // =========================================================================
    const SPIRIT = {
        key: 'saintKingSagross',
        name: '圣王·萨格罗斯',
        element: '光',
        maxHp: 850,
        maxPp: 100,
        attack: 120,
        defense: 105,
        spAttack: 120,
        spDefense: 105,
        speed: 105,
        resist: { fixed: 0, percent: 0, trueDmg: 0 }
    };

    // =========================================================================
    // 异常状态列表
    // =========================================================================
    const ABNORMAL_STATUSES = ['burn', 'immolate', 'poison', 'sleep', 'paralyze', 'freeze', 'fear', 'confuse', 'blind', 'exhaust'];

    // =========================================================================
    // 辅助函数
    // =========================================================================
    const hasStatUps = (char) => {
        if (!char.statModifiers) return false;
        return ['atk', 'def', 'spAtk', 'spDef', 'speed'].some(s => (char.statModifiers[s] || 0) > 0);
    };
    
    const countStatUps = (char) => {
        if (!char.statModifiers) return 0;
        return ['atk', 'def', 'spAtk', 'spDef', 'speed'].filter(s => (char.statModifiers[s] || 0) > 0).length;
    };

    // =========================================================================
    // 魂印定义
    // =========================================================================
    /**
     * 【魂印】寰
     * 我方每次使用属性技能则恢复自身所有PP一点，对手每次使用属性技能则使对手随机1个技能的PP值归零（BOSS无效）；
     * 每一次恢复体力，则下回合解除自身异常状态和能力下降状态，同时下2回合内免疫异常状态和能力下降状态且使用攻击技能50%的概率威力翻倍
     */
    const SOULBUFF = {
        name: '寰',
        desc: '【魂印】寰\n我方属性技能恢复PP；对手属性技能PP归零；恢复体力触发多种增益',
        
        effects: [
            // ─────────────────────────────────────────────────────────────────
            // [PP操控] 我方使用属性技能: 所有技能PP+1
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'sagross_ally_attr',
                name: '寰之佑',
                trigger: NODE.AFTER_SKILL,
                condition: (ctx) => ctx.self.key === 'saintKingSagross' && ctx.actor?.team === ctx.self.team && ctx.skill?.type === 'buff',
                calls: [
                    { system: 'PP', func: 'RESTORE_ALL', target: 'self', amount: 1 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [PP操控] 对手使用属性技能: 随机1技能PP归零
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'sagross_enemy_attr',
                name: '寰之罚',
                trigger: NODE.AFTER_SKILL,
                condition: (ctx) => ctx.self.key === 'saintKingSagross' && ctx.actor === ctx.opponent && ctx.skill?.type === 'buff' && !ctx.opponent.isBoss,
                calls: [
                    { system: 'PP', func: 'DEPLETE_RANDOM', target: 'opponent', count: 1 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [恢复触发] 恢复体力后标记
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'sagross_heal_mark',
                name: '寰之护',
                trigger: NODE.ON_HEAL,
                condition: (ctx) => ctx.self.key === 'saintKingSagross' && ctx.healAmount > 0,
                calls: [
                    { 
                        system: 'SOULBUFF', 
                        func: 'STATE.SET', 
                        target: 'self', 
                        key: 'healTriggered',
                        value: 1,
                        type: 'flag',
                        icon: '护',
                        desc: '寰之护: 下回合触发',
                        color: 'gold',
                        visible: true
                    }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [恢复触发] 回合开始处理效果
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'sagross_heal_process',
                name: '寰之护发动',
                trigger: NODE.TURN_START,
                condition: (ctx) => ctx.self.key === 'saintKingSagross' && window.SOULBUFF_STATE?.GET(ctx.self, 'healTriggered'),
                calls: [
                    // 清除标记
                    { system: 'SOULBUFF', func: 'STATE.CLEAR', target: 'self', key: 'healTriggered' },
                    // 解除异常状态
                    { system: 'STATUS', func: 'CLEAR_ABNORMAL', target: 'self' },
                    // 解除能力下降
                    { system: 'STATS', func: 'CLEAR_DOWNS', target: 'self' },
                    // 2回合免疫异常 (回合类状态)
                    { 
                        system: 'SOULBUFF', 
                        func: 'STATE.SET', 
                        target: 'self', 
                        key: 'immuneAbnormal',
                        value: 2,
                        type: 'turn',
                        turns: 2,
                        icon: '盾',
                        desc: '寰之盾: 免疫异常',
                        color: 'gold'
                    },
                    // 2回合免疫弱化
                    { 
                        system: 'SOULBUFF', 
                        func: 'STATE.SET', 
                        target: 'self', 
                        key: 'immuneStatDown',
                        value: 2,
                        type: 'turn',
                        turns: 2,
                        icon: '护',
                        desc: '寰之盾: 免疫弱化',
                        color: 'gold'
                    },
                    // 2回合攻击50%翻倍
                    { 
                        system: 'SOULBUFF', 
                        func: 'STATE.SET', 
                        target: 'self', 
                        key: 'powerDouble',
                        value: 2,
                        type: 'turn',
                        turns: 2,
                        icon: '力',
                        desc: '寰之力: 攻击50%翻倍',
                        color: 'red'
                    }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [寰之盾] 免疫异常状态
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'sagross_immune_abnormal',
                name: '寰之盾',
                trigger: NODE.BEFORE_STATUS,
                condition: (ctx) => ctx.self.key === 'saintKingSagross' && 
                    window.SOULBUFF_STATE?.GET(ctx.self, 'immuneAbnormal') > 0 &&
                    ABNORMAL_STATUSES.includes(ctx.status),
                calls: [
                    { system: 'BLOCK', func: 'NULLIFY' }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [寰之盾] 免疫能力下降
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'sagross_immune_stat_down',
                name: '寰之盾',
                trigger: NODE.BEFORE_STAT_CHANGE,
                condition: (ctx) => ctx.self.key === 'saintKingSagross' && 
                    window.SOULBUFF_STATE?.GET(ctx.self, 'immuneStatDown') > 0 &&
                    ctx.statChange < 0,
                calls: [
                    { system: 'BLOCK', func: 'NULLIFY' }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [寰之力] 攻击50%概率威力翻倍
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'sagross_power_double',
                name: '寰之力',
                trigger: NODE.DAMAGE_CALC,
                condition: (ctx) => ctx.self.key === 'saintKingSagross' && 
                    ctx.attacker === ctx.self &&
                    ctx.skill?.type === 'attack' &&
                    window.SOULBUFF_STATE?.GET(ctx.self, 'powerDouble') > 0 &&
                    Math.random() < 0.5,
                calls: [
                    { system: 'DAMAGE', func: 'MODIFY', multiplier: 2.0 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 回合结束: tick所有turn类状态
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'sagross_tick',
                name: '状态衰减',
                trigger: NODE.TURN_END,
                condition: (ctx) => ctx.self.key === 'saintKingSagross',
                calls: [
                    { system: 'SOULBUFF', func: 'STATE.TICK', target: 'self' }
                ]
            }
        ]
    };

    // =========================================================================
    // 技能定义
    // =========================================================================
    const SKILLS = [
        // ─────────────────────────────────────────────────────────────────────
        // 技能1: 裂世天寰杀 (第五技能)
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'sagross_skill_1',
            name: '裂世天寰杀',
            type: 'ultimate',
            element: '光',
            category: 'physical',
            power: 160,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 100,
            desc: '第五技能\n双方每处于1种能力提升状态则附加60点固定伤害；\n未击败对手则消除对手能力提升状态；\n若本回合击败对手则将对手的能力提升效果转移到自己身上',
            
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
                    power: 160
                },
                // DAMAGE.FIXED - 双方强化数x60固伤
                {
                    system: 'DAMAGE',
                    func: 'FIXED',
                    node: NODE.AFTER_ATTACK,
                    target: 'opponent',
                    value: (ctx) => (countStatUps(ctx.self) + countStatUps(ctx.opponent)) * 60
                },
                // 条件: 击败/未击败
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.opponent.hp <= 0,
                    onTrue: [
                        // 击败: 转移强化到自身
                        { system: 'STATS', func: 'TRANSFER', from: 'opponent', to: 'self', type: 'ups' }
                    ],
                    onFalse: [
                        // 未击败: 消除对手强化
                        { system: 'STATS', func: 'CLEAR_UPS', target: 'opponent' }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能2: 气逆乾坤决
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'sagross_skill_2',
            name: '气逆乾坤决',
            type: 'attack',
            element: '光',
            category: 'physical',
            power: 150,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 100,
            desc: '物理攻击\n反转对手能力提升状态，反转成功则己方免疫下1次受到的异常状态；\n随机附加2种异常状态',
            
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
                // STATS.REVERSE - 反转对手强化
                {
                    system: 'STATS',
                    func: 'REVERSE',
                    node: NODE.AFTER_ATTACK,
                    target: 'opponent',
                    onSuccess: [
                        // 反转成功: 1次异常免疫 (次数类状态)
                        { 
                            system: 'SOULBUFF', 
                            func: 'STATE.SET', 
                            target: 'self', 
                            key: 'statusImmune',
                            value: 1,
                            type: 'count',
                            count: 1,
                            icon: '免',
                            desc: '免疫1次异常',
                            color: 'blue'
                        }
                    ]
                },
                // STATUS.APPLY_RANDOM - 随机2种异常
                {
                    system: 'STATUS',
                    func: 'APPLY_RANDOM',
                    node: NODE.AFTER_ATTACK,
                    target: 'opponent',
                    count: 2
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能3: 众生恩赐
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'sagross_skill_3',
            name: '众生恩赐',
            type: 'buff',
            element: '光',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n令双方全属性+1；\n恢复自身最大体力的1/1；\n3回合内若自身能力提升状态消失，则消除对手回合类效果；\n下2回合令自身所有技能先制+2；\n下2回合自身攻击技能必定打出致命一击',
            
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
                // STATS.MODIFY - 双方全属性+1
                {
                    system: 'STATS',
                    func: 'MODIFY',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    stats: { atk: 1, def: 1, spAtk: 1, spDef: 1, speed: 1 }
                },
                {
                    system: 'STATS',
                    func: 'MODIFY',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
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
                // 3回合内强化消失触发效果
                {
                    system: 'SOULBUFF',
                    func: 'STATE.SET',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    key: 'buffLostTrigger',
                    value: 3,
                    type: 'turn',
                    turns: 3,
                    icon: '恩',
                    desc: '强化消失时消除对手回合效果',
                    color: 'gold'
                },
                // PRIO.ADD - 2回合先制+2
                {
                    system: 'PRIO',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    value: 2,
                    turns: 2
                },
                // 2回合必致命
                {
                    system: 'SOULBUFF',
                    func: 'STATE.SET',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    key: 'guaranteedCrit',
                    value: 2,
                    type: 'turn',
                    turns: 2,
                    icon: '暴',
                    desc: '必定致命一击',
                    color: 'red'
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能4: 秩序守恒
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'sagross_skill_4',
            name: '秩序守恒',
            type: 'buff',
            element: '光',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 100,
            desc: '属性攻击\n3回合内若对手使用属性技能，则使用属性技能后的下2回合攻击技能无法造成伤害且命中效果失效；\n3回合内70%的概率免疫对手攻击伤害，未触发则回合结束时附加120%伤害量的百分比伤害；\n吸取对手250点固定体力，每次使用额外附加100点，最高500点',
            
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
                // 3回合封锁对手属性技能后攻击
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    effectId: 'attr_punish',
                    turns: 3,
                    onBuffSkill: [
                        { system: 'TURN', func: 'ADD', target: 'self', effectId: 'attack_block', turns: 2, flags: { blockDamage: true, blockEffects: true } }
                    ]
                },
                // 3回合70%闪避+120%反击 (次数类状态)
                {
                    system: 'SOULBUFF',
                    func: 'STATE.SET',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    key: 'orderShield',
                    value: 3,
                    type: 'turn',
                    turns: 3,
                    icon: '序',
                    desc: '秩序守恒: 70%闪避',
                    color: 'blue'
                },
                // HP.DRAIN - 吸取体力 (累加机制)
                {
                    system: 'HP',
                    func: 'DRAIN',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    value: (ctx) => {
                        const useCount = window.SOULBUFF_STATE?.GET(ctx.self, 'orderDrainCount') || 0;
                        return Math.min(500, 250 + useCount * 100);
                    }
                },
                // 记录使用次数
                {
                    system: 'SOULBUFF',
                    func: 'STATE.ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    key: 'orderDrainCount',
                    amount: 1,
                    type: 'stack',
                    max: 3,
                    visible: false
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能5: 王之蔑视
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'sagross_skill_5',
            name: '王之蔑视',
            type: 'attack',
            element: '光',
            category: 'physical',
            power: 85,
            pp: 20,
            maxPp: 20,
            priority: 3,
            accuracy: 100,
            desc: '物理攻击 先制+3\n消除对手回合类效果，消除成功则令对手失明；\n附加150~250点固定伤害并恢复等量体力',
            
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
                        { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'blind', turns: 2, chance: 100 }
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
                // HP.DRAIN_FIXED - 吸取150~250固伤
                {
                    system: 'HP',
                    func: 'DRAIN_FIXED',
                    node: NODE.AFTER_ATTACK,
                    target: 'opponent',
                    value: () => 150 + Math.floor(Math.random() * 101)  // 150~250
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