/**
 * Effects Index - 效果系统入口 v3.0
 * 
 * 新架构: SYSTEM.SUBFUNC(nodes, handler)
 * 不需要向后兼容，所有精灵使用新格式
 * 
 * 系统架构:
 * ┌─────────────────────────────────────────────────┐
 * │              BattleEngine v2.1                   │
 * │          (36节点, 6v6队伍战斗)                    │
 * └─────────────────────┬───────────────────────────┘
 *                       │
 *        ┌──────────────┼──────────────┐
 *        │              │              │
 *        ▼              ▼              ▼
 * ┌─────────────┐ ┌───────────┐ ┌─────────────┐
 * │    TURN     │ │   COUNT   │ │   DAMAGE    │
 * │  回合效果    │ │  计数效果  │ │   伤害      │
 * └──────┬──────┘ └─────┬─────┘ └──────┬──────┘
 *        │              │              │
 *        ▼              ▼              ▼
 * ┌─────────────┐ ┌───────────┐ ┌─────────────┐
 * │     HP      │ │    PP     │ │   STATS     │
 * │   体力      │ │   活力    │ │   属性      │
 * └──────┬──────┘ └─────┬─────┘ └──────┬──────┘
 *        │              │              │
 *        ▼              ▼              ▼
 * ┌─────────────┐ ┌───────────┐ ┌─────────────┐
 * │   STATUS    │ │   PRIO    │ │  SOULBUFF   │
 * │  异常状态    │ │   先制    │ │   魂印      │
 * └─────────────┘ └───────────┘ └─────────────┘
 * 
 * 精灵定义格式 (spirits/*.js):
 * ┌─────────────────────────────────────────────────┐
 * │  SPIRIT = { key, name, element, stats, resist } │
 * ├─────────────────────────────────────────────────┤
 * │  SOULBUFF = {                                   │
 * │    effects: [{                                  │
 * │      trigger: NODE.xxx,                         │
 * │      condition: (ctx) => ...,                   │
 * │      calls: [                                   │
 * │        { system: 'SYSTEM', func: 'FUNC', ... }  │
 * │      ]                                          │
 * │    }]                                           │
 * │  }                                              │
 * ├─────────────────────────────────────────────────┤
 * │  SKILLS = [{                                    │
 * │    name, type, power, pp, priority,             │
 * │    calls: [                                     │
 * │      { system: 'SYSTEM', func: 'FUNC',          │
 * │        node: NODE.xxx, ... }                    │
 * │    ]                                            │
 * │  }]                                             │
 * └─────────────────────────────────────────────────┘
 */

// =========================================================================
// 系统函数参考
// =========================================================================
/**
 * DAMAGE 系统:
 *   DAMAGE.ATTACK(node, { target, power, critMod?, modifier? })
 *   DAMAGE.FIXED(node, { target, value })
 *   DAMAGE.PERCENT(node, { target, percent, ofMax? })
 *   DAMAGE.TRUE(node, { target, value })
 *   DAMAGE.MODIFIER(node, { target, multiplier })
 * 
 * HP 系统:
 *   HP.HEAL(node, { target, value })
 *   HP.HEAL_PERCENT(node, { target, percent, ofMax? })
 *   HP.SET(node, { target, value })
 *   HP.DRAIN(node, { target, value })
 *   HP.DRAIN_PERCENT(node, { target, percent, ofMax? })
 * 
 * PP 系统:
 *   PP.USE(node, { target, skill, amount })
 *   PP.DRAIN(node, { target, skills?, amount })
 *   PP.RESTORE(node, { target, skill?, amount })
 * 
 * STATS 系统:
 *   STATS.MODIFY(node, { target, stats, chance?, modifier? })
 *   STATS.CLEAR_UPS(node, { target, onSuccess? })
 *   STATS.CLEAR_DOWNS(node, { target })
 *   STATS.REVERSE(node, { target, reverseType?, onSuccess?, onFail? })
 *   STATS.COPY(node, { target, from, copyType })
 * 
 * STATUS 系统:
 *   STATUS.APPLY(node, { target, status, turns, chance? })
 *   STATUS.REMOVE(node, { target, status })
 *   STATUS.CHECK_CONTROL(node, { target })
 *   STATUS.CHECK_IMMUNE(node, { target, status })
 * 
 * TURN 系统:
 *   TURN.ADD(node, { target, effectId, turns, flags?, onTick?, onAction? })
 *   TURN.DISPEL(node, { target, onSuccess?, onFail? })
 *   TURN.PROTECT(node, { target, turns })
 *   TURN.TICK(node, { target })
 * 
 * COUNT 系统:
 *   COUNT.SET(node, { target, effectId, count, max?, onAttack?, onHit? })
 *   COUNT.ADD(node, { target, effectId, amount, max? })
 *   COUNT.CONSUME(node, { target, effectId, amount? })
 *   COUNT.SHIELD(node, { target, value, shieldType? })
 *   COUNT.IMMUNITY(node, { target, immuneType, count })
 * 
 * PRIO 系统:
 *   PRIO.ADD(node, { target, value, turns? })
 *   PRIO.FORCE(node, { target, position })
 * 
 * SOULBUFF 系统:
 *   SOULBUFF.REGISTER(spiritKey, soulbuff)
 *   SOULBUFF.TRIGGER(node, { effectId, param? })
 * 
 * BRANCH 控制流:
 *   { system: 'BRANCH', condition: (ctx) => bool, onTrue: [], onFalse?: [] }
 * 
 * FLAG 标记:
 *   { system: 'FLAG', func: 'SET', target, flag, value }
 */

// 验证 Core 系统
const REQUIRED_SYSTEMS = [
    'TURN', 'COUNT', 'DAMAGE', 'HP', 'PP', 
    'STATS', 'STATUS', 'PRIO', 'SOULBUFF'
];

window.addEventListener('DOMContentLoaded', () => {
    const missing = REQUIRED_SYSTEMS.filter(s => !window[s]);
    if (missing.length > 0) {
        console.error('[Effects] Missing systems:', missing.join(', '));
    } else {
        console.log('[Effects] All systems ready ✓');
        console.log('[Effects] Spirits:', Object.keys(window.SpiritRegistry || {}).join(', '));
    }
});

/**
 * HTML 加载顺序:
 * 
 * <!-- Core 系统 -->
 * <script src="core/turn_phase.js"></script>
 * <script src="core/spirit_state.js"></script>
 * <script src="core/team_state.js"></script>
 * <script src="core/global_state.js"></script>
 * <script src="core/player_input.js"></script>
 * <script src="core/turn_effect.js"></script>
 * <script src="core/count_effect.js"></script>
 * <script src="core/damage.js"></script>
 * <script src="core/hp.js"></script>
 * <script src="core/pp.js"></script>
 * <script src="core/stats.js"></script>
 * <script src="core/status.js"></script>
 * <script src="core/priority.js"></script>
 * <script src="core/soulbuff.js"></script>
 * <script src="core/systems.js"></script>
 * <script src="core/battle_engine.js"></script>
 * <script src="core/index.js"></script>
 * 
 * <!-- 精灵定义 (新架构) -->
 * <script src="spirits/agnes.js"></script>
 * <script src="spirits/star_sovereign.js"></script>
 * <script src="spirits/surging_canglan.js"></script>
 * <!-- ... 其他精灵 ... -->
 * 
 * <!-- 效果系统入口 -->
 * <script src="effects/index.js"></script>
 * 
 * <!-- 主游戏 -->
 * <script src="game.js"></script>
 */
