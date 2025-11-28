/**
 * PP 系統 - 活力系統
 * 
 * 管理精靈的 PP 值：消耗、恢復、鎖定等
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * 
 * PP.USE(target, amount, skillIndex?)
 *   - 消耗 PP
 * 
 * PP.RESTORE(target, amount, skillIndex?)
 *   - 恢復指定數量的 PP
 * 
 * PP.RESTORE_PERCENT(target, percent, skillIndex?)
 *   - 按百分比恢復 PP
 * 
 * PP.RESTORE_ALL(target)
 *   - 恢復所有 PP
 * 
 * PP.DRAIN(target, amount, skillIndex?)
 *   - 吸取對手 PP
 * 
 * PP.SET(target, value, skillIndex?)
 *   - 直接設置 PP 值
 * 
 * PP.LOCK(target, turns)
 *   - 鎖定 PP（無法使用）
 * 
 * PP.UNLOCK(target)
 *   - 解鎖 PP
 * 
 * PP.TICK_LOCK(target)
 *   - PP 鎖定回合遞減
 */

import { SpiritState } from '../../types';

// =============================================================================
// PP 系統
// =============================================================================

export const PPSystem = {
  USE: {
    execute(spirit: SpiritState, amount: number, skillIndex?: number): number {
      if (spirit.pp.locked) return 0;
      
      if (skillIndex !== undefined && spirit.skills[skillIndex]) {
        const skill = spirit.skills[skillIndex];
        const actual = Math.min(skill.pp, Math.max(0, amount));
        skill.pp = Math.max(0, skill.pp - actual);
        return actual;
      }
      
      const actual = Math.min(spirit.pp.current, Math.max(0, amount));
      spirit.pp.current = Math.max(0, spirit.pp.current - actual);
      return actual;
    },
  },

  RESTORE: {
    execute(spirit: SpiritState, amount: number, skillIndex?: number): number {
      if (skillIndex !== undefined && spirit.skills[skillIndex]) {
        const skill = spirit.skills[skillIndex];
        const actual = Math.min(skill.maxPp - skill.pp, Math.max(0, amount));
        skill.pp = Math.min(skill.maxPp, skill.pp + actual);
        return actual;
      }
      
      const actual = Math.min(spirit.pp.max - spirit.pp.current, Math.max(0, amount));
      spirit.pp.current = Math.min(spirit.pp.max, spirit.pp.current + actual);
      return actual;
    },
  },

  RESTORE_PERCENT: {
    execute(spirit: SpiritState, percent: number, skillIndex?: number): number {
      if (skillIndex !== undefined && spirit.skills[skillIndex]) {
        const skill = spirit.skills[skillIndex];
        const amount = Math.floor(skill.maxPp * percent / 100);
        return PPSystem.RESTORE.execute(spirit, amount, skillIndex);
      }
      
      const amount = Math.floor(spirit.pp.max * percent / 100);
      return PPSystem.RESTORE.execute(spirit, amount);
    },
  },

  RESTORE_ALL: {
    execute(spirit: SpiritState): number {
      // 恢復總 PP
      const totalRestored = spirit.pp.max - spirit.pp.current;
      spirit.pp.current = spirit.pp.max;
      
      // 恢復所有技能 PP
      for (const skill of spirit.skills) {
        skill.pp = skill.maxPp;
      }
      
      return totalRestored;
    },
  },

  DRAIN: {
    execute(
      self: SpiritState, 
      target: SpiritState, 
      amount: number, 
      skillIndex?: number
    ): { drained: number; restored: number } {
      const drained = PPSystem.USE.execute(target, amount, skillIndex);
      const restored = PPSystem.RESTORE.execute(self, drained, skillIndex);
      return { drained, restored };
    },
  },

  SET: {
    execute(spirit: SpiritState, value: number, skillIndex?: number): void {
      if (skillIndex !== undefined && spirit.skills[skillIndex]) {
        const skill = spirit.skills[skillIndex];
        skill.pp = Math.max(0, Math.min(skill.maxPp, value));
        return;
      }
      
      spirit.pp.current = Math.max(0, Math.min(spirit.pp.max, value));
    },
  },

  LOCK: {
    execute(spirit: SpiritState, turns: number = 1): void {
      spirit.pp.locked = true;
      spirit.pp.lockTurns = turns;
    },
  },

  UNLOCK: {
    execute(spirit: SpiritState): void {
      spirit.pp.locked = false;
      spirit.pp.lockTurns = 0;
    },
  },

  TICK_LOCK: {
    execute(spirit: SpiritState): boolean {
      if (spirit.pp.lockTurns > 0) {
        spirit.pp.lockTurns--;
        if (spirit.pp.lockTurns <= 0) {
          PPSystem.UNLOCK.execute(spirit);
          return true; // 解鎖了
        }
      }
      return false;
    },
  },
};



