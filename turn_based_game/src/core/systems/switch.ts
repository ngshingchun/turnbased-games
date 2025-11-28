/**
 * SWITCH 系統 - 換人系統
 * 
 * 管理精靈的切換：主動換人、死亡換人、強制換人等
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * 
 * SWITCH.CHECK_CAN(team)
 *   - 檢查是否可以換人
 *   - 返回 { can: boolean, reason?: string }
 * 
 * SWITCH.GET_AVAILABLE(team)
 *   - 獲取可切換的精靈索引列表
 * 
 * SWITCH.EXECUTE(team, newIndex)
 *   - 執行換人
 * 
 * SWITCH.FORCE(team, newIndex)
 *   - 強制換人（無視限制）
 * 
 * SWITCH.DEATH(team)
 *   - 死亡換人（選擇下一個活著的精靈）
 *   - 返回新的索引，或 -1 表示全滅
 * 
 * SWITCH.BLOCK(spirit)
 *   - 封鎖換人
 * 
 * SWITCH.UNBLOCK(spirit)
 *   - 解除封鎖
 * 
 * SWITCH.IS_BLOCKED(spirit)
 *   - 檢查是否被封鎖
 * 
 * SWITCH.GET_PREVIOUS(team)
 *   - 獲取上一個精靈
 */

import { SpiritState, TeamState } from '../../types';

// =============================================================================
// SWITCH 系統
// =============================================================================

export const SWITCHSystem = {
  CHECK_CAN: {
    execute(team: TeamState): { can: boolean; reason?: string } {
      // 檢查是否有可用的精靈
      const available = SWITCHSystem.GET_AVAILABLE.execute(team);
      if (available.length === 0) {
        return { can: false, reason: 'noAvailable' };
      }
      
      return { can: true };
    },
  },

  GET_AVAILABLE: {
    execute(team: TeamState): number[] {
      const available: number[] = [];
      
      for (let i = 0; i < team.spirits.length; i++) {
        const spirit = team.spirits[i];
        if (spirit && spirit.hp.current > 0 && i !== team.currentIndex) {
          available.push(i);
        }
      }
      
      return available;
    },
  },

  EXECUTE: {
    execute(team: TeamState, newIndex: number): boolean {
      // 檢查是否可以換人
      const check = SWITCHSystem.CHECK_CAN.execute(team);
      if (!check.can) return false;
      
      // 檢查目標精靈
      const newSpirit = team.spirits[newIndex];
      if (!newSpirit || newSpirit.hp.current <= 0) return false;
      if (newIndex === team.currentIndex) return false;
      
      // 記錄舊精靈
      const oldIndex = team.currentIndex;
      const oldSpirit = team.spirits[oldIndex];
      
      // 保存到歷史
      team.previousIndex = oldIndex;
      
      // 執行切換
      team.currentIndex = newIndex;
      
      return true;
    },
  },

  FORCE: {
    execute(team: TeamState, newIndex: number): boolean {
      // 強制換人，無視限制
      const newSpirit = team.spirits[newIndex];
      if (!newSpirit || newSpirit.hp.current <= 0) return false;
      
      // 記錄舊精靈
      const oldIndex = team.currentIndex;
      const oldSpirit = team.spirits[oldIndex];
      
      // 保存到歷史
      team.previousIndex = oldIndex;
      
      // 執行切換
      team.currentIndex = newIndex;
      
      return true;
    },
  },

  DEATH: {
    execute(team: TeamState): number {
      // 死亡換人：選擇下一個活著的精靈
      const available = SWITCHSystem.GET_AVAILABLE.execute(team);
      
      if (available.length === 0) {
        return -1; // 全滅
      }
      
      // 選擇第一個可用的
      const newIndex = available[0];
      SWITCHSystem.FORCE.execute(team, newIndex);
      
      return newIndex;
    },
  },



  GET_PREVIOUS: {
    execute(team: TeamState): SpiritState | null {
      if (team.previousIndex === undefined || team.previousIndex < 0) {
        return null;
      }
      return team.spirits[team.previousIndex] || null;
    },
  },
};



