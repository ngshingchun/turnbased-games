/**
 * EffectRouter - 效果路由器
 * 统一的效果调用入口，根据效果类型路由到对应模块
 * 
 * 架构：
 *   spirits/xxx.js (精灵定义)
 *        │
 *        ├── SkillEffect (技能效果)
 *        └── SoulEffect (魂印效果)
 *               │
 *        EffectRouter (路由器)
 *               │
 *    ┌──────────┼──────────┐
 *    │          │          │
 *    ▼          ▼          ▼
 * TurnEffect CountEffect StatEffect
 * (回合效果)  (计数效果)  (属性/伤害加成/反弹)
 *    │          │          │
 *    └──────────┼──────────┘
 *               │
 *    ┌──────────┼──────────┐
 *    │          │          │
 *    ▼          ▼          ▼
 * StatusEffect DamageEffect HealEffect ...
 *               │
 *               ▼
 *         DamageSystem + ResistSystem
 */
(() => {
    const EffectRouter = {
        // ========== 状态效果 ==========
        
        applyStatus(game, target, statusId, name, turns, desc, options) {
            // 先检查抗性系统的概率免疫
            if (window.ResistSystem?.checkStatusImmune(statusId, target)) {
                game.log(`${target.name} 天生抗性免疫了 ${name}！`);
                return false;
            }
            return window.StatusEffect?.apply(game, target, statusId, name, turns, desc, options);
        },

        removeStatus(game, target, statusId) {
            return window.StatusEffect?.remove(game, target, statusId);
        },

        hasStatus(target, statusId) {
            return window.StatusEffect?.has(target, statusId);
        },

        isControlled(target) {
            return window.StatusEffect?.isControlled(target);
        },

        hasAnyAbnormal(target) {
            return window.StatusEffect?.hasAnyAbnormal(target);
        },

        // ========== 属性效果 ==========

        modifyStats(game, target, changes, options) {
            return window.StatEffect?.modify(game, target, changes, options);
        },

        modifyAllStats(game, target, delta, options) {
            return window.StatEffect?.modifyAll(game, target, delta, options);
        },

        clearStatUps(game, target, silent) {
            return window.StatEffect?.clearUps(game, target, silent);
        },

        reverseStats(game, target, upsOnly, silent) {
            return window.StatEffect?.reverse(game, target, upsOnly, silent);
        },

        stealStats(game, source, target, silent) {
            return window.StatEffect?.steal(game, source, target, silent);
        },

        hasStatUps(target) {
            return window.StatEffect?.hasUps(target);
        },

        // ========== 伤害效果 ==========

        fixedDamage(game, target, amount, label, options) {
            return window.DamageEffect?.fixed(game, target, amount, label, options);
        },

        percentDamage(game, target, ratio, label, options) {
            return window.DamageEffect?.percent(game, target, ratio, label, options);
        },

        drainDamage(game, source, target, amount, label, options) {
            return window.DamageEffect?.drain(game, source, target, amount, label, options);
        },

        drainPercent(game, source, target, ratio, label, options) {
            return window.DamageEffect?.drainPercent(game, source, target, ratio, label, options);
        },

        // ========== 治疗效果 ==========

        heal(game, target, amount, source, options) {
            return window.HealEffect?.heal(game, target, amount, source, options);
        },

        healPercent(game, target, ratio, source, options) {
            return window.HealEffect?.healPercent(game, target, ratio, source, options);
        },

        healFull(game, target, source, options) {
            return window.HealEffect?.healFull(game, target, source, options);
        },

        // ========== 护盾效果 ==========

        addShieldCount(game, target, count, source) {
            return window.ShieldEffect?.addCountShield(game, target, count, source);
        },

        addShieldHp(game, target, amount, source) {
            return window.ShieldEffect?.addHpShield(game, target, amount, source);
        },

        addImmuneShield(game, target, count, source) {
            return window.ShieldEffect?.addImmuneShield(game, target, count, source);
        },

        // ========== 消除效果 (路由到 TurnEffect/StatEffect) ==========

        dispelTurnEffects(game, target, options) {
            return window.TurnEffect?.dispel(game, target, options);
        },

        dispelAbnormal(game, target, silent) {
            return window.TurnEffect?.dispelAbnormal(game, target, silent);
        },

        dispelStatUps(game, target, silent) {
            return window.StatEffect?.clearUps(game, target, silent);
        },

        // ========== 先制效果 ==========

        addPriority(game, target, turns, amount, source) {
            return window.PriorityEffect?.addPriority(game, target, turns, amount, source);
        },

        addForcedPriority(game, target, turns, source) {
            return window.PriorityEffect?.addForcedPriority(game, target, turns, source);
        },

        addPriorityDown(game, target, turns, amount, source) {
            return window.PriorityEffect?.addPriorityDown(game, target, turns, amount, source);
        },

        // ========== 暴击效果 ==========

        addCrit(game, target, turns, source) {
            return window.CritEffect?.addGuaranteed(game, target, turns, source);
        },

        // ========== 免疫效果 ==========

        addImmuneTurns(game, target, turns, source) {
            return window.ImmuneEffect?.addAbnormalImmune(game, target, turns, source);
        },

        addImmuneCount(game, target, count, source) {
            return window.ImmuneEffect?.addAbnormalImmuneCount(game, target, count, source);
        },

        addStatDropImmune(game, target, turns, source) {
            return window.ImmuneEffect?.addStatDropImmune(game, target, turns, source);
        },

        // ========== 封锁效果 ==========

        blockAttack(game, target, count, source) {
            return window.BlockEffect?.blockAttack(game, target, count, source);
        },

        blockAttribute(game, target, count, source) {
            return window.BlockEffect?.blockAttribute(game, target, count, source);
        },

        blockAttributeTurns(game, target, turns, source) {
            return window.BlockEffect?.blockAttributeTurns(game, target, turns, source);
        },

        // ========== 伤害加成 (路由到 StatEffect) ==========

        addDamageBoost(game, target, count, percent, source) {
            return window.StatEffect?.addDamageBoost(game, target, count, percent, source);
        },

        addVulnerability(game, target, turns, percent, source) {
            return window.StatEffect?.addVulnerability(game, target, turns, percent, source);
        },

        // ========== 反弹效果 (路由到 StatEffect) ==========

        addDamageReflect(game, target, count, multiplier, source) {
            return window.StatEffect?.addDamageReflect(game, target, count, multiplier, source);
        },

        addStatusReflect(game, target, turns, source) {
            game.addTurnEffect(target, '反弹异常', turns, 'reflect_status', '免疫并反弹异常状态');
            game.log(`${target.name} ${turns} 回合免疫并反弹异常状态！(${source})`);
        },

        // ========== 计数效果 ==========

        consumeCount(game, char, buffKey, amount) {
            return window.CountEffect?.consume(game, char, buffKey, amount);
        },

        addCount(game, char, buffKey, amount, max) {
            return window.CountEffect?.add(game, char, buffKey, amount, max);
        },

        hasCount(char, buffKey) {
            return window.CountEffect?.has(char, buffKey);
        },

        // ========== 回合效果 ==========

        onTurnStart(game, char, opponent) {
            return window.TurnEffect?.onTurnStart(game, char, opponent);
        },

        onTurnEnd(game, char, opponent) {
            return window.TurnEffect?.onTurnEnd(game, char, opponent);
        },

        // ========== 魂印效果 ==========

        triggerSoul(spiritKey, phase, game, payload) {
            return window.SoulEffect?.run(spiritKey, phase, game, payload);
        },

        hasSoulEffect(spiritKey, phase) {
            return window.SoulEffect?.has(spiritKey, phase);
        }
    };

    window.EffectRouter = EffectRouter;
})();
