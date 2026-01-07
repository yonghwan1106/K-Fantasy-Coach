'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

// 기본 스켈레톤 요소
export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer rounded bg-zinc-800/50 ${className}`}
      style={style}
    />
  );
}

// 카드형 스켈레톤
export function SkeletonCard() {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="w-16 h-8 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        <Skeleton className="h-10 rounded" />
        <Skeleton className="h-10 rounded" />
        <Skeleton className="h-10 rounded" />
      </div>
    </div>
  );
}

// 선수 카드 스켈레톤
export function SkeletonPlayerCard() {
  return (
    <div className="player-card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
        <Skeleton className="w-14 h-10 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center py-2">
            <Skeleton className="h-3 w-10 mx-auto mb-1" />
            <Skeleton className="h-4 w-8 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 차트 스켈레톤
export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div className="glass-card p-4">
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-3 w-6" />
        ))}
      </div>
    </div>
  );
}

// 테이블 스켈레톤
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card overflow-hidden">
      {/* 헤더 */}
      <div className="flex gap-4 p-4 border-b border-zinc-800 bg-zinc-900/50">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      {/* 행 */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 border-b border-zinc-800/50 last:border-0"
        >
          <Skeleton className="h-4 w-8" />
          <div className="flex items-center gap-2 flex-1">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

// 통계 카드 스켈레톤
export function SkeletonStatCard() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

// 포메이션 스켈레톤
export function SkeletonFormation() {
  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded" />
          <Skeleton className="h-8 w-16 rounded" />
          <Skeleton className="h-8 w-16 rounded" />
        </div>
      </div>
      <div className="relative bg-gradient-to-b from-green-900/30 to-green-800/20 rounded-xl p-8 min-h-[400px]">
        {/* GK */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <Skeleton className="w-16 h-16 rounded-full" />
        </div>
        {/* 수비 */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-14 h-14 rounded-full" />
          ))}
        </div>
        {/* 미드필더 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-12">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-14 h-14 rounded-full" />
          ))}
        </div>
        {/* 공격 */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-16">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-14 h-14 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// 리스트 아이템 스켈레톤
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-zinc-900/50">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-12 rounded" />
    </div>
  );
}

// 전체 페이지 로딩
export function SkeletonPage() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* 차트와 테이블 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart height={250} />
        <SkeletonTable rows={4} />
      </div>
    </div>
  );
}

export default {
  Skeleton,
  SkeletonCard,
  SkeletonPlayerCard,
  SkeletonChart,
  SkeletonTable,
  SkeletonStatCard,
  SkeletonFormation,
  SkeletonListItem,
  SkeletonPage,
};
