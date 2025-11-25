(() => {
    const key = 'lightPunishmentIncalos';
    const data = {
        key,
        name: "光之惩戒·英卡洛斯",
        asset: "assets/light_punishment_incalos.png",
        maxHp: 880,
        soulMark: "光",
        soulMarkDesc: "【魂印】光\n自身所有技能先制+1，免疫所有能力下降状态，攻击技能伤害计算时克制倍数至少为2；\n自身使用攻击技能则出手流程结束时，若本次攻击造成的伤害高于280则附加对手最大体力1/3的百分比伤害且令对手下回合使用的属性技能无效，若本次攻击造成的伤害低于280则吸取对手最大体力的1/3且令自身下回合攻击技能必定打出致命一击；\n自身首次死亡时有100%的概率得到1次圣光祝福：当回合残留1点体力，同时战斗阶段结束时解除自身异常状态且令自身下3次攻击技能造成的伤害提升150%（boss无效）",
        resist: { fixed: 0, percent: 0, trueDmg: 0 },

        /**
         * 魂印效果列表 (Point Form)
         * 每个效果标注：触发时机、路由目标、绑定方
         */
        soulEffects: [
            // === [被动] 先制+1 ===
            {
                id: 'incalos_priority',
                name: '光之敏捷',
                desc: '所有技能先制+1',
                phase: 'ON_CALCULATE_PRIORITY',
                route: 'PriorityEffect',
                value: 1,
                owner: 'self'
            },
            // === [被动] 免疫能力下降 ===
            {
                id: 'incalos_immune_stat_down',
                name: '光之护盾',
                desc: '免疫所有能力下降状态',
                phase: 'PASSIVE',
                route: 'ImmuneEffect',
                immuneType: 'stat_down',
                owner: 'self'
            },
            // === [被动] 克制倍数至少为2 ===
            {
                id: 'incalos_super_effective',
                name: '光之克制',
                desc: '攻击技能克制倍数至少为2',
                phase: 'ON_CALCULATE_DAMAGE',
                route: 'DamageEffect.minEffective',
                value: 2,                          // 最低2倍克制
                skillType: 'attack',
                owner: 'self'
            },
            // === [攻击后] 高伤判定 ===
            {
                id: 'incalos_high_damage',
                name: '光之惩戒·强',
                desc: '伤害>280则附加1/3百分比伤害并封属1回合',
                phase: 'ON_AFTER_HIT',
                condition: 'damageDealt > 280',
                route: 'DamageEffect.percent+BlockEffect.attribute',
                damageValue: 33,                   // 1/3 ≈ 33%
                blockTurns: 1,
                owner: 'opponent'
            },
            {
                id: 'incalos_low_damage',
                name: '光之惩戒·弱',
                desc: '伤害<=280则吸取1/3体力并下回合必致命',
                phase: 'ON_AFTER_HIT',
                condition: 'damageDealt <= 280',
                route: 'HealEffect.drain+CritEffect',
                drainValue: 33,                    // 1/3 ≈ 33%
                critTurns: 1,
                owner: 'self'
            },
            // === [致命] 圣光祝福 ===
            {
                id: 'incalos_blessing_survive',
                name: '圣光祝福·生',
                desc: '首次死亡时残留1点体力',
                phase: 'ON_FATAL_DAMAGE',
                route: 'ShieldEffect.fatalSurvive',
                once: true,                        // 每场1次
                owner: 'self',
                bossInvalid: true
            },
            {
                id: 'incalos_blessing_cleanse',
                name: '圣光祝福·净',
                desc: '圣光祝福触发后解除异常状态',
                phase: 'ON_TURN_END',
                condition: 'blessingActive',
                route: 'StatusEffect.cleanse',
                owner: 'self'
            },
            {
                id: 'incalos_blessing_boost',
                name: '圣光祝福·强',
                desc: '圣光祝福触发后下3次攻击伤害+150%',
                phase: 'ON_TURN_END',
                condition: 'blessingActive',
                route: 'CountEffect+DamageEffect.increase',
                count: 3,
                value: 150,
                skillType: 'attack',
                owner: 'self'
            }
        ],
        
        flags: { blessingTriggered: false },

        skills: [
            {
                name: "光·断罪裁决", type: "ultimate", power: 160, pp: 5, maxPp: 5,
                desc: "第五技能\n消除对手能力提升，消除成功2回合内对手无法通过自身技能恢复体力；\n击败对手则令对手下1次使用的攻击技能无效；\n当回合若未击败对手则80%令对手疲惫，未触发则令自身全属性+1",
                effects: [
                    { id: 905, args: [] },
                    { id: 1128, args: [2] },
                    { id: 1040, args: [] }
                ]
            },
            {
                name: "天河圣芒斩", type: "attack", power: 150, pp: 5, maxPp: 5,
                desc: "物理攻击\n若对手处于异常状态则自身造成的攻击伤害额外提升50%；\n若对手不处于异常状态则造成的攻击伤害额外提升50%；\n造成的攻击伤害若高于280则自身免疫下1次受到的异常状态",
                effects: [
                    { id: 1260, args: [50] },
                    { id: 1258, args: [280, 1] }
                ]
            },
            {
                name: "无始源光", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n技能使用成功时，全属性+1；\n2回合内每回合攻击+1、速度+1；\n4回合内每回合使用技能吸取对手最大体力的1/3，若自身体力低于最大体力的1/2则吸取效果翻倍；\n下2回合攻击必定先出手；下2回合自身造成的攻击伤害翻倍",
                effects: [
                    { id: 585, args: [] },
                    { id: 433, args: [2] },
                    { id: 971, args: [4, 3] },
                    { id: 694, args: [2] },
                    { id: 776, args: [2] }
                ]
            },
            {
                name: "光之惩戒", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n4回合内免疫并反弹所有受到的异常状态；\n3回合内每回合使用技能则100%令对手失明，未触发则附加对手最大体力1/3的百分比伤害；\n3回合内自身受到攻击则使对手疲惫，未触发则吸取对手最大体力的1/3",
                effects: [
                    { id: 191, args: [4] },
                    { id: 1298, args: [3] },
                    { id: 1188, args: [3] }
                ]
            },
            {
                name: "璨星断刃", type: "attack", power: 85, pp: 20, maxPp: 20,
                desc: "物理攻击 先制+3\n消除对手回合类效果，消除成功则令对手疲惫，未触发则吸取对手最大体力的1/3；\n无视攻击免疫效果；\n若自身为满体力则技能威力提升100%",
                effects: [
                    { id: 1297, args: [] },
                    { id: 699, args: [] },
                    { id: 925, args: [100] }
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
            
            // 初始化状态
            actor.buffs.incalosBlessingActive = false;
            actor.buffs.incalosLastDamageDealt = 0;
            actor.buffs.incalosBlessingBoostCount = 0;
            actor.flags = actor.flags || {};
            actor.flags.blessingTriggered = false;
        });

        // === CALCULATE_PRIORITY: 先制+1 ===
        timeline.on(TurnPhases.CALCULATE_PRIORITY, (g, { char, priorityMod }) => {
            if (!char || char.key !== key) return;
            
            // [被动] 所有技能先制+1
            priorityMod.bonus = (priorityMod.bonus || 0) + 1;
        });

        // === ON_STAT_DOWN: 免疫能力下降 ===
        timeline.on(TurnPhases.BEFORE_STAT_CHANGE, (g, { target, stat, amount }) => {
            if (!target || target.key !== key) return;
            if (amount < 0) {
                // [被动] 免疫能力下降
                g.log(`【魂印·光】${target.name} 的光之护盾免疫了能力下降！`);
                return { cancel: true };
            }
        });

        // === CALCULATE_DAMAGE: 克制倍数和伤害加成 ===
        timeline.on(TurnPhases.CALCULATE_DAMAGE, (g, { attacker, defender, skill, damageMod }) => {
            if (!attacker || attacker.key !== key) return;
            if (!skill || skill.type === 'buff') return;
            
            // [被动] 克制倍数至少为2
            if (damageMod.effective && damageMod.effective < 2) {
                damageMod.effective = 2;
                g.log(`【魂印·光】光之克制！克制倍数提升至2倍！`);
            }
            
            // [圣光祝福] 伤害+150%
            if (attacker.buffs.incalosBlessingBoostCount > 0) {
                damageMod.multiplier = (damageMod.multiplier || 1) * 2.5;  // +150% = 2.5倍
                attacker.buffs.incalosBlessingBoostCount--;
                g.log(`【魂印·光】圣光祝福！攻击伤害+150%！（剩余${attacker.buffs.incalosBlessingBoostCount}次）`);
            }
        });

        // === AFTER_HIT: 攻击后判定 ===
        timeline.on(TurnPhases.AFTER_HIT, (g, { actor, target, skill, damageDealt }) => {
            if (!actor || actor.key !== key) return;
            if (!skill || skill.type === 'buff') return;
            
            // 记录本次伤害
            actor.buffs.incalosLastDamageDealt = damageDealt || 0;
            
            // [攻击后] 高伤/低伤判定
            if (damageDealt > 280) {
                // 高伤：附加1/3百分比伤害 + 封属1回合
                const percentDmg = Math.floor(target.maxHp / 3);
                if (window.DamageEffect?.percent) {
                    window.DamageEffect.percent(g, target, percentDmg, '光之惩戒');
                } else {
                    target.hp = Math.max(0, target.hp - percentDmg);
                    g.log(`【魂印·光】光之惩戒·强！${target.name} 受到 ${percentDmg} 点百分比伤害！`);
                }
                
                // 封锁属性技能1回合
                target.buffs.blockAttribute = (target.buffs.blockAttribute || 0) + 1;
                g.log(`【魂印·光】${target.name} 下回合属性技能无效！`);
                
            } else if (damageDealt > 0) {
                // 低伤：吸取1/3体力 + 下回合必致命
                const drainAmt = Math.floor(target.maxHp / 3);
                if (window.DamageEffect?.drain) {
                    window.DamageEffect.drain(g, actor, target, drainAmt, '光之惩戒');
                } else {
                    target.hp = Math.max(0, target.hp - drainAmt);
                    actor.hp = Math.min(actor.maxHp, actor.hp + drainAmt);
                    g.log(`【魂印·光】光之惩戒·弱！吸取 ${drainAmt} 点体力！`);
                }
                
                // 下回合必致命
                actor.buffs.critNext = Math.max(actor.buffs.critNext || 0, 1);
                g.log(`【魂印·光】下回合攻击必定致命一击！`);
            }
        });

        // === DEATH_CHECK: 致命伤害检测（圣光祝福） ===
        timeline.on(TurnPhases.DEATH_CHECK, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            if (actor.hp > 0) return;
            if (actor.flags?.blessingTriggered) return;
            
            // BOSS无效
            if (opponent.meta?.isBoss) return;
            
            // [圣光祝福] 首次死亡残留1点体力
            actor.flags.blessingTriggered = true;
            actor.hp = 1;
            actor.buffs.incalosBlessingActive = true;
            
            g.log(`【魂印·光】圣光祝福发动！${actor.name} 残留1点体力！`);
            g.showFloatingText("圣光祝福", actor === g.player);
            
            return { survived: true };
        });

        // === TURN_END: 回合结束（圣光祝福效果） ===
        timeline.on(TurnPhases.TURN_END, (g, { actor }) => {
            if (!actor || actor.key !== key) return;
            
            // [圣光祝福] 回合结束处理
            if (actor.buffs.incalosBlessingActive) {
                // 解除异常状态
                if (actor.buffs.turnEffects) {
                    const abnormalIds = ['burn', 'immolate', 'poison', 'sleep', 'paralyze', 'freeze', 'fear', 'confuse', 'blind', 'exhaust'];
                    const hadAbnormal = actor.buffs.turnEffects.some(e => abnormalIds.includes(e.id));
                    if (hadAbnormal) {
                        actor.buffs.turnEffects = actor.buffs.turnEffects.filter(e => !abnormalIds.includes(e.id));
                        g.log(`【魂印·光】圣光祝福解除了异常状态！`);
                    }
                }
                
                // 下3次攻击伤害+150%
                actor.buffs.incalosBlessingBoostCount = 3;
                g.log(`【魂印·光】圣光祝福！下3次攻击伤害+150%！`);
                
                // 清除激活状态
                actor.buffs.incalosBlessingActive = false;
            }
        });

        // === GET_ICONS: 获取状态图标 ===
        timeline.on(TurnPhases.GET_ICONS, (g, { char, icons }) => {
            if (char.key !== key) return;
            
            if (!char.flags?.blessingTriggered) {
                icons.push({ val: '光', type: 'soul-effect', desc: '魂印·光: 圣光祝福（未触发）' });
            }
            
            if (char.buffs.incalosBlessingBoostCount > 0) {
                icons.push({ val: char.buffs.incalosBlessingBoostCount, type: 'count-effect', desc: `魂印·光: 圣光祝福（伤害+150%，剩余${char.buffs.incalosBlessingBoostCount}次）` });
            }
            
            // 免疫能力下降图标
            icons.push({ val: '免', type: 'soul-effect', desc: '魂印·光: 免疫能力下降' });
        });
    }

    registerSpirit(data, registerPhases);
})();
