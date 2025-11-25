(() => {
    const key = 'rebirthWings';
    const data = {
        key,
        name: "重生之翼",
        asset: "assets/rebirth_wings.png",
        maxHp: 800,
        soulMark: "神",
        soulMarkDesc: "【魂印】神\n自身被击败后100%随机复活出战背包内已被击败的1只精灵（无法复活重生之翼，boss有效）；\n[神耀能量]:\n自身可以储存最多6层神耀能量,神耀能量的层数越多,获得的效果越多:\n1层:减少自身受到伤害的8%,每增加1层额外获得8%的减伤\n2层:免疫所有异常状态、免疫所有能力下降状态\n3层:自身出手起则每回合结束后恢复自身最大体力的1/3\n4层:免疫并反弹自身受到的固定伤害\n5层:所有攻击技能先制额外+1\n6层：自身所有攻击技能伤害提升60%且第五技能威力提升不再消耗自身神耀能量；\n赛尔对战中击败对手后自身神耀能量清零且下回合先制额外+3",
        resist: { fixed: 0, percent: 0, trueDmg: 0 },

        /**
         * 魂印效果列表 (Point Form)
         */
        soulEffects: [
            // === [死亡] 复活效果 ===
            {
                id: 'rebirth_revive',
                name: '重生之力',
                desc: '被击败后100%随机复活已被击败的1只精灵',
                phase: 'ON_DEATH',
                route: 'SoulEffect.reviveAlly',
                excludeSelf: true,                 // 无法复活自身
                chance: 100,
                owner: 'self'
            },
            // === [神耀能量] 层级效果 ===
            {
                id: 'rebirth_glory_1',
                name: '神耀·减伤',
                desc: '每层神耀能量减少8%受到伤害',
                phase: 'ON_HIT',
                condition: 'godlyGloryEnergy >= 1',
                route: 'DamageEffect.reduction',
                value: 8,                          // 每层8%
                scaling: 'godlyGloryEnergy',       // 按层数叠加
                owner: 'self'
            },
            {
                id: 'rebirth_glory_2',
                name: '神耀·免疫',
                desc: '2层以上免疫异常状态与能力下降',
                phase: 'PASSIVE',
                condition: 'godlyGloryEnergy >= 2',
                route: 'ImmuneEffect',
                immuneType: ['abnormal', 'stat_down'],
                owner: 'self'
            },
            {
                id: 'rebirth_glory_3',
                name: '神耀·回复',
                desc: '3层以上每回合结束恢复1/3最大体力',
                phase: 'ON_TURN_END',
                condition: 'godlyGloryEnergy >= 3',
                route: 'HealEffect',
                healType: 'max_percent',
                value: 33,                         // 1/3 ≈ 33%
                owner: 'self'
            },
            {
                id: 'rebirth_glory_4',
                name: '神耀·反弹',
                desc: '4层以上免疫并反弹固定伤害',
                phase: 'ON_BEFORE_HIT',
                condition: 'godlyGloryEnergy >= 4',
                route: 'ReflectEffect+ImmuneEffect',
                immuneType: 'fixed_damage',
                reflectType: 'fixed_damage',
                owner: 'self'
            },
            {
                id: 'rebirth_glory_5',
                name: '神耀·先制',
                desc: '5层以上攻击技能先制+1',
                phase: 'ON_CALCULATE_PRIORITY',
                condition: 'godlyGloryEnergy >= 5',
                route: 'PriorityEffect',
                value: 1,
                skillType: 'attack',
                owner: 'self'
            },
            {
                id: 'rebirth_glory_6',
                name: '神耀·强攻',
                desc: '6层时攻击伤害+60%且第五技能不消耗能量',
                phase: 'ON_CALCULATE_DAMAGE',
                condition: 'godlyGloryEnergy >= 6',
                route: 'DamageEffect.increase',
                value: 60,
                skillType: 'attack',
                owner: 'self'
            },
            // === [击败] 清零先制 ===
            {
                id: 'rebirth_ko_reset',
                name: '神耀·清算',
                desc: '击败对手后神耀能量清零且下回合先制+3',
                phase: 'ON_KO',
                route: 'CountEffect+PriorityEffect',
                resetEnergy: true,
                priorityBonus: 3,
                priorityTurns: 1,
                owner: 'self'
            }
        ],

        skills: [
            {
                name: "正义天启歌", type: "ultimate", power: 170, pp: 5, maxPp: 5,
                desc: "第五技能\n消耗自身所有神耀能量，每消耗1层此技能威力提升50；\n无视伤害限制效果；\n后出手则下1回合令对手使用的攻击技能无效",
                priority: 0,
                effects: [
                    { id: 862, args: [], note: "消耗神耀，每层+50威力", route: "DamageEffect.scaling", scaling: "godlyGloryEnergy" },
                    { id: 697, args: [], note: "无视伤害限制", route: "DamageEffect.ignoreCap" },
                    { id: 863, args: [], note: "后出手则1回合对手攻击无效", route: "BlockEffect.attackImmunity", condition: "movedLast" }
                ]
            },
            {
                name: "无上天命剑", type: "attack", power: 150, pp: 5, maxPp: 5,
                desc: "物理攻击\n无视攻击免疫效果；\n本回合未击败对手则下1回合反弹受到伤害的1/2；\n击败对手则获得2层神耀能量；\n附加对手上次造成伤害数值的固定伤害",
                priority: 0,
                effects: [
                    { id: 699, args: [], note: "无视攻击免疫", route: "DamageEffect.ignoreImmunity" },
                    { id: 864, args: [], note: "未击败则1回合反弹50%伤害", route: "ReflectEffect", condition: "!ko" },
                    { id: 865, args: [2], note: "击败则+2层神耀", route: "CountEffect", condition: "ko" },
                    { id: 807, args: [], note: "附加对手上次伤害的固伤", route: "DamageEffect.fixed", value: "lastDamageDealt" }
                ]
            },
            {
                name: "黎羽幻生", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n技能使用成功时，全属性+1；\n恢复自身最大体力的1/1；\n获得2层神耀能量；\n下2回合自身攻击技能必定打出致命一击",
                priority: 0,
                effects: [
                    { id: 585, args: [1], note: "全属性+1", route: "StatEffect" },
                    { id: 43, args: [], note: "恢复满体力", route: "HealEffect", healType: "full" },
                    { id: 860, args: [2], note: "+2层神耀能量", route: "CountEffect" },
                    { id: 58, args: [2], note: "2回合必致命", route: "TurnEffect+CritEffect", owner: "self" }
                ]
            },
            {
                name: "挚金命轮", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n100%令对手全属性-1；\n4回合内若对手使用属性技能则令对手所有技能降低2点PP值；\n命中后70%令对手失明",
                priority: 0,
                effects: [
                    { id: 749, args: [1], note: "对手全属性-1", route: "StatEffect", owner: "opponent" },
                    { id: 861, args: [4, 2], note: "4回合对手属性技能降2PP", route: "TurnEffect", owner: "opponent" },
                    { id: 756, args: [70], note: "70%失明", route: "StatusEffect" }
                ]
            },
            {
                name: "银雾之翼", type: "attack", power: 85, pp: 20, maxPp: 20, crit: "10/16",
                desc: "物理攻击 先制+3\n消除对手回合类效果，消除成功使对手下回合先制-2；\n消除对手能力提升状态，消除成功则令对手下回合所有技能先制-2；\n若打出致命一击则获得2层神耀能量, 否则获得1层",
                priority: 3,                       // 标注：先制+3
                effects: [
                    { id: 867, args: [], note: "消除回合效果成功则先制-2", route: "TurnEffect.clear+PriorityEffect", owner: "opponent" },
                    { id: 868, args: [], note: "消除强化成功则先制-2", route: "StatEffect.clear+PriorityEffect", owner: "opponent" },
                    { id: 866, args: [], note: "致命+2层神耀/否则+1层", route: "CountEffect+CritEffect" }
                ]
            }
        ]
    };

    /**
     * 注册 TurnPhase 处理器
     */
    function registerPhases(timeline, game) {
        // === ENTRY: 登场 ===
        timeline.on(TurnPhases.ENTRY, (g, { actor }) => {
            if (!actor || actor.key !== key) return;
            
            // 初始化神耀能量
            actor.buffs.godlyGloryEnergy = actor.buffs.godlyGloryEnergy || 0;
            actor.buffs.rebirthWingsResetPriority = 0;
        });

        // === CALCULATE_PRIORITY: 先制计算 ===
        timeline.on(TurnPhases.CALCULATE_PRIORITY, (g, { char, skill, priorityMod }) => {
            if (!char || char.key !== key) return;
            
            // 神耀5层：攻击技能先制+1
            if (char.buffs.godlyGloryEnergy >= 5 && skill?.type === 'attack') {
                priorityMod.bonus = (priorityMod.bonus || 0) + 1;
            }
            
            // 击败后下回合先制+3
            if (char.buffs.rebirthWingsResetPriority > 0) {
                priorityMod.bonus = (priorityMod.bonus || 0) + 3;
            }
        });

        // === ON_HIT: 受击减伤（神耀） ===
        timeline.on(TurnPhases.ON_HIT, (g, { target, damageMod }) => {
            if (!target || target.key !== key) return;
            
            // 神耀减伤：每层8%
            const energy = target.buffs.godlyGloryEnergy || 0;
            if (energy >= 1) {
                const reduction = energy * 8;
                damageMod.multiplier = (damageMod.multiplier || 1) * (1 - reduction / 100);
                g.log(`【魂印·神】神耀能量${energy}层，减伤${reduction}%！`);
            }
        });

        // === ON_BEFORE_HIT: 固伤反弹（神耀4层） ===
        timeline.on(TurnPhases.BEFORE_HIT, (g, { target, attacker, damageType, damage }) => {
            if (!target || target.key !== key) return;
            if (target.buffs.godlyGloryEnergy < 4) return;
            
            // 固伤反弹
            if (damageType === 'fixed') {
                g.log(`【魂印·神】神耀护盾反弹固定伤害 ${damage}！`);
                attacker.hp = Math.max(0, attacker.hp - damage);
                return { cancel: true, nullified: true, reflected: true };
            }
        });

        // === CALCULATE_DAMAGE: 伤害增幅（神耀6层） ===
        timeline.on(TurnPhases.CALCULATE_DAMAGE, (g, { attacker, skill, damageMod }) => {
            if (!attacker || attacker.key !== key) return;
            if (!skill || skill.type === 'buff') return;
            
            // 神耀6层：攻击伤害+60%
            if (attacker.buffs.godlyGloryEnergy >= 6) {
                damageMod.multiplier = (damageMod.multiplier || 1) * 1.6;
                g.log(`【魂印·神】神耀满层！攻击伤害+60%！`);
            }
        });

        // === TURN_END: 回合结束 ===
        timeline.on(TurnPhases.TURN_END, (g, { actor }) => {
            if (!actor || actor.key !== key) return;
            
            // 神耀3层：恢复1/3最大体力
            if (actor.buffs.godlyGloryEnergy >= 3) {
                const healAmt = Math.floor(actor.maxHp / 3);
                if (window.HealEffect?.heal) {
                    window.HealEffect.heal(g, actor, healAmt, '神耀能量');
                } else {
                    g.heal(actor, healAmt, "神耀能量");
                }
            }
            
            // 递减击败先制
            if (actor.buffs.rebirthWingsResetPriority > 0) {
                actor.buffs.rebirthWingsResetPriority--;
            }
        });

        // === ON_KO: 击败对手 ===
        timeline.on(TurnPhases.ON_KO, (g, { attacker, target }) => {
            if (!attacker || attacker.key !== key) return;
            
            // 击败：神耀清零 + 下回合先制+3
            g.log(`【魂印·神】击败对手！神耀能量清零，下回合先制+3！`);
            attacker.buffs.godlyGloryEnergy = 0;
            attacker.buffs.rebirthWingsResetPriority = 1;
            g.showFloatingText("神耀清算", true);
        });

        // === ON_DEATH: 自身被击败（复活） ===
        timeline.on(TurnPhases.ON_DEATH, (g, { char, isPlayer }) => {
            if (!char || char.key !== key) return;
            
            // 尝试复活队友
            const team = isPlayer ? g.playerTeam : g.enemyTeam;
            const deadAllies = team?.filter(c => c.hp <= 0 && c.key !== key) || [];
            
            if (deadAllies.length > 0) {
                const toRevive = deadAllies[Math.floor(Math.random() * deadAllies.length)];
                toRevive.hp = Math.floor(toRevive.maxHp * 0.5);  // 复活50%血量
                g.log(`【魂印·神】重生之力发动！${toRevive.name} 被复活！`);
                g.showFloatingText("重生之力", isPlayer);
            }
        });

        // === GET_ICONS: 获取状态图标 ===
        timeline.on(TurnPhases.GET_ICONS, (g, { char, icons }) => {
            if (char.key !== key) return;
            
            const energy = char.buffs.godlyGloryEnergy || 0;
            if (energy > 0) {
                icons.push({ val: energy, type: 'soul-effect', desc: `魂印·神: 神耀能量${energy}层` });
            }
            if (char.buffs.rebirthWingsResetPriority > 0) {
                icons.push({ val: '+3', type: 'priority', desc: '魂印·神: 击败先制加成' });
            }
        });
    }

    registerSpirit(data, registerPhases);
})();
