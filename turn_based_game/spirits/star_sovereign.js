(() => {
    const key = 'starSovereign';
    const data = {
        key,
        name: "瀚宇星皇",
        asset: "assets/star.png",
        maxHp: 1050,
        soulMark: "星",
        soulMarkDesc: "【魂印】强攻·辅助·免伤\n免疫固定/百分比伤害与能力下降，固定/百分比抗性恒定100%；\n技能无效时，若对手存活则50%追加星皇之怒；\n在队伍中：己方全员享星皇之赐(每回合行动后恢复1/8体力)，首发享星皇之佑(3回合免疫异常与能力下降)；\n星皇之怒：以技能50%威力追加攻击并触发对应怒效果。",
        resist: { fixed: 1, percent: 1, trueDmg: 0 },  // 100%免疫固定/百分比伤害
        meta: { isStar: true },

        /**
         * 魂印效果列表 (Point Form)
         */
        soulEffects: [
            // === [被动] 免疫 ===
            {
                id: 'star_immune_fixed',
                name: '星皇护体',
                desc: '免疫固定伤害（100%抗性）',
                phase: 'PASSIVE',
                route: 'ImmuneEffect',
                immuneType: 'fixed_damage',
                value: 100,
                owner: 'self'
            },
            {
                id: 'star_immune_percent',
                name: '星皇护体',
                desc: '免疫百分比伤害（100%抗性）',
                phase: 'PASSIVE',
                route: 'ImmuneEffect',
                immuneType: 'percent_damage',
                value: 100,
                owner: 'self'
            },
            {
                id: 'star_immune_stat_down',
                name: '星皇威严',
                desc: '免疫能力下降',
                phase: 'PASSIVE',
                route: 'ImmuneEffect',
                immuneType: 'stat_down',
                value: true,
                owner: 'self'
            },
            // === [触发] 技能无效时追加 ===
            {
                id: 'star_rage_on_nullified',
                name: '星皇之怒',
                desc: '技能无效时50%追加星皇之怒',
                phase: 'ON_SKILL_NULLIFIED',
                condition: 'opponentAlive && random(50)',
                route: 'SkillEffect.chainAttack',
                attackName: '星皇之怒',
                powerMultiplier: 0.5,              // 50%威力
                owner: 'self'
            },
            // === [队伍] 星皇之赐 ===
            {
                id: 'star_gift_aura',
                name: '星皇之赐',
                desc: '队伍中己方全员每回合行动后恢复1/8体力',
                phase: 'ON_TURN_END',
                route: 'HealEffect',
                healType: 'max_percent',
                value: 12.5,                       // 1/8 ≈ 12.5%
                target: 'team',                    // 整队生效
                condition: 'starInTeam'
            },
            // === [首发] 星皇之佑 ===
            {
                id: 'star_blessing',
                name: '星皇之佑',
                desc: '首发时3回合免疫异常与能力下降',
                phase: 'ON_BATTLE_START',
                condition: 'isFirstDeploy',
                route: 'TurnEffect',
                effectId: 'star_blessing',
                turns: 3,
                owner: 'self'
            }
        ],

        skills: [
            {
                name: "万皇宗魄决", type: "attack", power: 160, pp: 5, maxPp: 5,
                desc: "物理攻击\n致命率每次+20%，最高100%；打出致命则下2次星皇之怒威力不再减少；若对手存活，50%再行动触发星皇之怒（怒：下2次攻击先制+2）",
                priority: 0,
                starRageType: 'wanhuang',
                effects: [
                    { id: 1098, args: [20, 2], note: "致命率+20%/2次怒威力不减", route: "CritEffect+CountEffect" }
                ]
            },
            {
                name: "亘古圣辰决", type: "attack", power: 150, pp: 5, maxPp: 5,
                desc: "物理攻击\n伤害<280则令对手疲惫；未击败则对手下1回合攻击无效；若对手存活，50%再行动触发星皇之怒（怒：50%失明，否则2回合属性技能无效）",
                priority: 0,
                starRageType: 'shengchen',
                effects: [
                    { id: 1097, args: [280], note: "伤害<280疲惫/1回合攻击无效", route: "StatusEffect+BlockEffect.attackImmunity", owner: "self" }
                ]
            },
            {
                name: "命宇轮回", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n全属性+1(体力<1/2翻倍)；4回合每次出手吸取对手1/3最大体力(自身体力<1/2翻倍)；下2次技能星皇之怒概率翻倍；若对手存活，50%再行动触发星皇之怒（怒：下2回合攻击伤害翻倍且下2次受击再减伤50%）",
                priority: 0,
                starRageType: 'lunhui',
                effects: [
                    { id: 1096, args: [1, 4, 3], note: "全属性+1/4回合吸血/2次怒概率翻倍", route: "StatEffect+TurnEffect+CountEffect" }
                ]
            },
            {
                name: "瀚空之门", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n3回合针对对手技能提供干扰；己方免疫下2次异常；若对手存活，50%再行动触发星皇之怒（怒：2回合回合类效果无法被消除；2回合全技能先制+2）",
                priority: 0,
                starRageType: 'gate',
                effects: [
                    { id: 1095, args: [3, 2], note: "3回合干扰/2次异常免疫", route: "TurnEffect+ImmuneEffect", owner: "self" }
                ]
            },
            {
                name: "圣世惩杀", type: "attack", power: 85, pp: 20, maxPp: 20,
                desc: "物理攻击 先制+3\n消除对手回合效果并清空2项PP；消除对手能力提升成功则下2回合星皇之怒概率+20%；若对手存活，50%再行动触发星皇之怒（怒：若对手无强化则附加1/3最大体力伤害）",
                priority: 3,                       // 标注：先制+3
                starRageType: 'punish',
                effects: [
                    { id: 1094, args: [2, 20], note: "消除回合效果/清2项PP/2回合怒+20%", route: "TurnEffect.clear+SkillEffect+CountEffect" }
                ]
            }
        ]
    };

    /**
     * 星皇之怒效果定义
     */
    const STAR_RAGE_EFFECTS = {
        wanhuang: {
            name: '万皇怒',
            desc: '下2次攻击先制+2',
            route: 'TurnEffect',
            effect: (g, star) => {
                star.buffs.starRagePriorityCount = (star.buffs.starRagePriorityCount || 0) + 2;
                g.log(`【星皇之怒】万皇怒！下2次攻击先制+2！`);
            }
        },
        shengchen: {
            name: '圣辰怒',
            desc: '50%失明，否则2回合属性技能无效',
            route: 'StatusEffect|BlockEffect',
            effect: (g, star, opponent) => {
                if (Math.random() < 0.5) {
                    opponent.buffs.blind = (opponent.buffs.blind || 0) + 2;
                    g.log(`【星皇之怒】圣辰怒！对手失明2回合！`);
                } else {
                    opponent.buffs.blockAttribute = (opponent.buffs.blockAttribute || 0) + 2;
                    g.log(`【星皇之怒】圣辰怒！对手2回合属性技能无效！`);
                }
            }
        },
        lunhui: {
            name: '轮回怒',
            desc: '下2回合攻击伤害翻倍且下2次受击再减伤50%',
            route: 'TurnEffect+DamageEffect',
            effect: (g, star) => {
                star.buffs.starRageDamageBuffTurns = (star.buffs.starRageDamageBuffTurns || 0) + 2;
                star.buffs.starRageDmgReduceCount = (star.buffs.starRageDmgReduceCount || 0) + 2;
                g.log(`【星皇之怒】轮回怒！2回合攻击翻倍，2次受击减伤！`);
            }
        },
        gate: {
            name: '瀚空怒',
            desc: '2回合回合类效果无法被消除；2回合全技能先制+2',
            route: 'TurnEffect+PriorityEffect',
            effect: (g, star) => {
                star.buffs.turnEffectProtected = (star.buffs.turnEffectProtected || 0) + 2;
                star.buffs.starRagePriorityTurns = (star.buffs.starRagePriorityTurns || 0) + 2;
                g.log(`【星皇之怒】瀚空怒！2回合效果保护，全技能先制+2！`);
            }
        },
        punish: {
            name: '惩杀怒',
            desc: '若对手无强化则附加1/3最大体力伤害',
            route: 'DamageEffect.fixed',
            effect: (g, star, opponent) => {
                const hasBuffs = opponent.buffs.statUps && 
                    Object.values(opponent.buffs.statUps).some(v => v > 0);
                if (!hasBuffs) {
                    const damage = Math.floor(opponent.maxHp / 3);
                    if (window.DamageEffect?.fixed) {
                        window.DamageEffect.fixed(g, opponent, damage, '星皇之怒');
                    } else {
                        opponent.hp = Math.max(0, opponent.hp - damage);
                        g.log(`【星皇之怒】惩杀怒！对手无强化，附加 ${damage} 固伤！`);
                    }
                }
            }
        }
    };

    /**
     * 注册 TurnPhase 处理器
     */
    function registerPhases(timeline, game) {
        // === OPEN_TURN: 战斗开始/登场 ===
        timeline.on(TurnPhases.OPEN_TURN, (g, { actor, opponent, isPlayer }) => {
            if (!actor || actor.key !== key) return;
            
            // [首发] 星皇之佑
            if (!actor.buffs.starGraceApplied) {
                actor.buffs.starGraceApplied = true;
                
                if (actor.hp > 0) {
                    actor.buffs.immuneAbnormal = Math.max(actor.buffs.immuneAbnormal || 0, 3);
                    actor.buffs.immuneStatDrop = Math.max(actor.buffs.immuneStatDrop || 0, 3);
                    g.log(`【魂印·星】${actor.name} 受到星皇之佑！3回合免疫异常与弱化！`);
                    g.showFloatingText("星皇之佑", isPlayer);
                }
            }
            
            // [队伍] 标记星皇在队
            actor.buffs.hasStarGift = true;
            const sideTeam = isPlayer ? g.playerTeam : g.enemyTeam;
            if (sideTeam) {
                sideTeam.forEach(ch => { ch.buffs.hasStarGift = true; });
            }
        });

        // === TURN_END: 回合结束 ===
        timeline.on(TurnPhases.TURN_END, (g, { actor, isPlayer }) => {
            // [队伍] 星皇之赐
            const team = isPlayer ? g.playerTeam : g.enemyTeam;
            const hasStar = team?.some(c => c.key === key);
            
            if (hasStar && actor.hp > 0) {
                const heal = Math.floor(actor.maxHp / 8);
                if (window.HealEffect?.heal) {
                    window.HealEffect.heal(g, actor, heal, '星皇之赐');
                } else {
                    g.heal(actor, heal, "星皇之赐");
                }
            }

            // 回合效果递减
            if (actor.key === key) {
                if (actor.buffs.starRageDamageBuffTurns > 0) {
                    actor.buffs.starRageDamageBuffTurns--;
                }
                if (actor.buffs.starRagePriorityTurns > 0) {
                    actor.buffs.starRagePriorityTurns--;
                }
                if (actor.buffs.turnEffectProtected > 0) {
                    actor.buffs.turnEffectProtected--;
                }
            }
        });

        // === CALCULATE_DAMAGE: 伤害翻倍（星怒） ===
        timeline.on(TurnPhases.CALCULATE_DAMAGE, (g, { attacker, damageMod }) => {
            if (!attacker || attacker.key !== key) return;
            
            if (attacker.buffs.starRageDamageBuffTurns > 0) {
                damageMod.multiplier = (damageMod.multiplier || 1) * 2;
                g.log(`【星皇之怒】轮回怒！攻击伤害翻倍！`);
            }
        });

        // === ON_HIT: 受击减伤（星怒） ===
        timeline.on(TurnPhases.ON_HIT, (g, { target, damageMod }) => {
            if (!target || target.key !== key) return;
            
            if (target.buffs.starRageDmgReduceCount > 0) {
                damageMod.multiplier = (damageMod.multiplier || 1) * 0.5;
                target.buffs.starRageDmgReduceCount--;
                g.log(`【星皇之怒】轮回怒！受击伤害减半！（剩余${target.buffs.starRageDmgReduceCount}次）`);
            }
        });

        // === CALCULATE_PRIORITY: 先制（星怒） ===
        timeline.on(TurnPhases.CALCULATE_PRIORITY, (g, { char, skill, priorityMod }) => {
            if (!char || char.key !== key) return;
            
            // 回合先制
            if (char.buffs.starRagePriorityTurns > 0) {
                priorityMod.bonus = (priorityMod.bonus || 0) + 2;
            }
            
            // 次数先制（攻击技能）
            if (char.buffs.starRagePriorityCount > 0 && skill?.type === 'attack') {
                priorityMod.bonus = (priorityMod.bonus || 0) + 2;
                char.buffs.starRagePriorityCount--;
            }
        });

        // === GET_ICONS: 获取状态图标 ===
        timeline.on(TurnPhases.GET_ICONS, (g, { char, icons }) => {
            if (char.key !== key) return;
            
            if (char.buffs.starRageDamageBuffTurns > 0) {
                icons.push({ val: char.buffs.starRageDamageBuffTurns, type: 'turn-effect', desc: '星怒·轮回: 攻击伤害翻倍' });
            }
            if (char.buffs.starRageDmgReduceCount > 0) {
                icons.push({ val: char.buffs.starRageDmgReduceCount, type: 'count-effect', desc: '星怒·轮回: 受击减伤50%' });
            }
            if (char.buffs.starRagePriorityTurns > 0) {
                icons.push({ val: char.buffs.starRagePriorityTurns, type: 'turn-effect', desc: '星怒·瀚空: 全技能先制+2' });
            }
            if (char.buffs.starRagePriorityCount > 0) {
                icons.push({ val: char.buffs.starRagePriorityCount, type: 'count-effect', desc: '星怒·万皇: 攻击先制+2' });
            }
            if (char.buffs.turnEffectProtected > 0) {
                icons.push({ val: char.buffs.turnEffectProtected, type: 'turn-effect', desc: '星怒·瀚空: 回合效果保护' });
            }
            if (char.buffs.hasStarGift) {
                icons.push({ val: '赐', type: 'soul-effect', desc: '魂印·星: 星皇之赐（回合恢复1/8）' });
            }
        });
    }

    // 导出星怒效果供技能使用
    window.STAR_RAGE_EFFECTS = STAR_RAGE_EFFECTS;

    registerSpirit(data, registerPhases);
})();
