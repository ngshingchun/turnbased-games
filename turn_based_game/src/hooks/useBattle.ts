/**
 * 戰鬥 Hook - 管理戰鬥狀態和邏輯
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  BattleEngine,
  createBattleEngine,
  SpiritData,
  SpiritState,
  TeamState,
  Side,
  PlayerAction,
  BattleResult,
  TurnPhaseNode,
  SpiritStateHelper,
} from '../core';

export interface BattleState {
  // 戰鬥狀態
  isStarted: boolean;
  isPaused: boolean;
  isEnded: boolean;
  winner: Side | null;
  
  // 回合信息
  turnCount: number;
  currentPhase: TurnPhaseNode | null;
  
  // 隊伍狀態
  teamA: TeamState | null;
  teamB: TeamState | null;
  currentA: SpiritState | null;
  currentB: SpiritState | null;
  
  // 輸入狀態
  waitingInput: boolean;
  actionA: PlayerAction | null;
  actionB: PlayerAction | null;
  
  // 日誌
  battleLog: string[];
}

export interface UseBattleReturn {
  state: BattleState;
  
  // 初始化
  initBattle: (teamA: SpiritData[], teamB: SpiritData[]) => void;
  
  // 行動
  setAction: (side: Side, action: PlayerAction) => void;
  executeTurn: () => Promise<BattleResult>;
  
  // 換人
  switchSpirit: (side: Side, index: number) => Promise<boolean>;
  getAvailableSwitches: (side: Side) => number[];
  
  // 控制
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

const initialState: BattleState = {
  isStarted: false,
  isPaused: false,
  isEnded: false,
  winner: null,
  turnCount: 0,
  currentPhase: null,
  teamA: null,
  teamB: null,
  currentA: null,
  currentB: null,
  waitingInput: true,
  actionA: null,
  actionB: null,
  battleLog: [],
};

export function useBattle(): UseBattleReturn {
  const [state, setState] = useState<BattleState>(initialState);
  const engineRef = useRef<BattleEngine | null>(null);
  const logBufferRef = useRef<string[]>([]);

  // 更新狀態
  const updateState = useCallback(() => {
    if (!engineRef.current) return;
    
    const engine = engineRef.current;
    const summary = engine.getSummary();
    
    setState(prev => ({
      ...prev,
      turnCount: summary.turn,
      currentPhase: summary.phase as TurnPhaseNode | null,
      teamA: engine.teamA,
      teamB: engine.teamB,
      currentA: engine.stateA,
      currentB: engine.stateB,
      isEnded: summary.battleEnded,
      winner: summary.winner as Side | null,
      battleLog: [...logBufferRef.current],
    }));
  }, []);

  // 日誌回調
  const onLog = useCallback((message: string) => {
    logBufferRef.current = [...logBufferRef.current, message];
    setState(prev => ({
      ...prev,
      battleLog: logBufferRef.current,
    }));
  }, []);

  // 初始化戰鬥
  const initBattle = useCallback((teamASpirits: SpiritData[], teamBSpirits: SpiritData[]) => {
    logBufferRef.current = [];
    
    const engine = createBattleEngine({
      onLog,
      onUpdate: updateState,
    });
    
    engine.initTeams(teamASpirits, teamBSpirits);
    engineRef.current = engine;
    
    setState({
      ...initialState,
      isStarted: true,
      waitingInput: true,
      teamA: engine.teamA,
      teamB: engine.teamB,
      currentA: engine.stateA,
      currentB: engine.stateB,
      battleLog: logBufferRef.current,
    });
  }, [onLog, updateState]);

  // 設置行動
  const setAction = useCallback((side: Side, action: PlayerAction) => {
    if (!engineRef.current) return;
    
    engineRef.current.setAction(side, action);
    
    setState(prev => ({
      ...prev,
      actionA: side === 'A' ? action : prev.actionA,
      actionB: side === 'B' ? action : prev.actionB,
      waitingInput: !engineRef.current?.allReady(),
    }));
  }, []);

  // 執行回合
  const executeTurn = useCallback(async (): Promise<BattleResult> => {
    if (!engineRef.current) {
      return { completed: false, battleEnded: false };
    }
    
    setState(prev => ({ ...prev, waitingInput: false }));
    
    const result = await engineRef.current.executeTurn();
    
    setState(prev => ({
      ...prev,
      actionA: null,
      actionB: null,
      waitingInput: !result.battleEnded,
      isEnded: result.battleEnded,
      winner: result.winner as Side | null ?? null,
    }));
    
    updateState();
    
    return result;
  }, [updateState]);

  // 換人
  const switchSpirit = useCallback(async (side: Side, index: number): Promise<boolean> => {
    if (!engineRef.current) return false;
    
    const result = await engineRef.current.switchSpirit(side, index);
    updateState();
    
    return result;
  }, [updateState]);

  // 獲取可換人列表
  const getAvailableSwitches = useCallback((side: Side): number[] => {
    if (!engineRef.current) return [];
    
    const team = side === 'A' ? engineRef.current.teamA : engineRef.current.teamB;
    if (!team) return [];
    
    return team.spirits
      .map((s, i) => ({ spirit: s, index: i }))
      .filter(({ spirit, index }) => 
        spirit !== null && SpiritStateHelper.isAlive(spirit) && index !== team.currentIndex
      )
      .map(({ index }) => index);
  }, []);

  // 暫停
  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  // 恢復
  const resume = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  // 重置
  const reset = useCallback(() => {
    engineRef.current = null;
    logBufferRef.current = [];
    setState(initialState);
  }, []);

  return {
    state,
    initBattle,
    setAction,
    executeTurn,
    switchSpirit,
    getAvailableSwitches,
    pause,
    resume,
    reset,
  };
}



