# 战斗系统架构文档 v2.1

## 概述

本系统采用并行状态容器架构，以36节点的回合阶段系统为核心。
支持6v6队伍战斗，每个系统独立文件，使用 `FUNC.SUBFUNC(node(s), handler)` 格式。

## 核心架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BattleEngine v2.1                             │
│                         战斗引擎 (6v6)                                │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  TurnPhase    │  │   TeamA       │  │   TeamB       │
│  回合阶段容器  │◄─┤  队伍A (6只)  │  │  队伍B (6只)  │
│  (36节点)     │  │               │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        │          ┌───────┴───────┐          │
        │          │  SpiritState  │          │
        │          │  当前精灵状态  │          │
        ▼          └───────────────┘          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    独立系统 (FUNC.SUBFUNC格式)                        │
│  TURN | COUNT | DAMAGE | HP | PP | STATS | STATUS | PRIO | SOULBUFF │
└─────────────────────────────────────────────────────────────────────┘
```

## 系统格式: FUNC.SUBFUNC(node(s), handler)

每个系统都使用统一的格式:

```javascript
// 示例: 在伤害节点造成100威力攻击
const effect = DAMAGE.ATTACK(
    [NODE.FIRST_DEAL_DAMAGE, NODE.SECOND_DEAL_DAMAGE],
    { power: 100, special: false }
);

