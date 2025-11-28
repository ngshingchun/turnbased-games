/**
 * 主應用 - Cosmic Battle
 */

import React, { useState, useCallback } from 'react';
import { BattleScene } from './components';
import { useBattle } from './hooks/useBattle';
import { getAllSpirits, SpiritRegistry } from './spirits';
import { SpiritData, Side, PlayerAction } from './core';
import './App.css';

type Screen = 'entry' | 'selection' | 'battle';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('entry');
  const [gameMode, setGameMode] = useState<'single' | 'multi'>('single');
  const [selectedP1, setSelectedP1] = useState<SpiritData[]>([]);
  const [selectedP2, setSelectedP2] = useState<SpiritData[]>([]);
  
  const {
    state: battleState,
    initBattle,
    setAction,
    executeTurn,
    switchSpirit,
    getAvailableSwitches,
    reset,
  } = useBattle();

  // 精靈池
  const spiritPool = getAllSpirits();

  // 開始選擇畫面
  const handleStartSelection = (mode: 'single' | 'multi') => {
    setGameMode(mode);
    setSelectedP1([]);
    setSelectedP2([]);
    setScreen('selection');
  };

  // 添加精靈到隊伍
  const handleAddSpirit = (spirit: SpiritData) => {
    if (selectedP1.length < 6) {
      setSelectedP1([...selectedP1, spirit]);
    } else if (gameMode === 'multi' && selectedP2.length < 6) {
      setSelectedP2([...selectedP2, spirit]);
    }
  };

  // 從隊伍移除精靈
  const handleRemoveSpirit = (index: number, isP1: boolean) => {
    if (isP1) {
      setSelectedP1(selectedP1.filter((_, i) => i !== index));
    } else {
      setSelectedP2(selectedP2.filter((_, i) => i !== index));
    }
  };

  // 開始戰鬥
  const handleStartBattle = () => {
    let p1Team = selectedP1;
    let p2Team = selectedP2;

    // 單人模式：自動填充電腦隊伍
    if (gameMode === 'single') {
      const available = spiritPool.filter(s => !selectedP1.some(p => p.key === s.key));
      p2Team = available.slice(0, Math.min(6, available.length));
    }

    if (p1Team.length === 0) {
      p1Team = [spiritPool[0]];
    }
    if (p2Team.length === 0) {
      p2Team = [spiritPool[1] || spiritPool[0]];
    }

    initBattle(p1Team, p2Team);
    setScreen('battle');
  };

  // 使用技能
  const handleUseSkill = useCallback((side: Side, skillIndex: number) => {
    const action: PlayerAction = {
      type: 'skill',
      skillIndex,
      priority: battleState.currentA?.skills[skillIndex]?.priority ?? 0,
    };
    setAction(side, action);

    // 單人模式：自動為電腦選擇技能
    if (gameMode === 'single' && side === 'A') {
      const enemySkills = battleState.currentB?.skills || [];
      const availableSkills = enemySkills.filter(s => s.pp > 0);
      if (availableSkills.length > 0) {
        const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
        const skillIdx = enemySkills.indexOf(randomSkill);
        setAction('B', {
          type: 'skill',
          skillIndex: skillIdx,
          priority: randomSkill.priority,
        });
      }
    }
  }, [battleState.currentA, battleState.currentB, gameMode, setAction]);

  // 打開換人模態框
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [switchSide, setSwitchSide] = useState<Side>('A');

  const handleOpenSwitch = (side: Side) => {
    setSwitchSide(side);
    setShowSwitchModal(true);
  };

  const handleSwitch = async (index: number) => {
    await switchSpirit(switchSide, index);
    setShowSwitchModal(false);
  };

  // 執行回合
  const handleExecuteTurn = async () => {
    await executeTurn();
  };

  // 返回主菜單
  const handleBackToMenu = () => {
    reset();
    setScreen('entry');
  };

  return (
    <div className="app">
      {/* 入口畫面 */}
      {screen === 'entry' && (
        <div className="entry-screen">
          <div className="title-container">
            <h1 className="game-title">Cosmic Battle</h1>
            <p className="game-subtitle">回合制策略對戰</p>
          </div>
          <div className="menu-options">
            <button 
              className="menu-btn"
              onClick={() => handleStartSelection('single')}
            >
              單人模式
            </button>
            <button 
              className="menu-btn"
              onClick={() => handleStartSelection('multi')}
            >
              雙人對戰
            </button>
          </div>
        </div>
      )}

      {/* 選擇畫面 */}
      {screen === 'selection' && (
        <div className="selection-screen">
          <h2 className="screen-title">選擇你的精靈</h2>
          
          <div className="selection-container">
            {/* 玩家1隊伍預覽 */}
            <div className="team-preview">
              <h3>玩家 1</h3>
              <div className="preview-slots">
                {selectedP1.map((spirit, i) => (
                  <div 
                    key={i} 
                    className="preview-slot filled"
                    onClick={() => handleRemoveSpirit(i, true)}
                  >
                    <span className="slot-initial">{spirit.name.charAt(0)}</span>
                    <span className="slot-name">{spirit.name}</span>
                  </div>
                ))}
                {Array(6 - selectedP1.length).fill(null).map((_, i) => (
                  <div key={`empty-${i}`} className="preview-slot empty">
                    <span className="slot-number">{selectedP1.length + i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 精靈池 */}
            <div className="spirit-pool-container">
              <div className="spirit-pool">
                {spiritPool.map(spirit => (
                  <div
                    key={spirit.key}
                    className="pool-item"
                    onClick={() => handleAddSpirit(spirit)}
                  >
                    <div className="pool-avatar">{spirit.name.charAt(0)}</div>
                    <span className="pool-name">{spirit.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 玩家2隊伍預覽 */}
            <div className="team-preview">
              <h3>{gameMode === 'single' ? '電腦 (自動填充)' : '玩家 2'}</h3>
              <div className="preview-slots">
                {selectedP2.map((spirit, i) => (
                  <div 
                    key={i} 
                    className="preview-slot filled"
                    onClick={() => handleRemoveSpirit(i, false)}
                  >
                    <span className="slot-initial">{spirit.name.charAt(0)}</span>
                    <span className="slot-name">{spirit.name}</span>
                  </div>
                ))}
                {Array(6 - selectedP2.length).fill(null).map((_, i) => (
                  <div key={`empty-${i}`} className="preview-slot empty">
                    <span className="slot-number">{selectedP2.length + i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="selection-controls">
            <button 
              className="control-btn secondary"
              onClick={handleBackToMenu}
            >
              返回
            </button>
            <button 
              className="control-btn primary"
              onClick={handleStartBattle}
              disabled={selectedP1.length === 0 && gameMode === 'multi'}
            >
              開始戰鬥
            </button>
          </div>
        </div>
      )}

      {/* 戰鬥畫面 */}
      {screen === 'battle' && (
        <>
          <BattleScene
            currentA={battleState.currentA}
            currentB={battleState.currentB}
            turnCount={battleState.turnCount}
            battleLog={battleState.battleLog}
            isEnded={battleState.isEnded}
            winner={battleState.winner}
            waitingInput={battleState.waitingInput}
            onUseSkill={handleUseSkill}
            onOpenSwitch={handleOpenSwitch}
            onOpenBag={() => {}}
            onExecuteTurn={handleExecuteTurn}
            actionA={battleState.actionA}
            actionB={battleState.actionB}
          />

          {/* 換人模態框 */}
          {showSwitchModal && (
            <div className="modal-overlay" onClick={() => setShowSwitchModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>選擇要上場的精靈</h3>
                <div className="switch-list">
                  {getAvailableSwitches(switchSide).map(index => {
                    const team = switchSide === 'A' ? battleState.teamA : battleState.teamB;
                    const spirit = team?.spirits[index];
                    if (!spirit) return null;
                    return (
                      <button
                        key={index}
                        className="switch-item"
                        onClick={() => handleSwitch(index)}
                      >
                        <span className="switch-avatar">{spirit.name.charAt(0)}</span>
                        <span className="switch-name">{spirit.name}</span>
                        <span className="switch-hp">
                          HP: {spirit.hp.current}/{spirit.hp.max}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button className="close-btn" onClick={() => setShowSwitchModal(false)}>
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 戰鬥結束返回按鈕 */}
          {battleState.isEnded && (
            <button 
              className="back-to-menu-btn"
              onClick={handleBackToMenu}
            >
              返回主菜單
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default App;



