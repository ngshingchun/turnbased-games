(() => {
    const key = 'aishala';
    const data = {
        key,
        name: "艾夏拉",
        asset: "assets/aishala.png",
        maxHp: 800,
        soulMark: "常",
        soulMarkDesc: "【魂印】常\n[常之罚]：自身先出手时当回合我方造成的攻击伤害提升50%，对手先出手时当回合我方受到的攻击伤害减少50%（BOSS无效）；\n[常之劫]：回合开始时，若对手处于能力提升状态则消除对手能力提升状态，消除成功则令对手睡眠，若对手不处于能力提升状态则当回合自身所有技能先制+1（BOSS无效）；\n[常之悲]：战斗阶段结束时，若自身体力为0，则消除对手回合类效果和能力提升状态，消除任意一项成功则令对手睡眠（BOSS无效）",
        resist: { fixed: 0, percent: 0, trueDmg: 0 },

        /**
         * 魂印效果列表 (Point Form)
         * 每个效果标注：触发时机、路由目标、绑定方
         */
        soulEffects: [
            // === [常之罚] 先后手伤害调整 ===
            {
                id: 'aishala_first_move_boost',
                name: '常之罚·先攻',
                desc: '自身先出手时当回合攻击伤害提升50%',
                phase: 'ON_FIRST_MOVE',
                route: 'DamageEffect.increase',
                value: 50,                         // 伤害+50%
                skillType: 'attack',
                owner: 'self',
                bossInvalid: true
            },
            {
                id: 'aishala_second_move_reduce',
                name: '常之罚·后守',
                desc: '对手先出手时当回合受到攻击伤害减少50%',
                phase: 'ON_SECOND_MOVE',
                route: 'DamageEffect.reduction',
                value: 50,                         // 减伤50%
                owner: 'self',
                bossInvalid: true
            },
            // === [常之劫] 回合开始判定 ===
            {
                id: 'aishala_calamity_clear',
                name: '常之劫·清',
                desc: '回合开始时若对手有强化则消除并令对手睡眠',
                phase: 'ON_TURN_START',
                condition: 'opponentHasStatUps',
                route: 'StatEffect.clear+StatusEffect',
                status: 'sleep',
                turns: 2,
                owner: 'opponent',
                bossInvalid: true
            },
            {
                id: 'aishala_calamity_priority',
                name: '常之劫·速',
                desc: '回合开始时若对手无强化则当回合先制+1',
                phase: 'ON_TURN_START',
                condition: '!opponentHasStatUps',
                route: 'PriorityEffect',
                value: 1,
                turns: 1,                          // 当回合
                owner: 'self',
                bossInvalid: true
            },
            // === [常之悲] 死亡时反击 ===
            {
                id: 'aishala_sorrow_death',
                name: '常之悲',
                desc: '死亡时消除对手回合效果和强化，成功则令对手睡眠',
                phase: 'ON_DEATH',
                route: 'TurnEffect.clear+StatEffect.clear+StatusEffect',
                status: 'sleep',
                turns: 2,
                owner: 'opponent',
                bossInvalid: true
            }
        ],

        skills: [
            {
                name: "常·天劫余生", type: "ultimate", power: 160, pp: 5, maxPp: 5,
                desc: "第五技能\n消除对手回合类效果，消除成功则己方免疫下1次受到的异常状态；\n2回合内对手无法通过自身技能恢复体力；\n附加自身特攻值与速度值总和20%的百分比伤害，每次使用增加10%，最高40%",
                effects: [
                    { id: 928, args: [] },
                    { id: 679, args: [2] },
                    { id: 1163, args: [20, 10, 40] }
                ]
            },
            {
                name: "天蛇之难", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n全属性+1，先出手时自身强化效果翻倍；\n4回合内每回合使用技能吸取对手最大体力的1/3，吸取体力时若自身体力低于最大体力的1/2则吸取效果翻倍；\n下2回合令自身所有技能先制+2；\n下2回合自身攻击技能必定打出致命一击",
                effects: [
                    { id: 1283, args: [] },
                    { id: 971, args: [4] },
                    { id: 843, args: [2] },
                    { id: 58, args: [2] }
                ]
            },
            {
                name: "虚妄幻境", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n4回合内免疫并反弹所有受到的异常状态；\n3回合内受到攻击则100%令对手睡眠，未触发则令对手全属性-1；\n3回合内每回合80%闪避对手攻击，未触发则使对手随机2项技能PP值归零",
                effects: [
                    { id: 191, args: [4] },
                    { id: 1322, args: [3] },
                    { id: 1235, args: [3] }
                ]
            },
            {
                name: "净灵咒", type: "attack", power: 90, pp: 5, maxPp: 5,
                desc: "特殊攻击 先制+3\n无视伤害限制效果；无视攻击免疫效果；\n消除对手回合类效果；\n命中后80%令对手睡眠；\n自身每损失20%的体力概率提升5%",
                effects: [
                    { id: 697, args: [] },
                    { id: 1699, args: [] },
                    { id: 180, args: [80, 5, 20] }
                ]
            },
            {
                name: "灵剑封魂", type: "attack", power: 85, pp: 20, maxPp: 20,
                desc: "特殊攻击 先制+3\n将自身能力下降状态反馈给对手，反馈成功则自身全属性+1，反馈失败则解除自身能力下降状态；\n每次使用则当回合造成的攻击伤害额外提升25%，最高额外提升100%",
                effects: [
                    { id: 1359, args: [] },
                    { id: 795, args: [25, 100] }
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
     * 注册 TurnPhase 处理器
     */
    function registerPhases(timeline, game) {
        // === ENTRY: 登场 ===
        timeline.on(TurnPhases.ENTRY, (g, { actor }) => {
            if (!actor || actor.key !== key) return;
            
            // 初始化状态
            actor.buffs.aishalaFirstMove = false;
            actor.buffs.aishalaSecondMove = false;
            actor.buffs.aishalaPriorityBonus = 0;
        });

        // === TURN_START: 回合开始 ===
        timeline.on(TurnPhases.TURN_START, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            
            // BOSS无效
            const isBoss = opponent.meta?.isBoss;
            
            // 重置先后手状态
            actor.buffs.aishalaFirstMove = false;
            actor.buffs.aishalaSecondMove = false;
            actor.buffs.aishalaPriorityBonus = 0;
            
            // [常之劫] 判定对手强化状态
            if (!isBoss) {
                if (hasStatUps(opponent)) {
                    // 对手有强化：消除并令其睡眠
                    const cleared = window.StatEffect?.clearBuffs?.(g, opponent) || g.clearStats?.(opponent);
                    if (cleared) {
                        if (window.StatusEffect?.apply) {
                            window.StatusEffect.apply(g, opponent, 'sleep', '睡眠', 2);
                        } else {
                            g.addTurnEffect(opponent, '睡眠', 2, 'sleep');
                        }
                        g.log(`【魂印·常】常之劫！消除了 ${opponent.name} 的强化并令其睡眠！`);
                    }
                } else {
                    // 对手无强化：当回合先制+1
                    actor.buffs.aishalaPriorityBonus = 1;
                    g.log(`【魂印·常】常之劫！对手无强化，当回合所有技能先制+1！`);
                }
            }
        });

        // === CALCULATE_PRIORITY: 先制计算 ===
        timeline.on(TurnPhases.CALCULATE_PRIORITY, (g, { char, priorityMod }) => {
            if (!char || char.key !== key) return;
            
            // [常之劫] 先制加成
            if (char.buffs.aishalaPriorityBonus > 0) {
                priorityMod.bonus = (priorityMod.bonus || 0) + char.buffs.aishalaPriorityBonus;
            }
        });

        // === BEFORE_ACTION: 行动前判定先后手 ===
        timeline.on(TurnPhases.BEFORE_ACTION, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            
            // BOSS无效
            const isBoss = opponent.meta?.isBoss;
            if (isBoss) return;
            
            // 判断先后手（根据 hasMoved 状态）
            if (!opponent.buffs.hasMoved) {
                // 对手未行动，自身先出手
                actor.buffs.aishalaFirstMove = true;
                g.log(`【魂印·常】常之罚·先攻！当回合攻击伤害+50%！`);
            } else {
                // 对手已行动，自身后出手
                actor.buffs.aishalaSecondMove = true;
                g.log(`【魂印·常】常之罚·后守！当回合受伤减少50%！`);
            }
        });

        // === CALCULATE_DAMAGE: 伤害计算（先攻加成） ===
        timeline.on(TurnPhases.CALCULATE_DAMAGE, (g, { attacker, skill, damageMod }) => {
            if (!attacker || attacker.key !== key) return;
            if (!skill || skill.type === 'buff') return;
            
            // [常之罚·先攻] 伤害+50%
            if (attacker.buffs.aishalaFirstMove) {
                damageMod.multiplier = (damageMod.multiplier || 1) * 1.5;
                g.log(`【魂印·常】常之罚生效！伤害+50%！`);
            }
        });

        // === ON_HIT: 受击减伤（后守） ===
        timeline.on(TurnPhases.ON_HIT, (g, { target, skill, damageMod }) => {
            if (!target || target.key !== key) return;
            if (!skill || skill.type === 'buff') return;
            
            // [常之罚·后守] 受伤-50%
            if (target.buffs.aishalaSecondMove) {
                damageMod.multiplier = (damageMod.multiplier || 1) * 0.5;
                g.log(`【魂印·常】常之罚·后守生效！受伤减少50%！`);
            }
        });

        // === ON_DEATH: 死亡时反击 ===
        timeline.on(TurnPhases.ON_DEATH, (g, { char, isPlayer }) => {
            if (!char || char.key !== key) return;
            
            const opponent = isPlayer ? g.enemy : g.player;
            
            // BOSS无效
            if (opponent.meta?.isBoss) return;
            
            // [常之悲] 消除对手回合效果和强化
            let success = false;
            
            // 消除回合效果
            if (opponent.buffs.turnEffects?.length > 0) {
                if (window.TurnEffect?.dispel) {
                    success = window.TurnEffect.dispel(g, opponent, { silent: true }) || success;
                } else {
                    opponent.buffs.turnEffects = [];
                    success = true;
                }
            }
            
            // 消除能力提升
            if (hasStatUps(opponent)) {
                if (window.StatEffect?.clearBuffs) {
                    success = window.StatEffect.clearBuffs(g, opponent) || success;
                } else if (g.clearStats) {
                    success = g.clearStats(opponent) || success;
                }
            }
            
            // 成功则令对手睡眠
            if (success) {
                if (window.StatusEffect?.apply) {
                    window.StatusEffect.apply(g, opponent, 'sleep', '睡眠', 2);
                } else {
                    g.addTurnEffect(opponent, '睡眠', 2, 'sleep');
                }
                g.log(`【魂印·常】常之悲！${char.name} 倒下时消除了 ${opponent.name} 的效果并令其睡眠！`);
                g.showFloatingText("常之悲", isPlayer);
            }
        });

        // === GET_ICONS: 获取状态图标 ===
        timeline.on(TurnPhases.GET_ICONS, (g, { char, icons }) => {
            if (char.key !== key) return;
            
            if (char.buffs.aishalaFirstMove) {
                icons.push({ val: '攻', type: 'soul-effect', desc: '魂印·常: 常之罚·先攻（伤害+50%）' });
            }
            if (char.buffs.aishalaSecondMove) {
                icons.push({ val: '守', type: 'soul-effect', desc: '魂印·常: 常之罚·后守（减伤50%）' });
            }
            if (char.buffs.aishalaPriorityBonus > 0) {
                icons.push({ val: '+1', type: 'priority', desc: '魂印·常: 常之劫（先制+1）' });
            }
        });
    }

    registerSpirit(data, registerPhases);
})();
