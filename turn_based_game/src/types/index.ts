/**
 * 回合制戰鬥系統 - 類型定義
 */

// =============================================================================
// 基礎類型
// =============================================================================

export type Side = 'A' | 'B';
export type Target = 'self' | 'opponent'; this should have more specific target like  opponent spirit with current index as 1,  self spirit state with current index as 0, self spirit which has current index as 0
export type StatusType = ';

// =============================================================================
// 節點模式 - 支持多種格式
// =============================================================================

export type NodePattern = 
  | string                                              // 單個節點 'DEAL_DAMAGE' 或 '*' 表示所有
  | string[]                                            // 多個節點 ['DEAL_DAMAGE', 'AFTER_ATTACK']
  | { all: true; except?: string[] }                    // 所有節點除了某些
  | { nodes: string[]; also?: string };                 // 特定節點 + 額外節點

// =============================================================================
// Function Calling - 積木系統的核心
// =============================================================================

export interface FunctionCall {
  system: string;                    // 系統名: 'HP', 'PP', 'DAMAGE', 'STATS', 'STATUS', 'STATE', etc.
  func: string;                      // 函數名: 'HEAL', 'USE', 'ATTACK', 'MODIFY', 'COMPARE_HP', etc.
  node?: string | NodePattern;       // 執行節點
  target?: Target;                   // 目標
  
  // === 各系統的參數 ===
  amount?: number | ((self: SpiritState, opponent: SpiritState) => number);
  percent?: number;
  basedOn?: 'max' | 'current' | 'lost';
  value?: number | string | boolean | ((self: SpiritState, opponent: SpiritState) => number);
  skillIndex?: number;
  
  // DAMAGE 參數
  power?: number | ((self: SpiritState, opponent: SpiritState) => number);
  category?: 'physical' | 'special';
  multiplier?: number;
  
  // STATS 參數
  stats?: Partial<StatsStage> | ((self: SpiritState, opponent: SpiritState) => Partial<StatsStage>);
  
  // STATUS 參數
  status?: StatusType;
  statusId?: StatusType | 'all';
  turns?: number;
  chance?: number;
  
  // TURN/COUNT 效果參數
  effectId?: string;                 // 效果ID（綁定 turn/count effect 時必須）
  inside turn/count SYSTEMS, when Turn.xxx/CountQueuingStrategy.xxx is executed, and this function contain effect IdleDeadline, then inside this function, plus a step which call STATE.writeeffectid(effctid,target) to write effect id to that spirit state's effectid list which is now not yet created, any function call other than turn/count SYSTEMS which are related to this turn/count function via effect id will be be eliminated from the state system's target team's golbal function list when it is written onto its corresponding node, and that function will excute implicity the call state.checkeffectid
  countId?: string;
  count?: number;
  max?: number;
  
  // TURN/COUNT 效果參數（已移除內嵌效果，所有效果分開寫）
  
  // 回調（不使用 condition，改用 STATE.getcurrentopponentspiritstate/getcurrentselfspiritstate/getcurrentopponentspiritstate'sshieldamount/getcurrentselfspiritstate'sshieldamount/getcurrentopponentspiritstate'sshellamount/getcurrentselfspiritstate'sshellamount 函數）

  
  
  // 其他
  action?: string;
  reference?: Target;
  damageTarget?: Target;
  ofMax?: boolean;
}

// =============================================================================
// 效果類型
// =============================================================================

export interface TurnEffect {
  id: string;
  name: string;
  turns: number;
  node: NodePattern;
  calls?: FunctionCall[];
  dispellable?: boolean;
}

export interface CountEffect {
  id: string;
  name: string;
  count: number;
  max: number;
  node: NodePattern;
  calls?: FunctionCall[];
}

export interface SoulBuffEffect {
  id: string;                        // 魂印專屬效果ID（字串），用於 UI/特判/橋接
  name?: string;
  node?: NodePattern;                // 若存在則作為整體節點匹配，否則依賴每個 call 的 node
  calls: FunctionCall[];             // 每個 FunctionCall 都有 node，不需要 trigger
  dispellable?: boolean;             // 魂印效果預設不可被消除
}

export interface SoulBuff {
  name: string;
  desc?: string;
  effects: SoulBuffEffect[];
}

