(() => {
    const key = 'agnes';
    const data = {
        key,
        name: "不灭·艾恩斯",
        asset: "assets/agnes.png",
        maxHp: 900,
        soulMark: "火",
        soulMarkDesc: "【魂印】火\n1. 受到致命攻击时残留1点体力，消除双方能力提升及回合效果，使对手焚烬2回合（每场1次）；\n2. 回合开始若体力>对手，当回合受击使对手焚烬，否则消除对手回合效果；\n3. 回合结束若体力<对手，恢复已损失体力的1/2。",
        resist: { fixed: 0, percent: 0, trueDmg: 0 },
        
        /**
         * 魂印效果列表 (Point Form)
         * 每个效果标注：触发时机、路由目标、绑定方
         */
        soulEffects: [
            {
                id: 'agnes_fatal_survive',
                name: '不灭火魂',
                desc: '受到致命攻击时残留1点体力（每场1次）',
                phase: 'ON_FATAL_DAMAGE',           // 触发时机
                route: 'ShieldEffect',              // 路由到护盾效果
                owner: 'self',                      // 绑定方：自身
                once: true                          // 每场1次
            },
            {
                id: 'agnes_fatal_clear_buffs',
                name: '火焰净化',
                desc: '致命生存时消除双方能力提升',
                phase: 'ON_FATAL_DAMAGE',
                route: 'StatEffect.clearBuffs',
                owner: 'both'                       // 绑定方：双方
            },
            {
                id: 'agnes_fatal_clear_turns',
                name: '火焰净化',
                desc: '致命生存时消除双方回合效果',
                phase: 'ON_FATAL_DAMAGE',
                route: 'TurnEffect.dispelAll',
                owner: 'both'
            },
            {
                id: 'agnes_fatal_immolate',
                name: '焚烬惩戒',
                desc: '致命生存时使对手焚烬2回合',
                phase: 'ON_FATAL_DAMAGE',
                route: 'StatusEffect',
                status: 'immolate',
                turns: 2,
                owner: 'opponent'                   // 绑定方：对手
            },
            {
                id: 'agnes_dominance_counter',
                name: '优势反击',
                desc: '体力>对手时，当回合受击(攻击技能)使对手焚烬',
                phase: 'ON_TAKE_DAMAGE',
                condition: 'agnesDominanceVar === 1 && skill.type === "attack"',
                route: 'StatusEffect',
                status: 'immolate',
                turns: 2,
                owner: 'opponent'              // 绑定方：对手
            },
            {
                id: 'agnes_fortitude_dispel',
                name: '坚毅净化',
                desc: '体力≤对手时且对手不处于焚烬，消除对手回合效果',
                phase: 'ON_TURN_START',
                condition: 'agnesDominanceVar === 0 && !opponent.hasStatus("immolate")',
                route: 'TurnEffect.dispelAll',
                owner: 'opponent'              // 绑定方：对手
            },
            {
                id: 'agnes_regen',
                name: '不灭之躯',
                desc: '回合结束若体力<对手，恢复已损失体力的1/2',
                phase: 'ON_TURN_END',
                condition: 'hp < opponent.hp',
                route: 'HealEffect',
                healType: 'lost_percent',
                value: 50,                          // 50%已损失体力
                owner: 'self'
            }
        ],
        
        skills: [
            {
                name: "王·酷烈风息", type: "attack", power: 150, pp: 5, maxPp: 5,
                desc: "火系物攻\n必中；反转自身能力下降，成功则免疫下1次异常；\n伤害<300則對手焚烬，未觸發則自身下次傷害+100%",
                priority: 0,                        // 标注：基础先制
                effects: [
                    { id: 1221, args: [1], note: "反转自身能力下降，成功免疫1次异常" },
                    { id: 1256, args: [300, 'immolate', 1, 100], note: "伤害<300焚烬，否则下次伤害+100%" }
                ]
            },
            {
                name: "火焰精核", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n必中；全属性+1(对手异常时翻倍)；\n4回合每回合恢复1/3体力并造成等量固伤(体力<1/2翻倍)；\n下2回合先制+2",
                priority: 0,
                effects: [
                    { id: 1001, args: [1], note: "全属性+1，对手异常时翻倍", route: "StatEffect" },
                    { id: 1065, args: [4, 3, 2], note: "4回合每回合恢复1/3+等量固伤", route: "TurnEffect", owner: "self" },
                    { id: 843, args: [2, 2], note: "下2回合先制+2", route: "TurnEffect", owner: "self" }
                ]
            },
            {
                name: "火种永存", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n必中；5回合免疫并反弹异常；\n4回合每回合70%几率对手焚烬，未触发則减少對手1/3最大體力；\n免疫下1次攻击",
                priority: 0,
                effects: [
                    { id: 191, args: [5], note: "5回合免疫并反弹异常", route: "TurnEffect", owner: "self" },
                    { id: 1255, args: [4, 70, 'immolate', 3], note: "4回合70%焚烬/1/3固伤", route: "TurnEffect", owner: "self" },
                    { id: 570, args: [1], note: "免疫下1次攻击", route: "BlockEffect.attackImmunity", owner: "self" }
                ]
            },
            {
                name: "秩序之助", type: "attack", power: 85, pp: 20, maxPp: 20,
                desc: "火系物攻\n先制+3；消除对手回合效果，成功則對手2回合無法使用屬性技能；\n2回合內對手無法恢復體力",
                priority: 3,                        // 标注：先制+3
                effects: [
                    { id: 781, args: [2], note: "消除回合效果成功则封属2回合", route: "TurnEffect+BlockEffect" },
                    { id: 679, args: [2], note: "2回合对手禁疗", route: "TurnEffect", owner: "opponent" }
                ]
            },
            {
                name: "王·焚世烈焰", type: "ultimate", power: 160, pp: 5, maxPp: 5,
                desc: "第五技能\n必中；無視微弱；\n消除對手能力上升，成功則下1回合先制；\n對手異常時傷害提高75%，否則吸取1/3最大體力",
                priority: 0,
                ignoreWeaken: true,                 // 标注：无视微弱
                effects: [
                    { id: 760, args: [], note: "无视微弱", route: "DamageEffect" },
                    { id: 777, args: [1], note: "消除能力成功则先制1回合", route: "StatEffect+PriorityEffect" },
                    { id: 1048, args: [75], note: "对手异常时伤害+75%", route: "DamageEffect" },
                    { id: 1257, args: [3], note: "对手无异常时吸取1/3体力", route: "HealEffect.drain" }
                ]
            }
        ],
        flags: { fatalTriggered: false }
    };

    /**
     * 注册 TurnPhase 处理器
     */
    function registerPhases(timeline, game) {
        // === TURN_START: 回合开始 ===
        timeline.on(TurnPhases.TURN_START, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            
            // 重置回合状态
            actor.buffs.agnesFatalTriggeredThisTurn = false;
            actor.buffs.tookDamageThisTurn = false;
            actor.buffs.tookAttackDamageThisTurn = false;  // 是否受到攻击技能伤害
            
            // 设置 var：体力>对手时为1，否则为0
            actor.buffs.agnesDominanceVar = actor.hp > opponent.hp ? 1 : 0;
            
            // 判断当前状态：优势/坚毅
            actor.buffs.agnesState = actor.buffs.agnesDominanceVar === 1 ? 'dominance' : 'fortitude';
            
            // Point 2.2: 坚毅状态 - 检测对手是否处于焚烬
            if (actor.buffs.agnesState === 'fortitude') {
                // 检查对手是否有焚烬状态
                const hasImmolate = opponent.buffs.turnEffects?.some(e => e.id === 'immolate');
                
                if (!hasImmolate) {
                    // 不处于焚烬时才消除回合效果
                    const cleared = g.clearTurnEffects?.(opponent) || 
                                   (window.TurnEffect?.dispelAll?.(g, opponent));
                    if (cleared) {
                        g.log(`【魂印·火】${actor.name} 进入坚毅状态，消除了 ${opponent.name} 的回合效果！`);
                    }
                } else {
                    g.log(`【魂印·火】${actor.name} 进入坚毅状态，但对手处于焚烬中，不消除回合效果`);
                }
            } else {
                g.log(`【魂印·火】${actor.name} 进入优势状态，当回合受击(攻击技能)将使对手焚烬！`);
            }
        });

        // === ON_HIT: 受到伤害时（优势状态反击） ===
        timeline.on(TurnPhases.ON_HIT, (g, { actor, target, damage, skill, damageType }) => {
            // target 是受伤方
            if (!target || target.key !== key) return;
            if (damage <= 0) return;
            
            target.buffs.tookDamageThisTurn = true;
            
            // 判断是否为攻击技能伤害（不包括 fixed/percent）
            const isAttackDamage = skill && skill.type === 'attack' && damageType !== 'fixed' && damageType !== 'percent';
            if (isAttackDamage) {
                target.buffs.tookAttackDamageThisTurn = true;
            }
            
            // Point 2.1: 优势状态 - 受击(攻击技能)使对手焚烬
            // 条件：agnesDominanceVar === 1 且 技能类型为 attack
            if (target.buffs.agnesDominanceVar === 1 && isAttackDamage) {
                const opponent = target === g.player ? g.enemy : g.player;
                if (window.StatusEffect?.apply) {
                    const success = window.StatusEffect.apply(g, opponent, 'immolate', '焚烬', 2, '无法行动');
                    if (success) {
                        g.log(`【魂印·火】${target.name} 的优势反击使 ${opponent.name} 陷入焚烬！`);
                    }
                } else {
                    // 后备：直接添加焚烬
                    opponent.buffs.turnEffects = opponent.buffs.turnEffects || [];
                    opponent.buffs.turnEffects.push({ id: 'immolate', name: '焚烬', turns: 2 });
                    g.log(`【魂印·火】${target.name} 的优势反击使 ${opponent.name} 陷入焚烬！`);
                }
            }
        });

        // === TURN_END: 回合结束 ===
        timeline.on(TurnPhases.TURN_END, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            
            // Point 3: 体力<对手时恢复已损失体力的1/2
            if (actor.hp < opponent.hp && actor.hp > 0) {
                const lost = actor.maxHp - actor.hp;
                if (lost > 0) {
                    const healAmount = Math.floor(lost / 2);
                    if (window.HealEffect?.heal) {
                        window.HealEffect.heal(g, actor, healAmount, '魂印·火');
                    } else {
                        g.heal(actor, healAmount, "魂印·火");
                    }
                    g.log(`【魂印·火】${actor.name} 恢复了 ${healAmount} 点体力！`);
                }
            }
        });

        // === DEATH_CHECK: 致命伤害检测 ===
        timeline.on(TurnPhases.DEATH_CHECK, (g, { actor, opponent, damage }) => {
            if (!actor || actor.key !== key) return;
            if (actor.hp > 0) return;  // 没死不触发
            if (actor.flags?.fatalTriggered) return;  // 已触发过
            
            // Point 1: 致命生存
            actor.flags.fatalTriggered = true;
            actor.hp = 1;
            g.log(`【魂印·火】${actor.name} 的不灭火魂发动，残留1点体力！`);
            
            // Point 1.2 & 1.3: 消除双方能力提升和回合效果
            if (window.StatEffect?.clearBuffs) {
                window.StatEffect.clearBuffs(g, actor);
                window.StatEffect.clearBuffs(g, opponent);
                g.log(`【魂印·火】消除了双方的能力提升！`);
            }
            if (window.TurnEffect?.dispelAll) {
                window.TurnEffect.dispelAll(g, actor);
                window.TurnEffect.dispelAll(g, opponent);
                g.log(`【魂印·火】消除了双方的回合效果！`);
            }
            
            // Point 1.4: 使对手焚烬
            if (window.StatusEffect?.apply) {
                window.StatusEffect.apply(g, opponent, 'immolate', '焚烬', 2, '无法行动');
                g.log(`【魂印·火】${opponent.name} 陷入焚烬状态！`);
            }
            
            return { survived: true };
        });

        // === GET_ICONS: 获取状态图标 ===
        timeline.on(TurnPhases.GET_ICONS, (g, { char, icons }) => {
            if (char.key !== key) return;
            if (char.buffs.agnesState === 'dominance') {
                icons.push({ val: '优', type: 'soul-effect', desc: '魂印·火：优势状态，受击使对手焚烬' });
            } else if (char.buffs.agnesState === 'fortitude') {
                icons.push({ val: '坚', type: 'soul-effect', desc: '魂印·火：坚毅状态，回合开始消除对手回合效果' });
            }
            if (!char.flags?.fatalTriggered) {
                icons.push({ val: '灭', type: 'soul-effect', desc: '魂印·火：不灭火魂（未触发）' });
            }
        });
    }

    /**
     * 注册 SoulEffect 处理器
     */
    function registerSoulEffects() {
        if (!window.SoulEffect) return;
        
        const { Phases, route } = window.SoulEffect;
        
        // 定义效果列表（用于文档）
        window.SoulEffect.defineEffects(key, data.soulEffects);
    }

    registerSpirit(data, registerPhases);
    
    // 延迟注册 SoulEffect（等待模块加载）
    if (window.SoulEffect) {
        registerSoulEffects();
    } else {
        window.addEventListener('DOMContentLoaded', registerSoulEffects);
    }
})();
