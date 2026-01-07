'use client';

import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Ban,
  Globe,
  HelpCircle
} from 'lucide-react';
import {
  AvailabilityStatus,
  PlayerAvailability,
  getAvailabilityLabel,
  getAvailabilityColor
} from '@/types';

interface AvailabilityBadgeProps {
  availability?: PlayerAvailability;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showIcon?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const statusIcons: Record<AvailabilityStatus, typeof CheckCircle> = {
  available: CheckCircle,
  doubtful: AlertCircle,
  injured: XCircle,
  suspended: Ban,
  international: Globe,
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export default function AvailabilityBadge({
  availability,
  size = 'md',
  showLabel = true,
  showIcon = true,
  showTooltip = true,
  className = '',
}: AvailabilityBadgeProps) {
  if (!availability) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${className}`}
        style={{
          backgroundColor: 'rgba(74, 222, 128, 0.15)',
          color: '#4ade80',
          border: '1px solid rgba(74, 222, 128, 0.3)',
        }}
      >
        {showIcon && <CheckCircle className={iconSizes[size]} />}
        {showLabel && '출전가능'}
      </span>
    );
  }

  const status = availability.status;
  const color = getAvailabilityColor(status);
  const label = getAvailabilityLabel(status);
  const Icon = statusIcons[status];

  const tooltipContent = availability.reason
    ? `${availability.reason}${availability.expectedReturn ? ` (복귀 예정: ${availability.expectedReturn})` : ''}`
    : undefined;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
      title={showTooltip && tooltipContent ? tooltipContent : undefined}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {showLabel && label}
    </span>
  );
}

// 아이콘만 표시하는 간단한 버전
interface AvailabilityIconProps {
  availability?: PlayerAvailability;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvailabilityIcon({
  availability,
  size = 'md',
  className = '',
}: AvailabilityIconProps) {
  const status = availability?.status || 'available';
  const color = getAvailabilityColor(status);
  const Icon = statusIcons[status];

  return (
    <Icon
      className={`${iconSizes[size]} ${className}`}
      style={{ color }}
    />
  );
}

// 상세 출전 정보 카드
interface AvailabilityDetailProps {
  availability?: PlayerAvailability;
  playerName?: string;
  className?: string;
}

export function AvailabilityDetail({
  availability,
  playerName,
  className = '',
}: AvailabilityDetailProps) {
  if (!availability || availability.status === 'available') {
    return (
      <div className={`p-3 rounded-lg bg-green-500/10 border border-green-500/20 ${className}`}>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-sm font-medium text-green-400">출전 가능</span>
        </div>
        {playerName && (
          <p className="text-xs text-zinc-400 mt-1">
            {playerName} 선수는 출전에 문제가 없습니다.
          </p>
        )}
      </div>
    );
  }

  const status = availability.status;
  const color = getAvailabilityColor(status);
  const Icon = statusIcons[status];

  const statusMessages = {
    doubtful: '출전이 불투명합니다. 경기 전 상태를 확인하세요.',
    injured: '부상으로 출전이 어렵습니다.',
    suspended: '징계로 출전이 불가합니다.',
    international: '국가대표팀 소집으로 부재중입니다.',
  };

  return (
    <div
      className={`p-4 rounded-lg ${className}`}
      style={{
        backgroundColor: `${color}10`,
        border: `1px solid ${color}30`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5" style={{ color }} />
        <span className="font-medium" style={{ color }}>
          {getAvailabilityLabel(status)}
        </span>
      </div>

      {availability.reason && (
        <p className="text-sm text-zinc-300 mb-2">{availability.reason}</p>
      )}

      <p className="text-xs text-zinc-400">{statusMessages[status]}</p>

      {availability.expectedReturn && (
        <div className="mt-3 pt-3 border-t border-zinc-700">
          <p className="text-xs text-zinc-500">
            복귀 예정: <span className="text-zinc-300">{availability.expectedReturn}</span>
          </p>
        </div>
      )}

      {availability.lastUpdated && (
        <p className="text-xs text-zinc-600 mt-2">
          최종 업데이트: {availability.lastUpdated}
        </p>
      )}
    </div>
  );
}

// 출전상태별 선수 수 표시
interface AvailabilityCountsProps {
  counts: Record<AvailabilityStatus, number>;
  className?: string;
}

export function AvailabilityCounts({
  counts,
  className = '',
}: AvailabilityCountsProps) {
  const statuses: AvailabilityStatus[] = ['available', 'doubtful', 'injured', 'suspended', 'international'];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {statuses.map((status) => {
        const count = counts[status] || 0;
        if (count === 0) return null;

        const color = getAvailabilityColor(status);
        const Icon = statusIcons[status];

        return (
          <div
            key={status}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
            style={{
              backgroundColor: `${color}15`,
              color,
            }}
          >
            <Icon className="w-3 h-3" />
            <span>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// 선수 선택시 경고 알림
interface AvailabilityWarningProps {
  availability?: PlayerAvailability;
  playerName: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function AvailabilityWarning({
  availability,
  playerName,
  onConfirm,
  onCancel,
}: AvailabilityWarningProps) {
  if (!availability || availability.status === 'available') return null;

  const color = getAvailabilityColor(availability.status);
  const Icon = statusIcons[availability.status];

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="glass-card p-6 max-w-md w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <div>
            <h3 className="font-bold text-white">출전 상태 확인</h3>
            <p className="text-sm text-zinc-400">{playerName}</p>
          </div>
        </div>

        <p className="text-zinc-300 mb-4">
          {availability.reason || '이 선수는 현재 출전이 불확실합니다.'}
        </p>

        {availability.expectedReturn && (
          <p className="text-sm text-zinc-400 mb-4">
            복귀 예정: <span className="text-white">{availability.expectedReturn}</span>
          </p>
        )}

        <p className="text-sm text-yellow-400 mb-6">
          그래도 선택하시겠습니까?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg text-black font-medium transition-colors"
            style={{ backgroundColor: color }}
          >
            선택
          </button>
        </div>
      </div>
    </div>
  );
}
