/**
 * 混沌魔君索伦森 (Solensen) - 精灵定义
 * 魂印: 源 (免伤·弱化·封属)
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
        key: 'solensen',
        name: '混沌魔君索伦森',
        element: '混沌',
        maxHp: 1000,
        maxPp: 100,
        attack: 130,
        defense: 110,
        spAttack: 130,
        spDefense: 110,
        speed: 100,
        resist: { fixed: 0, percent: 0, trueDmg: 0 }
    };

    // =========================================================================
    // 辅助函数
    // =========================================================================
    
    // 检查是否有强化
    const hasStatUps = (char) => {
        if (!char.statModifiers) return false;
        return ['atk', 'def', 'spAtk', 'spDef', 'speed'].some(s => (char.statModifiers[s] || 0) > 0);
    };
    
    // 计算相同等级能力数量
    const countSameStats = (self, opponent) => {
        let count = 0;
        const stats = ['atk', 'def', 'spAtk', 'spDef', 'speed'];
        for (const stat of stats) {
            const selfMod = self.statModifiers?.[stat] || 0;
            const oppMod = opponent.statModifiers?.[stat] || 0;
            if (selfMod === oppMod) count++;
        }
        return count;
    };

    // =========================================================================
    // 魂印定义
    // =========================================================================
    /**
     * 【魂印】源（免伤·弱化·封属）
     * [登场] 消除对手能力提升，成功则2回合对手无法提升能力且下1次属性技能无效（BOSS无效）；
     * [干扰] 每回合开始至战斗阶段结束，若对手有高于自身的能力等级，则同步为与自身相同（BOSS无效）；
     * [触发] 回合开始若自身无强化：当回合受到攻击伤害减半且50%概率免疫攻击；
     *        战斗阶段结束若自身有强化：恢复1/3最大体力并造成等量百分比伤害（BOSS有效）
     */
    const SOULBUFF = {
        name: '源',
        desc: '【魂印】源\n登场消除强化封锁能力；同步对手过高能力；无强化减伤/有强化回血反击',
        
        effects: [
            // ─────────────────────────────────────────────────────────────────
            // [登场] 消除对手能力提升，成功则封锁
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'solensen_entry',
                name: '混沌登场',
                trigger: NODE.ENTRY,
                condition: (ctx) => ctx.self.key === 'solensen' && !ctx.opponent.isBoss,
                calls: [
                    // 消除对手强化
                    {
                        system: 'STATS',
                        func: 'CLEAR_UPS',
                        target: 'opponent',
                        onSuccess: [
                            // 2回合无法提升能力
                            { system: 'TURN', func: 'ADD', target: 'opponent', effectId: 'block_stat_up', turns: 2, flags: { blockType: 'stat_up' } },
                            // 下1次属性技能无效
                            { system: 'TEAM', func: 'COUNT', target: 'opponent', action: 'set', countId: 'block_attribute', value: 1 }
                        ]
                    }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [干扰] 回合开始同步能力等级
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'solensen_sync_start',
                name: '混沌同步',
                trigger: NODE.TURN_START,
                condition: (ctx) => ctx.self.key === 'solensen' && !ctx.opponent.isBoss,
                calls: [
                    { system: 'STATS', func: 'SYNC_DOWN', target: 'opponent', reference: 'self' }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [干扰] 回合结束同步能力等级
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'solensen_sync_end',
                name: '混沌同步',
                trigger: NODE.TURN_END,
                condition: (ctx) => ctx.self.key === 'solensen' && !ctx.opponent.isBoss,
                calls: [
                    { system: 'STATS', func: 'SYNC_DOWN', target: 'opponent', reference: 'self' }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [触发] 无强化时: 回合开始标记减伤/免疫
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'solensen_guard_flag',
                name: '混沌守护',
                trigger: NODE.TURN_START,
                condition: (ctx) => ctx.self.key === 'solensen' && !hasStatUps(ctx.self),
                calls: [
                    { system: 'TEAM', func: 'FLAG', target: 'self', flag: 'chaosGuard', value: true, turns: 1 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [触发] 无强化时: 50%免疫攻击
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'solensen_guard_immune',
                name: '混沌庇护',
                trigger: NODE.BEFORE_HIT_RECV,
                condition: (ctx) => ctx.self.key === 'solensen' && ctx.self.flags?.chaosGuard && ctx.skill?.type === 'attack' && Math.random() < 0.5,
                calls: [
                    { system: 'BLOCK', func: 'NULLIFY' }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [触发] 无强化时: 攻击伤害减半
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'solensen_guard_reduction',
                name: '混沌守护',
                trigger: NODE.ON_HIT_RECV,
                condition: (ctx) => ctx.self.key === 'solensen' && ctx.self.flags?.chaosGuard && ctx.skill?.type === 'attack',
                calls: [
                    { system: 'DAMAGE', func: 'MODIFY', multiplier: 0.5 }
                ]
            },

            // ─────────────────────────────────────────────────────────────────
            // [触发] 有强化时: 回合结束恢复+固伤
            // ─────────────────────────────────────────────────────────────────
            {
                id: 'solensen_buff_heal',
                name: '混沌吸收',
                trigger: NODE.TURN_END,
                condition: (ctx) => ctx.self.key === 'solensen' && hasStatUps(ctx.self),
                calls: [
                    // 恢复1/3最大体力并造成等量固伤
                    { system: 'HP', func: 'HEAL_AND_DAMAGE', target: 'self', damageTarget: 'opponent', percent: 33, ofMax: true }
                ]
            }
        ]
    };

    // =========================================================================
    // 技能定义
    // =========================================================================
    const SKILLS = [
        // ─────────────────────────────────────────────────────────────────────
        // 技能1: 烈火净世击
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'solensen_skill_1',
            name: '烈火净世击',
            type: 'attack',
            element: '混沌',
            category: 'special',
            power: 150,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '混沌特攻\n必中；对手无强化时伤害+100%；\n反转对手强化，成功則恢复所有体力及PP',
            
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
                // DAMAGE.ATTACK - 造成伤害 (无强化+100%)
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: (ctx) => hasStatUps(ctx.opponent) ? 150 : 300
                },
                // STATS.REVERSE - 反转强化
                {
                    system: 'STATS',
                    func: 'REVERSE',
                    node: NODE.AFTER_ATTACK,
                    target: 'opponent',
                    onSuccess: [
                        // 恢复满体力
                        { system: 'HP', func: 'SET', target: 'self', value: 'max' },
                        // 恢复满PP
                        { system: 'PP', func: 'RESTORE_ALL', target: 'self' }
                    ]
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能2: 混沌灭世决 (第五技能)
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'solensen_skill_2',
            name: '混沌灭世决',
            type: 'ultimate',
            element: '混沌',
            category: 'special',
            power: 160,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '第五技能\n必中；消除对手强化，成功則對手下2次攻击无效；\n未击败对手則下2回合先制+2；\n对手每有1项能力等级与自身相同則附加120点固伤',
            
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
                // STATS.CLEAR_UPS - 消除强化
                {
                    system: 'STATS',
                    func: 'CLEAR_UPS',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    onSuccess: [
                        // 对手下2次攻击无效
                        { system: 'TEAM', func: 'COUNT', target: 'opponent', action: 'set', countId: 'attack_block', value: 2 }
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
                // 条件: 未击败则先制+2
                {
                    system: 'BRANCH',
                    node: NODE.AFTER_ATTACK,
                    condition: (ctx) => ctx.opponent.hp > 0,
                    onTrue: [
                        { system: 'PRIO', func: 'ADD', target: 'self', value: 2, turns: 2 }
                    ]
                },
                // DAMAGE.FIXED - 能力同级固伤
                {
                    system: 'DAMAGE',
                    func: 'FIXED',
                    node: NODE.AFTER_ATTACK,
                    target: 'opponent',
                    value: (ctx) => countSameStats(ctx.self, ctx.opponent) * 120
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能3: 背弃圣灵
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'solensen_skill_3',
            name: '背弃圣灵',
            type: 'buff',
            element: '混沌',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 'must_hit',
            desc: '属性攻击\n全属性+1；恢复满体力并造成等量固伤；\n下2回合对手受击伤害+150%；下2回合自身先制+2',
            
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
                // HP.HEAL_AND_DAMAGE - 恢复满体力+等量固伤
                {
                    system: 'HP',
                    func: 'HEAL_AND_DAMAGE',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    damageTarget: 'opponent',
                    percent: 100,
                    ofMax: true
                },
                // TURN.ADD - 2回合对手受伤+150%
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    effectId: 'damage_amplify',
                    turns: 2,
                    flags: { damageReceivedMultiplier: 2.5 }  // +150% = x2.5
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
        // 技能4: 混沌魔域
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'solensen_skill_4',
            name: '混沌魔域',
            type: 'buff',
            element: '混沌',
            category: 'attribute',
            power: 0,
            pp: 5,
            maxPp: 5,
            priority: 0,
            accuracy: 100,
            desc: '属性攻击\n5回合免疫并反弹异常；\n100%害怕，未触发則吸取1/3最大体力；\n对手全属性-1，自身体力低于对手时翻倍',
            
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
                // TURN.ADD - 5回合免疫并反弹异常
                {
                    system: 'TURN',
                    func: 'ADD',
                    node: NODE.SKILL_EFFECT,
                    target: 'self',
                    effectId: 'status_reflect',
                    turns: 5,
                    flags: { immuneStatus: true, reflectStatus: true }
                },
                // STATUS.APPLY - 100%害怕
                {
                    system: 'STATUS',
                    func: 'APPLY',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    status: 'fear',
                    turns: 1,
                    chance: 100,
                    onFail: [
                        // 未触发则吸取1/3体力
                        { system: 'HP', func: 'DRAIN', target: 'opponent', percent: 33, ofMax: true }
                    ]
                },
                // STATS.MODIFY - 对手全属性-1 (低血翻倍)
                {
                    system: 'STATS',
                    func: 'MODIFY',
                    node: NODE.SKILL_EFFECT,
                    target: 'opponent',
                    stats: (ctx) => {
                        const amount = ctx.self.hp < ctx.opponent.hp ? -2 : -1;
                        return { atk: amount, def: amount, spAtk: amount, spDef: amount, speed: amount };
                    }
                }
            ]
        },

        // ─────────────────────────────────────────────────────────────────────
        // 技能5: 诸雄之主
        // ─────────────────────────────────────────────────────────────────────
        {
            id: 'solensen_skill_5',
            name: '诸雄之主',
            type: 'attack',
            element: '混沌',
            category: 'special',
            power: 85,
            pp: 20,
            maxPp: 20,
            priority: 3,
            accuracy: 100,
            desc: '混沌特攻\n先制+3；消除对手回合效果，成功則免疫下2次异常；\n30%几率3倍伤害，自身强化时概率翻倍',
            
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
                        // 2次异常免疫
                        { system: 'TEAM', func: 'COUNT', target: 'self', action: 'set', countId: 'status_immune', value: 2 }
                    ]
                },
                // DAMAGE.ATTACK - 造成伤害 (30%/60%三倍)
                {
                    system: 'DAMAGE',
                    func: 'ATTACK',
                    node: NODE.DEAL_DAMAGE,
                    target: 'opponent',
                    power: (ctx) => {
                        const chance = hasStatUps(ctx.self) ? 0.6 : 0.3;
                        return Math.random() < chance ? 255 : 85;  // 3倍 = 255
                    }
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