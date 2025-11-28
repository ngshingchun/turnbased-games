/**
 * 系統索引文件
 * 
 * 導出所有可用的系統
 * 
 * ============================================================================
 * 系統列表:
 * ============================================================================
 * 
 * STATE   - 狀態讀取系統（檢查 HP, PP, Stats 等）
 * HP      - 體力系統（治療、傷害、設置）
 * PP      - 活力系統（消耗、恢復）
 * DAMAGE  - 傷害系統（攻擊計算、固傷、百分比傷）
 * STATS   - 屬性系統（強化、弱化、消除）
 * STATUS  - 異常狀態系統（施加、移除、免疫）
 * PRIO    - 先制系統（先後手判定）
 * TURN    - 回合效果系統（回合制效果管理）
 * COUNT   - 次數效果系統（次數制效果管理）
 * SWITCH  - 換人系統（換人、死亡換人）
 * ITEM    - 道具系統（使用道具）
 * RESIST  - 抗性系統（傷害抗性）
 * IMMUNITY- 免疫系統（狀態/傷害免疫）
 * SHIELD  - 護盾系統（護盾管理）
 * BLOCK   - 阻擋系統（攻擊無效化）
 * SOULBUFF- 魂印系統（魂印效果）
 */

// 各系統導出
// STATESystem 和 resolveTarget 已移動到 ../state.ts
export { HPSystem } from './hp';
export { PPSystem } from './pp';
export { DAMAGESystem } from './damage';
export { STATSSystem } from './stats';
export { STATUSSystem } from './status';
export { PRIOSystem } from './prio';
export { TURNSystem, matchesNode } from './turn';
export { COUNTSystem } from './count';
export { SWITCHSystem } from './switch';
export { ITEMSystem } from './item';
export { RESISTSystem } from './resist';
export { IMMUNITYSystem } from './immunity';
export { SHIELDSystem } from './shield';
export { BLOCKSystem } from './block';
export { SOULBUFFSystem } from './soulbuff';

// 統一的 SYSTEMS 對象
import { STATE } from '../state';
import { HPSystem } from './hp';
import { PPSystem } from './pp';
import { DAMAGESystem } from './damage';
import { STATSSystem } from './stats';
import { STATUSSystem } from './status';
import { PRIOSystem } from './prio';
import { TURNSystem } from './turn';
import { COUNTSystem } from './count';
import { SWITCHSystem } from './switch';
import { ITEMSystem } from './item';
import { RESISTSystem } from './resist';
import { IMMUNITYSystem } from './immunity';
import { SHIELDSystem } from './shield';
import { BLOCKSystem } from './block';
import { SOULBUFFSystem } from './soulbuff';

export const SYSTEMS = {
  STATE,
  HP: HPSystem,
  PP: PPSystem,
  DAMAGE: DAMAGESystem,
  STATS: STATSSystem,
  STATUS: STATUSSystem,
  PRIO: PRIOSystem,
  TURN: TURNSystem,
  COUNT: COUNTSystem,
  SWITCH: SWITCHSystem,
  ITEM: ITEMSystem,
  RESIST: RESISTSystem,
  IMMUNITY: IMMUNITYSystem,
  SHIELD: SHIELDSystem,
  BLOCK: BLOCKSystem,
  SOULBUFF: SOULBUFFSystem,
} as const;

export type SystemName = keyof typeof SYSTEMS;