// 执行效果
effect.execute(context);
```

返回的效果对象包含:
- `type`: 效果类型
- `nodes`: 触发节点列表
- `execute(ctx)`: 执行函数

## 36节点回合阶段

### 登场流程 (Nodes 1-5)
| 节点 | ID | 说明 |
|-----|-----|------|
| 1 | SWITCH_IN_PHASE | 换人阶段 |
| 2 | ON_ENTRY_SPEED | 登场速度判定 |
| 3 | AFTER_ENTRY | 登场后 |
| 4 | SPIRIT_ACTION_PHASE | 精灵行动阶段 |
| 5 | ON_ENTRY | 登场时效果 |

### 回合开始 (Nodes 6-7)
| 节点 | ID | 说明 |
|-----|-----|------|
| 6 | TURN_START | 回合开始 |
| **7** | **BATTLE_PHASE_START** | **决定先后手** |

### 先手方行动 (Nodes 8-16)
| 节点 | ID | 说明 |
|-----|-----|------|
| 8 | FIRST_ACTION_START | 先手行动开始 |
| 9 | FIRST_BEFORE_HIT | 先手命中前 |
| 10 | FIRST_ON_HIT | 先手命中时 |
| 11 | FIRST_SKILL_EFFECT | 先手技能效果 |
| 12 | FIRST_BEFORE_DAMAGE | 先手伤害前 |
| 13 | FIRST_DEAL_DAMAGE | 先手造成伤害 |
| 14 | FIRST_AFTER_ATTACK | 先手攻击后 |
| 15 | FIRST_ACTION_END | 先手行动结束 |
| 16 | FIRST_AFTER_ACTION | 先手行动后 |

### 死亡判定1 (Node 17)
| 节点 | ID | 说明 |
|-----|-----|------|
| 17 | DEATH_CHECK_1 | 任一方死亡跳过后手 |

### 后手方行动 (Nodes 18-26)
| 节点 | ID | 说明 |
|-----|-----|------|
| 18 | SECOND_ACTION_START | 后手行动开始 |
| 19 | SECOND_BEFORE_HIT | 后手命中前 |
| 20 | SECOND_ON_HIT | 后手命中时 |
| 21 | SECOND_SKILL_EFFECT | 后手技能效果 |
| 22 | SECOND_BEFORE_DAMAGE | 后手伤害前 |
| 23 | SECOND_DEAL_DAMAGE | 后手造成伤害 |
| 24 | SECOND_AFTER_ATTACK | 后手攻击后 |
| 25 | SECOND_ACTION_END | 后手行动结束 |
| 26 | SECOND_AFTER_ACTION | 后手行动后 |

### 回合结束 (Nodes 27-30)
| 节点 | ID | 说明 |
|-----|-----|------|
| 27 | BATTLE_PHASE_END | 战斗阶段结束 |
| 28 | AFTER_BATTLE_PHASE | 战斗阶段后 |
| 29 | TURN_END | 回合结束 |
| 30 | AFTER_TURN | 回合后 |

### 击败流程 (Nodes 31-36)
| 节点 | ID | 说明 |
|-----|-----|------|
| 31 | NOT_DEFEATED | 未被击败 |
| 32 | DEFEAT_CHECK | 击败判定 |
| 33 | AFTER_DEFEATED | 被击败后 |
| 34 | AFTER_DEFEAT_FOE | 击败对手后 |
| 35 | ON_DEATH_SWITCH | 死亡换人 |
| 36 | BATTLE_END_CHECK | 战斗结束判定 |

## 独立系统文件

| 系统 | 文件 | 功能 |
|------|------|------|
| TURN | turn_effect.js | ADD, BURN, POISON, HEAL, DISPEL, TICK, PROTECT |
| COUNT | count_effect.js | ADD, CONSUME, SHIELD, REFLECT, STACK, ABSORB, IMMUNITY |
| DAMAGE | damage.js | ATTACK, FIXED, PERCENT, TRUE, ABSORB |
| HP | hp.js | HEAL, HEAL_PERCENT, SET, DRAIN, DRAIN_PERCENT |
| PP | pp.js | USE, RESTORE, DRAIN, LOCK, CLEAR |
| STATS | stats.js | MODIFY, CLEAR_UPS, CLEAR_DOWNS, REVERSE, STEAL, SYNC |
| STATUS | status.js | APPLY, REMOVE, CHECK_CONTROL, CHECK_IMMUNE, TICK |
| PRIO | priority.js | ADD, FORCE, DOWN, CALCULATE |
| SOULBUFF | soulbuff.js | REGISTER, TRIGGER, DISABLE, ENABLE |

## TeamState 队伍状态 (6只精灵)

```javascript
TeamState {
    owner: 'A' | 'B',
    spirits: [Spirit × 6],  // 6只精灵
    currentIndex: 0,        // 当前精灵索引
    
    // 便捷访问
    get current(),          // 当前精灵
    
    // 方法
    switchTo(index),        // 换人
    getAllStates(),         // 获取所有精灵状态
    getByIndex(i),          // 按索引获取
    registerEffect(...)     // 注册队伍效果
}
```

## SpiritState 精灵状态

```javascript
SpiritState {
    // 基础信息
    id, key, name, owner, element,
    
    // 子系统
    hp: { current, max, damage(), heal() },
    pp: { current, max, use(), restore(), lock() },
    stats: { base, stage, calc(), modify() },
    status: { current[], immune[], apply(), remove() },
    turnEffects: { list[], add(), remove(), tick() },
    countEffects: { data{}, add(), consume(), get() },
    soulBuff: { key, active, run() },
    shield: { hp, count, immune, absorb() },
    resist: { fixed, percent, trueDmg, calc() },
    
    // 回合标记
    turnFlags: { usedSkill, tookDamage, ... }
}
```

## 文件结构

```
core/
├── turn_phase.js      # 36节点回合阶段
├── spirit_state.js    # 精灵状态容器
├── team_state.js      # 队伍状态容器 (6只)
├── global_state.js    # 全局状态容器
├── player_input.js    # 玩家输入容器
├── turn_effect.js     # TURN 系统
├── count_effect.js    # COUNT 系统
├── damage.js          # DAMAGE 系统
├── hp.js              # HP 系统
├── pp.js              # PP 系统
├── stats.js           # STATS 系统
├── status.js          # STATUS 系统
├── priority.js        # PRIO 系统
├── soulbuff.js        # SOULBUFF 系统
├── systems.js         # 系统整合与工具
├── battle_engine.js   # 战斗引擎
├── example_usage.js   # 使用示例
└── index.js           # 模块索引
```

## HTML 加载顺序

```html
<!-- Core 容器 -->
<script src="core/turn_phase.js"></script>
<script src="core/spirit_state.js"></script>
<script src="core/team_state.js"></script>
<script src="core/global_state.js"></script>
<script src="core/player_input.js"></script>

