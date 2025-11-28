/**
 * 精靈卡片組件
 */

import React from 'react';
import { SpiritState, SpiritStateHelper } from '../core';
import './SpiritCard.css';

interface SpiritCardProps {
  spirit: SpiritState;
  isPlayer?: boolean;
  isActive?: boolean;
  showDetails?: boolean;
  onClick?: () => void;
}

export const SpiritCard: React.FC<SpiritCardProps> = ({
  spirit,
  isPlayer = true,
  isActive = false,
  showDetails = false,
  onClick,
}) => {
  const hpPercent = SpiritStateHelper.hpPercent(spirit);
  const ppPercent = spirit.pp.max > 0 ? (spirit.pp.current / spirit.pp.max) * 100 : 0;
  const isDead = SpiritStateHelper.isDead(spirit);

  const getHpBarClass = () => {
    if (hpPercent <= 10) return 'hp-bar critical';
    if (hpPercent <= 25) return 'hp-bar low';
    if (hpPercent <= 50) return 'hp-bar medium';
    return 'hp-bar';
  };

  const getStatModifierClass = (value: number) => {
    if (value > 0) return 'stat-up';
    if (value < 0) return 'stat-down';
    return '';
  };

  const formatStatModifier = (value: number) => {
    if (value === 0) return '';
    return value > 0 ? `+${value}` : `${value}`;
  };

  return (
    <div 
      className={`spirit-card ${isPlayer ? 'player' : 'enemy'} ${isActive ? 'active' : ''} ${isDead ? 'dead' : ''}`}
      onClick={onClick}
    >
      {/* 頭像區域 */}
      <div className="spirit-avatar">
        <div className="avatar-frame">
          <div className="avatar-placeholder">
            {spirit.name.charAt(0)}
          </div>
        </div>
        {spirit.soulbuff && spirit.soulbuffActive && (
          <div className="soulbuff-badge" title={spirit.soulbuff.desc}>
            魂
          </div>
        )}
      </div>

      {/* 信息區域 */}
      <div className="spirit-info">
        <div className="spirit-name">{spirit.name}</div>
        
        {/* HP 條 */}
        <div className="hp-container">
          <div className={getHpBarClass()} style={{ width: `${hpPercent}%` }} />
          <span className="hp-text">
            {spirit.hp.current}/{spirit.hp.max}
          </span>
        </div>

        {/* PP 條 */}
        <div className="pp-container">
          <div className="pp-bar" style={{ width: `${ppPercent}%` }} />
          <span className="pp-text">
            {spirit.pp.current}/{spirit.pp.max}
          </span>
        </div>

        {/* 狀態圖標 */}
        <div className="status-icons">
          {/* 異常狀態 */}
          {spirit.statuses.map((status, i) => (
            <span key={i} className={`status-icon status-${status.id}`} title={`${status.name} (${status.turns}回合)`}>
              {status.name.charAt(0)}
            </span>
          ))}
          
          {/* 屬性修改 */}
          {Object.entries(spirit.stages).map(([stat, value]) => {
            if (value === 0) return null;
            return (
              <span key={stat} className={`stat-modifier ${getStatModifierClass(value)}`}>
                {stat.charAt(0).toUpperCase()}{formatStatModifier(value)}
              </span>
            );
          })}
        </div>

        {/* 詳細信息 */}
        {showDetails && (
          <div className="spirit-details">
            <div className="stat-row">
              <span>攻擊: {SpiritStateHelper.calcStat(spirit, 'attack')}</span>
              <span>防禦: {SpiritStateHelper.calcStat(spirit, 'defense')}</span>
            </div>
            <div className="stat-row">
              <span>特攻: {SpiritStateHelper.calcStat(spirit, 'spAttack')}</span>
              <span>特防: {SpiritStateHelper.calcStat(spirit, 'spDefense')}</span>
            </div>
            <div className="stat-row">
              <span>速度: {SpiritStateHelper.calcStat(spirit, 'speed')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



