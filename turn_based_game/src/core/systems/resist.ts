/**
 * RESIST 系統 - 抗性系統
 * 
 * 管理精靈的傷害抗性
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * $$$$$$$$$$$resist.setattack(0-100%)$$$$$$$$$$$$$4
 * RESIST.SET_FIXED(target, value)
 *   - 設置固定傷害抗性 (0-100%)
 * 
 * RESIST.SET_PERCENT(target, value)
 *   - 設置百分比傷害抗性 (0-100%)
 * 
 * RESIST.SET_TRUE(target, value)
 *   - 設置真實傷害抗性 (0-100%)$$$$$$$$no such thing as true damage resist in this game$$$$$$$$$
 * 

 * RESIST.RESET(target)
 *   - 重置抗性到初始值$$$$$$to 0.35$$$$$$$$$$
 */

import { SpiritState } from '../../types';

// =============================================================================
// RESIST 系統
// =============================================================================

export const RESISTSystem = {
  SET_FIXED: {
    execute(target: SpiritState, value: number): void {
      target.resist.fixed = Math.max(0, Math.min(100, value));
    },
  },

  SET_PERCENT: {
    execute(target: SpiritState, value: number): void {
      target.resist.percent = Math.max(0, Math.min(100, value));
    },
  },

  SET_TRUE: {
    execute(target: SpiritState, value: number): void {
      target.resist.trueDmg = Math.max(0, Math.min(100, value));
    },
  },

  MODIFY_FIXED: {
    execute(target: SpiritState, delta: number): number {
      const oldValue = target.resist.fixed;
      target.resist.fixed = Math.max(0, Math.min(100, oldValue + delta));
      return target.resist.fixed - oldValue;
    },
  },

  MODIFY_PERCENT: {
    execute(target: SpiritState, delta: number): number {
      const oldValue = target.resist.percent;
      target.resist.percent = Math.max(0, Math.min(100, oldValue + delta));
      return target.resist.percent - oldValue;
    },
  },

  MODIFY_TRUE: {
    execute(target: SpiritState, delta: number): number {
      const oldValue = target.resist.trueDmg;
      target.resist.trueDmg = Math.max(0, Math.min(100, oldValue + delta));
      return target.resist.trueDmg - oldValue;
    },
  },

  GET: {
    execute(target: SpiritState): { fixed: number; percent: number; trueDmg: number } {
      return { ...target.resist };
    },
  },

  CALC: {
    execute(
      damage: number,
      damageType: 'fixed' | 'percent' | 'true',
      target: SpiritState
    ): number {
      let resist: number;
      
      switch (damageType) {
        case 'fixed':
          resist = target.resist.fixed;
          break;
        case 'percent':
          resist = target.resist.percent;
          break;
        case 'true':
          resist = target.resist.trueDmg;
          break;
        default:
          resist = 0;
      }
      
      return Math.floor(damage * (1 - resist / 100));
    },
  },

  RESET: {
    execute(target: SpiritState): void {
      target.resist = {
        fixed: target.baseResist?.fixed || 0,
        percent: target.baseResist?.percent || 0,
        trueDmg: target.baseResist?.trueDmg || 0,
      };
    },
  },
};