// =============================================================================
// 狀態效果
// =============================================================================

export interface StatusEffect {
  id: StatusType;
  turns: number;
  source?: Target;
}

// =============================================================================
// 屬性等級
// =============================================================================

export interface StatsStage {
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

// =============================================================================
// 技能
// =============================================================================

export interface Skill {
  id: string;
  name: string;
  type: 'attack' | 'buff' | 'debuff' | 'ultimate' | 'special';
  element: ElementType;
  category: 'physical' | 'special' | 'attribute';
  power: number;
  pp: number;
  maxPp: number;
  priority: number;
  accuracy: number | 'must_hit';
  desc?: string;
  calls: FunctionCall[];             // 技能的積木調用
}

export interface SkillContainer {
  pp: number;
  power: number;
  type: string;
}

// =============================================================================
// 精靈狀態 - 純空殼結構
// =============================================================================

export interface SpiritState {
  // === 識別信息 ===
  key: string;
  name: string;
  element: ElementType;
  isBoss?: boolean;
  
  // === HP ===
  hp: {
    current: number;
    max: number;
  };
  isAlive: boolean;
  
  // === PP ===
  pp: {
    current: number;
    max: number;
    locked: boolean;
    lockTurns: number;
  };
  
  // === 基礎屬性 ===
  baseStats: {
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  
  // === 屬性等級（-6 到 +6）===
  stages: StatsStage;
  
  // === 抗性 ===
  resist: {
    fixed: number;      // 固傷抗性 (0-100%)
    percent: number;    // 百分比傷害抗性
    trueDmg: number;    // 真實傷害抗性
  };
  baseResist?: {
    fixed: number;
    percent: number;
    trueDmg: number;
  };
  
  // === 護盾 ===
  shield: {
    hp: number;         // HP 護盾
    count: number;      // 次數護盾
    immune: number;     // 免疫護盾
  };
  
  // === 先制 ===
  priority: {
    bonus: number;
    forceFirst: boolean;
    forceLast: boolean;
  };
  
  // === 免疫 ===
  immunities: {
    status: StatusType[];
    damageType: string[];
    statDrop: boolean;
  };
  
  // === 技能 ===
  skills: Skill[];
  
  // === 技能狀態容器 (PP, Power, Type) ===
  skillContainers: SkillContainer[];
  
  // === 魂印（從精靈定義載入）===
  soulBuff: SoulBuff | null;
  
  // === 臨時存儲：回合效果 ===
  turnEffects: TurnEffect[];
  
  // === 臨時存儲：次數效果 ===
  countEffects: Record<string, CountEffect>;
  
  // === 臨時存儲：異常狀態 ===
  statuses: StatusEffect[];
  
  // === 臨時計數器 ===
  temporaryCount: number;
}

// =============================================================================
// 隊伍狀態 - 存儲 6 隻精靈 + 全局效果
// =============================================================================

export interface TeamState {
  side: Side;
  
  // === 6 隻精靈 ===
  spirits: (SpiritState | null)[];
  
  // === 當前在場精靈索引 ===
  currentIndex: number;
  
  // === 上一個精靈索引 ===
  previousIndex?: number;
  
  // === 全局次數效果 ===
  globalCountEffects: Record<string, CountEffect>;
  
  // === 全局回合效果 ===
  globalTurnEffects: TurnEffect[];
  
  // === 道具 ===
  items: Record<string, number>;
}

// =============================================================================
// 全局狀態
// =============================================================================

export interface GlobalState {
  turn: number;
  weather: string | null;
  terrain: string | null;
  
  // 全局效果容器
  countEffects: Record<string, CountEffect>;
  turnEffects: TurnEffect[];
}

// =============================================================================
// 精靈數據定義（從精靈文件載入）
// =============================================================================

export interface SpiritData {
  key: string;
  name: string;
  element: ElementType;
  maxHp: number;
  maxPp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  resist?: {
    fixed?: number;
    percent?: number;
    trueDmg?: number;
  };
  skills: Skill[];
  soulBuff: SoulBuff;
}

// =============================================================================
// 玩家輸入
// =============================================================================

export interface PlayerInput {
  type: 'skill' | 'switch' | 'item';
  skillIndex?: number;
  switchIndex?: number;
  itemId?: string;
  targetIndex?: number;
}
