(() => {
    const key = 'kingRay';
    const data = {
        key,
        name: "王·雷伊",
        asset: "assets/king_ray.png",
        maxHp: 800,
        soulMark: "雷",
        soulMarkDesc: "【魂印】雷\n每回合开始和结束时吸取对手能力提升状态；\n回合开始时对手所有回合类效果的回合数变为1回合；\n回合开始时若自身体力高于对手则战斗阶段结束时自身攻击+2，回合开始时若自身体力低于对手，则当回合自身回合类效果无法被消除（BOSS无效）",
        resist: { fixed: 0, percent: 0, trueDmg: 0 },

        /**
         * 魂印效果列表 (Point Form)
         */
        soulEffects: [
            // === 吸取强化 ===
            {
                id: 'ray_steal_start',
                name: '雷霆吸取',
                desc: '回合开始时吸取对手能力提升状态',
                phase: 'ON_TURN_START',
                route: 'StatEffect.steal',
                owner: 'self'
            },
            {
                id: 'ray_steal_end',
                name: '雷霆吸取',
                desc: '回合结束时吸取对手能力提升状态',
                phase: 'ON_TURN_END',
                route: 'StatEffect.steal',
                owner: 'self'
            },
            // === 回合效果压制 ===
            {
                id: 'ray_turn_suppress',
                name: '雷霆压制',
                desc: '回合开始时对手所有回合效果回合数变为1',
                phase: 'ON_TURN_START',
                route: 'TurnEffect.suppress',
                owner: 'opponent',
                bossInvalid: true
            },
            // === 体力判定效果 ===
            {
                id: 'ray_dominance_attack',
                name: '雷王威势',
                desc: '体力>对手时，战斗阶段结束自身攻击+2',
                phase: 'ON_TURN_START',
                condition: 'hp > opponent.hp',
                route: 'TurnEffect',
                effectId: 'ray_attack_boost',
                owner: 'self',
                bossInvalid: true
            },
            {
                id: 'ray_fortitude_protect',
                name: '雷王守护',
                desc: '体力<对手时，当回合回合效果无法被消除',
                phase: 'ON_TURN_START',
                condition: 'hp < opponent.hp',
                route: 'TurnEffect',
                effectId: 'ray_protect',
                owner: 'self',
                bossInvalid: true
            }
        ],

        skills: [
            {
                name: "王·万霆朝宗", type: "ultimate", power: 160, pp: 5, maxPp: 5,
                desc: "第五技能\n攻击时造成的伤害不会出现微弱（克制关系为微弱时都变成普通）；\n消除对手回合类效果，消除成功则下回合自身造成的攻击伤害额外提升100%；\n未击败对手则自身全属性+1；\n未击败对手则下回合自身所有技能先制+2",
                priority: 0,
                ignoreWeaken: true,
                effects: [
                    { id: 760, args: [], note: "无视微弱", route: "DamageEffect.noWeak" },
                    { id: 913, args: [], note: "消除回合效果成功则下回合伤害+100%", route: "TurnEffect.clear+DamageEffect", owner: "self" },
                    { id: 983, args: [], note: "未击败则全属性+1", route: "StatEffect", condition: "!ko" },
                    { id: 984, args: [2], note: "未击败则下回合先制+2", route: "TurnEffect+PriorityEffect", condition: "!ko", owner: "self" }
                ]
            },
            {
                name: "传承王意", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n全属性+1，若自身当前体力低于对手则强化效果翻倍；\n2回合内每回合使用技能恢复自身最大体力的1/1；\n5回合内免疫并反弹所有受到的异常状态",
                priority: 0,
                effects: [
                    { id: 946, args: [], note: "全属性+1(低血翻倍)", route: "StatEffect" },
                    { id: 57, args: [2], note: "2回合每回合使用技能满血恢复", route: "TurnEffect+HealEffect", owner: "self" },
                    { id: 191, args: [5], note: "5回合免疫反弹异常", route: "TurnEffect", owner: "self" }
                ]
            },
            {
                name: "万鸣齐闪", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n反转自身能力下降状态；\n直接造成260点电系伤害，自身每处于一种能力提升状态则造成的伤害提高10%",
                priority: 0,
                effects: [
                    { id: 521, args: [], note: "反转自身能力下降", route: "StatEffect.invert" },
                    { id: 981, args: [260, 10], note: "260固伤+每项强化+10%", route: "DamageEffect.fixed" }
                ]
            },
            {
                name: "金翼剑轮", type: "attack", power: 130, pp: 5, maxPp: 5,
                desc: "物理攻击\n免疫下1次受到的攻击",
                priority: 0,
                effects: [
                    { id: 570, args: [1], note: "免疫下1次攻击", route: "CountEffect+BlockEffect.attackImmunity", owner: "self" }
                ]
            },
            {
                name: "雷裂残阳", type: "attack", power: 85, pp: 20, maxPp: 20,
                desc: "物理攻击 先制+3\n先出手时对手当回合属性技能无效；\n若自身处于能力提升状态则造成的攻击伤害额外提升50%；\n给对手造成伤害时，伤害数值的100%恢复自身体力",
                priority: 3,
                effects: [
                    { id: 980, args: [], note: "先出手则对手属性技能无效", route: "BlockEffect.attribute", condition: "movedFirst", owner: "opponent" },
                    { id: 842, args: [50], note: "有强化时伤害+50%", route: "DamageEffect", condition: "hasStatUps" },
                    { id: 101, args: [100], note: "伤害100%吸血", route: "HealEffect.drain" }
                ]
            }
        ]
    };

    /**
     * 检查是否有能力提升
     */
    function hasStatUps(char) {
        if (!char.buffs.statUps) return false;
        return Object.values(char.buffs.statUps).some(v => v > 0);
    }

    /**
     * 吸取对手能力提升
     */
    function stealStats(g, self, opponent) {
        if (!opponent.buffs.statUps) return false;
        
        let stolen = false;
        const stats = ['atk', 'def', 'spa', 'spd', 'spe'];
        
        for (const stat of stats) {
            const val = opponent.buffs.statUps[stat] || 0;
            if (val > 0) {
                self.buffs.statUps = self.buffs.statUps || {};
                self.buffs.statUps[stat] = (self.buffs.statUps[stat] || 0) + val;
                opponent.buffs.statUps[stat] = 0;
                stolen = true;
            }
        }
        
        return stolen;
    }

    /**
     * 注册 TurnPhase 处理器
     */
    function registerPhases(timeline, game) {
        // === ENTRY: 登场 ===
        timeline.on(TurnPhases.ENTRY, (g, { actor }) => {
            if (!actor || actor.key !== key) return;
            
            // 初始化状态
            actor.buffs.rayAttackBoostTrigger = false;
            actor.buffs.rayProtectTurnEffects = false;
        });

        // === TURN_START: 回合开始 ===
        timeline.on(TurnPhases.TURN_START, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            
            // BOSS无效检查
            const isBoss = opponent.meta?.isBoss;
            
            // [吸取] 回合开始吸取对手能力提升
            if (stealStats(g, actor, opponent)) {
                g.log(`【魂印·雷】回合开始吸取了对手的能力提升！`);
                g.showFloatingText("雷霆吸取", actor === g.player);
            }
            
            // [压制] 对手所有回合效果回合数变为1
            if (!isBoss && opponent.buffs.turnEffects?.length > 0) {
                let suppressed = false;
                for (const e of opponent.buffs.turnEffects) {
                    if (e.turns > 1) {
                        e.turns = 1;
                        suppressed = true;
                    }
                }
                if (suppressed) {
                    g.log(`【魂印·雷】雷霆压制！对手回合效果回合数压缩为1！`);
                }
            }
            
            // [体力判定]
            if (!isBoss) {
                if (actor.hp > opponent.hp) {
                    // 体力高于对手：战斗阶段结束攻击+2
                    actor.buffs.rayAttackBoostTrigger = true;
                    g.log(`【魂印·雷】雷王威势！战斗阶段结束将攻击+2！`);
                } else if (actor.hp < opponent.hp) {
                    // 体力低于对手：当回合回合效果保护
                    actor.buffs.rayProtectTurnEffects = true;
                    g.log(`【魂印·雷】雷王守护！当回合回合效果无法被消除！`);
                }
            }
        });

        // === BEFORE_CLEAR_TURN_EFFECTS: 消除回合效果前（保护判定） ===
        timeline.on(TurnPhases.BEFORE_CLEAR_TURN_EFFECTS, (g, { target }) => {
            if (!target || target.key !== key) return;
            
            if (target.buffs.rayProtectTurnEffects) {
                g.log(`【魂印·雷】雷王守护生效！回合效果无法被消除！`);
                return { cancel: true };
            }
        });

        // === TURN_END: 回合结束 ===
        timeline.on(TurnPhases.TURN_END, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            
            // [吸取] 回合结束吸取对手能力提升
            if (stealStats(g, actor, opponent)) {
                g.log(`【魂印·雷】回合结束吸取了对手的能力提升！`);
            }
            
            // [攻击+2] 触发攻击加成
            if (actor.buffs.rayAttackBoostTrigger) {
                if (window.StatEffect?.modify) {
                    window.StatEffect.modify(g, actor, 'atk', 2, '魂印·雷');
                } else {
                    actor.buffs.statUps = actor.buffs.statUps || {};
                    actor.buffs.statUps.atk = (actor.buffs.statUps.atk || 0) + 2;
                    g.log(`【魂印·雷】雷王威势发动！攻击+2！`);
                }
                actor.buffs.rayAttackBoostTrigger = false;
            }
            
            // 重置保护状态
            actor.buffs.rayProtectTurnEffects = false;
        });

        // === GET_ICONS: 获取状态图标 ===
        timeline.on(TurnPhases.GET_ICONS, (g, { char, icons }) => {
            if (char.key !== key) return;
            
            if (char.buffs.rayAttackBoostTrigger) {
                icons.push({ val: '+2', type: 'soul-effect', desc: '魂印·雷: 雷王威势（战斗结束攻击+2）' });
            }
            if (char.buffs.rayProtectTurnEffects) {
                icons.push({ val: '护', type: 'soul-effect', desc: '魂印·雷: 雷王守护（回合效果保护）' });
            }
        });
    }

    registerSpirit(data, registerPhases);
})();
