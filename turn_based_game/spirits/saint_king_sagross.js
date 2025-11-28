(() => {
    const key = 'saintKingSagross';
    const data = {
        key,
        name: "圣王·萨格罗斯",
        asset: "assets/saint_king_sagross.png",
        maxHp: 850,
        soulMark: "寰",
        soulMarkDesc: "【魂印】寰\n我方每次使用属性技能则恢复自身所有PP一点，对手每次使用属性技能则使对手随机1个技能的PP值归零（BOSS无效）；\n每一次恢复体力，则下回合解除自身异常状态和能力下降状态，同时下2回合内免疫异常状态和能力下降状态且使用攻击技能50%的概率威力翻倍",
        resist: { fixed: 0, percent: 0, trueDmg: 0 },

        /**
         * 魂印效果列表 (Point Form)
         * 每个效果标注：触发时机、路由目标、绑定方
         */
        soulbuffs: [
            // === [PP操控] ===
            {
                id: 'sagross_ally_attr_pp',
                name: '寰之佑',
                desc: '我方使用属性技能则自身所有技能PP+1',
                phase: 'ON_TEAM_MEMBER_ATTR_SKILL',
                route: 'SkillEffect.restorePP',
                value: 1,                          // 每技能+1PP
                target: 'all',                     // 所有技能
                owner: 'self'
            },
            {
                id: 'sagross_enemy_attr_pp',
                name: '寰之罚',
                desc: '对手使用属性技能则对手随机1技能PP归零',
                phase: 'ON_ENEMY_ATTR_SKILL',
                route: 'SkillEffect.depletePP',
                count: 1,                          // 1个技能
                value: 0,                          // PP归零
                owner: 'opponent',
                bossInvalid: true
            },
            // === [恢复触发] ===
            {
                id: 'sagross_heal_trigger',
                name: '寰之护',
                desc: '恢复体力后下回合解除异常和弱化',
                phase: 'ON_HEAL',
                route: 'TurnEffect',
                effectId: 'sagross_cleanse_pending',
                turns: 1,
                owner: 'self'
            },
            {
                id: 'sagross_heal_immune',
                name: '寰之盾',
                desc: '恢复体力后2回合免疫异常和弱化',
                phase: 'ON_HEAL',
                route: 'ImmuneEffect',
                immuneType: ['abnormal', 'stat_down'],
                turns: 2,
                owner: 'self'
            },
            {
                id: 'sagross_heal_power',
                name: '寰之力',
                desc: '恢复体力后2回合攻击50%概率威力翻倍',
                phase: 'ON_HEAL',
                route: 'TurnEffect+HpEffect.conditionalDouble',
                turns: 2,
                chance: 50,
                skillType: 'attack',
                owner: 'self'
            }
        ],

        skills: [
            {
                name: "裂世天寰杀", type: "ultimate", power: 160, pp: 5, maxPp: 5,
                desc: "第五技能\n双方每处于1种能力提升状态则附加60点固定伤害；\n未击败对手则消除对手能力提升状态；\n若本回合击败对手则将对手的能力提升效果转移到自己身上",
                effects: [
                    { id: 1146, args: [60] },
                    { id: 1147, args: [] },
                    { id: 784, args: [] }
                ]
            },
            {
                name: "气逆乾坤决", type: "attack", power: 150, pp: 5, maxPp: 5,
                desc: "物理攻击\n反转对手能力提升状态，反转成功则己方免疫下1次受到的异常状态；\n随机附加2种异常状态",
                effects: [
                    { id: 951, args: [] },
                    { id: 786, args: [2] }
                ]
            },
            {
                name: "众生恩赐", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n令双方全属性+1；\n恢复自身最大体力的1/1；\n3回合内若自身能力提升状态消失，则消除对手回合类效果；\n下2回合令自身所有技能先制+2；\n下2回合自身攻击技能必定打出致命一击",
                effects: [
                    { id: 1145, args: [] },
                    { id: 43, args: [] },
                    { id: 1057, args: [3] },
                    { id: 843, args: [2] },
                    { id: 58, args: [2] }
                ]
            },
            {
                name: "秩序守恒", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n3回合内若对手使用属性技能，则使用属性技能后的下2回合攻击技能无法造成伤害且命中效果失效；\n3回合内70%的概率免疫对手攻击伤害，未触发则回合结束时附加120%伤害量的百分比伤害；\n吸取对手250点固定体力，每次使用额外附加100点，最高500点",
                effects: [
                    { id: 738, args: [3, 2] },
                    { id: 1024, args: [3, 70, 120] },
                    { id: 837, args: [250, 100, 500] }
                ]
            },
            {
                name: "王之蔑视", type: "attack", power: 85, pp: 20, maxPp: 20,
                desc: "物理攻击 先制+3\n消除对手回合类效果，消除成功则令对手失明；\n附加150~250点固定伤害并恢复等量体力",
                effects: [
                    { id: 889, args: [] },
                    { id: 1144, args: [150, 250] }
                ]
            }
        ]
    };

    /**
     * 异常状态列表
     */
    const ABNORMAL_STATUSES = ['burn', 'immolate', 'poison', 'sleep', 'paralyze', 'freeze', 'fear', 'confuse', 'blind', 'exhaust'];

    /**
     * 注册 TurnPhase 处理器
     */
    function registerPhases(timeline, game) {
        // === ENTRY: 登场 ===
        timeline.on(TurnPhases.ENTRY, (g, { actor }) => {
            if (!actor || actor.key !== key) return;
            
            // 初始化状态
            actor.buffs.sagrossHealTriggered = false;
            actor.buffs.sagrossPowerChance = 0;
            actor.buffs.sagrossDmgTaken = 0;
            actor.buffs.sagrossAbsorbCount = 0;
        });

        // === TURN_START: 回合开始处理恢复触发效果 ===
        timeline.on(TurnPhases.TURN_START, (g, { actor }) => {
            if (!actor || actor.key !== key) return;
            
            // [寰之护] 若上回合被标记为恢复，解除异常和弱化
            if (actor.buffs.sagrossHealTriggered) {
                actor.buffs.sagrossHealTriggered = false;
                
                // 解除异常状态
                if (actor.buffs.turnEffects) {
                    const hadAbnormal = actor.buffs.turnEffects.some(e => ABNORMAL_STATUSES.includes(e.id));
                    if (hadAbnormal) {
                        actor.buffs.turnEffects = actor.buffs.turnEffects.filter(e => !ABNORMAL_STATUSES.includes(e.id));
                        g.log(`【魂印·寰】寰之护！解除了异常状态！`);
                    }
                }
                
                // 解除能力下降
                if (actor.buffs.statUps) {
                    let hadDrop = false;
                    for (let k in actor.buffs.statUps) {
                        if (actor.buffs.statUps[k] < 0) {
                            actor.buffs.statUps[k] = 0;
                            hadDrop = true;
                        }
                    }
                    if (hadDrop) {
                        g.log(`【魂印·寰】寰之护！解除了能力下降！`);
                    }
                }
                
                // 免疫异常和能力下降 2 回合
                actor.buffs.immuneAbnormal = Math.max(actor.buffs.immuneAbnormal || 0, 2);
                actor.buffs.immuneStatDrop = Math.max(actor.buffs.immuneStatDrop || 0, 2);
                g.log(`【魂印·寰】寰之盾！2回合免疫异常和弱化！`);
                
                // 添加威力翻倍效果
                actor.buffs.sagrossPowerChance = 2;
                g.addTurnEffect(actor, '圣威', 2, 'sagross_power_chance', '攻击50%概率翻倍', {
                    owner: actor.key,
                    source: 'soul_effect'
                });
                g.log(`【魂印·寰】寰之力！2回合攻击50%概率威力翻倍！`);
            }
        });

        // === CALCULATE_DAMAGE: 50%威力翻倍 ===
        timeline.on(TurnPhases.CALCULATE_DAMAGE, (g, { attacker, skill, damageMod }) => {
            if (!attacker || attacker.key !== key) return;
            if (!skill || skill.type === 'buff') return;
            
            // [寰之力] 50%概率威力翻倍
            if (attacker.buffs.sagrossPowerChance > 0) {
                if (Math.random() < 0.5) {
                    damageMod.multiplier = (damageMod.multiplier || 1) * 2;
                    g.log(`【魂印·寰】寰之力！威力翻倍触发！`);
                    g.showFloatingText("威力翻倍！", attacker === g.player);
                }
            }
        });

        // === TURN_END: 回合结束 ===
        timeline.on(TurnPhases.TURN_END, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            
            // 递减威力翻倍回合
            if (actor.buffs.sagrossPowerChance > 0) {
                actor.buffs.sagrossPowerChance--;
            }

            // 处理秩序守恒的伤害回弹逻辑
            if (actor.buffs.sagrossDmgTaken > 0) {
                const hasDodge = actor.buffs.turnEffects?.some(e => e.id === 'sagross_dodge');
                if (hasDodge) {
                    const dmg = Math.floor(actor.buffs.sagrossDmgTaken * 1.2);
                    if (window.HpEffect?.percent) {
                        window.HpEffect.percent(g, opponent, dmg, '秩序守恒');
                    } else {
                        opponent.hp = Math.max(0, opponent.hp - dmg);
                        g.log(`【魂印·寰】秩序守恒反击！${opponent.name} 受到 ${dmg} 点伤害！`);
                    }
                }
                actor.buffs.sagrossDmgTaken = 0;
            }
        });

        // === AFTER_SKILL: 技能使用后（PP操控）===
        timeline.on(TurnPhases.AFTER_HIT, (g, payload) => {
            const actor = payload.actor;
            const skill = payload.skill;
            if (!actor || !skill) return;

            // 找到圣王·萨格罗斯在场上的实例
            const sag = [g.player, g.enemy].find(c => c && c.key === key && c.hp > 0);
            if (!sag) return;

            // 判断是否为属性技能
            if (skill.type === 'buff') {
                // 判断使用者与萨格罗斯是否同队
                const sagIsPlayer = sag === g.player;
                const actorIsPlayer = actor === g.player;
                const sameTeam = sagIsPlayer === actorIsPlayer;
                
                if (sameTeam) {
                    // [寰之佑] 我方使用属性技能：萨格罗斯所有技能PP+1
                    if (sag.skills && sag.skills.length) {
                        let restored = false;
                        for (const s of sag.skills) {
                            if (s.pp < s.maxPp) {
                                s.pp = Math.min(s.maxPp, s.pp + 1);
                                restored = true;
                            }
                        }
                        if (restored) {
                            g.log(`【魂印·寰】寰之佑！因我方使用属性技能，所有技能PP+1！`);
                            g.updateUI();
                        }
                    }
                } else {
                    // [寰之罚] 对手使用属性技能：对手随机1技能PP归零
                    const isBoss = actor.meta?.isBoss;
                    if (!isBoss) {
                        const skills = actor.skills || [];
                        const candidates = skills.filter(s => (s.pp || 0) > 0);
                        if (candidates.length > 0) {
                            const pick = candidates[Math.floor(Math.random() * candidates.length)];
                            pick.pp = 0;
                            g.log(`【魂印·寰】寰之罚！${actor.name} 的 ${pick.name} PP归零！`);
                            g.updateUI();
                        }
                    }
                }
            }
        });

        // === ON_HIT: 记录受到的伤害（秩序守恒） ===
        timeline.on(TurnPhases.ON_HIT, (g, { target, damage }) => {
            if (!target || target.key !== key) return;
            
            // 记录本回合受到的伤害
            target.buffs.sagrossDmgTaken = (target.buffs.sagrossDmgTaken || 0) + damage;
        });

        // === GET_ICONS: 获取状态图标 ===
        timeline.on(TurnPhases.GET_ICONS, (g, { char, icons }) => {
            if (char.key !== key) return;
            
            if (char.buffs.sagrossPowerChance > 0) {
                icons.push({ val: char.buffs.sagrossPowerChance, type: 'turn-effect', desc: '魂印·寰: 寰之力（攻击50%翻倍）' });
            }
            if (char.buffs.immuneAbnormal > 0) {
                icons.push({ val: char.buffs.immuneAbnormal, type: 'turn-effect', desc: '魂印·寰: 寰之盾（免疫异常）' });
            }
            if (char.buffs.immuneStatDrop > 0) {
                icons.push({ val: char.buffs.immuneStatDrop, type: 'turn-effect', desc: '魂印·寰: 寰之盾（免疫弱化）' });
            }
        });
    }

    // === SoulBuff 注册（恢复体力触发）===
    function registerSoulBuffs() {
        if (!window.SoulBuff) return;
        
        window.SoulBuff.register(key, window.SoulBuff.Phases.ON_HEAL, (g, payload) => {
            const tgt = payload.target;
            if (!tgt || tgt.key !== key) return;
            
            // 标记已恢复，下回合开始时处理
            tgt.buffs = tgt.buffs || {};
            tgt.buffs.sagrossHealTriggered = true;
            g.log(`【魂印·寰】${tgt.name} 恢复了体力，下回合将触发寰之效果！`);
        });
    }

    registerSpirit(data, registerPhases);
    
    // 延迟注册 SoulBuff
    if (window.SoulBuff) {
        registerSoulBuffs();
    } else {
        window.addEventListener('DOMContentLoaded', registerSoulBuffs);
    }
})();
