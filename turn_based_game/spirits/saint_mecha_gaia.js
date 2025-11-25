(() => {
    const key = 'saintMechaGaia';
    const data = {
        key,
        name: "圣甲·盖亚",
        asset: "assets/saint_mecha_gaia.png",
        maxHp: 800,
        soulMark: "狂",
        soulMarkDesc: "【魂印】狂\n[拦截效果]：受到致死技能伤害时于当回合结束后直接扣除对手等于其造成攻击伤害数值的体力（若双方同时死亡则自身恢复1点体力）（boss无效）；\n[恢复效果]：自身出手起则每回合结束后恢复自身最大体力的1/3（boss有效）",
        resist: { fixed: 0, percent: 0, trueDmg: 0 },

        /**
         * 魂印效果列表 (Point Form)
         */
        soulEffects: [
            // === [拦截效果] ===
            {
                id: 'mecha_gaia_intercept',
                name: '狂之拦截',
                desc: '受到致死技能伤害时，回合结束后扣除对手等量伤害体力',
                phase: 'ON_FATAL_DAMAGE',
                route: 'CountEffect',
                effectId: 'intercept_damage',
                owner: 'self',
                bossInvalid: true
            },
            {
                id: 'mecha_gaia_mutual_ko',
                name: '狂之不屈',
                desc: '若双方同时死亡则自身恢复1点体力',
                phase: 'ON_DEATH_CHECK',
                condition: 'bothDead',
                route: 'HealEffect',
                value: 1,
                owner: 'self'
            },
            // === [恢复效果] ===
            {
                id: 'mecha_gaia_regen',
                name: '狂之回复',
                desc: '出手后每回合结束恢复1/3最大体力',
                phase: 'ON_TURN_END',
                condition: 'hasActedThisBattle',
                route: 'HealEffect',
                healType: 'max_percent',
                value: 33,
                owner: 'self'
            }
        ],

        skills: [
            {
                name: "破釜沉舟战", type: "ultimate", power: 160, pp: 5, maxPp: 5,
                desc: "第五技能\n消除对手回合类效果，消除成功则攻击+2、速度+2；\n附加所造成伤害值40%的固定伤害",
                priority: 0,
                effects: [
                    { id: 901, args: [], note: "消除回合效果成功则攻击+2速度+2", route: "TurnEffect.clear+StatEffect" },
                    { id: 422, args: [40], note: "附加伤害40%固伤", route: "DamageEffect.fixed" }
                ]
            },
            {
                name: "霸威冠宇", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n技能使用成功时，攻击+1、防御+1、特攻+1、特防+1、速度+1、命中+1；\n3回合内若对手使用攻击技能则使用后令自身全属性+1；\n5回合内免疫并反弹所有受到的异常状态",
                priority: 0,
                effects: [
                    { id: 585, args: [1], note: "全属性+1", route: "StatEffect" },
                    { id: 806, args: [3], note: "3回合对手攻击后自身全属性+1", route: "TurnEffect", owner: "self" },
                    { id: 191, args: [5], note: "5回合免疫反弹异常", route: "TurnEffect", owner: "self" }
                ]
            },
            {
                name: "圣甲气魄", type: "buff", power: 0, pp: 5, maxPp: 5,
                desc: "属性攻击\n4回合内每回合都能附加150点固定伤害；\n2回合内令对手使用的属性技能无效；\n吸取对手200点体力，体力低于对手时吸取效果翻倍",
                priority: 0,
                effects: [
                    { id: 60, args: [4, 150], note: "4回合每回合150固伤", route: "TurnEffect+DamageEffect.fixed", owner: "self" },
                    { id: 478, args: [2], note: "2回合对手属性技能无效", route: "TurnEffect", owner: "opponent" },
                    { id: 894, args: [200], note: "吸取200体力(低血翻倍)", route: "HealEffect.drain+DamageEffect" }
                ]
            },
            {
                name: "天威凛怒拳", type: "attack", power: 150, pp: 5, maxPp: 5,
                desc: "物理攻击\n当回合击败对手则下回合开始后随机附加1种异常状态；\n若对手体力不足300则直接秒杀",
                priority: 0,
                effects: [
                    { id: 826, args: [1], note: "击败则下回合随机异常", route: "StatusEffect.random", condition: "ko" },
                    { id: 456, args: [300], note: "对手<300体力秒杀", route: "DamageEffect.execute" }
                ]
            },
            {
                name: "狂绝冲撞", type: "attack", power: 85, pp: 20, maxPp: 20,
                desc: "物理攻击 先制+3\n吸取对手能力提升，吸取成功减少对手1/3最大体力；\n下2回合自身造成的攻击伤害翻倍",
                priority: 3,
                effects: [
                    { id: 859, args: [], note: "吸取强化成功则1/3体力固伤", route: "StatEffect.steal+DamageEffect.percent" },
                    { id: 776, args: [2], note: "2回合攻击伤害翻倍", route: "TurnEffect", owner: "self" }
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
            actor.buffs.mechaGaiaHealActive = false;
            actor.buffs.mechaGaiaInterceptDamage = 0;
            actor.buffs.mechaGaiaHasActed = false;
        });

        // === AFTER_HIT: 出手后标记 ===
        timeline.on(TurnPhases.AFTER_HIT, (g, { actor }) => {
            if (!actor || actor.key !== key) return;
            
            // 标记已出手，激活恢复效果
            actor.buffs.mechaGaiaHasActed = true;
            actor.buffs.mechaGaiaHealActive = true;
        });

        // === ON_HIT: 受到伤害记录 ===
        timeline.on(TurnPhases.ON_HIT, (g, { target, attacker, damage, skill }) => {
            if (!target || target.key !== key) return;
            if (damage <= 0) return;
            
            // 检查是否致死
            if (target.hp - damage <= 0 && skill?.type === 'attack') {
                // BOSS无效
                if (!attacker.meta?.isBoss) {
                    // 记录致死伤害值，回合结束时反馈
                    target.buffs.mechaGaiaInterceptDamage = damage;
                    g.log(`【魂印·狂】拦截效果触发！记录伤害 ${damage}！`);
                }
            }
        });

        // === TURN_END: 回合结束 ===
        timeline.on(TurnPhases.TURN_END, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            
            // [恢复效果] 出手后每回合恢复1/3最大体力
            if (actor.buffs.mechaGaiaHealActive && actor.hp > 0) {
                const healAmt = Math.floor(actor.maxHp / 3);
                if (window.HealEffect?.heal) {
                    window.HealEffect.heal(g, actor, healAmt, '魂印·狂');
                } else {
                    g.heal(actor, healAmt, "魂印·狂");
                }
            }
            
            // [拦截效果] 反馈伤害给对手
            if (actor.buffs.mechaGaiaInterceptDamage > 0 && opponent && opponent.hp > 0) {
                const dmg = actor.buffs.mechaGaiaInterceptDamage;
                if (window.DamageEffect?.fixed) {
                    window.DamageEffect.fixed(g, opponent, dmg, '魂印·狂');
                } else {
                    opponent.hp = Math.max(0, opponent.hp - dmg);
                    g.log(`【魂印·狂】拦截反击！${opponent.name} 受到 ${dmg} 点伤害！`);
                }
                actor.buffs.mechaGaiaInterceptDamage = 0;
            }
        });

        // === DEATH_CHECK: 死亡检测（双方同死） ===
        timeline.on(TurnPhases.DEATH_CHECK, (g, { actor, opponent }) => {
            if (!actor || actor.key !== key) return;
            
            // 若双方同时死亡，自身恢复1点体力
            if (actor.hp <= 0 && opponent && opponent.hp <= 0) {
                actor.hp = 1;
                g.log(`【魂印·狂】狂之不屈发动！${actor.name} 恢复1点体力！`);
                g.showFloatingText("狂之不屈", actor === g.player);
                return { survived: true };
            }
        });

        // === GET_ICONS: 获取状态图标 ===
        timeline.on(TurnPhases.GET_ICONS, (g, { char, icons }) => {
            if (char.key !== key) return;
            
            if (char.buffs.mechaGaiaHealActive) {
                icons.push({ val: '狂', type: 'soul-effect', desc: '魂印·狂: 每回合恢复1/3体力' });
            }
            if (char.buffs.mechaGaiaInterceptDamage > 0) {
                icons.push({ val: char.buffs.mechaGaiaInterceptDamage, type: 'count-effect', desc: '魂印·狂: 待反馈伤害' });
            }
        });
    }

    registerSpirit(data, registerPhases);
})();
