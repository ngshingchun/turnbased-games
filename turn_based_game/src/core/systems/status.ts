/**
 * STATUS 系統 - 異常狀態系統
 * 
 * 管理精靈的異常狀態：施加、移除、檢查等
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * 
 * STATUS.APPLY(target, statusId, turns, chance?)
 *   - 施加異常狀態
 *   - 返回是否成功施加
 * 
 * STATUS.REMOVE(target, statusId)
 *   - 移除指定異常狀態
 * 
 * STATUS.CLEAR(target, type?)
 *   - 清除異常狀態
 *   - type: 'all' | 'control' | 'damage' | 'debuff'
 * 
 * STATUS.TICK(target)
 *   - 異常狀態回合遞減
 *   - 返回過期的狀態列表
 * 
 * STATUS.CHECK_IMMUNE(target, statusId)
 *   - 檢查是否免疫該狀態
 * 
 * STATUS.ADD_IMMUNITY(target, statusId, turns)
 *   - 添加狀態免疫
 * 
 * STATUS.REMOVE_IMMUNITY(target, statusId)
 *   - 移除狀態免疫
 * 
 * STATUS.REFLECT(target)
 *   - 設置狀態反彈
 */

import { SpiritState, StatusType, StatusEffect } from '../../types';

// 控制型異常
const CONTROL_STATUS: StatusType[] = ['sleep', 'freeze', 'paralyze', 'fear', 'petrify', 'curse'];

// 傷害型異常
const DAMAGE_STATUS: StatusType[] = ['burn', 'poison'];

// =============================================================================
// STATUS 系統
// =============================================================================

export const STATUSSystem = {
  APPLY: {
    execute(
      target: SpiritState,
      statusId: StatusType,
      turns: number = 1,
      chance: number = 100
    ): boolean {
      // 機率檢查
      if (Math.random() * 100 > chance) {
        return false;
      }
      
      // 檢查免疫
      if (target.immunities.status.includes(statusId)) {
        return false;
      }
      
      // 檢查次數免疫
      const immuneCount = target.countEffects[`status_immune_${statusId}`]?.count || 
                          target.countEffects['status_immune_all']?.count || 0;
      if (immuneCount > 0) {
        // 消耗一次免疫
        if (target.countEffects[`status_immune_${statusId}`]) {
          target.countEffects[`status_immune_${statusId}`].count--;
        } else if (target.countEffects['status_immune_all']) {
          target.countEffects['status_immune_all'].count--;
        }
        return false;
      }
      
      // 檢查反彈
      if (target.flags.reflectStatus) {
        // 反彈邏輯需要由調用方處理
        target.turnFlags.reflectedStatus = statusId;
        return false;
      }
      
      // 檢查是否已有該狀態
      const existingIndex = target.statuses.findIndex(s => s.id === statusId);
      if (existingIndex >= 0) {
        // 刷新回合數
        target.statuses[existingIndex].turns = Math.max(
          target.statuses[existingIndex].turns,
          turns
        );
        return true;
      }
      
      // 添加新狀態
      const newStatus: StatusEffect = {
        id: statusId,
        turns,
        source: 'opponent', // 可以由調用方設置
      };
      
      target.statuses.push(newStatus);
      return true;
    },
  },

  REMOVE: {
    execute(target: SpiritState, statusId: StatusType): boolean {
      const index = target.statuses.findIndex(s => s.id === statusId);
      if (index >= 0) {
        target.statuses.splice(index, 1);
        return true;
      }
      return false;
    },
  },

  CLEAR: {
    execute(target: SpiritState, type: 'all' | 'control' | 'damage' | 'debuff' = 'all'): number {
      let removed = 0;
      
      switch (type) {
        case 'all':
          removed = target.statuses.length;
          target.statuses = [];
          break;
          
        case 'control':
          target.statuses = target.statuses.filter(s => {
            if (CONTROL_STATUS.includes(s.id)) {
              removed++;
              return false;
            }
            return true;
          });
          break;
          
        case 'damage':
          target.statuses = target.statuses.filter(s => {
            if (DAMAGE_STATUS.includes(s.id)) {
              removed++;
              return false;
            }
            return true;
          });
          break;
          
        case 'debuff':
          // 清除所有負面效果
          removed = target.statuses.length;
          target.statuses = [];
          break;
      }
      
      return removed;
    },
  },

  TICK: {
    execute(target: SpiritState): StatusType[] {
      const expired: StatusType[] = [];
      
      target.statuses = target.statuses.filter(s => {
        s.turns--;
        if (s.turns <= 0) {
          expired.push(s.id);
          return false;
        }
        return true;
      });
      
      return expired;
    },
  },

  CHECK_IMMUNE: {
    execute(target: SpiritState, statusId: StatusType): boolean {
      // 永久免疫
      if (target.immunities.status.includes(statusId)) {
        return true;
      }
      
      // 次數免疫
      const immuneCount = target.countEffects[`status_immune_${statusId}`]?.count || 
                          target.countEffects['status_immune_all']?.count || 0;
      if (immuneCount > 0) {
        return true;
      }
      
      // 通用免疫標記
      if (target.flags.immuneStatus) {
        return true;
      }
      
      return false;
    },
  },

  ADD_IMMUNITY: {
    execute(target: SpiritState, statusId: StatusType | 'all', turns: number): void {
      if (statusId === 'all') {
        // 添加到永久免疫列表（臨時）
        target.flags.immuneStatus = true;
        target.turnEffects.push({
          id: 'status_immunity_all',
          name: '異常免疫',
          turns,
          node: '*',
          calls: [],
        });
      } else {
        target.immunities.status.push(statusId);
      }
    },
  },

  ADD_COUNT_IMMUNITY: {
    execute(target: SpiritState, statusId: StatusType | 'all', count: number): void {
      const key = statusId === 'all' ? 'status_immune_all' : `status_immune_${statusId}`;
      target.countEffects[key] = {
        id: key,
        name: `${statusId} 免疫`,
        count,
        max: count,
        node: '*',
      };
    },
  },

  REMOVE_IMMUNITY: {
    execute(target: SpiritState, statusId: StatusType): void {
      const index = target.immunities.status.indexOf(statusId);
      if (index >= 0) {
        target.immunities.status.splice(index, 1);
      }
    },
  },

  SET_REFLECT: {
    execute(target: SpiritState, value: boolean): void {
      target.flags.reflectStatus = value;
    },
  },
};



