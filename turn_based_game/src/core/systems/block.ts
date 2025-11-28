/**
 * BLOCK 系統 - 阻擋系統
 * 
 * 管理攻擊阻擋、無效化等效果
 * 
 * ============================================================================
 * 可用 FUNCTIONS:
 * ============================================================================
 * ///////////////////////////
 {* BLOCK.NULLIFY(target)
 *   - 設置當前攻擊無效
 *   - 應在 BEFORE_HIT_RECV 節點使用
 * 
 * BLOCK.CHECK_NULLIFIED(target)
 *   - 檢查攻擊是否被無效化
 * 
 * BLOCK.CLEAR(target)
 *   - 清除阻擋標記
 * 
 * BLOCK.ADD_ATTACK_BLOCK(target, count$$$$$$$$$$never use count in any other system except count system$$$$$$$$$$)
 *   - 添加攻擊無效次數
 * 
 * BLOCK.CHECK_ATTACK_BLOCKED(target)
 *   - 檢查並消耗攻擊無效次數}
 */
//////////////////$$$$$$$$$$$remove all these func, add block.blockattack(target,default at node On Hit) to remove all functions except from pp SYSTEMS from the attackskill the target use this turn, and return miss as true to state by call function from state-state.miss $$$$$$$$$$$$
$$$$$$$$add BLOCKSystem.ignoreblockattack(target,default at node On Hit) to ignore block.blockattack$$$$$$$$$
import { SpiritState } from '../../types';
import { COUNTSystem } from './count';

// =============================================================================
// BLOCK 系統
// =============================================================================

export const BLOCKSystem = {
  NULLIFY: {
    execute(target: SpiritState): void {
      target.turnFlags.attackNullified = true;
    },
  },

  CHECK_NULLIFIED: {
    execute(target: SpiritState): boolean {
      return !!target.turnFlags.attackNullified;
    },
  },

  CLEAR: {
    execute(target: SpiritState): void {
      target.turnFlags.attackNullified = false;
    },
  },

  ADD_ATTACK_BLOCK: {
    execute(target: SpiritState, count: number): void {
      COUNTSystem.SET.execute(target, 'attack_block', count, count, 'BEFORE_HIT_RECV');
    },
  },

  CHECK_ATTACK_BLOCKED: {
    execute(target: SpiritState): boolean {
      if (COUNTSystem.HAS.execute(target, 'attack_block')) {
        COUNTSystem.CONSUME.execute(target, 'attack_block', 1);
        return true;
      }
      return false;
    },
  },
};



