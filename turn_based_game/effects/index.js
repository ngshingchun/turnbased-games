/**
 * Effects Index - 效果系统入口
 * 统一加载所有效果模块
 * 
 * 模块层级架构：
 * 
 * ┌─────────────────────────────────────────────────┐
 * │              spirits/xxx.js                      │  精灵定义文件
 * │  (技能、魂印描述、抗性配置、节点注册)              │
 * └─────────────────────┬───────────────────────────┘
 *                       │
 *        ┌──────────────┴──────────────┐
 *        │                             │
 *        ▼                             ▼
 * ┌─────────────┐               ┌─────────────┐
 * │ SkillEffect │               │ SoulEffect  │   效果定义层
 * │ (技能效果)   │               │ (魂印效果)   │
 * └──────┬──────┘               └──────┬──────┘
 *        │                             │
 *        └──────────────┬──────────────┘
 *                       │
 *                       ▼
 * ┌─────────────────────────────────────────────────┐
 * │                 EffectRouter                     │  效果路由器
 * └─────────────────────┬───────────────────────────┘
 *                       │
 *        ┌──────────────┼──────────────┐
 *        │              │              │
 *        ▼              ▼              ▼
 * ┌─────────────┐ ┌───────────┐ ┌─────────────┐
 * │ TurnEffect  │ │CountEffect│ │ StatEffect  │   核心效果系统
 * │ (回合效果)   │ │(计数效果) │ │(属性/加成/  │   (同层级)
 * │ +消除回合   │ │           │ │ 反弹效果)   │
 * └──────┬──────┘ └─────┬─────┘ └──────┬──────┘
 *        │              │              │
 *        └──────────────┼──────────────┘
 *                       │
 *        ┌──────────────┼──────────────┐
 *        │              │              │
 *        ▼              ▼              ▼
 * ┌─────────────┐ ┌───────────┐ ┌─────────────┐
 * │StatusEffect │ │DamageEffect│ │ HealEffect │   细分效果模块
 * │ShieldEffect │ │PriorityEffect│ │CritEffect│
 * │ ImmuneEffect│ │BlockEffect │ │            │
 * └──────┬──────┘ └─────┬─────┘ └──────┬──────┘
 *        │              │              │
 *        └──────────────┼──────────────┘
 *                       │
 *                       ▼
 * ┌─────────────────────────────────────────────────┐
 * │         DamageSystem + ResistSystem              │  底层系统
 * │         (伤害计算)    (抗性计算)                  │
 * └─────────────────────────────────────────────────┘
 * 
 * 抗性系统说明：
 * - 固定/百分比伤害减免：默认35%，星皇百分比=100%
 * - 异常状态概率免疫：默认0%，沧岚焚烬=70%
 */

// 验证模块加载
const requiredModules = [
    'DamageSystem',
    'ResistSystem',
    'StatusRegistry',
    'TurnPhases',
    'PhaseEngine',
    'TurnEffect', 
    'CountEffect',
    'SoulEffect',
    'StatusEffect',
    'StatEffect',
    'DamageEffect',
    'HealEffect',
    'ShieldEffect',
    'PriorityEffect',
    'CritEffect',
    'ImmuneEffect',
    'BlockEffect',
    'EffectRouter'
];

window.addEventListener('DOMContentLoaded', () => {
    const missing = requiredModules.filter(mod => !window[mod]);
    if (missing.length > 0) {
        console.warn('[Effects] Missing modules:', missing.join(', '));
    } else {
        console.log('[Effects] All modules loaded successfully');
    }
});

/**
 * HTML 加载顺序：
 * 
 * <!-- 底层系统 -->
 * <script src="damage_system.js"></script>
 * <script src="resist_system.js"></script>
 * 
 * <!-- 核心效果系统 (同层级) -->
 * <script src="turneffect.js"></script>
 * <script src="counteffect.js"></script>
 * <script src="souleffect.js"></script>
 * 
 * <!-- 细分效果模块 -->
 * <script src="effects/status_effect.js"></script>
 * <script src="effects/stat_effect.js"></script>
 * <script src="effects/damage_effect.js"></script>
 * <script src="effects/heal_effect.js"></script>
 * <script src="effects/shield_effect.js"></script>
 * <script src="effects/priority_effect.js"></script>
 * <script src="effects/crit_effect.js"></script>
 * <script src="effects/immune_effect.js"></script>
 * <script src="effects/block_effect.js"></script>
 * 
 * <!-- 路由器 -->
 * <script src="effects/effect_router.js"></script>
 * 
 * <!-- 精灵定义 (使用 SoulEffect + SkillEffect) -->
 * <script src="spirits/xxx.js"></script>
 * 
 * <!-- 技能效果定义 -->
 * <script src="skill_effects.js"></script>
 */
