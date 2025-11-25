# 效果系统架构文档

## 模块层级

```
┌─────────────────────────────────────────────────────────────────────┐
│                        spirits/xxx.js                                │  精灵定义文件
│              (技能、魂印描述、抗性配置、TurnPhase注册)                 │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
┌─────────────────┐   ┌─────────────┐   ┌─────────────┐
│   SkillEffect   │   │ SoulEffect  │   │  TurnPhase  │   效果定义层
│   (技能效果)     │   │ (魂印效果)   │   │ (回合流程)   │
└────────┬────────┘   └──────┬──────┘   └──────┬──────┘
         │                   │                  │
         └───────────────────┼──────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        EffectRouter                                  │  效果路由器
└─────────────────────────────┬───────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐   ┌─────────────┐      ┌─────────────┐
│   TurnEffect    │   │ CountEffect │      │ StatEffect  │   核心效果系统
│   (回合效果)     │   │ (计数效果)  │      │ (属性/加成/ │   (同层级)
│   +消除回合     │   │             │      │  反弹效果)  │
└────────┬────────┘   └──────┬──────┘      └──────┬──────┘
         │                   │                    │
         └───────────────────┼────────────────────┘
                             │
    ┌────────────────────────┼────────────────────────┐
    │            │           │           │            │
    ▼            ▼           ▼           ▼            ▼
┌────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
│Status  │ │Damage   │ │ Heal     │ │ Shield  │ │ Block    │
│Effect  │ │Effect   │ │ Effect   │ │ Effect  │ │ Effect   │
└────┬───┘ └────┬────┘ └────┬─────┘ └────┬────┘ └────┬─────┘
     │          │           │            │           │
     └──────────┼───────────┼────────────┼───────────┘
                │           │            │
                ▼           ▼            ▼
┌─────────────────────────────────────────────────────────────────────┐
│          DamageSystem + ResistSystem + StatusRegistry                │  底层系统
│          (伤害计算)    (抗性计算)      (状态注册表)                    │
└─────────────────────────────────────────────────────────────────────┘
```

## 回合阶段流程 (TurnPhases)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. OPEN_TURN      精灵登场（首次/切换）                               │
│    └─> 加载精灵 TurnPhase 注册                                       │
├─────────────────────────────────────────────────────────────────────┤
│ 2. ENTRY          登场后一次性效果                                    │
│    └─> 沧澜护盾、星皇之佑等                                           │
├─────────────────────────────────────────────────────────────────────┤
│ 3. TURN_START     回合开始                                           │
│    └─> 魂印检测、状态检测                                             │
├─────────────────────────────────────────────────────────────────────┤
│ 4. CALCULATE_PRIORITY  计算先制                                      │
│    └─> 基础先制 + 技能先制 + 效果先制                                  │
├─────────────────────────────────────────────────────────────────────┤
│ 5. BEFORE_MOVE    技能使用前                                         │
│    └─> 封锁检测、控制状态检测、PP检测                                  │
├─────────────────────────────────────────────────────────────────────┤
│ 6. BEFORE_HIT     命中前                                             │
│    └─> 闪避检测、免疫攻击检测（BlockEffect.checkAttackImmunity）      │
├─────────────────────────────────────────────────────────────────────┤
│ 7. CALCULATE_DAMAGE  伤害计算                                        │
│    └─> 基础伤害 × 属性克制 × 加成/减益 × 暴击                          │
├─────────────────────────────────────────────────────────────────────┤
│ 8. ON_HIT         命中中（伤害应用）                                   │
│    └─> 护盾吸收、伤害减免、实际扣血                                    │
├─────────────────────────────────────────────────────────────────────┤
│ 9. AFTER_HIT      命中后                                             │
│    └─> X回合内XX效果、追加异常、追加固伤、追击判定                      │
├─────────────────────────────────────────────────────────────────────┤
│ 10. TURN_END      回合结束                                           │
│    └─> DOT结算、回复结算、效果回合数-1、消除到期效果                   │
├─────────────────────────────────────────────────────────────────────┤
│ 11. DEATH_CHECK   死亡检测                                           │
│    └─> 残留1HP判定、重生判定、精灵切换                                 │
├─────────────────────────────────────────────────────────────────────┤
│ 12. BATTLE_END    战斗结束判定                                        │
│    └─> 一方全灭则战斗结束                                             │
└─────────────────────────────────────────────────────────────────────┘

