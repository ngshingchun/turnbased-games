/**
 * 王·盖亚 (King Gaia) - 精灵定义
 * 魂印: 盖
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
        key: 'kingGaia',
        name: '王·盖亚',
        element: '战',
        maxHp: 850,
        maxPp: 100,
        attack: 140,
        defense: 120,
        spAttack: 80,
        spDefense: 100,
        speed: 90,
        resist: { fixed: 0, percent: 0, trueDmg: 0 }
    };

    // =========================================================================
    // 魂印定义
    // =========================================================================
    /**
     * 【魂印】盖
     * 自身处于异常状态时，对手每回合2项属性-1且造成的伤害减少50%
     * 每回合恢复自身已损失体力的30%
     * 攻击有自身已损失体力百分比的几率威力翻倍（BOSS无效）
     */
    const SOULBUFF = {
        name: '盖',
        desc: '【魂印】盖\n自身处于异常状态时，对手每回合2项属性-1且造成的伤害减少50%\n每回合恢复自身已损失体力的30%\n攻击有自身已损失体力百分比的几率威力翻倍（BOSS无效）',
        
        effects: [
            // ─────────────────────────────────────────────────────────────────
            // 回合结束恢复
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'gaia_regen',
                name: '战王恢复',
                trigger: NODE.TURN_END,
                condition: (ctx) => ctx.self.key === 'kingGaia' && ctx.self.hp > 0,
                calls: [
                    // HP.HEAL - 恢复已损失体力的30%
                    { system: 'HP', func: 'HEAL', target: 'self', valueType: 'lost_percent', value: 30 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 异常时对手弱化
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'gaia_weaken_opponent',
                name: '王之威慑',
                trigger: NODE.TURN_END,
                condition: (ctx) => ctx.self.key === 'kingGaia' && ctx.self.hasAnyStatus(),
                calls: [
                    // STATS.RANDOM_MODIFY - 对手2项属性-1
                    { system: 'STATS', func: 'RANDOM_MODIFY', target: 'opponent', count: 2, value: -1 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 异常时对手伤害减半
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'gaia_damage_reduction',
                name: '王之防御',
                trigger: [NODE.FIRST_BEFORE_DAMAGE, NODE.SECOND_BEFORE_DAMAGE],
                condition: (ctx) => {
                    const gaia = ctx.self?.key === 'kingGaia' ? ctx.self : ctx.opponent;
                    return gaia?.key === 'kingGaia' && gaia.hasAnyStatus() && ctx.target?.key === 'kingGaia';
                },
                calls: [
                    // DAMAGE.MODIFY - 受到伤害-50%
                    { system: 'DAMAGE', func: 'MODIFY', multiplier: 0.5 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // 攻击时威力翻倍几率
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'gaia_power_double',
                name: '战王之力',
                trigger: [NODE.FIRST_BEFORE_DAMAGE, NODE.SECOND_BEFORE_DAMAGE],
                condition: (ctx) => ctx.self?.key === 'kingGaia' && !ctx.opponent?.flags?.isBoss,
                calls: [
                    {
                        system: 'BRANCH',
                        condition: (ctx) => {
                            const lostPercent = (ctx.self.maxHp - ctx.self.hp) / ctx.self.maxHp;
                            return Math.random() < lostPercent;
                        },
                        onTrue: [
                            // DAMAGE.MODIFY - 威力翻倍
                            { system: 'DAMAGE', func: 'MODIFY', multiplier: 2 }
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
        // 技能1: 战霸天下
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'gaia_skill_1',
            name: '战霸天下',
            type: 'buff',
            element: '战',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n4回合内免疫并反弹异常状态；\n5回合内免疫能力下降；\n将下次受到的伤害200%反馈给对手',
            
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
                // TURN.ADD - 5回合免疫能力下降
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'stat_down_immune',
                    turns: 5,
                    flags: { immuneStatDown: true }
                },
                // TEAM.COUNT - 下1次伤害200%反馈
                {
                    system: 'TEAM',
                    func: 'COUNT',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    action: 'set',
                    countId: 'damage_reflect',
                    value: 1,
                    onTrigger: [
                        { system: 'DAMAGE', func: 'REFLECT', target: 'opponent', percent: 200, source: 'lastDamageReceived' }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能2: 不败之境
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'gaia_skill_2',
            name: '不败之境',
            type: 'buff',
            element: '战',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n全属性+1，自身体力高于1/2时强化效果翻倍；\n4回合内每回合吸取对手最大体力的1/3；\n下2回合先制+2',
            
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
                // STATS.MODIFY - 全属性+1 (高血翻倍)
                {
                    system: 'STATS',
                    func: 'MODIFY',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    stats: { atk: 1, def: 1, spAtk: 1, spDef: 1, speed: 1 },
                    modifier: (ctx) => ctx.self.hpPercent > 50 ? 2 : 1
                },
                // TURN.ADD - 4回合吸取效果
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'invincible_drain',
                    turns: 4,
                    onTick: [
                        // HP.DRAIN_PERCENT - 吸取1/3最大体力
                        { system: 'HP', func: 'DRAIN_PERCENT', target: 'opponent', percent: 33, ofMax: true }
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
        // 技能3: 天诛乱舞
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'gaia_skill_3',
            name: '天诛乱舞',
            type: 'attack',
            element: '战',
            category: 'physical',
            power: 130,
            pp: 10,
            maxPp: 10,
            priority: 0,
            accuracy: 'must_hit',
            desc: '战斗物攻\n必中；\n反转自身能力下降；\n反转成功则对方害怕',
            
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
                    target: 'self',
                    onSuccess: [
                        // STATUS.APPLY - 成功则对手害怕
                        { system: 'STATUS', func: 'APPLY', target: 'opponent', status: 'fear', turns: 2 }
                    ]
                },
                // DAMAGE.ATTACK - 造成伤害
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: 130
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能4: 天威力破
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'gaia_skill_4',
            name: '天威力破',
            type: 'attack',
            element: '战',
            category: 'physical',
            power: 85,
            pp: 20,
            maxPp: 20,
            priority: 3,
            accuracy: 100,
            desc: '战斗物攻\n先制+3；\n消除对手回合类效果，成功则免疫下次异常；\n伤害<280则2回合必致命',
            
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
                    power: 85
                },
                // BRANCH - 伤害<280则必致命
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.lastDamage < 280,
                    onTrue: [
                        // TURN.ADD - 2回合必致命
                        { system: 'TURN', func: 'ADD', target: 'self', effectId: 'guaranteed_crit', turns: 2, flags: { guaranteedCrit: true } }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能5: 王·圣勇战意 (第五技能)
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'gaia_skill_5',
            name: '王·圣勇战意',
            type: 'ultimate',
            element: '战',
            category: 'physical',
            power: 160,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            flags: { ignoreWeaken: true },
            desc: '第五技能\n必中；无视微弱；\n吸取对手能力提升，成功则吸取300体力；\n对手有强化则先制+2',
            
            // 动态先制
            getPriority: (ctx) => ctx.opponent?.hasStatUp() ? 2 : 0,
            
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
                // STATS.STEAL - 吸取对手能力提升
                {
                    system: 'STATS',
                    func: 'STEAL',
                    node: NODE.SKILL_EFFECT,
                    from: 'opponent',
                    to: 'self',
                    onSuccess: [
                        // HP.DRAIN - 成功则吸取300体力
                        { system: 'HP', func: 'DRAIN', target: 'opponent', value: 300 }
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
