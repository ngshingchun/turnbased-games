/**
 * 技能按鈕組件
 */

import React, { useState } from 'react';
import { Skill } from '../core';
import './SkillButton.css';

interface SkillButtonProps {
  skill: Skill;
  index: number;
  disabled?: boolean;
  isUltimate?: boolean;
  onClick: () => void;
}

export const SkillButton: React.FC<SkillButtonProps> = ({
  skill,
  index,
  disabled = false,
  isUltimate = false,
  onClick,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getSkillIcon = () => {
    switch (skill.type) {
      case 'attack': return '⚔️';
      case 'buff': return '✨';
      case 'debuff': return '💀';
      case 'ultimate': return '👑';
      default: return '🔮';
    }
  };

  const getCategoryColor = () => {
    switch (skill.category) {
      case 'physical': return '#e74c3c';
      case 'special': return '#9b59b6';
      case 'attribute': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const ppPercent = skill.maxPp > 0 ? (skill.pp / skill.maxPp) * 100 : 0;
  const noPP = skill.pp <= 0;

  return (
    <div className="skill-button-wrapper">
      <button
        className={`skill-button ${isUltimate ? 'ultimate' : ''} ${disabled || noPP ? 'disabled' : ''}`}
        onClick={onClick}
        disabled={disabled || noPP}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ '--category-color': getCategoryColor() } as React.CSSProperties}
      >
        <div className="skill-icon">{getSkillIcon()}</div>
        <div className="skill-info">
          <span className="skill-name">{skill.name}</span>
          <span className="skill-power">
            {skill.power > 0 ? `威力: ${skill.power}` : '屬性技'}
          </span>
          <div className="skill-pp-bar">
            <div className="skill-pp-fill" style={{ width: `${ppPercent}%` }} />
            <span className="skill-pp-text">PP: {skill.pp}/{skill.maxPp}</span>
          </div>
        </div>
        {skill.priority !== 0 && (
          <div className={`skill-priority ${skill.priority > 0 ? 'positive' : 'negative'}`}>
            {skill.priority > 0 ? `+${skill.priority}` : skill.priority}
          </div>
        )}
      </button>
      
      {/* 提示框 */}
      {showTooltip && (
        <div className="skill-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-name">{skill.name}</span>
            <span className="tooltip-type" style={{ backgroundColor: getCategoryColor() }}>
              {skill.category === 'physical' ? '物理' : skill.category === 'special' ? '特殊' : '屬性'}
            </span>
          </div>
          <div className="tooltip-stats">
            <span>威力: {skill.power || '-'}</span>
            <span>命中: {skill.accuracy === 'must_hit' ? '必中' : skill.accuracy}</span>
            <span>先制: {skill.priority}</span>
          </div>
          <div className="tooltip-desc">{skill.desc}</div>
        </div>
      )}
    </div>
  );
};



