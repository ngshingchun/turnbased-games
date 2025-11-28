/**
 * IMMUNITY 系統 - 免疫系統
 * 
 * 管理精靈的各種免疫效果
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * 
 *{} IMMUNITY.ADD_STATUS(target, statusId)
 *   - 添加狀態免疫
 * 
 * IMMUNITY.REMOVE_STATUS(target, statusId)
 *   - 移除狀態免疫
 * }$$$$$move to status system,call status.add_immunity$$$$$$$$$
 * 
 * IMMUNITY.ADD_DAMAGE_TYPE(target, damageType)
 *   - 添加傷害類型免疫
 * 
 * IMMUNITY.REMOVE_DAMAGE_TYPE(target, damageType)
 *   - 移除傷害類型免疫$$$$$$$$$$move to resist system,call resist.attackdamageresisttox%(generic Dealing Damage node,x),$$$$$$$$$
 * 
 * IMMUNITY.ADD_STAT_DROP(target)
 *   - 添加屬性下降免疫$$$$$$$$$$move to state system,call state.setallkindstatminimumvalueto0, which stats value is [-6,6] for each kind of stats$$$$$$$$$
 * 
 *///////////// IMMUNITY.REMOVE_STAT_DROP(target)
 *   - 移除屬性下降免疫
 * 
 * IMMUNITY.CHECK_STATUS(target, statusId)
 *   - 檢查是否免疫該狀態
 * 
 * IMMUNITY.CHECK_DAMAGE_TYPE(target, damageType)
 *   - 檢查是否免疫該傷害類型
 * 
 * IMMUNITY.CHECK_STAT_DROP(target)
 *   - 檢查是否免疫屬性下降
 * 
 * IMMUNITY.GET_ALL(target)
 *   - 獲取所有免疫信息
 * 
 * IMMUNITY.CLEAR(target, type?)
 *   - 清除免疫
 *   - type: 'all' | 'status' | 'damage' | 'stat'//////////////$$$$$$$$remove this whole system$$$$$$$$$$$$$$
 */

import { SpiritState, StatusType } from '../../types';

type DamageType = 'fixed' | 'percent' | 'true' | 'attack';

// =============================================================================
// IMMUNITY 系統
// =============================================================================

export const IMMUNITYSystem = {
  ADD_STATUS: {
    execute(target: SpiritState, statusId: StatusType): void {
      if (!target.immunities.status.includes(statusId)) {
        target.immunities.status.push(statusId);
      }
    },
  },

  REMOVE_STATUS: {
    execute(target: SpiritState, statusId: StatusType): boolean {
      const index = target.immunities.status.indexOf(statusId);
      if (index >= 0) {
        target.immunities.status.splice(index, 1);
        return true;
      }
      return false;
    },
  },

  ADD_DAMAGE_TYPE: {
    execute(target: SpiritState, damageType: DamageType): void {
      if (!target.immunities.damageType.includes(damageType)) {
        target.immunities.damageType.push(damageType);
      }
    },
  },

  REMOVE_DAMAGE_TYPE: {
    execute(target: SpiritState, damageType: DamageType): boolean {
      const index = target.immunities.damageType.indexOf(damageType);
      if (index >= 0) {
        target.immunities.damageType.splice(index, 1);
        return true;
      }
      return false;
    },
  },

  ADD_STAT_DROP: {
    execute(target: SpiritState): void {
      target.immunities.statDrop = true;
    },
  },

  REMOVE_STAT_DROP: {
    execute(target: SpiritState): void {
      target.immunities.statDrop = false;
    },
  },

  CHECK_STATUS: {
    execute(target: SpiritState, statusId: StatusType): boolean {
      return target.immunities.status.includes(statusId);
    },
  },

  CHECK_DAMAGE_TYPE: {
    execute(target: SpiritState, damageType: DamageType): boolean {
      return target.immunities.damageType.includes(damageType);
    },
  },

  CHECK_STAT_DROP: {
    execute(target: SpiritState): boolean {
      return target.immunities.statDrop;
    },
  },

  GET_ALL: {
    execute(target: SpiritState): {
      status: StatusType[];
      damageType: string[];
      statDrop: boolean;
    } {
      return {
        status: [...target.immunities.status],
        damageType: [...target.immunities.damageType],
        statDrop: target.immunities.statDrop,
      };
    },
  },

  CLEAR: {
    execute(
      target: SpiritState,
      type: 'all' | 'status' | 'damage' | 'stat' = 'all'
    ): void {
      switch (type) {
        case 'all':
          target.immunities.status = [];
          target.immunities.damageType = [];
          target.immunities.statDrop = false;
          break;
        case 'status':
          target.immunities.status = [];
          break;
        case 'damage':
          target.immunities.damageType = [];
          break;
        case 'stat':
          target.immunities.statDrop = false;
          break;
      }
    },
  },
};

