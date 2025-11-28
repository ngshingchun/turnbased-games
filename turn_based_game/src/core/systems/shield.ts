/**
 * SHIELD 系統 - 護盾系統$$$$$$$$$$rename to protection system$$$$$$$$$$$
 * 
 * 管理精靈的護盾和護罩效果
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * $$$$$$$$$$$護罩,shell,shield resist certain amount of fixed damage and percent damage
 * 護盾,shield, resist certain amount of attack damage; protection.addshieldamount(target) this will excute state.addshieldamount(target) to add shield amount to target$$$$$$$$$$$

 * 
 * SHIELD.CLEAR(target)
 *   - 清除所有護盾
 * 
 * SHIELD.GET(target)
 *   - 獲取護盾狀態
 */

import { SpiritState } from '../../types';

// =============================================================================
// SHIELD 系統
// =============================================================================

export const SHIELDSystem = {
  ADD_HP: {
    execute(target: SpiritState, amount: number): void {
      target.shield.hp += amount;
    },
  },

  ADD_COUNT: {
    execute(target: SpiritState, count: number): void {
      target.shield.count += count;
    },
  },

  ADD_IMMUNE: {
    execute(target: SpiritState, count: number): void {
      target.shield.immune += count;
    },
  },

  ABSORB: {
    execute(target: SpiritState, damage: number): number {
      // 免疫護盾優先
      if (target.shield.immune > 0) {
        target.shield.immune--;
        return 0;
      }
      
      // 次數護盾
      if (target.shield.count > 0) {
        target.shield.count--;
        return 0;
      }
      
      // HP 護盾
      if (target.shield.hp > 0) {
        if (target.shield.hp >= damage) {
          target.shield.hp -= damage;
          return 0;
        } else {
          const remaining = damage - target.shield.hp;
          target.shield.hp = 0;
          return remaining;
        }
      }
      
      return damage;
    },
  },

  CLEAR: {
    execute(target: SpiritState): void {
      target.shield = {
        hp: 0,
        count: 0,
        immune: 0,
      };
    },
  },

  GET: {
    execute(target: SpiritState): { hp: number; count: number; immune: number } {
      return { ...target.shield };
    },
  },
};



