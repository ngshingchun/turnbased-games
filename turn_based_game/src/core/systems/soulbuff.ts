/**
 * SOULBUFF 系統 - 魂印系統
 * 
 * 管理精靈的魂印效果
 * 魂印效果存儲在精靈數據中，由節點執行時自動讀取
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * 
 * SOULBUFF.GET(target)
 *   - 獲取精靈的魂印
 * 
 * SOULBUFF.GET_EFFECTS(target, currentNode)
 *   - 獲取當前節點應觸發的魂印效果（透過 effect.node 或 call.node）
 *   - 每個魂印效果必須有字符串 effectId，用於 UI/特判/橋接
 * 
 * SOULBUFF.DISABLE(target)
 *   - 禁用魂印
 * 
 * SOULBUFF.ENABLE(target)
 *   - 啟用魂印
 * 
 * SOULBUFF.IS_ACTIVE(target)
 *   - 檢查魂印是否啟用
 */

import { SpiritState, SoulBuffEffect } from '../../types';
import { matchesNode } from './turn';

// =============================================================================
// SOULBUFF 系統
// =============================================================================

export const SOULBUFFSystem = {
  GET: {
    execute(target: SpiritState): { name: string; effects: SoulBuffEffect[] } | null {
      return target.soulBuff || null;
    },
  },

  GET_EFFECTS: {
    execute(target: SpiritState, currentNode: string): SoulBuffEffect[] {
      if (!target.soulBuff || target.flags.soulBuffDisabled) {
        return [];
      }
      
      return target.soulBuff.effects.filter(effect => {
        // 先看 effect.node，其次看每個 call.node
        if (effect.node && matchesNode(currentNode, effect.node)) return true;
        return effect.calls.some(call => call.node && matchesNode(currentNode, call.node));
      });
    },
  },

  DISABLE: {
    execute(target: SpiritState): void {
      target.flags.soulBuffDisabled = true;
    },
  },

  ENABLE: {
    execute(target: SpiritState): void {
      target.flags.soulBuffDisabled = false;
    },
  },

  IS_ACTIVE: {
    execute(target: SpiritState): boolean {
      return !target.flags.soulBuffDisabled && target.soulBuff !== null;
    },
  },
};


