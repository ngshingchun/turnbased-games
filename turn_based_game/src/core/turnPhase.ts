/**

* TurnPhase - 36 個節點執行器
 * 
 * 根據 turn_phase.txt 定義的 36 個節點
 * 每個節點：
 *   1. 執行預設 function$$$must be as last funcc to operate on that node$$$$
 *   2. 從 state 讀取當前節點的 function 並執行
 */

import { 
  SpiritState, 
  TeamState, 
  GlobalState, 
  FunctionCall,
  Skill,
  Side,
} from '../types';
import { clearSpiritOnSwitchOut, initSpiritOnEntry, STATE } from './state';

// =============================================================================
// 36 個節點定義（根據 turn_phase.txt）
// =============================================================================

export const NODE = {
  NODE_01: 'SWITCH_IN_PHASE',
  NODE_02: 'ON_ENTRY_SPEED',
  NODE_03: 'AFTER_ENTRY',
  NODE_04: 'ACTION_PHASE',
  NODE_05: 'ON_ENTRY',
  NODE_06: 'TURN_START',
  NODE_07: 'BATTLE_PHASE_START',
  NODE_08: 'FIRST_ACTION_START',
  NODE_09: 'FIRST_BEFORE_HIT',
  NODE_10: 'FIRST_ON_HIT',
  NODE_11: 'FIRST_SKILL_EFFECT',
  NODE_12: 'FIRST_BEFORE_DAMAGE',
  NODE_13: 'FIRST_DEAL_DAMAGE',
  NODE_14: 'FIRST_AFTER_ATTACK',
  NODE_15: 'FIRST_ACTION_END',
  NODE_16: 'FIRST_AFTER_ACTION',
  NODE_17: 'DEATH_CHECK_1',
  NODE_18: 'SECOND_ACTION_START',
  NODE_19: 'SECOND_BEFORE_HIT',
  NODE_20: 'SECOND_ON_HIT',
  NODE_21: 'SECOND_SKILL_EFFECT',
  NODE_22: 'SECOND_BEFORE_DAMAGE',
  NODE_23: 'SECOND_DEAL_DAMAGE',
  NODE_24: 'SECOND_AFTER_ATTACK',
  NODE_25: 'SECOND_ACTION_END',
  NODE_26: 'SECOND_AFTER_ACTION',
  NODE_27: 'BATTLE_PHASE_END',
  NODE_28: 'AFTER_BATTLE_PHASE',
  NODE_29: 'TURN_END',
  NODE_30: 'AFTER_TURN',
  NODE_31: 'ON_DEFEAT',
  NODE_32: 'ON_DEFEAT_FOE',
  NODE_33: 'AFTER_DEFEATED',
  NODE_34: 'AFTER_DEFEAT_FOE',
  NODE_35: 'ON_DEATH_SWITCH',
  NODE_36: 'DEFEAT_CHECK',
} as const;

export type NodeType = typeof NODE[keyof typeof NODE];

// =============================================================================
// TurnPhase 執行器
// =============================================================================

export class TurnPhase {
  public firstMover: Side = 'A';
  public secondMover: Side = 'B';
  public currentSkillA: Skill | null = null;
  public currentSkillB: Skill | null = null;
  private skipSecondMover: boolean = false;
  private defeatedThisTurn: { A: boolean; B: boolean } = { A: false, B: false };
  
