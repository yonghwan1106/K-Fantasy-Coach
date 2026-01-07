'use client';

import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Swords } from 'lucide-react';
import { DifficultyLevel, getDifficultyColor, getDifficultyLabel } from '@/types';

interface DifficultyBadgeProps {
  level: DifficultyLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
}

export default function DifficultyBadge({
  level,
  size = 'md',
  showLabel = true,
  showIcon = true,
  className = '',
}: DifficultyBadgeProps) {
  const color = getDifficultyColor(level);
  const label = getDifficultyLabel(level);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const getIcon = () => {
    if (level <= 2) return <ShieldCheck className={iconSize[size]} />;
    if (level <= 3) return <Shield className={iconSize[size]} />;
    return <ShieldAlert className={iconSize[size]} />;
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {showIcon && getIcon()}
      {showLabel && label}
    </span>
  );
}

// 별 기반 난이도 표시
interface DifficultyStarsProps {
  level: DifficultyLevel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DifficultyStars({
  level,
  size = 'md',
  className = '',
}: DifficultyStarsProps) {
  const color = getDifficultyColor(level);

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Swords
          key={i}
          className={iconSize[size]}
          style={{
            color: i < level ? color : '#3f3f46',
            opacity: i < level ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

// 수비력 기준 난이도 계산
export function calculateDifficulty(defenseRating: number): DifficultyLevel {
  if (defenseRating >= 4.2) return 5;
  if (defenseRating >= 3.8) return 4;
  if (defenseRating >= 3.3) return 3;
  if (defenseRating >= 2.8) return 2;
  return 1;
}

// 공격력 기준 위험도 계산 (상대팀 공격력 = 우리 수비에 위험)
export function calculateThreat(attackRating: number): DifficultyLevel {
  if (attackRating >= 4.3) return 5;
  if (attackRating >= 3.8) return 4;
  if (attackRating >= 3.3) return 3;
  if (attackRating >= 2.8) return 2;
  return 1;
}

// 매치업 총합 난이도
export function calculateMatchupDifficulty(
  opponentDefenseRating: number,
  opponentAttackRating: number,
  isHome: boolean
): DifficultyLevel {
  const defenseDifficulty = calculateDifficulty(opponentDefenseRating);
  const threatLevel = calculateThreat(opponentAttackRating);

  // 홈 경기 시 난이도 1단계 감소
  const homeBonus = isHome ? -0.5 : 0;

  const avgDifficulty = (defenseDifficulty + threatLevel) / 2 + homeBonus;

  if (avgDifficulty >= 4.5) return 5;
  if (avgDifficulty >= 3.5) return 4;
  if (avgDifficulty >= 2.5) return 3;
  if (avgDifficulty >= 1.5) return 2;
  return 1;
}
