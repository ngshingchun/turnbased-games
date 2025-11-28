/**
 * STATS 系統 - 屬性系統
 * 
 * 管理精靈的屬性等級（強化/弱化）
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * 
 * STATS.MODIFY(target, stats)
 *   - stats: { attack?, defense?, spAttack?, spDefense?, speed? }
 *   - 修改屬性等級
 * 
 * STATS.CLEAR_UPS(target)
 *   - 消除所有強化
 *   - 返回是否成功消除（是否有強化）
 * 
 * STATS.CLEAR_DOWNS(target)
 *   - 消除所有弱化
 * 
 * STATS.CLEAR_ALL(target)
 *   - 消除所有屬性變化
 * 
 * STATS.REVERSE(target)
 *   - 反轉所有屬性等級
 *   - 返回是否有反轉發生
 * 
 * STATS.STEAL(target, attacker, stats)
 *   - 偷取目標的強化等級
 * 
 * STATS.COPY(target, source)
 *   - 複製來源的屬性等級
 * 
 * STATS.SYNC_DOWN(target, reference)
 *   - 將目標的過高等級同步到與參考相同（只降低）
 * 
 * STATS.LOCK(target)
 *   - 鎖定屬性等級（無法被修改）
 * 
 * STATS.UNLOCK(target)
 *   - 解鎖屬性等級
 */

import { SpiritState, StatsStage } from '../../types';

type StatName = 'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed';

// =============================================================================
// STATS 系統
// =============================================================================

export const STATSSystem = {
  MODIFY: {
    execute(
      spirit: SpiritState, 
      stats: Partial<Record<StatName, number>>,
      _chance: number = 100
    ): boolean {
      // 檢查屬性鎖定
      if (spirit.flags.statLocked) return false;
      
      // 檢查是否禁止強化
      if (spirit.flags.blockStatUp) {
        // 過濾掉強化，只保留弱化
        const filteredStats: Partial<Record<StatName, number>> = {};
        for (const [key, value] of Object.entries(stats)) {
          if (value !== undefined && value < 0) {
            filteredStats[key as StatName] = value;
          }
        }
        stats = filteredStats;
      }
      
      // 檢查是否免疫弱化
      if (spirit.flags.immuneStatDown) {
        // 過濾掉弱化，只保留強化
        const filteredStats: Partial<Record<StatName, number>> = {};
        for (const [key, value] of Object.entries(stats)) {
          if (value !== undefined && value > 0) {
            filteredStats[key as StatName] = value;
          }
        }
        stats = filteredStats;
      }
      
      let anyChange = false;
      
      for (const [key, value] of Object.entries(stats)) {
        if (value !== undefined && key in spirit.stages) {
          const statKey = key as StatName;
          const oldVal = spirit.stages[statKey];
          // 屬性等級範圍: -6 到 +6
          spirit.stages[statKey] = Math.max(-6, Math.min(6, oldVal + value));
          if (spirit.stages[statKey] !== oldVal) {
            anyChange = true;
          }
        }
      }
      
      return anyChange;
    },
  },

  CLEAR_UPS: {
    execute(spirit: SpiritState): boolean {
      let hadUps = false;
      
      for (const key of ['attack', 'defense', 'spAttack', 'spDefense', 'speed'] as StatName[]) {
        if (spirit.stages[key] > 0) {
          spirit.stages[key] = 0;
          hadUps = true;
        }
      }
      
      return hadUps;
    },
  },

  CLEAR_DOWNS: {
    execute(spirit: SpiritState): boolean {
      let hadDowns = false;
      
      for (const key of ['attack', 'defense', 'spAttack', 'spDefense', 'speed'] as StatName[]) {
        if (spirit.stages[key] < 0) {
          spirit.stages[key] = 0;
          hadDowns = true;
        }
      }
      
      return hadDowns;
    },
  },

  CLEAR_ALL: {
    execute(spirit: SpiritState): void {
      spirit.stages = {
        attack: 0,
        defense: 0,
        spAttack: 0,
        spDefense: 0,
        speed: 0,
      };
    },
  },

  REVERSE: {
    execute(spirit: SpiritState): boolean {
      let anyChange = false;
      
      for (const key of ['attack', 'defense', 'spAttack', 'spDefense', 'speed'] as StatName[]) {
        if (spirit.stages[key] !== 0) {
          spirit.stages[key] = -spirit.stages[key];
          anyChange = true;
        }
      }
      
      return anyChange;
    },
  },

  STEAL: {
    execute(target: SpiritState, attacker: SpiritState): boolean {
      let anyStolen = false;
      
      for (const key of ['attack', 'defense', 'spAttack', 'spDefense', 'speed'] as StatName[]) {
        if (target.stages[key] > 0) {
          attacker.stages[key] = Math.min(6, attacker.stages[key] + target.stages[key]);
          target.stages[key] = 0;
          anyStolen = true;
        }
      }
      
      return anyStolen;
    },
  },

  COPY: {
    execute(target: SpiritState, source: SpiritState): void {
      for (const key of ['attack', 'defense', 'spAttack', 'spDefense', 'speed'] as StatName[]) {
        target.stages[key] = source.stages[key];
      }
    },
  },

  SYNC_DOWN: {
    execute(target: SpiritState, reference: SpiritState): boolean {
      let anyChange = false;
      
      for (const key of ['attack', 'defense', 'spAttack', 'spDefense', 'speed'] as StatName[]) {
        if (target.stages[key] > reference.stages[key]) {
          target.stages[key] = reference.stages[key];
          anyChange = true;
        }
      }
      
      return anyChange;
    },
  },

  LOCK: {
    execute(spirit: SpiritState): void {
      spirit.flags.statLocked = true;
    },
  },

  UNLOCK: {
    execute(spirit: SpiritState): void {
      spirit.flags.statLocked = false;
    },
  },

  BLOCK_UP: {
    execute(spirit: SpiritState): void {
      spirit.flags.blockStatUp = true;
    },
  },

  UNBLOCK_UP: {
    execute(spirit: SpiritState): void {
      spirit.flags.blockStatUp = false;
    },
  },

  IMMUNE_DOWN: {
    execute(spirit: SpiritState): void {
      spirit.flags.immuneStatDown = true;
    },
  },

  REMOVE_IMMUNE_DOWN: {
    execute(spirit: SpiritState): void {
      spirit.flags.immuneStatDown = false;
    },
  },
};