  // ─────────────────────────────────────────────────────────────────────────
  // 執行單個節點
  // ─────────────────────────────────────────────────────────────────────────
  async executeNode(
    node: NodeType,
    teamA: TeamState,
    teamB: TeamState,
    global: GlobalState,
    log: string[]
  ): Promise<{ winner: Side | null }> {
    const spiritA = teamA.spirits[teamA.currentIndex];
    const spiritB = teamB.spirits[teamB.currentIndex];
    
    if (!spiritA || !spiritB) {
      return { winner: null };
    }
    
    switch (node) {
      // =====================================================================
      // 節點 1: 切換上場階段 / Switch-in Phase
      // =====================================================================
      case NODE.NODE_01: {
        log.push(`[節點 1] 切換上場階段`);
        
        // --- 預設 function ---
        // 主動切換上場 / 死亡切換上場
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 2: 出戰時 (手速決定雙方先後) / On Entry (Speed Order)
      // =====================================================================
      case NODE.NODE_02: {
        log.push(`[節點 2] 出戰時 (手速決定先後)`);
        
        // --- 預設 function ---
        // 擊殺效果生效：超王第五、海皇第五、技能高級擊殺控等
        // 其他出站時效果：帝君登場奶背包、燈使出站點燈吸pp等
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 3: 出戰後 / After Entry
      // =====================================================================
      case NODE.NODE_03: {
        log.push(`[節點 3] 出戰後`);
        
        // --- 預設 function ---
        // (目前僅作流程銜接)
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 4: 精靈操作階段 / Spirit Action Phase
      // =====================================================================
      case NODE.NODE_04: {
        log.push(`[節點 4] 精靈操作階段`);
        
        // --- 預設 function ---
        // 選擇使用技能 / 使用藥劑 / 主動切換下場
        // 斯普林蒂主動下場傳遞血量/pp
        // 卡托娜高盾主動下場傳承強化
        // 烏拉諾斯主動/死亡下場附加buff
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);$$$$teamA, teamB's global ,same for all nodes$$$$$
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 5: 登場時 / On Entry
      // =====================================================================
      case NODE.NODE_05: {
        log.push(`[節點 5] 登場時`);
        
        // --- 預設 function ---
        // 登場回合魂免：神羅聖華、趙云
        // 登場控：幽美登場消強控、混沌魔尊登場隨機控
        // 登場消強/斷回合：索倫森登場消強、諧尼登場斷回合
        // 首次登場效果：武心嬋首次登場附加3龍鱗、獵神標記狩殺之的
        initSpiritOnEntry(spiritA);
        initSpiritOnEntry(spiritB);
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 6: 回合開始時 / Turn Start
      // =====================================================================
      case NODE.NODE_06: {
        global.turn++;
        log.push(`\n========== 回合 ${global.turn} 開始 ==========`);
        log.push(`[節點 6] 回合開始時`);
        
        // --- 預設 function ---
        // 回合開始控場：古溫婆婆、希拓、艾夏拉、路希菲爾德
        // 回合開始免控：啟靈元神、締笙、龍琰
        // 回合開始續航：古溫婆婆、迪迦奧特曼
        // 回合開始解控：天后、古溫婆婆、卡威治
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 7: 戰鬥階段開始時 / Battle Phase Start
      // =====================================================================
      case NODE.NODE_07: {
        log.push(`[節點 7] 戰鬥階段開始時`);
        
        // --- 預設 function ---
        // 先後手權確定：必先優先級、先制高低、速度高低
        // 封先制/壓先制、無視強化/視強為弱/視弱為強
        // 低級切換控/擊殺控
        const prioA = this.calcPriority(spiritA, this.currentSkillA);
        const prioB = this.calcPriority(spiritB, this.currentSkillB);
        
        if (spiritA.priority.forceFirst && !spiritB.priority.forceFirst) {
          this.firstMover = 'A'; this.secondMover = 'B';
          log.push(`  ${spiritA.name} 強制先手！`);
        } else if (spiritB.priority.forceFirst && !spiritA.priority.forceFirst) {
          this.firstMover = 'B'; this.secondMover = 'A';
          log.push(`  ${spiritB.name} 強制先手！`);
        } else if (prioA > prioB) {
          this.firstMover = 'A'; this.secondMover = 'B';
          log.push(`  ${spiritA.name} 先手 (${prioA} vs ${prioB})`);
        } else if (prioB > prioA) {
          this.firstMover = 'B'; this.secondMover = 'A';
          log.push(`  ${spiritB.name} 先手 (${prioB} vs ${prioA})`);
        } else {
          if (Math.random() < 0.5) { this.firstMover = 'A'; this.secondMover = 'B'; }
          else { this.firstMover = 'B'; this.secondMover = 'A'; }
          log.push(`  速度相同，隨機: ${this.firstMover === 'A' ? spiritA.name : spiritB.name} 先手`);
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 8: 先手方戰鬥階段-出手流程開始時
      // =====================================================================
      case NODE.NODE_08: {
        const first = this.firstMover === 'A' ? spiritA : spiritB;
        log.push(`[節點 8] 先手出手流程開始 - ${first.name}`);
        
        // --- 預設 function ---
        // 異常真傷結算：燒傷、中毒、凍傷、流血
        for (const status of first.statuses) {
          if (status.id === 'burn') {
            const dmg = Math.floor(first.hp.max * 0.0625);
            first.hp.current = Math.max(0, first.hp.current - dmg);
            log.push(`  → ${first.name} 燒傷 -${dmg} HP`);
          }
          if (status.id === 'poison') {
            const dmg = Math.floor(first.hp.max * 0.125);
            first.hp.current = Math.max(0, first.hp.current - dmg);
            log.push(`  → ${first.name} 中毒 -${dmg} HP`);
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 9: 先手方戰鬥階段-命中前/使用技能時
      // =====================================================================
      case NODE.NODE_09: {
        const first = this.firstMover === 'A' ? spiritA : spiritB;
        const second = this.firstMover === 'A' ? spiritB : spiritA;
        const skill = this.firstMover === 'A' ? this.currentSkillA : this.currentSkillB;
        log.push(`[節點 9] 先手命中前/使用技能時`);
        
        // --- 預設 function ---
        // 魂印命中前被動：德拉莫斯受擊控/偷強、炎魔受擊燒傷補償斷回合
        // 魂印命中前主動：寂滅/彼爾德技能命中前斷回合、哈肯薩/花寅命中前粉傷
        // 技能命中前被動：蒼星人律再書受擊清pp、受擊強弱化
        // 技能命中前主動：魂印/技能閃避、魂印/技能必中
        if (skill) {
          log.push(`  ${first.name} 使用 ${skill.name}！`);
          if (skill.pp > 0) skill.pp--;
          for (const call of skill.calls) {
            if (this.matchNode(node, call.node)) {
              this.executeCall(call, first, second, log);
            }
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 10: 先手方戰鬥階段-命中時
      // =====================================================================
      case NODE.NODE_10: {
        const first = this.firstMover === 'A' ? spiritA : spiritB;
        const second = this.firstMover === 'A' ? spiritB : spiritA;
        const skill = this.firstMover === 'A' ? this.currentSkillA : this.currentSkillB;
        log.push(`[節點 10] 先手命中時`);
        
        // --- 預設 function ---$$$$$$$$all default function are excute as the last step of the node$$$$$$$$$
        // 睡神判斷低傷害
        // 獅盔/封攻擊：獅盔視作未命中、封攻擊視作命中
        // 現代命中時效果：薩夫凱特強制修改為命中、趙雲/庫拉塔克技能命中時強化
        if (skill) {
          for (const call of skill.calls) {
            if (this.matchNode(node, call.node)) {
              this.executeCall(call, first, second, log);
            }
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 11: 先手方戰鬥階段-技能效果生效時
      // =====================================================================
      case NODE.NODE_11: {
        const first = this.firstMover === 'A' ? spiritA : spiritB;
        const second = this.firstMover === 'A' ? spiritB : spiritA;
        const skill = this.firstMover === 'A' ? this.currentSkillA : this.currentSkillB;
        log.push(`[節點 11] 先手技能效果生效時`);
        
        // --- 預設 function ---
        // 技能內效果依次結算：續航、消強/斷回合、強弱化、主動控場、變威力
        // 大部分寶石效果計算：一代控場寶石、真傷寶石、活力恢復/維持寶石
        if (skill) {
          for (const call of skill.calls) {
            if (this.matchNode(node, call.node)) {
              this.executeCall(call, first, second, log);
            }
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 12: 先手方戰鬥階段-造成攻擊傷害前
      // =====================================================================
      case NODE.NODE_12: {
        const first = this.firstMover === 'A' ? spiritA : spiritB;
        const second = this.firstMover === 'A' ? spiritB : spiritA;
        const skill = this.firstMover === 'A' ? this.currentSkillA : this.currentSkillB;
        log.push(`[節點 12] 先手造成攻擊傷害前`);
        
        // --- 預設 function ---
        // 魂印靠前傷害前被動：火王魂印受擊焚燬補償斷回合、堅硬特性
        // 魂印靠前傷害前主動：萬魔攻擊害怕補償回血、瞬殺特性
        // 大部分回合類單點效果生效：回合吸血/續航、回合強弱化、連環控
        // 套裝造成傷害前主動：笑傲粉、毒液粉
        if (skill) {
          for (const call of skill.calls) {
            if (this.matchNode(node, call.node)) {
              this.executeCall(call, first, second, log);
            }
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 13: 先手方戰鬥階段-造成攻擊傷害
      // =====================================================================
      case NODE.NODE_13: {
        const first = this.firstMover === 'A' ? spiritA : spiritB;
        const second = this.firstMover === 'A' ? spiritB : spiritA;
        const skill = this.firstMover === 'A' ? this.currentSkillA : this.currentSkillB;
        log.push(`[節點 13] 先手造成攻擊傷害`);
        
        // --- 預設 function ---
        // 特性增傷：強襲、精神
        // 通用增傷節點：現代大部分技能增傷、大部分魂印增傷、套裝增傷
        // 通用保底傷害節點：技能自帶保底傷害、龍裳魂印保底300傷害、魔王咒怨
        // 護盾結算節點：護盾抵消傷害
        // 通用減傷節點：艾夏拉/幽美/該隱等魂印減傷、御風/晨曦套裝減傷
        // 通用鎖傷節點、通用擋傷節點
        // 造成最終傷害
        if (skill && skill.type === 'attack') {
          for (const call of skill.calls) {
            if (this.matchNode(node, call.node)) {
              this.executeCall(call, first, second, log);
            }
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 14: 先手方戰鬥階段-攻擊後/使用技能後
      // =====================================================================
      case NODE.NODE_14: {
        const first = this.firstMover === 'A' ? spiritA : spiritB;
        const second = this.firstMover === 'A' ? spiritB : spiritA;
        const skill = this.firstMover === 'A' ? this.currentSkillA : this.currentSkillB;
        log.push(`[節點 14] 先手攻擊後/使用技能後`);
        
        // --- 預設 function ---
        // 攻擊後被動技能效果：聖卡強化受擊石化補償封屬性、團長石鬼守護受擊石化補償強化
        // 攻擊後被動魂印效果：魂帝受擊高傷斷回合控、東輝首回合登場斷回合控
        // 攻擊後被動套裝效果：時空受擊吸血、晨曦受擊回血、黃御受擊粉
        // 攻擊後主動魂印效果：大象魂印1/4粉、咤克斯魂印概率秒殺
        // 部分低級免死、追命寶石
        if (skill) {
          for (const call of skill.calls) {
            if (this.matchNode(node, call.node)) {
              this.executeCall(call, first, second, log);
            }
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 15: 先手方戰鬥階段-出手流程結束時
      // =====================================================================
      case NODE.NODE_15: {
        log.push(`[節點 15] 先手出手流程結束時`);
        
        // --- 預設 function ---
        // 出手流程結束時被動：不動明王0血時降低對手血量為1、劍心墟祖免受擊粉
        // 出手流程結束時主動：螳螂魂印吸血/粉傷、靈神魂印記錄傷害粉、二代控場寶石
        // 出手流程結束時套裝：天光套暴擊削弱/續航開始生效、天光套粉
        // 封回血效果的結束時間
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 16: 先手方戰鬥階段-行動結束後
      // =====================================================================
      case NODE.NODE_16: {
        log.push(`[節點 16] 先手行動結束後`);
        
        // --- 預設 function ---
        // 星皇buff回血：1/8續航
        // 額外行動：空元行者-空元之詩、克雷弗德-德萊赫默、天启星魂-满层额外行动
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 17: 先手方戰鬥階段-死亡判定節點1
      // =====================================================================
      case NODE.NODE_17: {
        log.push(`[節點 17] 死亡判定節點1`);
        
        // --- 預設 function ---
        // 判定任意一方死亡則跳過後手方戰鬥階段和戰鬥階段結束時
        if (spiritA.hp.current <= 0) {
          spiritA.isAlive = false;
          log.push(`  ☠ ${spiritA.name} 倒下了！`);
          this.defeatedThisTurn.A = true;
        }
        if (spiritB.hp.current <= 0) {
          spiritB.isAlive = false;
          log.push(`  ☠ ${spiritB.name} 倒下了！`);
          this.defeatedThisTurn.B = true;
          if (this.secondMover === 'B') this.skipSecondMover = true;
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 18: 後手方戰鬥階段-出手流程開始時
      // =====================================================================
      case NODE.NODE_18: {
        if (this.skipSecondMover) break;
        const second = this.secondMover === 'A' ? spiritA : spiritB;
        log.push(`[節點 18] 後手出手流程開始 - ${second.name}`);
        
        // --- 預設 function ---
        // 異常真傷結算：燒傷、中毒、凍傷、流血
        for (const status of second.statuses) {
          if (status.id === 'burn') {
            const dmg = Math.floor(second.hp.max * 0.0625);
            second.hp.current = Math.max(0, second.hp.current - dmg);
            log.push(`  → ${second.name} 燒傷 -${dmg} HP`);
          }
          if (status.id === 'poison') {
            const dmg = Math.floor(second.hp.max * 0.125);
            second.hp.current = Math.max(0, second.hp.current - dmg);
            log.push(`  → ${second.name} 中毒 -${dmg} HP`);
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 19: 後手方戰鬥階段-命中前/使用技能時
      // =====================================================================
      case NODE.NODE_19: {
        if (this.skipSecondMover) break;
        const first = this.secondMover === 'A' ? spiritB : spiritA;
        const second = this.secondMover === 'A' ? spiritA : spiritB;
        const skill = this.secondMover === 'A' ? this.currentSkillA : this.currentSkillB;
        log.push(`[節點 19] 後手命中前/使用技能時`);
        
        // --- 預設 function ---
        if (skill) {
          log.push(`  ${second.name} 使用 ${skill.name}！`);
          if (skill.pp > 0) skill.pp--;
          for (const call of skill.calls) {
            if (this.matchNode(node, call.node)) {
              this.executeCall(call, second, first, log);
            }
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 20: 後手方戰鬥階段-命中時
      // =====================================================================
      case NODE.NODE_20: {
        if (this.skipSecondMover) break;
        const first = this.secondMover === 'A' ? spiritB : spiritA;
        const second = this.secondMover === 'A' ? spiritA : spiritB;
        const skill = this.secondMover === 'A' ? this.currentSkillA : this.currentSkillB;
        log.push(`[節點 20] 後手命中時`);
        
        // --- 預設 function ---
        if (skill) {
          for (const call of skill.calls) {
            if (this.matchNode(node, call.node)) {
              this.executeCall(call, second, first, log);
            }
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 21: 後手方戰鬥階段-技能效果生效時
      // =====================================================================
      case NODE.NODE_21: {
        if (this.skipSecondMover) break;
        const first = this.secondMover === 'A' ? spiritB : spiritA;
        const second = this.secondMover === 'A' ? spiritA : spiritB;
        const skill = this.secondMover === 'A' ? this.currentSkillA : this.currentSkillB;
        log.push(`[節點 21] 後手技能效果生效時`);
        
        // --- 預設 function ---
        if (skill) {
          for (const call of skill.calls) {
            if (this.matchNode(node, call.node)) {
              this.executeCall(call, second, first, log);
            }
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 22: 後手方戰鬥階段-造成攻擊傷害前
      // =====================================================================
      case NODE.NODE_22: {
        if (this.skipSecondMover) break;
        const first = this.secondMover === 'A' ? spiritB : spiritA;
        const second = this.secondMover === 'A' ? spiritA : spiritB;
        const skill = this.secondMover === 'A' ? this.currentSkillA : this.currentSkillB;
        log.push(`[節點 22] 後手造成攻擊傷害前`);
        
        // --- 預設 function ---
        if (skill) {
          for (const call of skill.calls) {
            if (this.matchNode(node, call.node)) {
              this.executeCall(call, second, first, log);
            }
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 23: 後手方戰鬥階段-造成攻擊傷害
      // =====================================================================
      case NODE.NODE_23: {
        if (this.skipSecondMover) break;
        const first = this.secondMover === 'A' ? spiritB : spiritA;
        const second = this.secondMover === 'A' ? spiritA : spiritB;
        const skill = this.secondMover === 'A' ? this.currentSkillA : this.currentSkillB;
        log.push(`[節點 23] 後手造成攻擊傷害`);
        
        // --- 預設 function ---
        if (skill && skill.type === 'attack') {
          for (const call of skill.calls) {
            if (this.matchNode(node, call.node)) {
              this.executeCall(call, second, first, log);
            }
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 24: 後手方戰鬥階段-攻擊後/使用技能後
      // =====================================================================
      case NODE.NODE_24: {
        if (this.skipSecondMover) break;
        const first = this.secondMover === 'A' ? spiritB : spiritA;
        const second = this.secondMover === 'A' ? spiritA : spiritB;
        const skill = this.secondMover === 'A' ? this.currentSkillA : this.currentSkillB;
        log.push(`[節點 24] 後手攻擊後/使用技能後`);
        
        // --- 預設 function ---
        if (skill) {
          for (const call of skill.calls) {
            if (this.matchNode(node, call.node)) {
              this.executeCall(call, second, first, log);
            }
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 25: 後手方戰鬥階段-出手流程結束時
      // =====================================================================
      case NODE.NODE_25: {
        if (this.skipSecondMover) break;
        log.push(`[節點 25] 後手出手流程結束時`);
        
        // --- 預設 function ---
        // (同節點15)
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 26: 後手方戰鬥階段-行動結束後
      // =====================================================================
      case NODE.NODE_26: {
        if (this.skipSecondMover) break;
        log.push(`[節點 26] 後手行動結束後`);
        
        // --- 預設 function ---
        // (同節點16)
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 27: 戰鬥階段結束時
      // =====================================================================
      case NODE.NODE_27: {
        log.push(`[節點 27] 戰鬥階段結束時`);
        
        // --- 預設 function ---
        // 戰鬥階段結束時清pp：楓眠、郭嘉
        // 戰鬥階段結束時續航：始祖靈獸、倪克斯、締笙
        // 戰鬥階段結束時控場：惡鬼圖伽、關銀屏、混沌魔眼耶里梅斯
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 28: 戰鬥階段結束後 (死亡判定節點2)
      // =====================================================================
      case NODE.NODE_28: {
        log.push(`[節點 28] 戰鬥階段結束後 (死亡判定節點2)`);
        
        // --- 預設 function ---
        // 死亡判定節點2 (反同归于尽)
        // 判定雙方血量是否為0，為0則死亡
        // 雙方同時死亡則後手方保留1滴血
        const currentA = teamA.spirits[teamA.currentIndex];
        const currentB = teamB.spirits[teamB.currentIndex];
        
        if (currentA && currentA.hp.current <= 0 && currentB && currentB.hp.current <= 0) {
          const second = this.secondMover === 'A' ? currentA : currentB;
          second.hp.current = 1;
          second.isAlive = true;
          log.push(`  → 雙方同時倒下，${second.name} 保留 1 HP！`);
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 29: 回合結束時
      // =====================================================================
      case NODE.NODE_29: {
        log.push(`[節點 29] 回合結束時`);
        
        // --- 預設 function ---
        // 淨世新生節點：淨世新生3回合結束回滿血量pp
        // 技能/魂印回合類覆蓋效果的結束節點：回合數-1
        // 特殊魂印效果：君臨天下6回合結束降1血/清pp/鎖切
        spiritA.turnEffects = spiritA.turnEffects.filter(e => { e.turns--; return e.turns > 0; });
        spiritB.turnEffects = spiritB.turnEffects.filter(e => { e.turns--; return e.turns > 0; });
        spiritA.statuses = spiritA.statuses.filter(s => { s.turns--; return s.turns > 0; });
        spiritB.statuses = spiritB.statuses.filter(s => { s.turns--; return s.turns > 0; });
        
        spiritA.priority = { bonus: 0, forceFirst: false, forceLast: false };
        spiritB.priority = { bonus: 0, forceFirst: false, forceLast: false };
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 30: 回合結束後 (死亡判定節點3)
      // =====================================================================
      case NODE.NODE_30: {
        log.push(`[節點 30] 回合結束後 (死亡判定節點3)`);
        
        // --- 預設 function ---
        // 舊時代部分回合結束後效果：重生之翼回合結束後續航、機蓋回合結束後續航
        // 死亡判定節點3 (可能同归于尽)：判定雙方血量是否為0，為0則死亡
        const currentA = teamA.spirits[teamA.currentIndex];
        const currentB = teamB.spirits[teamB.currentIndex];
        
        if (currentA && currentA.hp.current <= 0) {
          currentA.isAlive = false;
          this.defeatedThisTurn.A = true;
        }
        if (currentB && currentB.hp.current <= 0) {
          currentB.isAlive = false;
          this.defeatedThisTurn.B = true;
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 31: 未擊敗/擊敗階段-子節點1 未被擊敗/被擊敗時
      // =====================================================================
      case NODE.NODE_31: {
        log.push(`[節點 31] 未被擊敗/被擊敗時`);
        
        // --- 預設 function ---
        // (通用判定節點)
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 32: 未擊敗/擊敗階段-子節點2 未擊敗/擊敗對手時
      // =====================================================================
      case NODE.NODE_32: {
        log.push(`[節點 32] 未擊敗/擊敗對手時`);
        
        // --- 預設 function ---
        // 部分技能效果：未擊敗則陷入異常、未擊敗則次數閃避、未擊敗續航
        // 部分會造成粉傷的技能效果 (0血保護)
        // 部分魂印未擊敗/擊敗時效果：灵巢魂印未擊敗回血/回pp/團隊次免
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 33: 未擊敗/擊敗階段-子節點3 被擊敗後
      // =====================================================================
      case NODE.NODE_33: {
        log.push(`[節點 33] 被擊敗後`);
        
        // --- 預設 function ---
        // 絕大部分魂印被擊敗效果：帝佛被擊敗清pp、明王被擊敗反強+1血
        // 湮滅之主咤克斯被擊敗降低對手體力上限
        // 奧菲利婭支援被擊敗後斷回合
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 34: 未擊敗/擊敗階段-子節點4 擊敗對手後
      // =====================================================================
      case NODE.NODE_34: {
        log.push(`[節點 34] 擊敗對手後`);
        
        // --- 預設 function ---
        // 部分技能擊敗對手后效果：擊殺雙回、項羽新第五擊殺回滿血
        // 部分魂印擊敗對手后效果：混暗魂印擊敗對手后清pp、變異鱷魚擊敗對手后提升能力值
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 35: 未擊敗/擊敗階段-子節點5 死亡下場
      // =====================================================================
      case NODE.NODE_35: {
        log.push(`[節點 35] 死亡下場`);
        
        // --- 預設 function ---
        // 死亡下場效果：烏拉諾斯死亡下場附加buff、冰骷使者死亡下場封屬性
        // 克羅諾斯死亡下場附加鎖傷、蒼星死亡下場回复隊友全部血量/pp
        // 部分特殊擊殺效果：灵巢擊殺转移弱化/异常
        
        // 清除死亡精靈的臨時數據
        if (this.defeatedThisTurn.A) {
          const deadSpirit = teamA.spirits[teamA.currentIndex];
          if (deadSpirit) clearSpiritOnSwitchOut(deadSpirit);
        }
        if (this.defeatedThisTurn.B) {
          const deadSpirit = teamB.spirits[teamB.currentIndex];
          if (deadSpirit) clearSpiritOnSwitchOut(deadSpirit);
        }
        
        // 死亡換人
        if (this.defeatedThisTurn.A) {
          const newIdx = teamA.spirits.findIndex((s, i) => s && s.hp.current > 0 && i !== teamA.currentIndex);
          if (newIdx >= 0) {
            teamA.previousIndex = teamA.currentIndex;
            teamA.currentIndex = newIdx;
            log.push(`  → ${teamA.spirits[newIdx]?.name} 登場！`);
          }
        }
        if (this.defeatedThisTurn.B) {
          const newIdx = teamB.spirits.findIndex((s, i) => s && s.hp.current > 0 && i !== teamB.currentIndex);
          if (newIdx >= 0) {
            teamB.previousIndex = teamB.currentIndex;
            teamB.currentIndex = newIdx;
            log.push(`  → ${teamB.spirits[newIdx]?.name} 登場！`);
          }
        }
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
      
      // =====================================================================
      // 節點 36: 戰敗判定節點
      // =====================================================================
      case NODE.NODE_36: {
        log.push(`[節點 36] 戰敗判定節點`);
        
        // --- 預設 function ---
        // 判定己方或對手是否滿足戰敗條件（如全隊精靈陣亡、特殊勝負條件達成）
        // 戰敗或勝利後結束整個戰鬥流程並進入結算畫面
        const teamADefeated = teamA.spirits.filter(s => s !== null).every(s => s!.hp.current <= 0);
        const teamBDefeated = teamB.spirits.filter(s => s !== null).every(s => s!.hp.current <= 0);
        
        if (teamADefeated) {
          log.push(`\n========== Team B 獲勝！ ==========`);
          return { winner: 'B' };
        }
        if (teamBDefeated) {
          log.push(`\n========== Team A 獲勝！ ==========`);
          return { winner: 'A' };
        }
        
        // 重置擊敗標記
        this.defeatedThisTurn = { A: false, B: false };
        this.skipSecondMover = false;
        
        // --- 從 state 讀取 function ---
        this.executeFromState(node, spiritA, spiritB, log);
        this.executeFromState(node, spiritB, spiritA, log);
        
        break;
      }
    }
    
    return { winner: null };
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // 從 State 讀取並執行
  // ─────────────────────────────────────────────────────────────────────────
  private executeFromState(
    currentNode: NodeType,
    self: SpiritState,
    opponent: SpiritState,
    log: string[]
  ): void {
    const runCallsForNode = (calls?: FunctionCall[], source?: string) => {
      if (!calls) return;
      const filtered = calls.filter(call => !call.node || this.matchNode(currentNode, call.node));
      if (filtered.length > 0) {
        this.executeCalls(filtered, self, opponent, log, source);
      }
    };

    // 1. 讀取 soulBuff effects
    if (self.soulBuff) {
      for (const effect of self.soulBuff.effects) {
        if (effect.node && !this.matchNode(currentNode, effect.node)) continue;
        runCallsForNode(effect.calls, 'soulBuff');
      }
    }
    
    // 2. 讀取 turnEffects
    for (const effect of self.turnEffects) {
      if (this.matchNode(currentNode, effect.node)) {
        runCallsForNode(effect.calls);
      }
    }
    
    // 3. 讀取 countEffects
    for (const effect of Object.values(self.countEffects)) {
      if (effect.count > 0 && this.matchNode(currentNode, effect.node)) {
        runCallsForNode(effect.calls);
      }
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // 執行 FunctionCall 列表（支持 REQUIRE 中斷）
  // ─────────────────────────────────────────────────────────────────────────
  private executeCalls(
    calls: FunctionCall[],
    self: SpiritState,
    opponent: SpiritState,
    log: string[],
    source?: string
  ): boolean {
    for (const call of calls) {
      const result = this.executeCall(call, self, opponent, log, source);
      // 如果是 REQUIRE 函數且返回 false，跳過後續
      if (result === false) {
        return false;
      }
    }
    return true;
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // 執行 FunctionCall（REQUIRE 函數返回 false 時中斷）
  // ─────────────────────────────────────────────────────────────────────────
  private executeCall(
    call: FunctionCall,
    self: SpiritState,
    opponent: SpiritState,
    log: string[],
    source?: string
  ): boolean | void {
    const target = call.target === 'opponent' ? opponent : self;
    
    // ─────────────────────────────────────────────────────────────────────
    // STATE 系統 - 包含 REQUIRE 函數
    // ─────────────────────────────────────────────────────────────────────
    if (call.system === 'STATE') {
      switch (call.func) {
        case 'CHECK_OPPONENT_BUFF':
          STATE.CHECK_OPPONENT_BUFF(self, opponent);
          return true;
        case 'CHECK_OPPONENT_NO_BUFF':
          STATE.CHECK_OPPONENT_NO_BUFF(self, opponent);
          return true;
        case 'CHECK_TEMPORARY_COUNT':
          return STATE.CHECK_TEMPORARY_COUNT(self);
        default:
          return true;
      }
    }
    
    switch (call.system) {
      case 'HP': {
        switch (call.func) {
          case 'HEAL': {
            const amt = typeof call.amount === 'function' ? call.amount(self, opponent) : (call.amount || 0);
            const actual = Math.min(target.hp.max - target.hp.current, amt);
            target.hp.current += actual;
            if (actual > 0) log.push(`    ${target.name} 恢復 ${actual} HP`);
            break;
          }
          case 'HEAL_PERCENT': {
            const base = call.basedOn === 'current' ? target.hp.current : target.hp.max;
            const amt = Math.floor(base * (call.percent || 0) / 100);
            const actual = Math.min(target.hp.max - target.hp.current, amt);
            target.hp.current += actual;
            if (actual > 0) log.push(`    ${target.name} 恢復 ${actual} HP`);
            break;
          }
          case 'SET': {
            if (call.value === 'max') { target.hp.current = target.hp.max; log.push(`    ${target.name} HP 滿！`); }
            break;
          }
          case 'HEAL_AND_DAMAGE': {
            const base = call.ofMax ? self.hp.max : (self.hp.max - self.hp.current);
            const amt = Math.floor(base * (call.percent || 0) / 100);
            self.hp.current = Math.min(self.hp.max, self.hp.current + amt);
            const dmgT = call.damageTarget === 'opponent' ? opponent : self;
            dmgT.hp.current = Math.max(0, dmgT.hp.current - amt);
            log.push(`    ${self.name} 恢復 ${amt} HP，${dmgT.name} -${amt} HP`);
            break;
          }
          case 'DRAIN_PERCENT': {
            const base = call.basedOn === 'current' ? target.hp.current : target.hp.max;
            const amt = Math.floor(base * (call.percent || 0) / 100);
            const drained = Math.min(target.hp.current, amt);
            target.hp.current -= drained;
            self.hp.current = Math.min(self.hp.max, self.hp.current + drained);
            log.push(`    ${self.name} 吸取 ${drained} HP`);
            break;
          }
        }
        break;
      }
      case 'PP': {
        switch (call.func) {
          case 'USE': {
            const amt = typeof call.amount === 'function' ? call.amount(self, opponent) : (call.amount || 1);
            if (call.skillIndex !== undefined && target.skills[call.skillIndex]) {
              target.skills[call.skillIndex].pp = Math.max(0, target.skills[call.skillIndex].pp - amt);
            }
            break;
          }
          case 'RESTORE_ALL': {
            for (const s of target.skills) s.pp = s.maxPp;
            log.push(`    ${target.name} PP 滿！`);
            break;
          }
        }
        break;
      }
      case 'DAMAGE': {
        switch (call.func) {
          case 'ATTACK': {
            const pwr = typeof call.power === 'function' ? call.power(self, opponent) : (call.power || 0);
            const cat = call.category || 'physical';
            const atk = cat === 'physical' ? this.calcStat(self, 'attack') : this.calcStat(self, 'spAttack');
            const def = cat === 'physical' ? this.calcStat(target, 'defense') : this.calcStat(target, 'spDefense');
            let dmg = Math.floor((pwr * atk / Math.max(1, def)) * 0.5 + 10);
            dmg = Math.floor(dmg * (1 - target.resist.fixed / 100));
            target.hp.current = Math.max(0, target.hp.current - dmg);
            log.push(`    → ${target.name} -${dmg} HP`);
            break;
          }
          case 'FIXED': {
            const val = typeof call.value === 'function' ? call.value(self, opponent) : (call.value as number || 0);
            const dmg = Math.floor(val * (1 - target.resist.fixed / 100));
            target.hp.current = Math.max(0, target.hp.current - dmg);
            if (dmg > 0) log.push(`    → ${target.name} -${dmg} HP (固傷)`);
            break;
          }
        }
        break;
      }
      case 'STATS': {
        switch (call.func) {
          case 'MODIFY': {
            const stats = typeof call.stats === 'function' ? call.stats(self, opponent) : call.stats;
            if (stats) {
              for (const [k, v] of Object.entries(stats)) {
                if (v !== undefined && k in target.stages) {
                  target.stages[k as keyof typeof target.stages] = Math.max(-6, Math.min(6, target.stages[k as keyof typeof target.stages] + v));
                }
              }
              log.push(`    ${target.name} 能力變化！`);
            }
            break;
          }
          case 'CLEAR_UPS': {
            let had = false;
            for (const k of ['attack', 'defense', 'spAttack', 'spDefense', 'speed'] as const) {
              if (target.stages[k] > 0) { target.stages[k] = 0; had = true; }
            }
            if (had) {
              log.push(`    ${target.name} 強化被消除！`);
              if (call.onSuccess) for (const c of call.onSuccess) this.executeCall(c, self, opponent, log, source);
            } else if (call.onFail) for (const c of call.onFail) this.executeCall(c, self, opponent, log, source);
            break;
          }
          case 'REVERSE': {
            let any = false;
            for (const k of ['attack', 'defense', 'spAttack', 'spDefense', 'speed'] as const) {
              if (target.stages[k] !== 0) { target.stages[k] = -target.stages[k]; any = true; }
            }
            if (any) {
              log.push(`    ${target.name} 能力反轉！`);
              if (call.onSuccess) for (const c of call.onSuccess) this.executeCall(c, self, opponent, log, source);
            }
            break;
          }
          case 'SYNC_DOWN': {
            const ref = call.reference === 'self' ? self : opponent;
            for (const k of ['attack', 'defense', 'spAttack', 'spDefense', 'speed'] as const) {
              if (target.stages[k] > ref.stages[k]) target.stages[k] = ref.stages[k];
            }
            break;
          }
        }
        break;
      }
      case 'STATUS': {
        switch (call.func) {
          case 'APPLY': {
            const st = call.status || call.statusId;
            if (st && st !== 'all') {
              if (Math.random() * 100 <= (call.chance || 100)) {
                target.statuses.push({ id: st, turns: call.turns || 1, source: 'opponent' });
                log.push(`    ${target.name} 陷入 ${st}！`);
              } else if (call.onFail) for (const c of call.onFail) this.executeCall(c, self, opponent, log, source);
            }
            break;
          }
          case 'ADD_COUNT_IMMUNITY': {
            const id = (call.statusId || 'all') === 'all' ? 'status_immune_all' : `status_immune_${call.statusId}`;
            self.countEffects[id] = { id, name: '異常免疫', count: call.count || 1, max: call.count || 1, node: '*' };
            log.push(`    ${self.name} 獲得 ${call.count} 次異常免疫！`);
            break;
          }
          case 'SET_REFLECT': {
            // Removed flag logic
            if (call.value) log.push(`    ${target.name} 獲得異常反彈！`);
            break;
          }
        }
        break;
      }
      case 'TURN': {
        const isSoulBuffSource = source === 'soulBuff';
        switch (call.func) {
          case 'ADD': {
            const dispellable = call.dispellable !== undefined ? call.dispellable : !isSoulBuffSource;
            target.turnEffects.push({
              id: call.effectId || `e_${Date.now()}`,
              name: call.effectId || '效果',
              turns: call.turns || 1,
              node: call.effectNode || call.node || '*',
              calls: call.onSuccess || [],
              dispellable,
            });
            break;
          }
          case 'DISPEL': {
            const before = target.turnEffects.length;
            target.turnEffects = target.turnEffects.filter(e => e.dispellable === false);
            const removed = before - target.turnEffects.length;
            if (removed > 0) {
              log.push(`    ${target.name} ${removed} 個效果被消除！`);
              if (call.onSuccess) for (const c of call.onSuccess) this.executeCall(c, self, opponent, log, source);
            }
            break;
          }
        }
        break;
      }
      case 'COUNT': {
        switch (call.func) {
          case 'SET': {
            target.countEffects[call.countId || ''] = {
              id: call.countId || '',
              name: call.countId || '',
              count: call.count || 1,
              max: call.max || call.count || 1,
              node: call.effectNode || call.node || '*',
              calls: call.onSuccess || [],
            };
            break;
          }
        }
        break;
      }
      case 'PRIO': {
        switch (call.func) {
          case 'ADD': {
            const v = typeof call.value === 'function' ? call.value(self, opponent) : (call.value as number || 0);
            target.priority.bonus += v;
            if (call.turns && call.effectId) {
              target.turnEffects.push({ id: call.effectId, name: '先制', turns: call.turns, node: NODE.NODE_29 });
            }
            log.push(`    ${target.name} 先制 +${v}！`);
            break;
          }
        }
        break;
      }
      case 'BLOCK': {
        switch (call.func) {
          case 'NULLIFY': {
            // Removed turnFlags logic
            log.push(`    攻擊被無效化！`);
            break;
          }
        }
        break;
      }
      // BRANCH 已移除 - 使用 STATE.REQUIRE_XXX 函數代替
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // 輔助
  // ─────────────────────────────────────────────────────────────────────────
  private matchNode(cur: string, eff: string | string[] | object | undefined): boolean {
    if (!eff) return false;
    if (typeof eff === 'string') return eff === '*' || eff === cur;
    if (Array.isArray(eff)) return eff.includes(cur);
    if (typeof eff === 'object') {
      const o = eff as { all?: boolean; except?: string[]; nodes?: string[]; also?: string };
      if (o.all) return !o.except?.includes(cur);
      if (o.nodes) { if (o.nodes.includes(cur)) return true; if (o.also === '*' || o.also === cur) return true; }
    }
    return false;
  }
  
  private calcPriority(s: SpiritState, skill: Skill | null): number {
    return (skill?.priority || 0) * 1000 + this.calcStat(s, 'speed') + s.priority.bonus;
  }
  
  private calcStat(s: SpiritState, stat: keyof typeof s.baseStats): number {
    const m = [2/8, 2/7, 2/6, 2/5, 2/4, 2/3, 1, 3/2, 4/2, 5/2, 6/2, 7/2, 8/2];
    return Math.floor(s.baseStats[stat] * m[Math.max(0, Math.min(12, s.stages[stat] + 6))]);
  }
}
