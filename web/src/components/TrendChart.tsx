'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Home, Plane } from 'lucide-react';
import { GameHistory, PlayerHistory } from '@/types';

interface TrendChartProps {
  history: GameHistory[];
  seasonAvg?: number;
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
  gradientFill?: boolean;
  className?: string;
}

export default function TrendChart({
  history,
  seasonAvg,
  height = 200,
  showGrid = true,
  showDots = true,
  gradientFill = true,
  className = '',
}: TrendChartProps) {
  // 라운드 순으로 정렬 (오름차순)
  const sortedHistory = [...history].sort((a, b) => a.round - b.round);

  const data = sortedHistory.map((game) => ({
    round: `R${game.round}`,
    score: game.score,
    opponent: game.opponent,
    home: game.home,
    goals: game.goals,
    assists: game.assists,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-3 text-sm">
          <p className="font-bold text-white mb-1">{data.round}</p>
          <p className="text-gold-400 font-semibold">{data.score.toFixed(1)}점</p>
          <div className="flex items-center gap-1 text-zinc-400 mt-1">
            {data.home ? (
              <Home className="w-3 h-3 text-green-400" />
            ) : (
              <Plane className="w-3 h-3 text-zinc-500" />
            )}
            <span>vs {data.opponent}</span>
          </div>
          {(data.goals > 0 || data.assists > 0) && (
            <p className="text-xs text-zinc-500 mt-1">
              {data.goals > 0 && `${data.goals}G `}
              {data.assists > 0 && `${data.assists}A`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        {gradientFill ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FBBF24" stopOpacity={0} />
              </linearGradient>
            </defs>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            )}
            <XAxis
              dataKey="round"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 12 }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            {seasonAvg && (
              <ReferenceLine
                y={seasonAvg}
                stroke="#71717a"
                strokeDasharray="5 5"
                label={{
                  value: `시즌 평균 ${seasonAvg.toFixed(1)}`,
                  position: 'right',
                  fill: '#71717a',
                  fontSize: 10,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="score"
              stroke="#FBBF24"
              strokeWidth={2}
              fill="url(#scoreGradient)"
              dot={showDots ? { fill: '#FBBF24', r: 4, strokeWidth: 0 } : false}
              activeDot={{ fill: '#F97316', r: 6, strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            )}
            <XAxis
              dataKey="round"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 12 }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            {seasonAvg && (
              <ReferenceLine
                y={seasonAvg}
                stroke="#71717a"
                strokeDasharray="5 5"
              />
            )}
            <Line
              type="monotone"
              dataKey="score"
              stroke="#FBBF24"
              strokeWidth={2}
              dot={showDots ? { fill: '#FBBF24', r: 4, strokeWidth: 0 } : false}
              activeDot={{ fill: '#F97316', r: 6, strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// 트렌드 인디케이터
interface TrendIndicatorProps {
  trend: 'rising' | 'falling' | 'stable';
  avgLast5?: number;
  avgLast10?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TrendIndicator({
  trend,
  avgLast5,
  avgLast10,
  size = 'md',
  className = '',
}: TrendIndicatorProps) {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const trendConfig = {
    rising: {
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      label: '상승세',
    },
    falling: {
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      label: '하락세',
    },
    stable: {
      icon: Minus,
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-500/10',
      label: '유지',
    },
  };

  const config = trendConfig[trend];
  const Icon = config.icon;

  const change = avgLast5 && avgLast10 ? avgLast5 - avgLast10 : null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`p-2 rounded-lg ${config.bgColor}`}>
        <Icon className={`${iconSizes[size]} ${config.color}`} />
      </div>
      <div>
        <p className={`${textSizes[size]} ${config.color} font-medium`}>
          {config.label}
        </p>
        {change !== null && (
          <p className="text-xs text-zinc-500">
            최근 5경기 {change >= 0 ? '+' : ''}{change.toFixed(1)}점
          </p>
        )}
      </div>
    </div>
  );
}

// 미니 스파크라인 차트
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = '#FBBF24',
  className = '',
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// 시즌 베스트/워스트 하이라이트
interface SeasonHighlightProps {
  best: { round: number; score: number; opponent?: string };
  worst: { round: number; score: number; opponent?: string };
  className?: string;
}

export function SeasonHighlight({
  best,
  worst,
  className = '',
}: SeasonHighlightProps) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400">시즌 베스트</span>
        </div>
        <p className="text-xl font-bold text-white">{best.score.toFixed(1)}</p>
        <p className="text-xs text-zinc-500">
          R{best.round} {best.opponent && `vs ${best.opponent}`}
        </p>
      </div>
      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-400">시즌 워스트</span>
        </div>
        <p className="text-xl font-bold text-white">{worst.score.toFixed(1)}</p>
        <p className="text-xs text-zinc-500">
          R{worst.round} {worst.opponent && `vs ${worst.opponent}`}
        </p>
      </div>
    </div>
  );
}
