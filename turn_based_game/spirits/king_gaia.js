(() => {
    const key = 'kingGaia';
    const data = {
        key,
        name: "王·盖亚",
        asset: "assets/king_gaia.png",
        maxHp: 850,
        soulMark: "盖",
        soulMarkDesc: "【魂印】盖\n自身处于异常状态时，对手每回合2项属性-1且造成的伤害减少50%；\n每回合恢复自身已损失体力的30%，攻击有自身已损失体力百分比的几率威力翻倍（BOSS无效）",
        resist: { fixed: 0, percent: 0, trueDmg: 0 },

        /**
         * 魂印效果列表 (Point Form)
         */
        soulEffects: [
            // === [持续] 恢复效果 ===
            {
                id: 'gaia_regen',
                name: '战王恢复',
                desc: '每回合恢复自身已损失体力的30%',
                phase: 'ON_TURN_END',
                route: 'HealEffect',
                healType: 'lost_percent',
                value: 30,                         // 已损失体力30%
                owner: 'self'
            },
            // === [异常时] 弱化对手 ===
            {
                id: 'gaia_weaken_opponent',
                name: '王之威慑',
                desc: '异常时对手每回合2项属性-1',
                phase: 'ON_TURN_END',
                condition: 'hasAbnormalStatus',
                route: 'StatEffect.randomDecrease',
                count: 2,                          // 2项属性
                value: -1,
                owner: 'opponent'
            },
            {
                id: 'gaia_damage_reduction',
                name: '王之防御',
                desc: '异常时对手造成的伤害减少50%',
                phase: 'ON_TURN_START',
                condition: 'hasAbnormalStatus',
                route: 'DamageEffect.reduction',
                value: 50,                         // 减伤50%
                owner: 'opponent'                  // 对手造成伤害减少
            },
            // === [攻击时] 威力翻倍 ===
            {
                id: 'gaia_crit_chance',
                name: '战王之力',
                desc: '攻击有自身已损失体力百分比的几率威力翻倍',
                phase: 'ON_CALCULATE_DAMAGE',
                route: 'DamageEffect.conditionalDouble',
                chanceType: 'lost_hp_percent',     // 概率=已损失体力%
                owner: 'self',
                bossInvalid: true
            }
        ],

        skills: [
            {
                name: "战霸天下", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n4回合内免疫并反弹异常状态；\n5回合内免疫能力下降；\n将下次受到的伤害200%反馈给对手",
                priority: 0,
                effects: [
                    { id: 191, args: [4], note: "4回合免疫反弹异常", route: "TurnEffect", owner: "self" },
                    { id: 2001, args: [5], note: "5回合免疫能力下降", route: "TurnEffect", owner: "self" },
                    { id: 2002, args: [1, 200], note: "下1次伤害200%反馈", route: "CountEffect+ReflectEffect" }
                ]
            },
            {
                name: "不败之境", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n全属性+1，自身体力高于1/2时强化效果翻倍；\n4回合内，每回合吸取对手最大体力的1/3；\n下2回合自身先制+2",
                priority: 0,
                effects: [
                    { id: 2003, args: [1], note: "全属性+1(高血翻倍)", route: "StatEffect" },
                    { id: 2004, args: [4, 3], note: "4回合吸取1/3最大体力", route: "TurnEffect+HealEffect+DamageEffect", owner: "self" },
                    { id: 843, args: [2, 2], note: "2回合先制+2", route: "TurnEffect", owner: "self" }
                ]
            },
            {
                name: "天诛乱舞", type: "attack", power: 130, pp: 10, maxPp: 10,
                desc: "战斗物攻\n必中；\n反转自身能力下降；\n反转成功则对方害怕",
                priority: 0,
                effects: [
                    { id: 2005, args: [], note: "反转自身下降+成功则害怕", route: "StatEffect.invert+StatusEffect" }
                ]
            },
            {
                name: "天威力破", type: "attack", power: 85, pp: 20, maxPp: 20,
                desc: "战斗物攻\n先制+3；\n消除对手回合类效果，消除成功则免疫下次受到的异常状态；\n造成的伤害低于280則下2回合自身攻击必定致命一击",
                priority: 3,                       // 标注：先制+3
                effects: [
                    { id: 2006, args: [], note: "消除回合效果成功则1次异常免疫", route: "TurnEffect.clear+ImmuneEffect", owner: "self" },
                    { id: 2007, args: [280, 2], note: "伤害<280则2回合必致命", route: "TurnEffect", owner: "self" }
                ]
            },
            {
                name: "王·圣勇战意", type: "ultimate", power: 160, pp: 5, maxPp: 5,
                desc: "第五技能\n必中；\n攻击时造成的伤害不会出现微弱；\n吸取对手能力提升状态，若吸取成功則吸取對手300點體力；\n若對手處於能力提升狀態，則自身該技能先制+2",
                priority: 0,                       // 动态先制
                effects: [
                    { id: 760, args: [], note: "无微弱", route: "DamageEffect.noWeak" },
                    { id: 2008, args: [300], note: "吸取强化成功则吸取300体力", route: "StatEffect.steal+HealEffect" },
                    { id: 2009, args: [2], note: "对手有强化则先制+2", route: "PriorityEffect" }
                ]
            }
        ]
    };

    /**
     * 异常状态列表（用于判断）
     */
    const ABNORMAL_STATUSES = ['burn', 'immolate', 'poison', 'sleep', 'paralyze', 'freeze', 'fear', 'confuse'];

    /**
     * 检查是否有异常状态
     */
    function hasAbnormalStatus(char) {
        if (!char.buffs.turnEffects) return false;
        return char.buffs.turnEffects.some(e => ABNORMAL_STATUSES.includes(e.id));
    }

    /**
     * 注册 TurnPhase 处理器
     */
    function registerPhases(timeline, game) {
        // === ENTRY: 登场 ===
        timeline.on(TurnPhases.ENTRY, (g, { actor }) => {
            if (!actor || actor.key !== key) return;
            
            // 初始化状态
            actor.buffs.gaiaAbnormalReduction = false;
        });

        // === TURN_START: 回合开始 ===
        timeline.on(TurnPhases.TURN_START, (g, { actor }) => {
            if (!actor || actor.key !== key) return;
            
            // [异常时] 检查是否有异常状态
            actor.buffs.gaiaAbnormalReduction = hasAbnormalStatus(actor);
            
            if (actor.buffs.gaiaAbnormalReduction) {
                g.log(`【魂印·盖】${actor.name} 处于异常状态，当回合对手伤害减少50%！`);
            }
        });

        // === ON_HIT: 命中中（伤害减半） ===
        timeline.on(TurnPhases.ON_HIT, (g, { target, attacker, damageMod }) => {
            // 检查attacker（王盖亚的对手）是否是王盖亚且王盖亚有异常
            const gaia = [g.player, g.enemy].find(c => c.key === key && c.hp > 0);
            if (gaia && gaia !== attacker && hasAbnormalStatus(gaia)) {
                damageMod.multiplier = (damageMod.multiplier || 1) * 0.5;
                g.log(`【魂印·盖】王之防御：对手伤害减半！`);
            }
        });

        // === CALCULATE_DAMAGE: 威力翻倍判定 ===
        timeline.on(TurnPhases.CALCULATE_DAMAGE, (g, { attacker, defender, skill, damageMod }) => {
            if (!attacker || attacker.key !== key) return;
            if (!skill || skill.type === 'buff') return;
            if (defender.meta?.isBoss) return;     // BOSS无效
            
            // [攻击时] 已损失体力百分比几率威力翻倍
            const lostPercent = (attacker.maxHp - attacker.hp) / attacker.maxHp;
            if (Math.random() < lostPercent) {
                damageMod.multiplier = (damageMod.multiplier || 1) * 2;
                g.log(`【魂印·盖】战王之力发动！威力翻倍！`);
                g.showFloatingText("威力翻倍！", attacker === g.player);
            }
        });

        // === TURN_END: 回合结束 ===
        timeline.on(TurnPhases.TURN_END, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            
            // [持续] 恢复已损失体力30%
            const lost = actor.maxHp - actor.hp;
            if (lost > 0) {
                const healAmt = Math.floor(lost * 0.3);
                if (window.HealEffect?.heal) {
                    window.HealEffect.heal(g, actor, healAmt, '魂印·盖');
                } else {
                    g.heal(actor, healAmt, "魂印·盖");
                }
            }
            
            // [异常时] 对手2项属性-1
            if (hasAbnormalStatus(actor) && opponent && opponent.hp > 0) {
                const stats = ['atk', 'def', 'spa', 'spd', 'spe'];
                const shuffled = stats.sort(() => Math.random() - 0.5);
                const toDecrease = shuffled.slice(0, 2);
                
                for (const stat of toDecrease) {
                    if (window.StatEffect?.modify) {
                        window.StatEffect.modify(g, opponent, stat, -1, '魂印·盖');
                    } else {
                        g.modifyStats(opponent, { [stat]: -1 });
                    }
                }
                
                g.log(`【魂印·盖】王之威慑！对手 ${toDecrease.join('、')} -1！`);
            }
        });

        // === GET_ICONS: 获取状态图标 ===
        timeline.on(TurnPhases.GET_ICONS, (g, { char, icons }) => {
            if (char.key !== key) return;
            
            if (char.buffs.gaiaAbnormalReduction) {
                icons.push({ val: '盖', type: 'soul-effect', desc: '魂印·盖: 异常激活（对手伤害-50%，每回合弱化）' });
            }
        });
    }

    registerSpirit(data, registerPhases);
})();
