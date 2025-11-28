/**
 * STATE 系統 - 狀態管理與空殼創建
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * 14 個空殼：
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Team A:
 *   空殼 1:  精靈 A1
 *   空殼 2:  精靈 A2
 *   空殼 3:  精靈 A3
 *   空殼 4:  精靈 A4
 *   空殼 5:  精靈 A5
 *   空殼 6:  精靈 A6
 *   空殼 13: Team A Global Effect
 * 
 * Team B:
 *   空殼 7:  精靈 B1
 *   空殼 8:  精靈 B2
 *   空殼 9:  精靈 B3
 *   空殼 10: 精靈 B4
 *   空殼 11: 精靈 B5
 *   空殼 12: 精靈 B6
 *   空殼 14: Team B Global Effect
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * 可用 FUNCTIONS:
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * $$$$$$state.get 
 * 
 * === 空殼創建 ===
 * STATE.CREATE_SPIRIT(data) → SpiritState
 * STATE.CREATE_TEAM(side, dataList) → TeamState
 * STATE.CREATE_GLOBAL() → GlobalState
 * 
 * === 精靈上下場 ===
 * STATE.CLEAR_ON_SWITCH_OUT(spirit) → void
 * STATE.INIT_ON_ENTRY(spirit) → void
 * 
 * === HP 相關 ===
 * STATE.GET_HP(target) → { current, max, percent }
 * STATE.CHECK_HP(target, condition, value?) → boolean
 *   - condition: 'alive' | 'dead' | 'below' | 'above' | 'equal'
 * STATE.GET_LOST_HP(target) → number
 * STATE.IS_LOW_HP(target, threshold?) → boolean
 * STATE.COMPARE_HP(target1, target2) → 'higher' | 'lower' | 'equal'
 * 
 * === PP 相關 ===
 * STATE.GET_PP(target, skillIndex?) → { current, max, percent }
 * STATE.IS_PP_LOCKED(target) → boolean
 * 
 * === STATS 相關 ===
 * STATE.GET_STAT(target, statName) → number
 * STATE.GET_STAGE(target, statName) → number
 * STATE.HAS_STAT_UP(target) → boolean
 * STATE.HAS_STAT_DOWN(target) → boolean
 * STATE.COMPARE_STAT(target1, target2, statName) → 'higher' | 'lower' | 'equal'
 * STATE.COUNT_SAME_STATS(target1, target2) → number
 * 
 * === STATUS 相關 ===
 * STATE.HAS_STATUS(target, statusId) → boolean
 * STATE.IS_CONTROLLED(target) → boolean
 * STATE.GET_STATUS(target, statusId) → StatusEffect | null
 * 
 * === TURN EFFECT 相關 ===
 * STATE.HAS_TURN_EFFECT(target, effectId) → boolean
 * STATE.GET_TURN_EFFECT(target, effectId) → TurnEffect | null
 * 
 * === COUNT EFFECT 相關 ===
 * STATE.GET_COUNT(target, countId) → number
 * STATE.HAS_COUNT(target, countId) → boolean
 * 
 * === FLAG 相關 ===
 * STATE.GET_FLAG(target, flagName) → unknown
 * STATE.HAS_FLAG(target, flagName) → boolean
 * STATE.SET_FLAG(target, flagName, value) → void
 * 
 * === SPIRIT 相關 ===
 * STATE.GET_KEY(target) → string
 * STATE.IS_BOSS(target) → boolean
 * STATE.GET_ELEMENT(target) → ElementType
 * 
 * === TEAM 相關 ===
 * STATE.GET_ALIVE_COUNT(team) → number
 * STATE.IS_DEFEATED(team) → boolean
 * STATE.GET_CURRENT_INDEX(team) → number
 * STATE.HAS_SPIRIT(team, key) → boolean
 * STATE.GET_CURRENT_SPIRIT(team) → SpiritState | null
 */

import { 
  SpiritData, 
  SpiritState, 
  TeamState, 
  GlobalState,
  Side,
  Target,
  StatusType,
  TurnEffect,
  StatusEffect,
} from '../types';

// =============================================================================
// 目標解析
// =============================================================================

export function resolveTarget(
  self: SpiritState,
  opponent: SpiritState,
  target: Target
): SpiritState {
  return target === 'opponent' ? opponent : self;
}

// =============================================================================
// STATE 系統
// =============================================================================

