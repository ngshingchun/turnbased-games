/**
 * TurnEffect - 回合效果注册表
 * 处理所有基于回合数的效果：每回合递减，到期触发
 * 
 * 职责：
 * 1. 回合效果的增删改查
 * 2. 回合开始/结束的效果处理
 * 3. 消除回合效果（原 DispelEffect.turnEffects）
 * 
 * SkillEffect、SoulBuff 会路由到这里
 */
(() => {
    const registry = {};

    /**
     * 注册回合效果处理器
     */
    function register(key, handler) {
        if (!key || typeof handler !== 'function') return;
        registry[key] = handler;
    }

    /**
     * 执行回合效果
     */
    function run(key, game, payload) {
        if (registry[key]) {
            registry[key](game, payload);
        }
    }

    /**
     * 回合开始处理
     */
    function onTurnStart(game, char, opponent) {
        // 遍历回合效果，触发开始逻辑
        char.buffs.turnEffects.forEach(effect => {
            if (registry[`${effect.id}_start`]) {
                registry[`${effect.id}_start`](game, { char, opponent, effect });
            }
        });
    }

    /**
     * 回合结束处理
     */
    function onTurnEnd(game, char, opponent) {
        const toRemove = [];

        // 遍历回合效果，触发结束逻辑
        for (let i = char.buffs.turnEffects.length - 1; i >= 0; i--) {
            const effect = char.buffs.turnEffects[i];

            // 执行每回合效果
            if (registry[`${effect.id}_tick`]) {
                registry[`${effect.id}_tick`](game, { char, opponent, effect });
            }

            // 递减回合数
            effect.turns--;

            // 到期处理
            if (effect.turns <= 0) {
                // 执行到期效果
                if (registry[`${effect.id}_expire`]) {
                    registry[`${effect.id}_expire`](game, { char, opponent, effect });
                }
                toRemove.push(i);
            }
        }

        // 移除到期效果
        toRemove.forEach(idx => {
            const effect = char.buffs.turnEffects[idx];
            game.log(`${char.name} 的 ${effect.name} 效果结束了。`);
            game.showFloatingText(`${effect.name} 结束`, char === game.player, '#aaa');
            char.buffs.turnEffects.splice(idx, 1);
        });

        // 递减其他回合计数器
        decrementBuffs(game, char);
    }

    /**
     * 递减各种回合计数器
     */
    function decrementBuffs(game, char) {
        if (char.buffs.priorityNext > 0) char.buffs.priorityNext--;
        if (char.buffs.priorityForceNext > 0) char.buffs.priorityForceNext--;
        if (char.buffs.critNext > 0) char.buffs.critNext--;
        if (char.buffs.immuneAbnormal > 0) char.buffs.immuneAbnormal--;
        if (char.buffs.immuneStatDrop > 0) char.buffs.immuneStatDrop--;
        if (char.buffs.solensenStatBlockAura > 0) char.buffs.solensenStatBlockAura--;
        if (char.buffs.starRageDamageBuffTurns > 0) char.buffs.starRageDamageBuffTurns--;
        if (char.buffs.starRagePriorityTurns > 0) char.buffs.starRagePriorityTurns--;
        if (char.buffs.starRageUnremovableTurns > 0) char.buffs.starRageUnremovableTurns--;
        
        if (char.buffs.starRageChanceTurns > 0) {
            char.buffs.starRageChanceTurns--;
            if (char.buffs.starRageChanceTurns === 0) {
                char.buffs.starRageChanceFactor = 1;
                char.buffs.starRageChanceBonus = 0;
            }
        }
    }

    // ========== 内置效果处理器 ==========

    // 毒伤害
    register('poison_tick', (game, { char, opponent, effect }) => {
        window.HpEffect?.statusDamage(game, char, 'poison');
    });

    // 冻伤伤害
    register('frostbite_tick', (game, { char, opponent, effect }) => {
        window.HpEffect?.statusDamage(game, char, 'frostbite');
    });

    // 烧伤伤害
    register('burn_tick', (game, { char, opponent, effect }) => {
        window.HpEffect?.statusDamage(game, char, 'burn');
    });

    // 焚烬伤害
    register('immolate_tick', (game, { char, opponent, effect }) => {
        window.HpEffect?.statusDamage(game, char, 'immolate');
    });

    // 焚烬到期转化
    register('immolate_expire', (game, { char, opponent, effect }) => {
        window.StatusEffect?.apply(game, char, 'burn', '烧伤', 2);
        window.StatEffect?.modify(game, char, { accuracy: -1 });
        game.log(`${char.name} 的焚烬转化为烧伤，命中降低！`);
    });

    // 沉默伤害
    register('silence_tick', (game, { char, opponent, effect }) => {
        window.HpEffect?.statusDamage(game, char, 'silence');
    });

    // 流血伤害
    register('bleed_tick', (game, { char, opponent, effect }) => {
        window.HpEffect?.statusDamage(game, char, 'bleed');
    });

    // 寄生吸取
    register('parasite_tick', (game, { char, opponent, effect }) => {
        const dmg = window.HpEffect?.statusDamage(game, char, 'parasite');
        if (dmg > 0) {
            window.HpEffect?.heal(game, opponent, dmg, "寄生");
        }
    });

    // 烈焰诅咒
    register('curse_fire_tick', (game, { char, opponent, effect }) => {
        window.HpEffect?.statusDamage(game, char, 'curse_fire');
    });

    // 诅咒到期转化
    register('curse_expire', (game, { char, opponent, effect }) => {
        const curseTypes = [
            { name: '烈焰诅咒', id: 'curse_fire', desc: '每回合受到1/8最大体力伤害' },
            { name: '致命诅咒', id: 'curse_fatal', desc: '受到的攻击伤害提升50%' },
            { name: '虚弱诅咒', id: 'curse_weak', desc: '造成的攻击伤害降低50%' }
        ];
        const chosen = curseTypes[Math.floor(Math.random() * curseTypes.length)];
        window.StatusEffect?.apply(game, char, chosen.id, chosen.name, 2, chosen.desc);
    });

    // 冰冻到期转化
    register('freeze_expire', (game, { char, opponent, effect }) => {
        window.StatusEffect?.apply(game, char, 'frostbite', '冻伤', 2);
        window.StatEffect?.modify(game, char, { speed: -1 });
        game.log(`${char.name} 的冰冻解除，转化为冻伤且速度下降！`);
    });

    // 感染到期转化
    register('infect_expire', (game, { char, opponent, effect }) => {
        window.StatusEffect?.apply(game, char, 'poison', '中毒', 2);
        window.StatEffect?.modify(game, char, { attack: -1, specialAttack: -1 });
    });

    // 束缚结束伤害
    register('bind_expire', (game, { char, opponent, effect }) => {
        const dmg = Math.floor(char.maxHp / 8);
        window.HpEffect?.fixed(game, char, dmg, "束缚结束");
    });

    // 水厄伤害
    register('water_curse_tick', (game, { char, opponent, effect }) => {
        const stacks = char.buffs.waterCurseStack || 1;
        const pct = 0.2 * stacks;
        window.HpEffect?.percent(game, char, pct, `水厄伤害(层数:${stacks})`);
    });

    register('water_curse_expire', (game, { char }) => {
        char.buffs.waterCurseStack = 0;
    });

    // 再生效果
    register('regen_tick', (game, { char, opponent, effect }) => {
        if (!window.StatusEffect?.isControlled(char)) {
            window.HpEffect?.regenPercent(game, char, 1/8, "再生");
        }
    });

    // 火焰精核
    register('fire_core_tick', (game, { char, opponent, effect }) => {
        if (window.StatusEffect?.isControlled(char)) return;

        const params = effect.params || [4, 3, 2];
        const healRatio = params[1];
        const lowHpRatio = params[2];

        let mult = (char.hp < char.maxHp / lowHpRatio) ? 2 : 1;
        const amount = Math.floor(char.maxHp / healRatio) * mult;

        window.HpEffect?.heal(game, char, amount, "火焰精核");
        window.HpEffect?.fixed(game, opponent, amount, "火焰精核");
    });

    // 吸血效果
    register('absorb_hp_skill_tick', (game, { char, opponent, effect }) => {
        if (window.StatusEffect?.isControlled(char)) return;

        const params = effect.params || [4, 3];
        const ratio = params[1] || 3;

        if (!game.isStarSovereign(opponent)) {
            window.HpEffect?.drainPercent(game, char, opponent, 1/ratio, "吸血");
        } else {
            game.log(`${opponent.name} 魂印免疫百分比吸取！`);
        }
    });

    // 属性循环提升
    register('stat_up_loop_tick', (game, { char, opponent, effect }) => {
        window.StatEffect?.modify(game, char, { attack: 1, speed: 1 });
    });

    // 吸取循环
    register('absorb_loop_tick', (game, { char, opponent, effect }) => {
        const absorbAmt = (char.hp < char.maxHp / 2) 
            ? Math.floor(opponent.maxHp * 2 / 3) 
            : Math.floor(opponent.maxHp / 3);
        window.HpEffect?.drain(game, char, opponent, absorbAmt, "无始源光");
    });

    // 火种永存
    register('eternal_fire_tick', (game, { char, opponent, effect }) => {
        if (window.StatusEffect?.isControlled(char)) return;

        const params = effect.params || [4, 70, '焚烬', 3];
        const chance = params[1];
        const statusName = params[2];
        const cutRatio = params[3];

        const statusMap = { '焚烬': 'immolate', '烧伤': 'burn', '冰封': 'freeze', '害怕': 'fear', '麻痹': 'paralyze', '睡眠': 'sleep', '中毒': 'poison' };
        const statusId = statusMap[statusName] || 'burn';

        if (Math.random() * 100 < chance) {
            window.StatusEffect?.apply(game, opponent, statusId, statusName, 2);
            game.log(`火种永存！触发${statusName}！`);
        } else {
            const cut = Math.floor(opponent.maxHp / cutRatio);
            window.HpEffect?.fixed(game, opponent, cut, "火种永存");
        }
    });

    // ========== 新增效果处理器 ==========

    // 反弹异常（反弹给攻击方）
    register('reflect_status_tick', (game, { char, opponent, effect }) => {
        // 回合开始检查，实际反弹逻辑在 StatusEffect 中处理
    });

    // 免疫攻击（通过 BlockEffect 处理）
    register('immune_next_attack_start', (game, { char, opponent, effect }) => {
        // 确保免疫标记存在
        if (!char.buffs.attackImmunityCount) {
            char.buffs.attackImmunityCount = effect.count || 1;
        }
    });

    // 封锁属性技能
    register('block_attr_start', (game, { char, opponent, effect }) => {
        game.log(`${char.name} 无法使用属性技能！`);
    });

    // 禁疗效果
    register('heal_block_start', (game, { char, opponent, effect }) => {
        char.buffs.healBlocked = true;
    });
    register('heal_block_expire', (game, { char, opponent, effect }) => {
        char.buffs.healBlocked = false;
    });

    // 免疫能力下降
    register('immune_stat_drop_start', (game, { char, opponent, effect }) => {
        char.buffs.immuneStatDrop = effect.turns;
    });

    // 易伤效果
    register('vulnerability_start', (game, { char, opponent, effect }) => {
        const params = effect.params || [2, 100];
        char.buffs.vulnerabilityMultiplier = params[1] || 100;
    });
    register('vulnerability_expire', (game, { char, opponent, effect }) => {
        char.buffs.vulnerabilityMultiplier = 0;
    });

    // 疲惫效果（跳过回合）
    register('exhaust_start', (game, { char, opponent, effect }) => {
        char.buffs.exhausted = true;
        game.log(`${char.name} 因疲惫无法行动！`);
    });
    register('exhaust_expire', (game, { char, opponent, effect }) => {
        char.buffs.exhausted = false;
    });

    // 失明效果（命中率降低）
    register('blind_start', (game, { char, opponent, effect }) => {
        char.buffs.blinded = true;
    });
    register('blind_expire', (game, { char, opponent, effect }) => {
        char.buffs.blinded = false;
    });

    // 先制下降
    register('priority_down_start', (game, { char, opponent, effect }) => {
        char.buffs.priorityPenalty = (char.buffs.priorityPenalty || 0) + 2;
    });
    register('priority_down_expire', (game, { char, opponent, effect }) => {
        char.buffs.priorityPenalty = Math.max(0, (char.buffs.priorityPenalty || 0) - 2);
    });

    // PP诅咒（使用属性技能减PP）
    register('pp_curse_attr_tick', (game, { char, opponent, effect }) => {
        // 实际扣除逻辑在技能使用时检查
    });

    // 封锁强化
    register('block_stat_up_start', (game, { char, opponent, effect }) => {
        char.buffs.statUpBlocked = true;
    });
    register('block_stat_up_expire', (game, { char, opponent, effect }) => {
        char.buffs.statUpBlocked = false;
    });

    // 固定伤害循环
    register('fixed_damage_loop_tick', (game, { char, opponent, effect }) => {
        if (window.StatusEffect?.isControlled(char)) return;
        const dmg = effect.damage || 150;
        window.HpEffect?.fixed(game, opponent, dmg, effect.name || "固定伤害");
    });

    // 英卡洛斯技能陷阱（使用技能则失明，否则受伤）
    register('incalos_skill_trap_tick', (game, { char, opponent, effect }) => {
        if (char.buffs.usedSkillThisTurn) {
            window.StatusEffect?.apply(game, char, 'blind', '失明', 2);
            game.log(`【光之惩戒】使用技能触发失明！`);
        } else {
            const dmg = Math.floor(char.maxHp / 3);
            window.HpEffect?.fixed(game, char, dmg, "光之惩戒");
        }
    });

    // 英卡洛斯受击陷阱（受击则对手疲惫，否则吸取）
    register('incalos_hit_trap_tick', (game, { char, opponent, effect }) => {
        if (char.buffs.tookDamageThisTurn) {
            window.StatusEffect?.apply(game, opponent, 'exhaust', '疲惫', 1);
            game.log(`【光之惩戒】受击触发对手疲惫！`);
        } else {
            const absorbAmt = Math.floor(opponent.maxHp / 3);
            window.HpEffect?.drain(game, char, opponent, absorbAmt, "光之惩戒");
        }
    });

    // 萨格罗斯能力守护（能力消失则消除对手回合效果）
    register('sagross_stat_guard_tick', (game, { char, opponent, effect }) => {
        // 检查是否有能力被消除（需要在 StatEffect 中配合标记）
        if (char.buffs.statWasCleared) {
            dispel(game, opponent);
            game.log(`【魂印·寰】能力守护触发！消除对手回合效果！`);
            char.buffs.statWasCleared = false;
        }
    });

    // 萨格罗斯秩序陷阱（使用属性技能则2回合攻击无效）
    register('sagross_order_trap_tick', (game, { char, opponent, effect }) => {
        if (char.buffs.usedAttrSkillThisTurn) {
            char.buffs.blockAttack = (char.buffs.blockAttack || 0) + 2;
            game.log(`【秩序守恒】使用属性技能！下2回合攻击技能无效！`);
        }
    });

    // 萨格罗斯闪避（70%闪避，失败则反击）
    register('sagross_dodge_start', (game, { char, opponent, effect }) => {
        char.buffs.sagrossDodgeActive = true;
    });
    register('sagross_dodge_expire', (game, { char, opponent, effect }) => {
        char.buffs.sagrossDodgeActive = false;
    });

    // 圣甲盖亚属性陷阱（对手攻击后自身全属性+1）
    register('mecha_gaia_stat_trap_tick', (game, { char, opponent, effect }) => {
        if (opponent.buffs.usedAttackThisTurn) {
            window.StatEffect?.modify(game, char, { attack: 1, defense: 1, speed: 1, specialAttack: 1, specialDefense: 1 });
            game.log(`【霸威冠宇】对手使用攻击技能！自身全属性+1！`);
        }
    });

    // 艾夏拉睡眠陷阱（受击则睡眠，否则弱化）
    register('aishala_sleep_trap_tick', (game, { char, opponent, effect }) => {
        if (char.buffs.tookDamageThisTurn) {
            window.StatusEffect?.apply(game, opponent, 'sleep', '睡眠', 2);
            game.log(`【虚妄幻境】受击触发对手睡眠！`);
        } else {
            window.StatEffect?.modify(game, opponent, { attack: -1, defense: -1, speed: -1, specialAttack: -1, specialDefense: -1 });
            game.log(`【虚妄幻境】未受击！对手全属性-1！`);
        }
    });

    // 艾夏拉闪避（80%闪避，失败则清PP）
    register('aishala_dodge_tick', (game, { char, opponent, effect }) => {
        // 闪避逻辑在 BEFORE_HIT 中处理
    });

    // 萨格罗斯威力翻倍（伤害计算时处理）
    register('sagross_power_chance_tick', (game, { char, opponent, effect }) => {
        // 实际处理在 CALCULATE_DAMAGE 中
    });

    // 瀚空之门（干扰对手技能）
    register('star_gate_tick', (game, { char, opponent, effect }) => {
        // 干扰逻辑根据具体实现
    });

    // ========== 消除功能（原 DispelEffect） ==========

    /**
     * 消除回合效果
     * @param {Object} options - { excludeUndispellable, silent }
     * @returns {boolean} 是否有消除
     */
    function dispel(game, target, options = {}) {
        const { excludeUndispellable = true, silent = false } = options;
        
        // 检查不可驱散
        if (excludeUndispellable && target.buffs.starRageUnremovableTurns > 0) {
            if (!silent) game.log(`${target.name} 的回合效果无法被消除！`);
            return false;
        }

        if (target.buffs.turnEffects.length === 0) {
            if (!silent) game.log(`${target.name} 没有可消除的回合效果。`);
            return false;
        }

        // 过滤不可驱散效果
        if (excludeUndispellable) {
            const dispellable = target.buffs.turnEffects.filter(e => !e.cannotDispel);
            const undispellable = target.buffs.turnEffects.filter(e => e.cannotDispel);
            
            if (dispellable.length === 0) {
                if (!silent) game.log(`${target.name} 没有可消除的回合效果。`);
                return false;
            }

            target.buffs.turnEffects = undispellable;
        } else {
            target.buffs.turnEffects = [];
        }

        if (!silent) game.log(`消除了 ${target.name} 的回合效果！`);
        game.updateUI();
        return true;
    }

    /**
     * 消除异常状态
     */
    function dispelAbnormal(game, target, silent = false) {
        const abnormals = target.buffs.turnEffects.filter(e => 
            window.StatusEffect?.isAbnormal(e.id)
        );
        
        if (abnormals.length === 0) {
            if (!silent) game.log(`${target.name} 没有异常状态。`);
            return false;
        }

        target.buffs.turnEffects = target.buffs.turnEffects.filter(e => 
            !window.StatusEffect?.isAbnormal(e.id)
        );

        if (!silent) game.log(`消除了 ${target.name} 的异常状态！`);
        game.updateUI();
        return true;
    }

    /**
     * 消除指定效果
     */
    function dispelSpecific(game, target, effectId, silent = false) {
        const idx = target.buffs.turnEffects.findIndex(e => e.id === effectId);
        if (idx !== -1) {
            const effect = target.buffs.turnEffects[idx];
            target.buffs.turnEffects.splice(idx, 1);
            if (!silent) game.log(`消除了 ${target.name} 的 ${effect.name} 效果！`);
            game.updateUI();
            return true;
        }
        return false;
    }

    /**
     * 检查是否有可消除效果
     */
    function hasDispellable(target) {
        return target.buffs.turnEffects.some(e => !e.cannotDispel);
    }

    window.TurnEffect = { 
        register, 
        run, 
        onTurnStart, 
        onTurnEnd,
        decrementBuffs,
        // 消除功能
        dispel,
        dispelAbnormal,
        dispelSpecific,
        hasDispellable
    };
})();