特殊事件：
- SWITCH          切换精灵时 → OPEN_TURN → ENTRY
- USE_ITEM        使用道具时（跳过技能流程）
- SKIP_TURN       跳过回合（控制状态）→ 直接到 TURN_END
```

## 效果路由到阶段

| 效果类型 | 触发阶段 | 说明 |
|---------|---------|------|
| 伤害计算 | CALCULATE_DAMAGE | 基础伤害修正 |
| 技能伤害 | ON_HIT | 实际扣血 |
| X回合XX | AFTER_HIT | 命中后附加 |
| 追加异常 | AFTER_HIT | 命中后施加 |
| 追加固伤 | AFTER_HIT | 命中后固伤 |
| DOT伤害 | TURN_END | 每回合结算 |
| 治疗回复 | TURN_END | 每回合结算 |
| 免疫攻击 | BEFORE_HIT | 无效化攻击 |
| 无视免疫 | BEFORE_HIT | 穿透免疫 |

## 模块说明

### 底层系统
- **DamageSystem** - 伤害计算核心
- **ResistSystem** - 抗性系统（伤害减免、状态免疫）
- **StatusRegistry** - 异常状态注册表（新增）

### 核心效果系统（同层级）
- **TurnEffect** - 回合效果注册表，含消除回合效果功能
- **CountEffect** - 计数效果注册表
- **SoulEffect** - 魂印效果（精灵被动），路由到其他效果模块

### 细分效果模块 (effects/)
| 模块 | 功能 |
|------|------|
| StatusEffect | 异常状态施加/移除/检测，使用 StatusRegistry |
| StatEffect | 属性修改/清除/反转/偷取/同步 + 伤害加成/弱化/反弹 |
| DamageEffect | 固定伤害/百分比伤害/吸血 |
| HealEffect | 治疗/回复/吸血检测 |
| ShieldEffect | 计数护盾/血量护盾/免疫护盾 |
| PriorityEffect | 先制修改/强制先制 |
| CritEffect | 暴击率/必暴 |
| ImmuneEffect | 异常免疫/弱化免疫 |
| BlockEffect | 攻击封锁/属性封锁 + **免疫攻击/无视免疫** |

### 效果路由器
- **EffectRouter** - 统一入口，根据效果类型路由到对应模块

## 免疫攻击系统 (BlockEffect)

**重要区分**：
- ❌ 免疫攻击 ≠ 护盾
- ✅ 免疫攻击 = 令对手的攻击技能失去伤害和效果

```javascript
// 添加免疫攻击（如：不灭火种的免疫攻击、索倫森第五技能）
BlockEffect.addAttackImmunity(game, target, count, source);

// 检查攻击是否被无效化（在 BEFORE_HIT 阶段）
const result = BlockEffect.checkAttackImmunity(game, attacker, defender, skill, options);
if (result.nullified) {
    // 攻击被无效化，不执行伤害和效果
}

// 无视免疫（如：沧澜第五技能）
skill.ignoreImmunity = true;
// 或
BlockEffect.checkAttackImmunity(game, attacker, defender, skill, { ignoreImmunity: true });
```

## StatusRegistry 异常状态注册表

```javascript
// 注册新异常状态
StatusRegistry.register('newStatus', {
    name: '新状态',
    category: 'control',  // dot/control/debuff/restrict/special
    isControl: true,      // 是否为控制状态
    blockSwitch: false,   // 是否禁止切换
    defaultTurns: 2,
    stackable: false,
    desc: '状态描述',
    onApply: (game, target) => { /* 施加时回调 */ },
    onTick: (game, target) => { /* 每回合结算 */ },
    onRemove: (game, target) => { /* 移除时回调 */ }
});

// 随机选择状态（技能效果：随机两种异常）
const statusIds = StatusRegistry.random(2, {
    category: 'control',  // 只选控制状态
    exclude: ['sleep']    // 排除睡眠
});

// 随机施加状态
StatusRegistry.applyRandom(game, target, 2, { category: 'dot' });
```

## 已合并/删除的模块
- ~~DispelEffect~~ → 合并到 TurnEffect (dispelAll, dispelBuffs, dispelDebuffs)
- ~~DamageBoostEffect~~ → 合并到 StatEffect (addDamageBoost, setVulnerability)
- ~~ReflectEffect~~ → 合并到 StatEffect (reflectDamage)

## 抗性系统

### 默认抗性
- 固定伤害减免: 35%
- 百分比伤害减免: 35%
- 真实伤害减免: 0%
- 状态免疫: 0%

### 特殊精灵配置
```javascript
// 星皇 - 完全免疫固定/百分比伤害
resist: { fixed: 1, percent: 1, trueDmg: 0 }

// 沧岚 - 70%概率免疫焚烬
resist: { statusImmune: { immolate: 0.7 } }
```

## HTML 加载顺序

```html
<!-- 底层系统 -->
<script src="damage_system.js"></script>
<script src="resist_system.js"></script>
<script src="status_registry.js"></script>
<script src="turn_phases.js"></script>
<script src="turneffect.js"></script>
<script src="counteffect.js"></script>
<script src="souleffect.js"></script>

<!-- 细分效果模块 -->
<script src="effects/status_effect.js"></script>
<script src="effects/stat_effect.js"></script>
<script src="effects/damage_effect.js"></script>
<script src="effects/heal_effect.js"></script>
<script src="effects/shield_effect.js"></script>
<script src="effects/priority_effect.js"></script>
<script src="effects/crit_effect.js"></script>
<script src="effects/immune_effect.js"></script>
<script src="effects/block_effect.js"></script>

<!-- 路由器 & 索引 -->
<script src="effects/effect_router.js"></script>
<script src="effects/index.js"></script>

<!-- 精灵定义 -->
<script src="spirits/registry.js"></script>
<script src="spirits/xxx.js"></script>

<!-- 技能效果 -->
<script src="skill_effects.js"></script>

<!-- 主游戏 -->
<script src="game.js"></script>
```
