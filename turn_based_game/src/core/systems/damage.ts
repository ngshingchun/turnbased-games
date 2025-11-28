/**
 * DAMAGE 系統 - 傷害系統
 * 
 * 管理攻擊傷害計算
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * 
 * DAMAGE.ATTACK(attacker, defender, power, category)
 *   - 計算並造成攻擊傷害（紅傷）
 *   - category: 'physical' | 'special'
 * 
 * DAMAGE.FIXED(target, amount)
 *   - 造成固定傷害（粉傷）
 * 
 * DAMAGE.PERCENT(target, percent, basedOn)
 *   - 造成百分比傷害
 *   - basedOn: 'max' | 'current' | 'lost'
 * 
 * DAMAGE.TRUE(target, amount)
 *   - 造成真實傷害（白傷，無視抗性）
 * 
 * DAMAGE.REFLECT(source, target, ratio, lastDamage)
 *   - 反彈傷害
 * 
 * DAMAGE.RECOIL(attacker, ratio, lastDamage)
 *   - 反傷（自傷）
 * 
 * DAMAGE.ABSORB(attacker, defender, ratio, lastDamage)
 *   - 吸取傷害
 */

import { SpiritState, Skill } from '../../types';
import { STATE } from '../state';
import { HPSystem } from './hp';

// =============================================================================
// DAMAGE 系統
// =============================================================================

export const DAMAGESystem = {
  ATTACK: {
    execute(
      attacker: SpiritState,
      defender: SpiritState,
      power: number,
      category: 'physical' | 'special' = 'physical'
    ): number {
      // 獲取攻擊和防禦屬性
      const atkStat = category === 'physical'
        ? STATE.GET_STAT(attacker, 'attack')
        : STATE.GET_STAT(attacker, 'spAttack');
      const defStat = category === 'physical'
        ? STATE.GET_STAT(defender, 'defense')
        : STATE.GET_STAT(defender, 'spDefense');
      
      // 基礎傷害公式
      let damage = Math.floor((power * atkStat / Math.max(1, defStat)) * 0.5 + 10);
      
      // 應用抗性（攻擊傷害用 fixed 抗性）
      damage = Math.floor(damage * (1 - defender.resist.fixed / 100));
      
      // 造成傷害
      const actual = HPSystem.DAMAGE.execute(defender, damage);
      
      return actual;
    },
  },

  FIXED: {
    execute(target: SpiritState, amount: number): number {
      // 應用固傷抗性
      const damage = Math.floor(amount * (1 - target.resist.fixed / 100));
      return HPSystem.DAMAGE.execute(target, damage);
    },
  },

  PERCENT: {
    execute(
      target: SpiritState,
      percent: number,
      basedOn: 'max' | 'current' | 'lost' = 'max'
    ): number {
      let base: number;
      switch (basedOn) {
        case 'max':
          base = target.hp.max;
          break;
        case 'current':
          base = target.hp.current;
          break;
        case 'lost':
          base = target.hp.max - target.hp.current;
          break;
        default:
          base = target.hp.max;
      }
      
      const amount = Math.floor(base * percent / 100);
      
      // 應用百分比傷害抗性
      const damage = Math.floor(amount * (1 - target.resist.percent / 100));
      return HPSystem.DAMAGE.execute(target, damage);
    },
  },

  TRUE: {
    execute(target: SpiritState, amount: number): number {
      // 真實傷害，只受 trueDmg 抗性影響
      const damage = Math.floor(amount * (1 - target.resist.trueDmg / 100));
      return HPSystem.DAMAGE.execute(target, damage);
    },
  },

  REFLECT: {
    execute(
      _source: SpiritState,
      target: SpiritState,
      ratio: number,
      lastDamage: number
    ): number {
      const amount = Math.floor(lastDamage * ratio);
      return HPSystem.DAMAGE.execute(target, amount);
    },
  },

  RECOIL: {
    execute(attacker: SpiritState, ratio: number, lastDamage: number): number {
      const amount = Math.floor(lastDamage * ratio);
      return HPSystem.DAMAGE.execute(attacker, amount);
    },
  },

  ABSORB: {
    execute(
      attacker: SpiritState,
      defender: SpiritState,
      ratio: number,
      lastDamage: number
    ): { healed: number } {
      const amount = Math.floor(lastDamage * ratio);
      const healed = HPSystem.HEAL.execute(attacker, amount);
      return { healed };
    },
  },


};