<!-- 独立系统 -->
<script src="core/turn_effect.js"></script>
<script src="core/count_effect.js"></script>
<script src="core/damage.js"></script>
<script src="core/hp.js"></script>
<script src="core/pp.js"></script>
<script src="core/stats.js"></script>
<script src="core/status.js"></script>
<script src="core/priority.js"></script>
<script src="core/soulbuff.js"></script>

<!-- 整合与引擎 -->
<script src="core/systems.js"></script>
<script src="core/battle_engine.js"></script>
<script src="core/index.js"></script>

<!-- 精灵定义 -->
<script src="spirits/registry.js"></script>
<script src="spirits/xxx.js"></script>

<!-- 主游戏 -->
<script src="game.js"></script>
```

## 使用示例

### 创建6v6战斗

```javascript
const engine = Core.createBattle(
    // A队6只精灵
    [
        { name: '火焰龙', maxHp: 1000, attack: 120 },
        { name: '水精灵', maxHp: 900, attack: 100 },
        { name: '雷电兽', maxHp: 800, attack: 140 },
        { name: '岩石魔', maxHp: 1200, defense: 150 },
        { name: '风之鸟', maxHp: 750, speed: 150 },
        { name: '暗影龙', maxHp: 950, spAttack: 130 }
    ],
    // B队6只精灵
    [
        { name: '冰霜巨人', maxHp: 1100 },
        { name: '光明使者', maxHp: 850 },
        { name: '毒蛇王', maxHp: 800 },
        { name: '钢铁战士', maxHp: 1300 },
        { name: '幻影忍者', maxHp: 700 },
        { name: '圣光天使', maxHp: 1000 }
    ]
);
```

### 每个节点都可输入指令

```javascript
// 执行回合，在每个节点传入handler
await engine.executeTurn({
    // Node 6: 回合开始
    [NODE.TURN_START]: async (ctx) => {
        console.log('回合开始');
    },
    
    // Node 13: 先手造成伤害
    [NODE.FIRST_DEAL_DAMAGE]: async (ctx) => {
        // 使用 DAMAGE 系统
        const effect = DAMAGE.ATTACK([NODE.FIRST_DEAL_DAMAGE], { power: 100 });
        effect.execute(ctx);
    },
    
    // Node 29: 回合结束
    [NODE.TURN_END]: async (ctx) => {
        // 回合结束效果
    }
});
```

### 使用技能构建器

```javascript
const fireBlast = skill('烈焰风暴')
    .pp(15)
    .power(150)
    .type('fire')
    .special()
    .damage({ nodes: [NODE.FIRST_DEAL_DAMAGE, NODE.SECOND_DEAL_DAMAGE] })
    .status('burn', 2, { chance: 50 })
    .build();
```

### 使用精灵构建器

```javascript
const dragon = spirit('火焰龙')
    .type('fire')
    .stats(1000, 120, 100, 150, 100, 110)
    .skill(fireBlast)
    .soulBuff({
        name: '炎龙魂',
        effects: [...]
    })
    .build();
```

### 组合效果

```javascript
// 组合多个效果
const combo = combine(
    DAMAGE.ATTACK([NODE.FIRST_DEAL_DAMAGE], { power: 80 }),
    HP.DRAIN([NODE.FIRST_AFTER_ATTACK], { ratio: 0.5 })
);

// 条件效果
const emergencyHeal = when(
    (ctx) => ctx.self.hp.percent < 50,
    HP.HEAL_PERCENT([NODE.TURN_END], { percent: 10 })
);

// 几率效果
const luckyHit = chance(30,
    DAMAGE.ATTACK([NODE.FIRST_DEAL_DAMAGE], { power: 200, crit: true })
);
```