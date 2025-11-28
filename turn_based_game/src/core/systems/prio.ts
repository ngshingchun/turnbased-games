/**
 * PRIO 系統 - 先制系統
 * 
 * 管理精靈的先制值和先後手判定
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * 
 * PRIO.ADD(target, amount)
 *   - 增加先制值
 * 
 * PRIO.DOWN(target, amount)
 *   - 減少先制值
 * 
 * PRIO.FORCE_FIRST(target)
 *   - 強制先手
 * 
 * PRIO.FORCE_LAST(target)
 *   - 強制後手
 * 
 * PRIO.BLOCK(target)
 *   - 封鎖先制（無法獲得先制加成）
 * 
 * PRIO.UNBLOCK(target)
 *   - 解除封鎖
 * 
 * PRIO.RESET(target)
 *   - 重置先制值到基礎值
 * 
 * PRIO.SWAP()
 *   - 交換先後手
 * 
 * PRIO.CALC(spirit, skillPriority?)
 *   - 計算最終先制值
 * 
 * PRIO.COMPARE(spiritA, spiritB, skillA, skillB)
 *   - 比較雙方先制，決定先後手
 */

import { SpiritState, Skill } from '../../types';
import { STATE } from '../state';

// =============================================================================
// PRIO 系統
// =============================================================================

export const PRIOSystem = {
  ADD: {
    execute(spirit: SpiritState, amount: number): void {
      spirit.priority.bonus += amount;
    },
  },

  DOWN: {
    execute(spirit: SpiritState, amount: number): void {
      spirit.priority.bonus -= amount;
    },
  },

  FORCE_FIRST: {
    execute(spirit: SpiritState): void {
      spirit.priority.forceFirst = true;
    },
  },

  FORCE_LAST: {
    execute(spirit: SpiritState): void {
      spirit.priority.forceLast = true;
    },
  },



  RESET: {
    execute(spirit: SpiritState): void {
      spirit.priority.bonus = 0;
      spirit.priority.forceFirst = false;
      spirit.priority.forceLast = false;
    },
  },

  CALC: {
    execute(spirit: SpiritState, skillPriority: number = 0): {
      priority: number;
      forceFirst: boolean;
      forceLast: boolean;
    } {
      // 強制效果
      if (spirit.priority.forceFirst) {
        return {
          priority: Infinity,
          forceFirst: true,
          forceLast: false,
        };
      }
      
      if (spirit.priority.forceLast) {
        return {
          priority: -Infinity,
          forceFirst: false,
          forceLast: true,
        };
      }
      
      // 計算速度
      const speed = STATE.GET_STAT(spirit, 'speed');
      
      // 最終先制 = 技能先制 + 速度/100 + 加成
      const priority = skillPriority * 1000 + speed + spirit.priority.bonus;
      
      return {
        priority,
        forceFirst: false,
        forceLast: false,
      };
    },
  },

  COMPARE: {
    execute(
      spiritA: SpiritState,
      spiritB: SpiritState,
      skillA?: Skill,
      skillB?: Skill
    ): {
      first: 'A' | 'B';
      second: 'A' | 'B';
      reason: string;
    } {
      const prioA = PRIOSystem.CALC.execute(spiritA, skillA?.priority || 0);
      const prioB = PRIOSystem.CALC.execute(spiritB, skillB?.priority || 0);
      
      // 強制先手檢查
      if (prioA.forceFirst && !prioB.forceFirst) {
        return { first: 'A', second: 'B', reason: 'forceFirst' };
      }
      if (prioB.forceFirst && !prioA.forceFirst) {
        return { first: 'B', second: 'A', reason: 'forceFirst' };
      }
      
      // 強制後手檢查
      if (prioA.forceLast && !prioB.forceLast) {
        return { first: 'B', second: 'A', reason: 'forceLast' };
      }
      if (prioB.forceLast && !prioA.forceLast) {
        return { first: 'A', second: 'B', reason: 'forceLast' };
      }
      
      // 正常比較
      if (prioA.priority > prioB.priority) {
        return { first: 'A', second: 'B', reason: 'priority' };
      }
      if (prioB.priority > prioA.priority) {
        return { first: 'B', second: 'A', reason: 'priority' };
      }
      
      // 速度相同，隨機
      const random = Math.random() < 0.5;
      return {
        first: random ? 'A' : 'B',
        second: random ? 'B' : 'A',
        reason: 'random',
      };
    },
  },
};

