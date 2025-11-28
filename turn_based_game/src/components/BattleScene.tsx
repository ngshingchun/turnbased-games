/**
 * 戰鬥場景組件
 */

import React from 'react';
import { SpiritCard } from './SpiritCard';
import { SkillButton } from './SkillButton';
import { BattleLog } from './BattleLog';
import { SpiritState, Side, PlayerAction } from '../core';
import './BattleScene.css';

interface BattleSceneProps {
  // 狀態
  currentA: SpiritState | null;
  currentB: SpiritState | null;
  turnCount: number;
  battleLog: string[];
  isEnded: boolean;
  winner: Side | null;
  waitingInput: boolean;
  
  // 行動
  onUseSkill: (side: Side, skillIndex: number) => void;
  onOpenSwitch: (side: Side) => void;
  onOpenBag: () => void;
  onExecuteTurn: () => void;
  
  // 輸入狀態
  actionA: PlayerAction | null;
  actionB: PlayerAction | null;
}

export const BattleScene: React.FC<BattleSceneProps> = ({
  currentA,
  currentB,
  turnCount,
  battleLog,
  isEnded,
  winner,
  waitingInput,
  onUseSkill,
  onOpenSwitch,
  onOpenBag,
  onExecuteTurn,
  actionA,
  actionB,
}) => {
  const bothReady = actionA !== null && actionB !== null;

  return (
    <div className="battle-scene">
      {/* 背景 */}
      <div className="battle-background">
        <div className="stars" />
        <div className="nebula" />
      </div>

      {/* 頂部 HUD */}
      <div className="battle-hud">
        {/* 玩家狀態 */}
        <div className="hud-section player-section">
          {currentA && (
            <SpiritCard
              spirit={currentA}
              isPlayer={true}
              isActive={true}
              showDetails={false}
            />
          )}
        </div>

        {/* 中間信息 */}
        <div className="hud-center">
          <div className="turn-badge">
            <span className="turn-label">回合</span>
            <span className="turn-number">{turnCount}</span>
          </div>
          <div className="vs-badge">VS</div>
        </div>

        {/* 對手狀態 */}
        <div className="hud-section enemy-section">
          {currentB && (
            <SpiritCard
              spirit={currentB}
              isPlayer={false}
              isActive={true}
              showDetails={false}
            />
          )}
        </div>
      </div>

      {/* 戰鬥區域 */}
      <div className="battle-arena">
        {/* 玩家精靈 */}
        <div className="arena-character player-character">
          <div className="character-sprite">
            {currentA && (
              <div className="sprite-placeholder player">
                {currentA.name.charAt(0)}
              </div>
            )}
          </div>
          {actionA && (
            <div className="action-indicator ready">
              已選擇: {actionA.type === 'skill' ? currentA?.skills[actionA.skillIndex!]?.name : '換人'}
            </div>
          )}
        </div>

        {/* 對手精靈 */}
        <div className="arena-character enemy-character">
          <div className="character-sprite">
            {currentB && (
              <div className="sprite-placeholder enemy">
                {currentB.name.charAt(0)}
              </div>
            )}
          </div>
          {actionB && (
            <div className="action-indicator ready">
              已選擇
            </div>
          )}
        </div>

        {/* 結束畫面 */}
        {isEnded && (
          <div className="battle-end-overlay">
            <div className="end-message">
              <h2>{winner === 'A' ? '勝利！' : winner === 'B' ? '失敗...' : '戰鬥結束'}</h2>
              <p>{winner === 'A' ? '恭喜你贏得了戰鬥！' : '再接再厲！'}</p>
            </div>
          </div>
        )}
      </div>

      {/* 底部面板 */}
      <div className="battle-controls">
        {/* 技能區 */}
        <div className="skills-panel">
          {/* 第五技能 (大招) */}
          <div className="ultimate-skill">
            {currentA?.skills[4] && (
              <SkillButton
                skill={currentA.skills[4]}
                index={4}
                isUltimate={true}
                disabled={!waitingInput || actionA !== null}
                onClick={() => onUseSkill('A', 4)}
              />
            )}
          </div>

          {/* 普通技能 */}
          <div className="normal-skills">
            {currentA?.skills.slice(0, 4).map((skill, index) => (
              <SkillButton
                key={index}
                skill={skill}
                index={index}
                disabled={!waitingInput || actionA !== null}
                onClick={() => onUseSkill('A', index)}
              />
            ))}
          </div>
        </div>

        {/* 右側面板 */}
        <div className="right-panel">
          {/* 戰鬥日誌 */}
          <BattleLog logs={battleLog} />

          {/* 行動按鈕 */}
          <div className="action-buttons">
            <button 
              className="action-btn"
              onClick={onOpenBag}
              disabled={!waitingInput}
            >
              背包
            </button>
            <button 
              className="action-btn"
              onClick={() => onOpenSwitch('A')}
              disabled={!waitingInput}
            >
              換人
            </button>
            {bothReady && (
              <button 
                className="action-btn execute"
                onClick={onExecuteTurn}
              >
                執行回合
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};



