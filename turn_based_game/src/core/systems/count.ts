/**
 * COUNT 系統 - 次數效果系統
 * 
 * 管理次數制效果：添加、消耗、查詢等
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * 
 * COUNT.SET(target, id, count, max?, node?)
 *   - 設置次數效果
 * 
 * COUNT.ADD(target, id, amount)
 *   - 增加次數
 * 
 * COUNT.CONSUME(target, id, amount?)
 *   - 消耗次數
 *   - 返回是否成功消耗
 * 
 * COUNT.GET(target, id)
 *   - 獲取當前次數
 * 
 * COUNT.HAS(target, id)
 *   - 檢查是否有該效果且次數 > 0
 * 
 * COUNT.CLEAR(target, id)
 *   - 清除指定效果
 * 
 * COUNT.CLEAR_ALL(target)
 *   - 清除所有次數效果
 * 
 * COUNT.GET_ALL(target, node?)
 *   - 獲取所有效果，可按節點過濾
 */

import { SpiritState, CountEffect, NodePattern, FunctionCall } from '../../types';
import { matchesNode } from './turn';

// =============================================================================
// COUNT 系統
// =============================================================================

export const COUNTSystem = {
  SET: {
    execute(
      target: SpiritState,
      id: string,
      count: number,
      max?: number,
      node?: NodePattern,
      calls?: FunctionCall[]
    ): void {
      target.countEffects[id] = {
        id,
        name: id,
        count,
        max: max || count,
        node: node || '*',
        calls: calls || [],
      };
    },
  },

  ADD: {
    execute(target: SpiritState, id: string, amount: number): number {
      const effect = target.countEffects[id];
      if (!effect) return 0;
      
      const oldCount = effect.count;
      effect.count = Math.min(effect.max, effect.count + amount);
      return effect.count - oldCount;
    },
  },

  CONSUME: {
    execute(target: SpiritState, id: string, amount: number = 1): boolean {
      const effect = target.countEffects[id];
      if (!effect || effect.count < amount) return false;
      
      effect.count -= amount;
      
      // 如果次數用完，標記但不刪除（保留結構）
      if (effect.count <= 0) {
        effect.count = 0;
      }
      
      return true;
    },
  },

  GET: {
    execute(target: SpiritState, id: string): number {
      return target.countEffects[id]?.count || 0;
    },
  },

  HAS: {
    execute(target: SpiritState, id: string): boolean {
      return (target.countEffects[id]?.count || 0) > 0;
    },
  },

  CLEAR: {
    execute(target: SpiritState, id: string): void {
      delete target.countEffects[id];
    },
  },

  CLEAR_ALL: {
    execute(target: SpiritState): void {
      target.countEffects = {};
    },
  },

  GET_ALL: {
    execute(target: SpiritState, currentNode?: string): CountEffect[] {
      const effects = Object.values(target.countEffects);
      
      if (!currentNode) {
        return effects;
      }
      
      return effects.filter(effect => matchesNode(currentNode, effect.node));
    },
  },
};



