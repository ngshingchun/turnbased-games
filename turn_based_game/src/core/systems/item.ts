/**
 * ITEM 系統 - 道具系統
 * 
 * 管理戰鬥中的道具使用
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * 
 * ITEM.USE(team, itemId, targetSpirit?)
 *   - 使用道具
 *   - 返回 { success: boolean, effect?: unknown }
 * 
 * ITEM.GET_COUNT(team, itemId)
 *   - 獲取道具數量
 * 
 * ITEM.ADD(team, itemId, count)
 *   - 添加道具
 * 
 * ITEM.REMOVE(team, itemId, count)
 *   - 移除道具
 * 
 * ITEM.CHECK_CAN_USE(team, itemId, targetSpirit?)
 *   - 檢查是否可以使用
 * 
 * ITEM.GET_ALL(team)
 *   - 獲取所有道具
 * 
 * ============================================================================
 * 預設道具:
 * ============================================================================
 * 
 * - pp_potion: 恢復所有技能10PP
 * - hp_potion: 恢復350HP
 * - full_hp_potion: 恢復滿HP
 * - revive: 復活精靈（恢復50%HP）
 * - status_heal: 治療異常狀態
 */

import { SpiritState, TeamState } from '../../types';
import { HPSystem } from './hp';
import { PPSystem } from './pp';
import { STATUSSystem } from './status';

// =============================================================================
// 道具定義
// =============================================================================

interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  targetType: 'current' | 'any' | 'dead';
  use: (team: TeamState, target: SpiritState) => { success: boolean; effect?: unknown };
}

const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  pp_potion: {
    id: 'pp_potion',
    name: 'PP恢復藥',
    description: '恢復所有技能10PP',
    targetType: 'any',
    use: (_team, target) => {
      if (target.hp.current <= 0) return { success: false };
      const restored = PPSystem.RESTORE.execute(target, 10);
      return { success: true, effect: { ppRestored: restored } };
    },
  },
  
  hp_potion: {
    id: 'hp_potion',
    name: 'HP恢復藥',
    description: '恢復350HP',
    targetType: 'any',
    use: (_team, target) => {
      if (target.hp.current <= 0) return { success: false };
      const healed = HPSystem.HEAL.execute(target, 350);
      return { success: true, effect: { hpHealed: healed } };
    },
  },
  
  full_hp_potion: {
    id: 'full_hp_potion',
    name: '滿血藥',
    description: '恢復滿HP',
    targetType: 'any',
    use: (_team, target) => {
      if (target.hp.current <= 0) return { success: false };
      HPSystem.SET.execute(target, 'max');
      return { success: true, effect: { hpHealed: target.hp.max - target.hp.current } };
    },
  },
  
  revive: {
    id: 'revive',
    name: '復活藥',
    description: '復活精靈（恢復50%HP）',
    targetType: 'dead',
    use: (_team, target) => {
      if (target.hp.current > 0) return { success: false };
      const revived = HPSystem.REVIVE.execute(target, 50);
      return { success: true, effect: { hpRevived: revived } };
    },
  },
  
  status_heal: {
    id: 'status_heal',
    name: '異常治療藥',
    description: '治療所有異常狀態',
    targetType: 'any',
    use: (_team, target) => {
      if (target.hp.current <= 0) return { success: false };
      const removed = STATUSSystem.CLEAR.execute(target, 'all');
      return { success: true, effect: { statusRemoved: removed } };
    },
  },
};

// =============================================================================
// ITEM 系統
// =============================================================================

export const ITEMSystem = {
  USE: {
    execute(
      team: TeamState,
      itemId: string,
      targetIndex?: number
    ): { success: boolean; effect?: unknown } {
      // 檢查道具是否存在
      if (!team.items[itemId] || team.items[itemId] <= 0) {
        return { success: false };
      }
      
      // 獲取道具定義
      const itemDef = ITEM_DEFINITIONS[itemId];
      if (!itemDef) {
        return { success: false };
      }
      
      // 決定目標
      const index = targetIndex ?? team.currentIndex;
      const target = team.spirits[index];
      if (!target) {
        return { success: false };
      }
      
      // 檢查目標是否有效
      if (itemDef.targetType === 'dead' && target.hp.current > 0) {
        return { success: false };
      }
      if (itemDef.targetType === 'any' && target.hp.current <= 0) {
        return { success: false };
      }
      
      // 使用道具
      const result = itemDef.use(team, target);
      
      if (result.success) {
        // 消耗道具
        team.items[itemId]--;
        if (team.items[itemId] <= 0) {
          delete team.items[itemId];
        }
      }
      
      return result;
    },
  },

  GET_COUNT: {
    execute(team: TeamState, itemId: string): number {
      return team.items[itemId] || 0;
    },
  },

  ADD: {
    execute(team: TeamState, itemId: string, count: number): void {
      team.items[itemId] = (team.items[itemId] || 0) + count;
    },
  },

  REMOVE: {
    execute(team: TeamState, itemId: string, count: number): number {
      const current = team.items[itemId] || 0;
      const removed = Math.min(current, count);
      team.items[itemId] = current - removed;
      if (team.items[itemId] <= 0) {
        delete team.items[itemId];
      }
      return removed;
    },
  },

  CHECK_CAN_USE: {
    execute(
      team: TeamState,
      itemId: string,
      targetIndex?: number
    ): { can: boolean; reason?: string } {
      // 檢查道具是否存在
      if (!team.items[itemId] || team.items[itemId] <= 0) {
        return { can: false, reason: 'noItem' };
      }
      
      // 獲取道具定義
      const itemDef = ITEM_DEFINITIONS[itemId];
      if (!itemDef) {
        return { can: false, reason: 'unknownItem' };
      }
      
      // 決定目標
      const index = targetIndex ?? team.currentIndex;
      const target = team.spirits[index];
      if (!target) {
        return { can: false, reason: 'invalidTarget' };
      }
      
      // 檢查目標是否有效
      if (itemDef.targetType === 'dead' && target.hp.current > 0) {
        return { can: false, reason: 'targetAlive' };
      }
      if (itemDef.targetType === 'any' && target.hp.current <= 0) {
        return { can: false, reason: 'targetDead' };
      }
      
      return { can: true };
    },
  },

  GET_ALL: {
    execute(team: TeamState): { itemId: string; count: number; name: string }[] {
      return Object.entries(team.items).map(([id, count]) => ({
        itemId: id,
        count,
        name: ITEM_DEFINITIONS[id]?.name || id,
      }));
    },
  },
};



