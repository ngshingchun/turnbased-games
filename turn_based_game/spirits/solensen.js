(() => {
    const key = 'solensen';
    const data = {
        key,
        name: "混沌魔君索伦森",
        asset: "assets/solensen.png",
        maxHp: 1000,
        soulMark: "源",
        soulMarkDesc: "【魂印】源（免伤·弱化·封属）\n[登场] 消除对手能力提升，成功则2回合对手无法提升能力且下1次属性技能无效（BOSS无效）；\n[干扰] 每回合开始至战斗阶段结束，若对手有高于自身的能力等级，则同步为与自身相同（BOSS无效）；\n[触发] 回合开始若自身无强化：当回合受到攻击伤害减半且50%概率免疫攻击；战斗阶段结束若自身有强化：恢复1/3最大体力并造成等量百分比伤害（BOSS有效）",
        resist: { fixed: 0, percent: 0, trueDmg: 0 },

        /**
         * 魂印效果列表 (Point Form)
         */
        soulEffects: [
            // === [登场] ===
            {
                id: 'solensen_entry_clear',
                name: '混沌登场',
                desc: '登场时消除对手能力提升',
                phase: 'ON_ENTRY',
                route: 'StatEffect.clearBuffs',
                owner: 'opponent',
                bossInvalid: true                  // BOSS无效
            },
            {
                id: 'solensen_entry_block_buff',
                name: '混沌封锁',
                desc: '消除成功则2回合对手无法提升能力',
                phase: 'ON_ENTRY',
                condition: 'clearSuccess',
                route: 'TurnEffect',
                effectId: 'block_stat_up',
                turns: 2,
                owner: 'opponent',
                bossInvalid: true
            },
            {
                id: 'solensen_entry_block_attr',
                name: '混沌封属',
                desc: '消除成功则下1次属性技能无效',
                phase: 'ON_ENTRY',
                condition: 'clearSuccess',
                route: 'CountEffect',
                effectId: 'block_attribute',
                count: 1,
                owner: 'opponent',
                bossInvalid: true
            },
            // === [干扰] ===
            {
                id: 'solensen_sync_start',
                name: '混沌同步',
                desc: '回合开始时同步对手高于自身的能力等级',
                phase: 'ON_TURN_START',
                route: 'StatEffect.sync',
                syncDirection: 'down',             // 只降低不提升
                owner: 'opponent',
                bossInvalid: true
            },
            {
                id: 'solensen_sync_end',
                name: '混沌同步',
                desc: '回合结束时同步对手高于自身的能力等级',
                phase: 'ON_TURN_END',
                route: 'StatEffect.sync',
                syncDirection: 'down',
                owner: 'opponent',
                bossInvalid: true
            },
            // === [触发] - 无强化时 ===
            {
                id: 'solensen_guard_reduction',
                name: '混沌守护',
                desc: '无强化时当回合受到攻击伤害减半',
                phase: 'ON_TURN_START',
                condition: '!hasStatUps',
                route: 'DamageEffect.reduction',
                value: 50,                         // 减伤50%
                owner: 'self'
            },
            {
                id: 'solensen_guard_immunity',
                name: '混沌庇护',
                desc: '无强化时50%概率免疫攻击',
                phase: 'ON_BEFORE_HIT',
                condition: '!hasStatUps && random(50)',
                route: 'BlockEffect.attackImmunity',
                value: 1,
                owner: 'self'
            },
            // === [触发] - 有强化时 ===
            {
                id: 'solensen_buff_heal',
                name: '混沌吸收',
                desc: '有强化时回合结束恢复1/3最大体力',
                phase: 'ON_TURN_END',
                condition: 'hasStatUps',
                route: 'HealEffect',
                healType: 'max_percent',
                value: 33,                         // 1/3 ≈ 33%
                owner: 'self'
            },
            {
                id: 'solensen_buff_damage',
                name: '混沌反击',
                desc: '有强化时回合结束造成等量百分比伤害',
                phase: 'ON_TURN_END',
                condition: 'hasStatUps',
                route: 'DamageEffect.percent',
                value: 33,
                owner: 'opponent'
            }
        ],

        skills: [
            {
                name: "烈火净世击", type: "attack", power: 150, pp: 5, maxPp: 5,
                desc: "混沌特攻\n必中；对手无强化时伤害+100%；\n反转对手强化，成功則恢复所有体力及PP",
                priority: 0,
                effects: [
                    { id: 4001, args: [100], note: "对手无强化时伤害+100%", route: "DamageEffect" },
                    { id: 4002, args: [], note: "反转强化成功则满体力满PP", route: "StatEffect+HealEffect" }
                ]
            },
            {
                name: "混沌灭世决", type: "ultimate", power: 160, pp: 5, maxPp: 5,
                desc: "第五技能\n必中；消除对手强化，成功則對手下2次攻击无效；\n未击败对手則下2回合先制+2；\n对手每有1项能力等级与自身相同則附加120点固伤",
                priority: 0,
                effects: [
                    { id: 4003, args: [2], note: "消除强化成功则2次攻击无效", route: "StatEffect+BlockEffect.attackImmunity", owner: "self" },
                    { id: 4004, args: [2], note: "未击败则2回合先制+2", route: "TurnEffect", owner: "self" },
                    { id: 4005, args: [120], note: "每项同级能力+120固伤", route: "DamageEffect.fixed" }
                ]
            },
            {
                name: "背弃圣灵", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n全属性+1；恢复满体力并造成等量固伤；\n下2回合对手受击伤害+150%；下2回合自身先制+2",
                priority: 0,
                effects: [
                    { id: 4006, args: [], note: "全属性+1", route: "StatEffect" },
                    { id: 4007, args: [], note: "恢复满体力+等量固伤", route: "HealEffect+DamageEffect" },
                    { id: 4008, args: [2, 150], note: "2回合对手受伤+150%", route: "TurnEffect", owner: "opponent" },
                    { id: 843, args: [2, 2], note: "2回合先制+2", route: "TurnEffect", owner: "self" }
                ]
            },
            {
                name: "混沌魔域", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n5回合免疫并反弹异常；\n100%害怕，未触发則吸取1/3最大体力；\n对手全属性-1，自身体力低于对手时翻倍",
                priority: 0,
                effects: [
                    { id: 191, args: [5], note: "5回合免疫并反弹异常", route: "TurnEffect", owner: "self" },
                    { id: 4009, args: [100, 3], note: "100%害怕/吸取1/3体力", route: "StatusEffect+HealEffect" },
                    { id: 4010, args: [], note: "对手全属性-1，低血翻倍", route: "StatEffect" }
                ]
            },
            {
                name: "诸雄之主", type: "attack", power: 85, pp: 20, maxPp: 20,
                desc: "混沌特攻\n先制+3；消除对手回合效果，成功則免疫下2次异常；\n30%几率3倍伤害，自身强化时概率翻倍",
                priority: 3,                       // 标注：先制+3
                effects: [
                    { id: 4011, args: [2], note: "消除回合效果成功则2次异常免疫", route: "TurnEffect+ImmuneEffect", owner: "self" },
                    { id: 4012, args: [30], note: "30%三倍伤害，强化时60%", route: "DamageEffect" }
                ]
            }
        ]
    };

    /**
     * 同步能力等级辅助函数
     */
    function syncStats(g, solensen, opponent, source) {
        if (!solensen || !opponent) return;
        if (opponent.meta?.isBoss) return;  // BOSS无效
        
        let synced = false;
        const stats = ['atk', 'def', 'spa', 'spd', 'spe'];
        
        for (const stat of stats) {
            const opponentLevel = opponent.buffs.statUps?.[stat] || 0;
            const selfLevel = solensen.buffs.statUps?.[stat] || 0;
            
            if (opponentLevel > selfLevel) {
                opponent.buffs.statUps = opponent.buffs.statUps || {};
                opponent.buffs.statUps[stat] = selfLevel;
                synced = true;
            }
        }
        
        if (synced) {
            g.log(`【魂印·源】同步对手能力等级（${source}）！`);
            g.showFloatingText("魂印: 同步", solensen === g.player);
            g.updateUI();
        }
    }

    /**
     * 检查是否有强化
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
        timeline.on(TurnPhases.ENTRY, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            
            // 初始化状态
            actor.buffs.solensenStatBlockAura = 0;
            actor.buffs.solensenAttrBlockAura = 0;
            actor.buffs.solensenGuardReduction = false;
            actor.buffs.solensenGuardImmune = false;
            
            // [登场] 消除对手能力提升
            if (!opponent.meta?.isBoss && hasStatUps(opponent)) {
                const cleared = window.StatEffect?.clearBuffs?.(g, opponent) || g.clearStats?.(opponent);
                if (cleared) {
                    // 成功：2回合封锁强化 + 1次封锁属性技能
                    actor.buffs.solensenStatBlockAura = 2;
                    actor.buffs.solensenAttrBlockAura = 1;
                    
                    // 路由到 TurnEffect（绑定对手）
                    if (window.TurnEffect) {
                        g.addTurnEffect(opponent, '封锁强化', 2, 'block_stat_up', '无法提升能力', {
                            owner: actor.key,
                            source: 'soul_effect'
                        });
                    }
                    
                    // 路由到 CountEffect（绑定对手）
                    opponent.buffs.blockAttribute = (opponent.buffs.blockAttribute || 0) + 1;
                    
                    g.log(`【魂印·源】消除了 ${opponent.name} 的强化！2回合无法强化且下1次属性技能无效！`);
                }
            }
        });

        // === TURN_START: 回合开始 ===
        timeline.on(TurnPhases.TURN_START, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            
            // [干扰] 同步能力等级
            syncStats(g, actor, opponent, '回合开始');
            
            // [触发] 检查自身是否有强化
            const hasBuff = hasStatUps(actor);
            actor.buffs.solensenGuardReduction = !hasBuff;
            actor.buffs.solensenGuardImmune = !hasBuff;
            
            if (!hasBuff) {
                g.log(`【魂印·源】${actor.name} 无强化，当回合受到攻击伤害减半且50%免疫攻击！`);
            }
        });

        // === BEFORE_HIT: 命中前（免疫攻击判定） ===
        timeline.on(TurnPhases.BEFORE_HIT, (g, { target, attacker, skill }) => {
            if (!target || target.key !== key) return;
            if (skill?.type === 'buff') return;
            
            // [触发] 无强化时50%免疫攻击
            if (target.buffs.solensenGuardImmune && Math.random() < 0.5) {
                g.log(`【魂印·源】${target.name} 的混沌庇护发动，免疫了攻击！`);
                g.showFloatingText("免疫攻击", target === g.player);
                return { cancel: true, nullified: true };
            }
        });

        // === ON_HIT: 命中中（伤害减半） ===
        timeline.on(TurnPhases.ON_HIT, (g, { target, damageMod }) => {
            if (!target || target.key !== key) return;
            
            // [触发] 无强化时受伤减半
            if (target.buffs.solensenGuardReduction) {
                damageMod.multiplier = (damageMod.multiplier || 1) * 0.5;
                g.log(`【魂印·源】混沌守护：伤害减半！`);
            }
        });

        // === TURN_END: 回合结束 ===
        timeline.on(TurnPhases.TURN_END, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            
            // [干扰] 回合结束同步
            syncStats(g, actor, opponent, '回合结束');
            
            // [触发] 有强化时恢复+固伤
            if (hasStatUps(actor)) {
                const healAmt = Math.floor(actor.maxHp / 3);
                let actualHealed = 0;
                
                if (window.HealEffect?.heal) {
                    actualHealed = window.HealEffect.heal(g, actor, healAmt, '魂印·源');
                } else {
                    actualHealed = g.heal(actor, healAmt, "魂印·源");
                }
                
                // 造成等量百分比伤害
                if (actualHealed > 0) {
                    if (window.DamageEffect?.fixed) {
                        window.DamageEffect.fixed(g, opponent, actualHealed, '魂印·源');
                    } else {
                        opponent.hp = Math.max(0, opponent.hp - actualHealed);
                        g.log(`【魂印·源】${opponent.name} 受到了 ${actualHealed} 点固定伤害！`);
                    }
                }
            }
        });

        // 对手回合结束时也要同步
        timeline.on(TurnPhases.TURN_END, (g, { actor, opponent }) => {
            if (opponent && opponent.key === key) {
                syncStats(g, opponent, actor, '回合结束');
            }
        });

        // === GET_ICONS: 获取状态图标 ===
        timeline.on(TurnPhases.GET_ICONS, (g, { char, icons }) => {
            if (char.key !== key) return;
            
            if (char.buffs.solensenAttrBlockAura > 0) {
                icons.push({ val: char.buffs.solensenAttrBlockAura, type: 'count-effect', desc: '魂印·源: 封锁对手属性技能' });
            }
            if (char.buffs.solensenStatBlockAura > 0) {
                icons.push({ val: char.buffs.solensenStatBlockAura, type: 'turn-effect', desc: '魂印·源: 封锁对手强化' });
            }
            if (char.buffs.solensenGuardReduction) {
                icons.push({ val: '守', type: 'soul-effect', desc: '魂印·源: 混沌守护（伤害减半）' });
            }
            if (char.buffs.solensenGuardImmune) {
                icons.push({ val: '护', type: 'soul-effect', desc: '魂印·源: 混沌庇护（50%免疫）' });
            }
        });
    }

    registerSpirit(data, registerPhases);
})();
