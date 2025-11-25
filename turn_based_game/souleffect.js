/**
 * SoulEffect - 魂印效果系统
 * 与 TurnEffect、CountEffect 同层级
 * 
 * 每个精灵有独特的魂印，SoulEffect 负责：
 * 1. 注册精灵特有的魂印处理器
 * 2. 在对应节点触发魂印效果
 * 3. 路由到 TurnEffect/CountEffect/StatEffect 等底层系统
 * 
 * 重要：所有 TurnEffect 和 CountEffect 必须绑定所属方 (owner)
 */
(() => {
    const registry = {};
    const spiritEffects = {};  // 存储精灵魂印效果定义

    /**
     * 魂印触发节点
     */
    const Phases = {
        // === 登场/退场 ===
        ON_ENTRY: 'on_entry',                     // 登场时
        ON_SWITCH_OUT: 'on_switch_out',           // 下场时
        
        // === 回合流程 ===
        ON_TURN_START: 'on_turn_start',           // 回合开始
        ON_BEFORE_MOVE: 'on_before_move',         // 技能使用前
        ON_BEFORE_HIT: 'on_before_hit',           // 命中前
        ON_CALCULATE_DAMAGE: 'on_calculate_damage', // 伤害计算时
        ON_HIT: 'on_hit',                         // 命中中
        ON_AFTER_HIT: 'on_after_hit',             // 命中后
        ON_TURN_END: 'on_turn_end',               // 回合结束
        
        // === 技能相关 ===
        ON_SELF_SKILL: 'on_self_skill',           // 自身使用任意技能
        ON_SELF_ATTR_SKILL: 'on_self_attr_skill', // 自身使用属性技能
        ON_SELF_ATTACK_SKILL: 'on_self_attack_skill', // 自身使用攻击技能
        ON_ENEMY_SKILL: 'on_enemy_skill',         // 对手使用任意技能
        ON_ENEMY_ATTR_SKILL: 'on_enemy_attr_skill', // 对手使用属性技能
        ON_ENEMY_ATTACK_SKILL: 'on_enemy_attack_skill', // 对手使用攻击技能
        ON_SKILL_NULLIFIED: 'on_skill_nullified', // 技能被无效化时
        
        // === 伤害相关 ===
        ON_DEAL_DAMAGE: 'on_deal_damage',         // 造成伤害时
        ON_TAKE_DAMAGE: 'on_take_damage',         // 受到伤害时
        ON_TAKE_FIXED_DAMAGE: 'on_take_fixed_damage', // 受到固定伤害时
        ON_NO_DAMAGE_TAKEN: 'on_no_damage_taken', // 本回合未受伤害时
        
        // === 生死相关 ===
        ON_KILL: 'on_kill',                       // 击败对手时
        ON_FATAL_DAMAGE: 'on_fatal_damage',       // 受到致命伤害时
        ON_DEATH: 'on_death',                     // 死亡时
        ON_DEATH_CHECK: 'on_death_check',         // 死亡检测时
        
        // === 治疗相关 ===
        ON_HEAL: 'on_heal',                       // 恢复体力时
        ON_BEFORE_HEAL: 'on_before_heal',         // 治疗前
        
        // === 状态相关 ===
        ON_STATUS_APPLY: 'on_status_apply',       // 被施加状态时
        ON_STATUS_CLEAR: 'on_status_clear',       // 状态被清除时
        ON_STAT_UP: 'on_stat_up',                 // 属性提升时
        ON_STAT_DOWN: 'on_stat_down',             // 属性下降时
        ON_STAT_CLEAR: 'on_stat_clear',           // 属性被消除时
        
        // === 先制相关 ===
        ON_CALCULATE_PRIORITY: 'on_calculate_priority', // 计算先制时
        ON_FIRST_MOVE: 'on_first_move',           // 先出手时
        ON_SECOND_MOVE: 'on_second_move',         // 后出手时
        
        // === 队伍相关 ===
        ON_TEAM_MEMBER_ACTION: 'on_team_member_action', // 队友行动时
        ON_TEAM_MEMBER_HEAL: 'on_team_member_heal'      // 队友恢复时
    };

    /**
     * 注册魂印效果处理器
     * @param {string} spiritKey - 精灵标识
     * @param {string} phase - 触发节点
     * @param {Function} handler - 处理函数
     * @param {number} priority - 优先级（越高越先执行）
     */
    function register(spiritKey, phase, handler, priority = 0) {
        const key = `${spiritKey}:${phase}`;
        if (!registry[key]) {
            registry[key] = [];
        }
        registry[key].push({ handler, priority });
        registry[key].sort((a, b) => b.priority - a.priority);
    }

    /**
     * 执行魂印效果
     * @returns {Object|null} 处理结果（可能包含修改后的数据）
     */
    function run(spiritKey, phase, game, payload = {}) {
        const key = `${spiritKey}:${phase}`;
        const handlers = registry[key];
        if (!handlers || handlers.length === 0) return null;

        let result = {};
        for (const { handler } of handlers) {
            try {
                const handlerResult = handler(game, payload);
                if (handlerResult) {
                    result = { ...result, ...handlerResult };
                }
                // 如果返回 cancel: true，中断后续处理
                if (result.cancel) break;
            } catch (err) {
                console.error(`[SoulEffect:${key}] Error:`, err);
            }
        }
        return result;
    }

    /**
     * 检查精灵是否有注册某节点的魂印
     */
    function has(spiritKey, phase) {
        const key = `${spiritKey}:${phase}`;
        return registry[key] && registry[key].length > 0;
    }

    /**
     * 注册精灵魂印效果定义（用于文档和UI显示）
     */
    function defineEffects(spiritKey, effects) {
        spiritEffects[spiritKey] = effects;
    }

    /**
     * 获取精灵魂印效果定义
     */
    function getEffects(spiritKey) {
        return spiritEffects[spiritKey] || [];
    }

    // =====================================================================
    // 魂印效果路由辅助函数
    // =====================================================================

    /**
     * 路由到 TurnEffect（回合效果）
     * @param {Object} game - 游戏实例
     * @param {Object} target - 目标
     * @param {string} effectId - 效果ID
     * @param {string} name - 效果名称
     * @param {number} turns - 回合数
     * @param {Object} options - 额外选项
     */
    function routeToTurnEffect(game, target, effectId, name, turns, options = {}) {
        const owner = options.owner || target;  // 绑定所属方
        game.addTurnEffect(target, name, turns, effectId, options.desc || '', { 
            ...options, 
            owner: owner.key || owner.name,
            source: options.source || 'soul_effect'
        });
    }

    /**
     * 路由到 CountEffect（计数效果）
     */
    function routeToCountEffect(game, target, effectId, count, options = {}) {
        const owner = options.owner || target;
        if (window.CountEffect?.add) {
            window.CountEffect.add(game, target, effectId, count, options.max || 99, {
                ...options,
                owner: owner.key || owner.name,
                source: options.source || 'soul_effect'
            });
        }
    }

    /**
     * 路由到 StatusEffect（异常状态）
     */
    function routeToStatusEffect(game, target, statusId, name, turns, options = {}) {
        if (window.StatusEffect?.apply) {
            return window.StatusEffect.apply(game, target, statusId, name, turns, options.desc, options);
        }
        return false;
    }

    /**
     * 路由到 StatEffect（属性效果）
     */
    function routeToStatEffect(game, target, stat, amount, options = {}) {
        if (window.StatEffect?.modify) {
            window.StatEffect.modify(game, target, stat, amount, options.source || '魂印');
        }
    }

    /**
     * 路由到 DamageEffect（伤害效果）
     */
    function routeToDamageEffect(game, target, damageType, amount, options = {}) {
        if (window.DamageEffect) {
            switch (damageType) {
                case 'fixed':
                    return window.DamageEffect.fixed(game, target, amount, options.source || '魂印');
                case 'percent':
                    return window.DamageEffect.percent(game, target, amount, options.source || '魂印');
                case 'drain':
                    return window.DamageEffect.drain(game, options.attacker, target, amount);
            }
        }
        return 0;
    }

    /**
     * 路由到 HealEffect（治疗效果）
     */
    function routeToHealEffect(game, target, amount, options = {}) {
        if (window.HealEffect?.heal) {
            return window.HealEffect.heal(game, target, amount, options.source || '魂印');
        }
        return 0;
    }

    /**
     * 路由到 ShieldEffect（护盾效果）
     */
    function routeToShieldEffect(game, target, shieldType, value, options = {}) {
        if (window.ShieldEffect) {
            switch (shieldType) {
                case 'hp':
                    window.ShieldEffect.addHpShield(game, target, value, options.source || '魂印');
                    break;
                case 'count':
                    window.ShieldEffect.addCountShield(game, target, value, options.source || '魂印');
                    break;
                case 'immune':
                    window.ShieldEffect.addImmuneShield(game, target, value, options.source || '魂印');
                    break;
            }
        }
    }

    /**
     * 路由到 BlockEffect（封锁效果）
     */
    function routeToBlockEffect(game, target, blockType, value, options = {}) {
        if (window.BlockEffect) {
            switch (blockType) {
                case 'attack':
                    window.BlockEffect.blockAttack(game, target, value, options.source || '魂印');
                    break;
                case 'attribute':
                    window.BlockEffect.blockAttribute(game, target, value, options.source || '魂印');
                    break;
                case 'attributeTurns':
                    window.BlockEffect.blockAttributeTurns(game, target, value, options.source || '魂印');
                    break;
                case 'attackImmunity':
                    window.BlockEffect.addAttackImmunity(game, target, value, options.source || '魂印');
                    break;
            }
        }
    }

    /**
     * 路由到 PriorityEffect（先制效果）
     */
    function routeToPriorityEffect(game, target, amount, turns, options = {}) {
        if (window.PriorityEffect?.addPriority) {
            window.PriorityEffect.addPriority(game, target, amount, turns, options.source || '魂印');
        }
    }

    /**
     * 路由到 ImmuneEffect（免疫效果）
     */
    function routeToImmuneEffect(game, target, immuneType, value, options = {}) {
        if (window.ImmuneEffect) {
            switch (immuneType) {
                case 'abnormal':
                    window.ImmuneEffect.addAbnormalImmune(game, target, value, options.source || '魂印');
                    break;
                case 'statDrop':
                    window.ImmuneEffect.addStatDropImmune(game, target, value, options.source || '魂印');
                    break;
            }
        }
    }

    // =====================================================================
    // 导出
    // =====================================================================

    window.SoulEffect = { 
        register, 
        run, 
        has,
        defineEffects,
        getEffects,
        Phases,
        // 路由函数
        route: {
            toTurnEffect: routeToTurnEffect,
            toCountEffect: routeToCountEffect,
            toStatusEffect: routeToStatusEffect,
            toStatEffect: routeToStatEffect,
            toDamageEffect: routeToDamageEffect,
            toHealEffect: routeToHealEffect,
            toShieldEffect: routeToShieldEffect,
            toBlockEffect: routeToBlockEffect,
            toPriorityEffect: routeToPriorityEffect,
            toImmuneEffect: routeToImmuneEffect
        }
    };
})();