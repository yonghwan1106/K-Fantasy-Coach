'use client';

import React from 'react';
import { Wallet, AlertTriangle, CheckCircle } from 'lucide-react';

interface BudgetMeterProps {
  totalBudget: number;
  spentAmount: number;
  className?: string;
  showDetails?: boolean;
}

export default function BudgetMeter({
  totalBudget,
  spentAmount,
  className = '',
  showDetails = true,
}: BudgetMeterProps) {
  const remainingBudget = totalBudget - spentAmount;
  const usagePercent = Math.min((spentAmount / totalBudget) * 100, 100);
  const isOverBudget = spentAmount > totalBudget;
  const isWarning = usagePercent >= 80 && !isOverBudget;

  const getStatusColor = () => {
    if (isOverBudget) return 'from-red-500 to-red-600';
    if (isWarning) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-500';
  };

  const getStatusBgColor = () => {
    if (isOverBudget) return 'bg-red-500/10';
    if (isWarning) return 'bg-yellow-500/10';
    return 'bg-green-500/10';
  };

  const getStatusIcon = () => {
    if (isOverBudget) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (isWarning) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className={`glass-card p-4 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${getStatusBgColor()}`}>
            <Wallet className="w-5 h-5 text-gold-400" />
          </div>
          <span className="font-medium text-white">예산 현황</span>
        </div>
        {getStatusIcon()}
      </div>

      {/* 진행 바 */}
      <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div
          className={`absolute left-0 top-0 h-full bg-gradient-to-r ${getStatusColor()} transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(usagePercent, 100)}%` }}
        />
        {/* 100% 마커 */}
        <div className="absolute right-0 top-0 h-full w-0.5 bg-zinc-600" />
      </div>

      {/* 상세 정보 */}
      {showDetails && (
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
            <p className="text-zinc-400 text-xs mb-1">총 예산</p>
            <p className="text-white font-bold">{totalBudget}M</p>
          </div>
          <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
            <p className="text-zinc-400 text-xs mb-1">사용</p>
            <p className={`font-bold ${isOverBudget ? 'text-red-500' : 'text-gold-400'}`}>
              {spentAmount.toFixed(1)}M
            </p>
          </div>
          <div className="text-center p-2 bg-zinc-800/50 rounded-lg">
            <p className="text-zinc-400 text-xs mb-1">잔여</p>
            <p className={`font-bold ${isOverBudget ? 'text-red-500' : 'text-green-500'}`}>
              {remainingBudget.toFixed(1)}M
            </p>
          </div>
        </div>
      )}

      {/* 경고 메시지 */}
      {isOverBudget && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>예산 초과! {(spentAmount - totalBudget).toFixed(1)}M 초과됨</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 미니 버전 (인라인 사용)
export function BudgetMeterMini({
  totalBudget,
  spentAmount,
  className = '',
}: Omit<BudgetMeterProps, 'showDetails'>) {
  const remainingBudget = totalBudget - spentAmount;
  const usagePercent = Math.min((spentAmount / totalBudget) * 100, 100);
  const isOverBudget = spentAmount > totalBudget;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isOverBudget ? 'bg-red-500' : 'bg-gradient-to-r from-gold-500 to-orange-500'
          }`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>
      <span className={`text-sm font-medium min-w-[60px] text-right ${
        isOverBudget ? 'text-red-500' : 'text-zinc-400'
      }`}>
        {remainingBudget.toFixed(1)}M
      </span>
    </div>
  );
}

// 예산 선택 버튼 컴포넌트
interface BudgetSelectorProps {
  value: number;
  onChange: (budget: number) => void;
  options?: number[];
  className?: string;
}

export function BudgetSelector({
  value,
  onChange,
  options = [80, 100, 120],
  className = '',
}: BudgetSelectorProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {options.map((budget) => (
        <button
          key={budget}
          onClick={() => onChange(budget)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            value === budget
              ? 'bg-gradient-to-r from-gold-500 to-orange-500 text-black'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          {budget}M
        </button>
      ))}
    </div>
  );
}
