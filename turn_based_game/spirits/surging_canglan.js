(() => {
    const key = 'surgingCanglan';
    const data = {
        key,
        name: "怒涛·沧岚",
        asset: "assets/surging_canglan.png",
        maxHp: 950,
        soulMark: "滴",
        soulMarkDesc: "【魂印】滴\n1. 登场附加400护盾，有护盾时先制+1；\n2. 未受伤害则回合结束恢复250体力并固伤250，受伤害则免疫下1次攻击；\n3. 使用攻击技能伤害提升25%（最高100%）",
        resist: { fixed: 0, percent: 0, trueDmg: 0, statusImmune: { immolate: 0.7 } },

        /**
         * 魂印效果列表 (Point Form)
         */
        soulEffects: [
            {
                id: 'canglan_entry_shield',
                name: '水之护盾',
                desc: '登场附加400护盾',
                phase: 'ON_ENTRY',
                route: 'ShieldEffect.hp',
                value: 400,
                owner: 'self'
            },
            {
                id: 'canglan_shield_priority',
                name: '水之迅捷',
                desc: '有护盾时先制+1',
                phase: 'ON_CALCULATE_PRIORITY',
                condition: 'shieldHp > 0',
                route: 'PriorityEffect',
                value: 1,
                owner: 'self'
            },
            {
                id: 'canglan_no_damage_heal',
                name: '静水回流',
                desc: '未受攻击伤害则回合结束恢复250体力（不含固定/百分比伤害）',
                phase: 'ON_TURN_END',
                condition: '!tookAttackDamageThisTurn',  // 只检查攻击技能伤害
                route: 'HealEffect',
                value: 250,
                owner: 'self'
            },
            {
                id: 'canglan_no_damage_fixed',
                name: '静水反击',
                desc: '未受攻击伤害则回合结束固伤250（不含固定/百分比伤害）',
                phase: 'ON_TURN_END',
                condition: '!tookAttackDamageThisTurn',
                route: 'DamageEffect.fixed',
                value: 250,
                owner: 'opponent'
            },
            {
                id: 'canglan_damage_immunity',
                name: '水之庇护',
                desc: '受攻击伤害则免疫下1次伤害',
                phase: 'ON_TAKE_ATTACK_DAMAGE',        // 只在受到攻击伤害时触发
                route: 'CountEffect',                  // 有「次」先路由 CountEffect
                effectId: 'damageImmunity',
                count: 1,
                bindTo: 'BlockEffect.damageImmunity',  // 再绑定到 BlockEffect
                owner: 'self'
            },
            {
                id: 'canglan_damage_stack',
                name: '怒涛之力',
                desc: '使用攻击技能伤害提升25%（最高100%）',
                phase: 'ON_SELF_ATTACK_SKILL',
                route: 'CountEffect',
                effectId: 'damageStack',
                increment: 1,
                max: 4,
                damageBonus: 25,  // 每层25%
                owner: 'self'
            }
        ],

        skills: [
            {
                name: "王·洛水惊鸿", type: "ultimate", power: 160, pp: 5, maxPp: 5,
                desc: "第五技能\n必中；无视微弱和免疫；\n消除对手回合效果，成功则冰封，失败则免疫下1次异常；\n附加20%最大体力固伤",
                priority: 0,
                ignoreWeaken: true,
                ignoreImmunity: true,              // 标注：无视免疫攻击效果
                effects: [
                    { id: 3100, args: [], note: "无视微弱", route: "DamageEffect" },
                    { id: 3001, args: [], note: "无视免疫", route: "BlockEffect.ignoreImmunity" },
                    { id: 3002, args: [], note: "消除回合效果成功则冰封/免疫1次异常", route: "TurnEffect+StatusEffect" },
                    { id: 3003, args: [20], note: "附加20%最大体力固伤", route: "DamageEffect.percent" }
                ]
            },
            {
                name: "王·碧海潮生", type: "attack", power: 150, pp: 5, maxPp: 5,
                desc: "水系特攻\n必中；100%对手全属性-1；\n反转自身弱化，成功則4回合免弱",
                priority: 0,
                effects: [
                    { id: 3004, args: [], note: "100%对手全属性-1", route: "StatEffect" },
                    { id: 3005, args: [4], note: "反转弱化成功则4回合免弱", route: "StatEffect+TurnEffect", owner: "self" }
                ]
            },
            {
                name: "浮生若梦", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n必中；全属性+1(有护盾翻倍)；\n4回合免疫并反弹异常；\n下2回合对手受击伤害+100%；下2回合自身先制+2",
                priority: 0,
                effects: [
                    { id: 3006, args: [1], note: "全属性+1，有护盾翻倍", route: "StatEffect" },
                    { id: 191, args: [4], note: "4回合免疫并反弹异常", route: "TurnEffect", owner: "self" },
                    { id: 3007, args: [2], note: "2回合对手受击伤害+100%", route: "TurnEffect", owner: "opponent" },
                    { id: 843, args: [2, 2], note: "2回合先制+2", route: "TurnEffect", owner: "self" }
                ]
            },
            {
                name: "沧海永存", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n80%冰封，未觸發則下2回合攻擊100%束縛；\n恢復滿體力，體力<1/2則附加等量固傷",
                priority: 0,
                effects: [
                    { id: 3008, args: [80, 2], note: "80%冰封/2回合100%束缚", route: "StatusEffect+TurnEffect" },
                    { id: 3009, args: [], note: "恢复满体力，<1/2则等量固伤", route: "HealEffect+DamageEffect" }
                ]
            },
            {
                name: "上善若水", type: "attack", power: 85, pp: 20, maxPp: 20,
                desc: "水系特攻\n先制+3；反轉對手強化，成功則複製，失敗則消除；\n傷害<300則附加30%最大體力固傷",
                priority: 3,                       // 标注：先制+3
                effects: [
                    { id: 3010, args: [], note: "反转强化成功则复制/消除", route: "StatEffect" },
                    { id: 3011, args: [300, 30], note: "伤害<300则30%体力固伤", route: "DamageEffect.percent" }
                ]
            }
        ]
    };

    /**
     * 注册 TurnPhase 处理器
     */
    function registerPhases(timeline, game) {
        // === OPEN_TURN: 登场 ===
        timeline.on(TurnPhases.OPEN_TURN, (g, { actor }) => {
            if (!actor || actor.key !== key) return;
            
            // Point 1.1: 登场附加400护盾
            actor.buffs.shieldHp = (actor.buffs.shieldHp || 0) + 400;
            g.log(`【魂印·滴】${actor.name} 获得了400点护盾！`);
            
            // 初始化伤害叠加层数
            if (!actor.buffs.damageStack) {
                actor.buffs.damageStack = 0;
            }
        });

        // === TURN_START: 回合开始 ===
        timeline.on(TurnPhases.TURN_START, (g, { actor }) => {
            if (!actor || actor.key !== key) return;
            
            // 重置回合状态
            actor.buffs.tookDamageThisTurn = false;
            actor.buffs.tookAttackDamageThisTurn = false;  // 是否受到攻击技能伤害（不含fixed/percent）
        });

        // === CALCULATE_PRIORITY: 计算先制 ===
        timeline.on(TurnPhases.CALCULATE_PRIORITY, (g, { actor, priorityMod }) => {
            if (!actor || actor.key !== key) return;
            
            // Point 1.2: 有护盾时先制+1
            if (actor.buffs.shieldHp > 0) {
                priorityMod.bonus = (priorityMod.bonus || 0) + 1;
                g.log(`【魂印·滴】有护盾，先制+1`);
            }
        });

        // === ON_HIT: 受到伤害时 ===
        timeline.on(TurnPhases.ON_HIT, (g, { target, damage, skill, damageType }) => {
            if (!target || target.key !== key) return;
            if (damage <= 0) return;
            
            target.buffs.tookDamageThisTurn = true;
            
            // 判断是否为攻击技能伤害（不包括 fixed/percent）
            const isAttackDamage = skill && skill.type === 'attack' && damageType !== 'fixed' && damageType !== 'percent';
            if (isAttackDamage) {
                target.buffs.tookAttackDamageThisTurn = true;
            }
        });

        // === TURN_END: 回合结束 ===
        timeline.on(TurnPhases.TURN_END, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            
            // Point 2: 未受「攻击伤害」vs 受「攻击伤害」
            // 注意：只检查攻击技能伤害，不包括 fixed/percent damage
            if (!actor.buffs.tookAttackDamageThisTurn) {
                // Point 2.1: 未受攻击伤害 - 恢复250体力
                if (window.HealEffect?.heal) {
                    window.HealEffect.heal(g, actor, 250, '魂印·滴');
                } else {
                    g.heal(actor, 250, "魂印·滴");
                }
                
                // Point 2.2: 未受攻击伤害 - 固伤250
                if (window.DamageEffect?.fixed) {
                    window.DamageEffect.fixed(g, opponent, 250, '魂印·滴');
                } else {
                    opponent.hp = Math.max(0, opponent.hp - 250);
                    g.log(`【魂印·滴】${opponent.name} 受到了250点固定伤害！`);
                }
            } else {
                // Point 2.3: 受攻击伤害 - 通过 CountEffect 获得免疫下1次伤害
                if (window.CountEffect?.add) {
                    window.CountEffect.add(g, actor, 'damageImmunity', 1, {
                        desc: '免疫下1次伤害',
                        source: '魂印·滴',
                        onTrigger: (g, char) => {
                            // 免疫伤害逻辑由 BlockEffect 处理
                        }
                    });
                } else {
                    actor.buffs.damageImmunityCount = (actor.buffs.damageImmunityCount || 0) + 1;
                }
                g.log(`【魂印·滴】${actor.name} 获得免疫下1次伤害效果！`);
            }
        });

        // === AFTER_HIT: 使用攻击技能后 ===
        timeline.on(TurnPhases.AFTER_HIT, (g, { actor, skill }) => {
            if (!actor || actor.key !== key) return;
            if (!skill || skill.type === 'buff') return;
            
            // Point 3: 使用攻击技能伤害提升25%（最高100%）
            if (actor.buffs.damageStack < 4) {
                actor.buffs.damageStack = (actor.buffs.damageStack || 0) + 1;
                g.log(`【魂印·滴】怒涛之力层数+1，当前${actor.buffs.damageStack}层（伤害+${actor.buffs.damageStack * 25}%）`);
            }
        });

        // === ON_CALCULATE_DAMAGE: 伤害计算 ===
        timeline.on(TurnPhases.CALCULATE_DAMAGE, (g, { actor, damageMod }) => {
            if (!actor || actor.key !== key) return;
            
            // Point 3: 应用伤害加成
            const stacks = actor.buffs.damageStack || 0;
            if (stacks > 0) {
                damageMod.multiplier = (damageMod.multiplier || 1) * (1 + stacks * 0.25);
            }
        });

        // === GET_ICONS: 获取状态图标 ===
        timeline.on(TurnPhases.GET_ICONS, (g, { char, icons }) => {
            if (char.key !== key) return;
            
            if (char.buffs.shieldHp > 0) {
                icons.push({ val: char.buffs.shieldHp, type: 'shield', desc: `护盾：${char.buffs.shieldHp}` });
            }
            
            const stacks = char.buffs.damageStack || 0;
            if (stacks > 0) {
                icons.push({ val: stacks, type: 'count-effect', desc: `怒涛之力：伤害+${stacks * 25}%` });
            }
            
            if (char.buffs.damageImmunityCount > 0) {
                icons.push({ val: char.buffs.damageImmunityCount, type: 'count-effect', desc: '免疫伤害' });
            }
            if (char.buffs.attackImmunityCount > 0) {
                icons.push({ val: char.buffs.attackImmunityCount, type: 'count-effect', desc: '免疫攻击' });
            }
        });
    }

    registerSpirit(data, registerPhases);
})();
