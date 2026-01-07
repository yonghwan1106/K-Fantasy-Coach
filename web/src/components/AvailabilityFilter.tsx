'use client';

import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Ban,
  Globe,
  Filter
} from 'lucide-react';
import {
  AvailabilityStatus,
  getAvailabilityLabel,
  getAvailabilityColor
} from '@/types';

interface AvailabilityFilterProps {
  selectedStatuses: AvailabilityStatus[];
  onChange: (statuses: AvailabilityStatus[]) => void;
  counts?: Partial<Record<AvailabilityStatus, number>>;
  showAll?: boolean;
  className?: string;
}

const statusConfig: Array<{
  status: AvailabilityStatus;
  icon: typeof CheckCircle;
}> = [
  { status: 'available', icon: CheckCircle },
  { status: 'doubtful', icon: AlertCircle },
  { status: 'injured', icon: XCircle },
  { status: 'suspended', icon: Ban },
  { status: 'international', icon: Globe },
];

export default function AvailabilityFilter({
  selectedStatuses,
  onChange,
  counts,
  showAll = true,
  className = '',
}: AvailabilityFilterProps) {
  const allStatuses: AvailabilityStatus[] = ['available', 'doubtful', 'injured', 'suspended', 'international'];
  const isAllSelected = selectedStatuses.length === allStatuses.length;

  const toggleStatus = (status: AvailabilityStatus) => {
    if (selectedStatuses.includes(status)) {
      onChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onChange([...selectedStatuses, status]);
    }
  };

  const toggleAll = () => {
    if (isAllSelected) {
      onChange(['available']); // 최소 하나는 선택되도록
    } else {
      onChange(allStatuses);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {showAll && (
        <button
          onClick={toggleAll}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            isAllSelected
              ? 'bg-zinc-700 text-white'
              : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          전체
        </button>
      )}

      {statusConfig.map(({ status, icon: Icon }) => {
        const isSelected = selectedStatuses.includes(status);
        const color = getAvailabilityColor(status);
        const label = getAvailabilityLabel(status);
        const count = counts?.[status];

        return (
          <button
            key={status}
            onClick={() => toggleStatus(status)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isSelected ? '' : 'opacity-50 hover:opacity-80'
            }`}
            style={{
              backgroundColor: isSelected ? `${color}20` : 'transparent',
              color: isSelected ? color : '#a1a1aa',
              border: isSelected ? `1px solid ${color}40` : '1px solid transparent',
            }}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {count !== undefined && (
              <span
                className="px-1.5 py-0.5 rounded text-xs font-bold"
                style={{
                  backgroundColor: isSelected ? `${color}30` : 'rgba(255,255,255,0.1)',
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// 간단한 버전 (드롭다운 스타일)
interface AvailabilityDropdownProps {
  value: AvailabilityStatus | 'all';
  onChange: (value: AvailabilityStatus | 'all') => void;
  counts?: Partial<Record<AvailabilityStatus, number>>;
  className?: string;
}

export function AvailabilityDropdown({
  value,
  onChange,
  counts,
  className = '',
}: AvailabilityDropdownProps) {
  const options = [
    { value: 'all' as const, label: '전체', icon: Filter },
    ...statusConfig.map(({ status, icon }) => ({
      value: status,
      label: getAvailabilityLabel(status),
      icon,
    })),
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as AvailabilityStatus | 'all')}
      className={`bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500 ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
          {option.value !== 'all' && counts?.[option.value as AvailabilityStatus] !== undefined
            ? ` (${counts[option.value as AvailabilityStatus]})`
            : ''}
        </option>
      ))}
    </select>
  );
}

// 출전 가능 선수만 필터 토글
interface AvailableOnlyToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  unavailableCount?: number;
  className?: string;
}

export function AvailableOnlyToggle({
  value,
  onChange,
  unavailableCount,
  className = '',
}: AvailableOnlyToggleProps) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        value
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50'
      } ${className}`}
    >
      <CheckCircle className="w-4 h-4" />
      <span>출전가능만</span>
      {!value && unavailableCount !== undefined && unavailableCount > 0 && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">
          {unavailableCount} 제외됨
        </span>
      )}
    </button>
  );
}

// 상태별 퀵 필터 버튼들
interface QuickStatusFiltersProps {
  onFilter: (status: AvailabilityStatus) => void;
  counts?: Partial<Record<AvailabilityStatus, number>>;
  activeStatus?: AvailabilityStatus | null;
  className?: string;
}

export function QuickStatusFilters({
  onFilter,
  counts,
  activeStatus,
  className = '',
}: QuickStatusFiltersProps) {
  // 출전불가 상태들만 표시 (문제가 있는 선수 빠르게 찾기용)
  const problemStatuses: AvailabilityStatus[] = ['doubtful', 'injured', 'suspended', 'international'];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <p className="text-xs text-zinc-500 w-full mb-1">빠른 필터:</p>
      {problemStatuses.map((status) => {
        const count = counts?.[status] || 0;
        if (count === 0) return null;

        const color = getAvailabilityColor(status);
        const label = getAvailabilityLabel(status);
        const isActive = activeStatus === status;

        return (
          <button
            key={status}
            onClick={() => onFilter(status)}
            className={`px-2 py-1 rounded text-xs transition-all ${
              isActive ? 'ring-2' : 'hover:opacity-100'
            }`}
            style={{
              backgroundColor: `${color}15`,
              color,
              opacity: isActive ? 1 : 0.7,
              borderColor: isActive ? color : 'transparent',
            }}
          >
            {label} ({count})
          </button>
        );
      })}
    </div>
  );
}