export const STATE = {
  // ═══════════════════════════════════════════════════════════════════════════
  // 空殼創建
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ─────────────────────────────────────────────────────────────────────────
  // 創建精靈空殼
  // ─────────────────────────────────────────────────────────────────────────
  CREATE_SPIRIT(data: SpiritData): SpiritState {
    return {
      key: data.key,
      name: data.name,
      element: data.element,
      isBoss: false,
      hp: { current: data.maxHp, max: data.maxHp },
      isAlive: true,
      pp: { current: data.maxPp, max: data.maxPp, locked: false, lockTurns: 0 },
      baseStats: {
        attack: data.attack,
        defense: data.defense,
        spAttack: data.spAttack,
        spDefense: data.spDefense,
        speed: data.speed,
      },
      stages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
      resist: { fixed: data.resist?.fixed || 0, percent: data.resist?.percent || 0, trueDmg: data.resist?.trueDmg || 0 },
      baseResist: { fixed: data.resist?.fixed || 0, percent: data.resist?.percent || 0, trueDmg: data.resist?.trueDmg || 0 },
      shield: { hp: 0, count: 0, immune: 0 },
      priority: { bonus: 0, forceFirst: false, forceLast: false },
      immunities: { status: [], damageType: [], statDrop: false },
      skills: data.skills.map(skill => ({ ...skill, pp: skill.maxPp })),
      skillContainers: Array(5).fill(null).map((_, i) => {
        const skill = data.skills[i];
        if (skill) {
          return {
            pp: skill.maxPp,
            power: skill.power,
            type: skill.type
          };
        }
        return {
          pp: 0,
          power: 0,
          type: 'none'
        };
      }),
      soulBuff: data.soulBuff,$$$$$$$$
      turnEffects: [],
      countEffects: {},
      statuses: [],
      $$$$$$$$$$$add shield amount to each spirit state,this is a Number, like hp that protection system can call function to increase current shield amount, when on hit of attack damage, reduce shield amount by the amount of attack damage, then go to hp$$$$$$$$$$$
      $$$$$$$$$add shell amount to each spirit state,this is a Number, like hp that protection system can call function to increase current shell amount, when on hit of fixed damage and percent damage, reduce shell amount by the amount of fixed damage and percent damage, then go to hp$$$$$$$$$$$
      temporaryCount: 0,
    };
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // 創建隊伍空殼（包含 6 個精靈 + Global Effect）
  // ─────────────────────────────────────────────────────────────────────────
  CREATE_TEAM(side: Side, spiritDataList: (SpiritData | null)[]): TeamState {
    // 空殼 1-6 (A) 或 空殼 7-12 (B)
    const spirit0 = spiritDataList[0] ? STATE.CREATE_SPIRIT(spiritDataList[0]) : null;
    const spirit1 = spiritDataList[1] ? STATE.CREATE_SPIRIT(spiritDataList[1]) : null;
    const spirit2 = spiritDataList[2] ? STATE.CREATE_SPIRIT(spiritDataList[2]) : null;
    const spirit3 = spiritDataList[3] ? STATE.CREATE_SPIRIT(spiritDataList[3]) : null;
    const spirit4 = spiritDataList[4] ? STATE.CREATE_SPIRIT(spiritDataList[4]) : null;
    const spirit5 = spiritDataList[5] ? STATE.CREATE_SPIRIT(spiritDataList[5]) : null;
    
    // 空殼 13 (A) 或 空殼 14 (B): Team Global Effect
    return {
      side,
      spirits: [spirit0, spirit1, spirit2, spirit3, spirit4, spirit5],
      currentIndex: 0,
      previousIndex: undefined,
      globalCountEffects: {},
      globalTurnEffects: [],
      $$$$$$$$add priority count to each team state,this is a Number, set at zero after, mark that priority system can call function to chnage current priority count$$$$$$$$
$$$$$$$$$add miss boolean to each team state, this is a boolean, sat as null every turn, mark that block system can call function ,state.miss/ STATE.unmiss to change miss boolean ,and call STATE.getmiss to get miss boolean$$$$$$$$$$
      items: { pp_potion: 3, hp_potion: 3, revive: 1 },
    };
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // 創建全局狀態
  // ─────────────────────────────────────────────────────────────────────────
  CREATE_GLOBAL(): GlobalState {
    return {
      turn: 0,
      weather: null,$$$no two such thing as weather and terrain in this game$$$$$$$$$
      terrain: null,
      countEffects: {},
      turnEffects: [],
    };
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 精靈上下場
  // ═══════════════════════════════════════════════════════════════════════════
  
  // ─────────────────────────────────────────────────────────────────────────
  // 精靈下場：清除臨時數據
  // ─────────────────────────────────────────────────────────────────────────
  CLEAR_ON_SWITCH_OUT(spirit: SpiritState): void {
    // 清除回合效果（除了不可消除的）
    spirit.turnEffects = spirit.turnEffects.filter(e => e.dispellable === false);
    // 清除次數效果
    spirit.countEffects = {};
    // 清除異常狀態
    spirit.statuses = [];
    // 重置屬性等級
    spirit.stages = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
    // 重置護盾
    spirit.shield = { hp: 0, count: 0, immune: 0 };
    // 重置先制
    spirit.priority = { bonus: 0, forceFirst: false, forceLast: false };
    // 重置免疫
    spirit.immunities = { status: [], damageType: [], statDrop: false };
    // 重置抗性到基礎值
    spirit.resist = { 
      fixed: spirit.baseResist?.fixed || 0,
      percent: spirit.baseResist?.percent || 0,
      trueDmg: spirit.baseResist?.trueDmg || 0,
    };
    // 重置臨時數值
    spirit.temporaryCount = 0;$$$$$$$$$$temporaryCount is stored in golbal state$$$$$$$$$$$
  },
  
  // ─────────────────────────────────────────────────────────────────────────
  // 精靈登場：初始化
  // ─────────────────────────────────────────────────────────────────────────
  INIT_ON_ENTRY(spirit: SpiritState): void {
    spirit.temporaryCount = 0;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HP 相關
  // ═══════════════════════════════════════════════════════════════════════════
  
  GET_HP(spirit: SpiritState): { current: number; max: number; percent: number } {
    return {
      current: spirit.hp.current,
      max: spirit.hp.max,
      percent: spirit.hp.max > 0 ? (spirit.hp.current / spirit.hp.max) * 100 : 0,
    };
  },
  
  CHECK_HP(
    spirit: SpiritState, 
    condition: 'alive' | 'dead' | 'below' | 'above' | 'equal',
    value?: number
  ): boolean {
    const percent = spirit.hp.max > 0 ? (spirit.hp.current / spirit.hp.max) * 100 : 0;
    switch (condition) {
      case 'alive': return spirit.hp.current > 0;
      case 'dead': return spirit.hp.current <= 0;
      case 'below': return value !== undefined ? percent < value : false;
      case 'above': return value !== undefined ? percent > value : false;
      case 'equal': return value !== undefined ? spirit.hp.current === value : false;
      default: return false;
    }
  },
  
  GET_LOST_HP(spirit: SpiritState): number {
    return spirit.hp.max - spirit.hp.current;
  },
  
  IS_LOW_HP(spirit: SpiritState, threshold = 25): boolean {
    const percent = spirit.hp.max > 0 ? (spirit.hp.current / spirit.hp.max) * 100 : 0;
    return percent <= threshold;
  },
  
  COMPARE_HP(spirit1: SpiritState, spirit2: SpiritState): 'higher' | 'lower' | 'equal' {
    if (spirit1.hp.current > spirit2.hp.current) return 'higher';
    if (spirit1.hp.current < spirit2.hp.current) return 'lower';
    return 'equal';
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PP 相關
  // ═══════════════════════════════════════════════════════════════════════════
  
  GET_PP(spirit: SpiritState, skillIndex?: number): { current: number; max: number; percent: number } {
    if (skillIndex !== undefined && spirit.skills[skillIndex]) {
      const skill = spirit.skills[skillIndex];
      return {
        current: skill.pp,
        max: skill.maxPp,
        percent: skill.maxPp > 0 ? (skill.pp / skill.maxPp) * 100 : 0,
      };
    }
    return {
      current: spirit.pp.current,
      max: spirit.pp.max,
      percent: spirit.pp.max > 0 ? (spirit.pp.current / spirit.pp.max) * 100 : 0,
    };
  },
  
  IS_PP_LOCKED(spirit: SpiritState): boolean {
    return spirit.pp.locked;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATS 相關
  // ═══════════════════════════════════════════════════════════════════════════
  
  GET_STAT(spirit: SpiritState, statName: keyof typeof spirit.baseStats): number {
    const base = spirit.baseStats[statName];
    const stage = spirit.stages[statName];
    const mult = [2/8, 2/7, 2/6, 2/5, 2/4, 2/3, 1, 3/2, 4/2, 5/2, 6/2, 7/2, 8/2];
    return Math.floor(base * mult[Math.max(0, Math.min(12, stage + 6))]);
  },
  
  GET_STAGE(spirit: SpiritState, statName: keyof typeof spirit.stages): number {
    return spirit.stages[statName];
  },
  
  HAS_STAT_UP(spirit: SpiritState): boolean {
    return Object.values(spirit.stages).some(v => v > 0);
  },
  
  HAS_STAT_DOWN(spirit: SpiritState): boolean {
    return Object.values(spirit.stages).some(v => v < 0);
  },
  
  COMPARE_STAT(
    spirit1: SpiritState, 
    spirit2: SpiritState, 
    statName: keyof typeof spirit1.stages
  ): 'higher' | 'lower' | 'equal' {
    const stage1 = spirit1.stages[statName];
    const stage2 = spirit2.stages[statName];
    if (stage1 > stage2) return 'higher';
    if (stage1 < stage2) return 'lower';
    return 'equal';
  },
  
  // 1. 檢查對手和自己相同等級的stats
  COUNT_SAME_STATS(spirit1: SpiritState, spirit2: SpiritState): number {
    let count = 0;
    const stats: (keyof typeof spirit1.stages)[] = ['attack', 'defense', 'spAttack', 'spDefense', 'speed'];
    for (const stat of stats) {
      if (spirit1.stages[stat] === spirit2.stages[stat]) count++;
    }
    return count;
  },

  // 2. 檢查對手有沒有強化,有則set [temporary boolean]的數值+1
  CHECK_OPPONENT_BUFF(self: SpiritState, opponent: SpiritState): void {
    const hasBuff = Object.values(opponent.stages).some(v => v > 0);
    if (hasBuff) {
      self.temporaryCount += 1;
    }
  },

  // 3. 檢查對手有沒有強化,沒有則set [temporary boolean]的數值+1
  CHECK_OPPONENT_NO_BUFF(self: SpiritState, opponent: SpiritState): void {
    const hasBuff = Object.values(opponent.stages).some(v => v > 0);
    if (!hasBuff) {
      self.temporaryCount += 1;
    }
  },

  // 4. 新增check [temporary boolean是否為2],ouput is boolean., outtput完,不管boolen結果是什麼,都要還原數值為0
  CHECK_TEMPORARY_COUNT(spirit: SpiritState): boolean {
    const result = spirit.temporaryCount === 2;
    spirit.temporaryCount = 0;
    return result;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS 相關
  // ═══════════════════════════════════════════════════════════════════════════
  
  HAS_STATUS(spirit: SpiritState, statusId: StatusType): boolean {
    return spirit.statuses.some(s => s.id === statusId);
  },
  
  IS_CONTROLLED(spirit: SpiritState): boolean {
    const controlStatus: StatusType[] = ['sleep', 'freeze', 'paralyze', 'fear', 'petrify', 'curse'];
    return spirit.statuses.some(s => controlStatus.includes(s.id));
  },
  
  GET_STATUS(spirit: SpiritState, statusId: StatusType): StatusEffect | null {
    return spirit.statuses.find(s => s.id === statusId) || null;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TURN EFFECT 相關
  // ═══════════════════════════════════════════════════════════════════════════
  
  HAS_TURN_EFFECT(spirit: SpiritState, effectId: string): boolean {
    return spirit.turnEffects.some(e => e.id === effectId);
  },
  
  GET_TURN_EFFECT(spirit: SpiritState, effectId: string): TurnEffect | null {
    return spirit.turnEffects.find(e => e.id === effectId) || null;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COUNT EFFECT 相關
  // ═══════════════════════════════════════════════════════════════════════════
  
  GET_COUNT(spirit: SpiritState, countId: string): number {
    return spirit.countEffects[countId]?.count || 0;
  },
  
  HAS_COUNT(spirit: SpiritState, countId: string): boolean {
    return (spirit.countEffects[countId]?.count || 0) > 0;
  },
  

  
  // ═══════════════════════════════════════════════════════════════════════════
  // SPIRIT 相關
  // ═══════════════════════════════════════════════════════════════════════════
  
  GET_KEY(spirit: SpiritState): string {
    return spirit.key;
  },
  
  IS_BOSS(spirit: SpiritState): boolean {
    return spirit.isBoss || false;
  },
  
  GET_ELEMENT(spirit: SpiritState): string {
    return spirit.element;
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TEAM 相關
  // ═══════════════════════════════════════════════════════════════════════════
  
  GET_ALIVE_COUNT(team: TeamState): number {
    return team.spirits.filter(s => s !== null && s.hp.current > 0).length;
  },
  
  IS_DEFEATED(team: TeamState): boolean {
    return team.spirits.filter(s => s !== null).every(s => s!.hp.current <= 0);
  },
  
  GET_CURRENT_INDEX(team: TeamState): number {
    return team.currentIndex;
  },
  
  HAS_SPIRIT(team: TeamState, key: string): boolean {
    return team.spirits.some(s => s !== null && s.key === key);
  },
  
  GET_CURRENT_SPIRIT(team: TeamState): SpiritState | null {
    return team.spirits[team.currentIndex] || null;
  },
  

  
};

// 為了兼容性，導出別名
export const createSpiritState = STATE.CREATE_SPIRIT;
export const createTeamState = STATE.CREATE_TEAM;
export const createGlobalState = STATE.CREATE_GLOBAL;
export const clearSpiritOnSwitchOut = STATE.CLEAR_ON_SWITCH_OUT;
export const initSpiritOnEntry = STATE.INIT_ON_ENTRY;

