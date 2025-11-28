/**
 * Core 模塊導出
 * 
 * ============================================================================
 * 架構說明:
 * ============================================================================
 * 
 * 1. TurnPhase - 36 個節點執行器
 *    - 每個節點執行預設 function（如果有）
 *    - 從 state 讀取當前節點的 function 並執行
 * 
 * 2. State (SpiritState, TeamState, GlobalState) - 純空殼數據結構
 *    - 12 只精靈 + 2 個隊伍 + 全局狀態
 * 
 * 3. StateFactory - 創建空殼狀態
 */

// === TurnPhase ===
export { TurnPhase, NODE } from './turnPhase';
export type { NodeType } from './turnPhase';

// === State 系統 ===
export { 
  STATE,
  createSpiritState, 
  createTeamState, 
  createGlobalState,
  clearSpiritOnSwitchOut,
  initSpiritOnEntry,
  resolveTarget,
} from './state';

// === Systems (分離到獨立文件) ===
export { HPSystem } from './systems/hp';
export { PPSystem } from './systems/pp';
export { DAMAGESystem } from './systems/damage';
export { STATSSystem } from './systems/stats';
export { STATUSSystem } from './systems/status';
export { PRIOSystem } from './systems/prio';
export { TURNSystem, matchesNode } from './systems/turn';
export { COUNTSystem } from './systems/count';
export { SWITCHSystem } from './systems/switch';
export { ITEMSystem } from './systems/item';
export { RESISTSystem } from './systems/resist';
export { IMMUNITYSystem } from './systems/immunity';
export { SHIELDSystem } from './systems/shield';
export { BLOCKSystem } from './systems/block';
export { SOULBUFFSystem } from './systems/soulbuff';
