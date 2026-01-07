'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Star, Sparkles } from 'lucide-react';
import { getPriceLevel, getValueLevel } from '@/types';

interface ValueRatingBadgeProps {
  price: number;
  predictedScore: number;
  priceChange?: number;
  showPrice?: boolean;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ValueRatingBadge({
  price,
  predictedScore,
  priceChange,
  showPrice = true,
  showValue = true,
  size = 'md',
  className = '',
}: ValueRatingBadgeProps) {
  const valueRating = price > 0 ? predictedScore / price : 0;
  const priceLevel = getPriceLevel(price);
  const valueLevel = getValueLevel(valueRating);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const getPriceColorClass = () => {
    switch (priceLevel) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
    }
  };

  const getValueColorClass = () => {
    switch (valueLevel) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
    }
  };

  const getValueStars = () => {
    if (valueRating >= 3.5) return 5;
    if (valueRating >= 3) return 4;
    if (valueRating >= 2.5) return 3;
    if (valueRating >= 2) return 2;
    return 1;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 가격 표시 */}
      {showPrice && (
        <div className={`flex items-center gap-1 bg-zinc-800/80 rounded-lg ${sizeClasses[size]}`}>
          <span className={`font-bold ${getPriceColorClass()}`}>
            {price.toFixed(1)}M
          </span>
          {priceChange !== undefined && priceChange !== 0 && (
            <span className={`flex items-center ${priceChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {priceChange > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="text-[10px]">
                {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}
              </span>
            </span>
          )}
        </div>
      )}

      {/* 가성비 표시 */}
      {showValue && (
        <div className={`flex items-center gap-1 bg-zinc-800/80 rounded-lg ${sizeClasses[size]}`}>
          <Sparkles className={`w-3 h-3 ${getValueColorClass()}`} />
          <span className={`font-medium ${getValueColorClass()}`}>
            {valueRating.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

// 가성비 별점 컴포넌트
interface ValueStarsProps {
  valueRating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  className?: string;
}

export function ValueStars({
  valueRating,
  size = 'md',
  showNumber = false,
  className = '',
}: ValueStarsProps) {
  const starCount = Math.min(5, Math.max(1, Math.round(valueRating)));
  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${iconSize[size]} ${
            i < starCount ? 'text-gold-400 fill-gold-400' : 'text-zinc-600'
          }`}
        />
      ))}
      {showNumber && (
        <span className="text-zinc-400 text-sm ml-1">
          ({valueRating.toFixed(1)})
        </span>
      )}
    </div>
  );
}

// 가격 태그 컴포넌트
interface PriceTagProps {
  price: number;
  priceChange?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriceTag({
  price,
  priceChange,
  size = 'md',
  className = '',
}: PriceTagProps) {
  const priceLevel = getPriceLevel(price);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const bgClasses = {
    high: 'bg-red-500/20 border-red-500/30',
    medium: 'bg-yellow-500/20 border-yellow-500/30',
    low: 'bg-green-500/20 border-green-500/30',
  };

  const textClasses = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-green-400',
  };

  return (
    <div
      className={`
        inline-flex items-center gap-1 rounded-full border
        ${bgClasses[priceLevel]} ${sizeClasses[size]} ${className}
      `}
    >
      <span className={`font-bold ${textClasses[priceLevel]}`}>
        {price.toFixed(1)}M
      </span>
      {priceChange !== undefined && priceChange !== 0 && (
        <span className={`text-[10px] ${priceChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
          {priceChange > 0 ? '↑' : '↓'}{Math.abs(priceChange).toFixed(1)}
        </span>
      )}
    </div>
  );
}

// 가치 분석 카드 컴포넌트
interface ValueAnalysisCardProps {
  price: number;
  predictedScore: number;
  recentAvg: number;
  className?: string;
}

export function ValueAnalysisCard({
  price,
  predictedScore,
  recentAvg,
  className = '',
}: ValueAnalysisCardProps) {
  const valueRating = price > 0 ? predictedScore / price : 0;
  const valueLevel = getValueLevel(valueRating);
  const potentialROI = ((predictedScore - price) / price * 100);

  return (
    <div className={`bg-zinc-800/50 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-medium text-zinc-400 mb-3">가치 분석</h4>

      <div className="space-y-3">
        {/* 가격 */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-400 text-sm">가격</span>
          <PriceTag price={price} size="sm" />
        </div>

        {/* 예상 점수 */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-400 text-sm">예상 점수</span>
          <span className="text-gold-400 font-bold">{predictedScore.toFixed(1)}</span>
        </div>

        {/* 가성비 */}
        <div className="flex justify-between items-center">
          <span className="text-zinc-400 text-sm">가성비</span>
          <div className="flex items-center gap-2">
            <ValueStars valueRating={valueRating} size="sm" />
            <span className={`font-bold ${
              valueLevel === 'excellent' ? 'text-green-400' :
              valueLevel === 'good' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {valueRating.toFixed(2)}
            </span>
          </div>
        </div>

        {/* ROI */}
        <div className="flex justify-between items-center pt-2 border-t border-zinc-700">
          <span className="text-zinc-400 text-sm">예상 ROI</span>
          <span className={`font-bold ${potentialROI >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {potentialROI >= 0 ? '+' : ''}{potentialROI.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
