'use client';

import React from 'react';
import { Target, AlertTriangle } from 'lucide-react';

interface ConsistencyMeterProps {
  consistency: number; // 0 ~ 1
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showValue?: boolean;
  className?: string;
}

export default function ConsistencyMeter({
  consistency,
  size = 'md',
  showLabel = true,
  showValue = true,
  className = '',
}: ConsistencyMeterProps) {
  // 일관성 레벨 계산
  const getLevel = (value: number) => {
    if (value >= 0.85) return { label: '매우 안정적', color: '#4ade80', tier: 'S' };
    if (value >= 0.7) return { label: '안정적', color: '#FBBF24', tier: 'A' };
    if (value >= 0.55) return { label: '보통', color: '#F97316', tier: 'B' };
    if (value >= 0.4) return { label: '불안정', color: '#ef4444', tier: 'C' };
    return { label: '매우 불안정', color: '#dc2626', tier: 'D' };
  };

  const level = getLevel(consistency);
  const percentage = Math.round(consistency * 100);

  const sizes = {
    sm: { bar: 'h-1.5', text: 'text-xs', icon: 'w-4 h-4', width: 'w-32' },
    md: { bar: 'h-2', text: 'text-sm', icon: 'w-5 h-5', width: 'w-40' },
    lg: { bar: 'h-3', text: 'text-base', icon: 'w-6 h-6', width: 'w-48' },
  };

  const s = sizes[size];

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Target className={`${s.icon} text-zinc-400`} />
            <span className={`${s.text} text-zinc-400`}>일관성</span>
          </div>
          {showValue && (
            <div className="flex items-center gap-1.5">
              <span
                className={`${s.text} font-bold px-1.5 py-0.5 rounded`}
                style={{
                  color: level.color,
                  backgroundColor: `${level.color}20`,
                }}
              >
                {level.tier}
              </span>
              <span className={`${s.text} text-zinc-300`}>
                {percentage}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* 프로그레스 바 */}
      <div className={`${s.width} ${s.bar} bg-zinc-800 rounded-full overflow-hidden`}>
        <div
          className={`${s.bar} rounded-full transition-all duration-500 ease-out`}
          style={{
            width: `${percentage}%`,
            backgroundColor: level.color,
          }}
        />
      </div>

      {showLabel && (
        <p className="text-xs text-zinc-500 mt-1">{level.label}</p>
      )}
    </div>
  );
}

// 원형 일관성 미터
interface CircularConsistencyProps {
  consistency: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  className?: string;
}

export function CircularConsistency({
  consistency,
  size = 80,
  strokeWidth = 8,
  showPercentage = true,
  className = '',
}: CircularConsistencyProps) {
  const getLevel = (value: number) => {
    if (value >= 0.85) return { color: '#4ade80', tier: 'S' };
    if (value >= 0.7) return { color: '#FBBF24', tier: 'A' };
    if (value >= 0.55) return { color: '#F97316', tier: 'B' };
    if (value >= 0.4) return { color: '#ef4444', tier: 'C' };
    return { color: '#dc2626', tier: 'D' };
  };

  const level = getLevel(consistency);
  const percentage = Math.round(consistency * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (consistency * circumference);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth={strokeWidth}
        />
        {/* 진행 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={level.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-xl font-bold"
            style={{ color: level.color }}
          >
            {level.tier}
          </span>
          <span className="text-xs text-zinc-400">{percentage}%</span>
        </div>
      )}
    </div>
  );
}

// 일관성 비교 (여러 선수)
interface ConsistencyCompareProps {
  players: Array<{
    name: string;
    consistency: number;
  }>;
  className?: string;
}

export function ConsistencyCompare({
  players,
  className = '',
}: ConsistencyCompareProps) {
  const sortedPlayers = [...players].sort((a, b) => b.consistency - a.consistency);

  const getLevel = (value: number) => {
    if (value >= 0.85) return '#4ade80';
    if (value >= 0.7) return '#FBBF24';
    if (value >= 0.55) return '#F97316';
    if (value >= 0.4) return '#ef4444';
    return '#dc2626';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {sortedPlayers.map((player, index) => {
        const color = getLevel(player.consistency);
        const percentage = Math.round(player.consistency * 100);

        return (
          <div key={player.name} className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 w-4">{index + 1}</span>
            <span className="text-sm text-white w-20 truncate">{player.name}</span>
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <span
              className="text-sm font-medium w-10 text-right"
              style={{ color }}
            >
              {percentage}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// 일관성 등급 설명
interface ConsistencyLegendProps {
  className?: string;
}

export function ConsistencyLegend({ className = '' }: ConsistencyLegendProps) {
  const levels = [
    { tier: 'S', range: '85%+', label: '매우 안정적', color: '#4ade80', desc: '꾸준한 고득점 기대' },
    { tier: 'A', range: '70-84%', label: '안정적', color: '#FBBF24', desc: '대체로 예상 수준' },
    { tier: 'B', range: '55-69%', label: '보통', color: '#F97316', desc: '변동성 있음' },
    { tier: 'C', range: '40-54%', label: '불안정', color: '#ef4444', desc: '기복이 심함' },
    { tier: 'D', range: '~39%', label: '매우 불안정', color: '#dc2626', desc: '예측 어려움' },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-xs text-zinc-500 mb-3">일관성 등급 기준</p>
      {levels.map((level) => (
        <div key={level.tier} className="flex items-center gap-2 text-xs">
          <span
            className="w-6 h-6 rounded flex items-center justify-center font-bold"
            style={{
              color: level.color,
              backgroundColor: `${level.color}20`,
            }}
          >
            {level.tier}
          </span>
          <span className="text-zinc-400 w-14">{level.range}</span>
          <span className="text-zinc-300 flex-1">{level.desc}</span>
        </div>
      ))}
    </div>
  );
}
