/**
 * HP 系統 - 體力系統
 * 
 * 管理精靈的體力值：治療、傷害、設置等
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * 
 * HP.HEAL(target, amount)
 *   - 恢復指定數量的 HP
 * 
 * HP.HEAL_PERCENT(target, percent, basedOn)
 *   - basedOn: 'max' | 'current' | 'lost'
 *   - 按百分比恢復 HP
 * 
 * HP.SET(target, value)
 *   - value: number | 'max' | 'min'
 *   - 直接設置 HP 值
 * 
 * HP.DRAIN(target, amount)
 *   - 吸取目標 HP 給自己
 * 
 * HP.DRAIN_PERCENT(target, percent, basedOn)
 *   - 按百分比吸取 HP
 * 
 * HP.DAMAGE(target, amount)
 *   - 對目標造成固定傷害（非攻擊傷害）
 * 
 * HP.DAMAGE_PERCENT(target, percent, basedOn)
 *   - 按百分比造成傷害
 * 
 * HP.SACRIFICE(target, amount)
 *   - 犧牲自身 HP（不觸發受傷效果）
 * 
 * HP.LOCK(target, minHp)
 *   - 鎖血，HP 不會低於 minHp
 * 
 * HP.UNLOCK(target)
 *   - 解除鎖血
 * 
 * HP.BLOCK_HEAL(target)
 *   - 禁止治療
 * 
 * HP.UNBLOCK_HEAL(target)
 *   - 解除禁療
 * 
 * HP.REVIVE(target, percent)
 *   - 復活精靈，恢復 percent% 的 HP
 */

import { SpiritState } from '../../types';

// =============================================================================
// HP 系統
// =============================================================================

export const HPSystem = {
  HEAL: {
    execute(spirit: SpiritState, amount: number): number {
      // 檢查禁療
      if (spirit.flags.healBlocked) return 0;
      
      const actual = Math.min(spirit.hp.max - spirit.hp.current, Math.max(0, amount));
      spirit.hp.current = Math.min(spirit.hp.max, spirit.hp.current + actual);
      spirit.turnFlags.lastHealAmount = actual;
      return actual;
    },
  },

  HEAL_PERCENT: {
    execute(
      spirit: SpiritState, 
      percent: number, 
      basedOn: 'max' | 'current' | 'lost' = 'max'
    ): number {
      if (spirit.flags.healBlocked) return 0;
      
      let base: number;
      switch (basedOn) {
        case 'max':
          base = spirit.hp.max;
          break;
        case 'current':
          base = spirit.hp.current;
          break;
        case 'lost':
          base = spirit.hp.max - spirit.hp.current;
          break;
        default:
          base = spirit.hp.max;
      }
      
      const amount = Math.floor(base * percent / 100);
      return HPSystem.HEAL.execute(spirit, amount);
    },
  },

  SET: {
    execute(spirit: SpiritState, value: number | 'max' | 'min'): void {
      if (value === 'max') {
        spirit.hp.current = spirit.hp.max;
      } else if (value === 'min') {
        spirit.hp.current = 1;
      } else {
        spirit.hp.current = Math.max(0, Math.min(spirit.hp.max, value));
      }
      
      if (spirit.hp.current <= 0) {
        spirit.isAlive = false;
      }
    },
  },

  DRAIN: {
    execute(self: SpiritState, target: SpiritState, amount: number): { drained: number; healed: number } {
      const drained = HPSystem.DAMAGE.execute(target, amount);
      const healed = HPSystem.HEAL.execute(self, drained);
      return { drained, healed };
    },
  },

  DRAIN_PERCENT: {
    execute(
      self: SpiritState, 
      target: SpiritState, 
      percent: number, 
      basedOn: 'max' | 'current' = 'max'
    ): { drained: number; healed: number } {
      const base = basedOn === 'max' ? target.hp.max : target.hp.current;
      const amount = Math.floor(base * percent / 100);
      return HPSystem.DRAIN.execute(self, target, amount);
    },
  },

  DAMAGE: {
    execute(spirit: SpiritState, amount: number): number {
      // 應用護盾
      let remainingDamage = amount;
      
      // 免疫護盾
      if (spirit.shield.immune > 0) {
        spirit.shield.immune--;
        return 0;
      }
      
      // 次數護盾
      if (spirit.shield.count > 0) {
        spirit.shield.count--;
        return 0;
      }
      
      // HP 護盾
      if (spirit.shield.hp > 0) {
        if (spirit.shield.hp >= remainingDamage) {
          spirit.shield.hp -= remainingDamage;
          return 0;
        } else {
          remainingDamage -= spirit.shield.hp;
          spirit.shield.hp = 0;
        }
      }
      
      // 檢查鎖血
      const minHp = (spirit.flags.hpLock as number) || 0;
      const actualDamage = Math.min(
        spirit.hp.current - minHp,
        Math.max(0, remainingDamage)
      );
      
      spirit.hp.current = Math.max(minHp, spirit.hp.current - actualDamage);
      spirit.turnFlags.lastDamageReceived = actualDamage;
      spirit.turnFlags.tookDamageThisTurn = true;
      
      if (spirit.hp.current <= 0) {
        spirit.isAlive = false;
      }
      
      return actualDamage;
    },
  },

  DAMAGE_PERCENT: {
    execute(
      spirit: SpiritState, 
      percent: number, 
      basedOn: 'max' | 'current' = 'max'
    ): number {
      const base = basedOn === 'max' ? spirit.hp.max : spirit.hp.current;
      const amount = Math.floor(base * percent / 100);
      return HPSystem.DAMAGE.execute(spirit, amount);
    },
  },

  SACRIFICE: {
    execute(spirit: SpiritState, amount: number): number {
      // 犧牲不觸發受傷效果，直接扣血
      const actual = Math.min(spirit.hp.current - 1, Math.max(0, amount)); // 至少保留1HP
      spirit.hp.current -= actual;
      return actual;
    },
  },

  LOCK: {
    execute(spirit: SpiritState, minHp: number): void {
      spirit.flags.hpLock = minHp;
    },
  },

  UNLOCK: {
    execute(spirit: SpiritState): void {
      delete spirit.flags.hpLock;
    },
  },

  BLOCK_HEAL: {
    execute(spirit: SpiritState): void {
      spirit.flags.healBlocked = true;
    },
  },

  UNBLOCK_HEAL: {
    execute(spirit: SpiritState): void {
      spirit.flags.healBlocked = false;
    },
  },

  REVIVE: {
    execute(spirit: SpiritState, percent: number = 50): number {
      if (spirit.hp.current > 0) return 0; // 還活著
      
      const amount = Math.floor(spirit.hp.max * percent / 100);
      spirit.hp.current = amount;
      spirit.isAlive = true;
      return amount;
    },
  },

  // 恢復 HP 並對對手造成等量傷害
  HEAL_AND_DAMAGE: {
    execute(
      self: SpiritState, 
      target: SpiritState, 
      percent: number, 
      ofMax: boolean = true
    ): { healed: number; damaged: number } {
      const base = ofMax ? self.hp.max : (self.hp.max - self.hp.current);
      const amount = Math.floor(base * percent / 100);
      
      const healed = HPSystem.HEAL.execute(self, amount);
      const damaged = HPSystem.DAMAGE.execute(target, amount);
      
      return { healed, damaged };
    },
  },

  // 標記精靈死亡
  KILL: {
    execute(spirit: SpiritState): void {
      spirit.hp.current = 0;
      spirit.isAlive = false;
    },
  },
};



