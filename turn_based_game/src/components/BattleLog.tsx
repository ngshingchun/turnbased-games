/**
 * 戰鬥日誌組件
 */

import React, { useRef, useEffect } from 'react';
import './BattleLog.css';

interface BattleLogProps {
  logs: string[];
  maxHeight?: number;
}

export const BattleLog: React.FC<BattleLogProps> = ({
  logs,
  maxHeight = 150,
}) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  // 自動滾動到底部
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogClass = (log: string) => {
    if (log.includes('獲勝') || log.includes('勝利')) return 'log-victory';
    if (log.includes('失敗') || log.includes('全滅')) return 'log-defeat';
    if (log.includes('使用了')) return 'log-skill';
    if (log.includes('造成') || log.includes('傷害')) return 'log-damage';
    if (log.includes('恢復') || log.includes('回復')) return 'log-heal';
    if (log.includes('===')) return 'log-turn';
    return '';
  };

  return (
    <div className="battle-log" style={{ maxHeight }}>
      <div className="log-header">
        <span className="log-title">戰鬥日誌</span>
      </div>
      <div className="log-content">
        {logs.map((log, index) => (
          <div key={index} className={`log-entry ${getLogClass(log)}`}>
            {log}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};



