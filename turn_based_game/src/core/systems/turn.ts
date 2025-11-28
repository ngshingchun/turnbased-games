/**
 * TURN 系統 - 回合效果系統
 * 
 * 管理回合制效果：添加、移除、遞減等
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * 
 * TURN.ADD(target, id, name, turns, node, calls?, flags?)
 *   - 添加回合效果
 * 
 * TURN.REMOVE(target, id)
 *   - 移除指定回合效果
 * 
 * TURN.HAS(target, id)
 *   - 檢查是否有該效果
 * 
 * TURN.GET(target, id)
 *   - 獲取效果詳情
 * 
 * TURN.GET_ALL(target, node?)
 *   - 獲取所有效果，可按節點過濾
 * 
 * TURN.DISPEL(target)
 *   - 消除所有可消除的回合效果
 * 
 * TURN.TICK(target)
 *   - 回合效果遞減
 *   - 返回過期的效果列表
 * 
 * TURN.CLEAR(target)
 *   - 清除所有回合效果
 */

import { SpiritState, TurnEffect, FunctionCall, NodePattern } from '../../types';

// =============================================================================
// TURN 系統
// =============================================================================

export const TURNSystem = {
  ADD: {
    execute(
      target: SpiritState,
      id: string,
      name: string,
      turns: number,
      node: NodePattern,
      calls?: FunctionCall[]
    ): void {
      // 檢查是否已存在
      const existing = target.turnEffects.find(e => e.id === id);
      if (existing) {
        // 刷新回合數
        existing.turns = Math.max(existing.turns, turns);
        return;
      }
      
      // 添加新效果
      target.turnEffects.push({
        id,
        name,
        turns,
        node,
        calls: calls || [],
        dispellable: true, // 默認可消除
      });
    },
  },

  REMOVE: {
    execute(target: SpiritState, id: string): boolean {
      const index = target.turnEffects.findIndex(e => e.id === id);
      if (index >= 0) {
        target.turnEffects.splice(index, 1);
        return true;
      }
      return false;
    },
  },

  HAS: {
    execute(target: SpiritState, id: string): boolean {
      return target.turnEffects.some(e => e.id === id);
    },
  },

  GET: {
    execute(target: SpiritState, id: string): TurnEffect | null {
      return target.turnEffects.find(e => e.id === id) || null;
    },
  },

  GET_ALL: {
    execute(target: SpiritState, currentNode?: string): TurnEffect[] {
      if (!currentNode) {
        return [...target.turnEffects];
      }
      
      return target.turnEffects.filter(effect => 
        matchesNode(currentNode, effect.node)
      );
    },
  },

  DISPEL: {
    execute(target: SpiritState): number {
      const before = target.turnEffects.length;
      target.turnEffects = target.turnEffects.filter(e => !e.dispellable);
      return before - target.turnEffects.length;
    },
  },

  TICK: {
    execute(target: SpiritState): TurnEffect[] {
      const expired: TurnEffect[] = [];
      
      target.turnEffects = target.turnEffects.filter(e => {
        e.turns--;
        if (e.turns <= 0) {
          expired.push(e);
          return false;
        }
        return true;
      });
      
      return expired;
    },
  },

  CLEAR: {
    execute(target: SpiritState): void {
      target.turnEffects = [];
    },
  },
};

// =============================================================================
// 輔助函數：節點匹配
// =============================================================================

export function matchesNode(currentNode: string, effectNode: NodePattern): boolean {
  if (typeof effectNode === 'string') {
    return effectNode === '*' || effectNode === currentNode;
  }
  
  if (Array.isArray(effectNode)) {
    return effectNode.includes(currentNode);
  }
  
  if (typeof effectNode === 'object' && effectNode !== null) {
    // { all: true, except: [...] }
    if ('all' in effectNode && effectNode.all) {
      return !effectNode.except?.includes(currentNode);
    }
    
    // { nodes: [...], also: '*' }
    if ('nodes' in effectNode && effectNode.nodes) {
      if (effectNode.nodes.includes(currentNode)) {
        return true;
      }
      if (effectNode.also === '*' || effectNode.also === currentNode) {
        return true;
      }
    }
  }
  
  return false;
}



