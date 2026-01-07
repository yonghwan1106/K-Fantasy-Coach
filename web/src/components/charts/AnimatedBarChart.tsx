'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface DataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: string | number | undefined;
}

interface AnimatedBarChartProps {
  data: DataPoint[];
  dataKey?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  animationDelay?: number;
  animationDuration?: number;
  barColor?: string;
  gradientColors?: { start: string; end: string };
  horizontal?: boolean;
  showLabels?: boolean;
  labelPosition?: 'top' | 'inside' | 'outside';
  className?: string;
}

export default function AnimatedBarChart({
  data,
  dataKey = 'value',
  height = 300,
  showGrid = true,
  showTooltip = true,
  animationDelay = 0,
  animationDuration = 1000,
  barColor,
  gradientColors = { start: '#FBBF24', end: '#F97316' },
  horizontal = false,
  showLabels = false,
  labelPosition = 'top',
  className = '',
}: AnimatedBarChartProps) {
  const [containerRef, isVisible] = useIntersectionObserver<HTMLDivElement>({ threshold: 0.1 });
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setAnimate(true), animationDelay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, animationDelay]);

  const gradientId = `bar-gradient-${Math.random().toString(36).substr(2, 9)}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-sm">
          <p className="font-medium text-zinc-400 mb-1">{label}</p>
          <p className="font-bold text-amber-400">
            {typeof payload[0].value === 'number' ? payload[0].value.toFixed(1) : payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div ref={containerRef} className={`${className} transition-opacity duration-500 ${animate ? 'opacity-100' : 'opacity-0'}`}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 20, right: 20, left: horizontal ? 60 : -10, bottom: 5 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2={horizontal ? '1' : '0'} y2={horizontal ? '0' : '1'}>
              <stop offset="0%" stopColor={gradientColors.start} />
              <stop offset="100%" stopColor={gradientColors.end} />
            </linearGradient>
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />}
          {horizontal ? (
            <>
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A1A1AA', fontSize: 12 }} width={50} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
            </>
          )}
          {showTooltip && <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(251, 191, 36, 0.1)' }} />}
          <Bar
            dataKey={dataKey}
            radius={[4, 4, 4, 4]}
            fill={barColor || `url(#${gradientId})`}
            isAnimationActive={animate}
            animationDuration={animationDuration}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || `url(#${gradientId})`} />
            ))}
            {showLabels && (
              <LabelList
                dataKey={dataKey}
                position={labelPosition}
                fill="#fff"
                fontSize={11}
                formatter={(value) => typeof value === 'number' ? value.toFixed(1) : value}
              />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Horizontal Progress Bar (CSS-based, not Recharts)
interface ProgressBarProps {
  value: number;
  maxValue: number;
  label?: string;
  color?: string;
  showValue?: boolean;
  height?: number;
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  maxValue,
  label,
  color = '#FBBF24',
  showValue = true,
  height = 8,
  animated = true,
  className = '',
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  const [containerRef, isVisible] = useIntersectionObserver<HTMLDivElement>({ threshold: 0.1 });

  useEffect(() => {
    if (isVisible && animated) {
      const timer = setTimeout(() => {
        setWidth((value / maxValue) * 100);
      }, 100);
      return () => clearTimeout(timer);
    } else if (!animated) {
      setWidth((value / maxValue) * 100);
    }
  }, [isVisible, animated, value, maxValue]);

  return (
    <div ref={containerRef} className={className}>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-zinc-400">{label}</span>
          {showValue && <span className="text-white font-medium">{value.toFixed(1)}</span>}
        </div>
      )}
      <div className="w-full bg-zinc-800 rounded-full overflow-hidden" style={{ height }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${width}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

// Stacked Progress Bars
interface StackedProgressProps {
  segments: Array<{ value: number; color: string; label: string }>;
  height?: number;
  showLabels?: boolean;
  className?: string;
}

export function StackedProgress({
  segments,
  height = 12,
  showLabels = true,
  className = '',
}: StackedProgressProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const [widths, setWidths] = useState(segments.map(() => 0));
  const [containerRef, isVisible] = useIntersectionObserver<HTMLDivElement>({ threshold: 0.1 });

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setWidths(segments.map(s => (s.value / total) * 100));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, segments, total]);

  return (
    <div ref={containerRef} className={className}>
      <div className="w-full bg-zinc-800 rounded-full overflow-hidden flex" style={{ height }}>
        {segments.map((segment, idx) => (
          <div
            key={idx}
            className="h-full transition-all duration-1000 ease-out first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${widths[idx]}%`,
              backgroundColor: segment.color,
            }}
          />
        ))}
      </div>
      {showLabels && (
        <div className="flex flex-wrap gap-3 mt-2">
          {segments.map((segment, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-zinc-400">{segment.label}</span>
              <span className="text-white font-medium">{((segment.value / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Mini Bar for inline display
interface MiniBarProps {
  value: number;
  maxValue?: number;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function MiniBar({
  value,
  maxValue = 100,
  width = 60,
  height = 4,
  color = '#FBBF24',
  className = '',
}: MiniBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div className={`bg-zinc-800 rounded-full overflow-hidden ${className}`} style={{ width, height }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${percentage}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

// Rank Bar Chart (sorted horizontal bars)
interface RankBarChartProps {
  data: Array<{ name: string; value: number; rank?: number }>;
  showRank?: boolean;
  maxBars?: number;
  barColor?: string;
  height?: number;
  className?: string;
}

export function RankBarChart({
  data,
  showRank = true,
  maxBars = 5,
  barColor = '#FBBF24',
  height = 200,
  className = '',
}: RankBarChartProps) {
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, maxBars);
  const maxValue = Math.max(...sortedData.map(d => d.value));

  return (
    <div className={`space-y-3 ${className}`}>
      {sortedData.map((item, idx) => (
        <div key={item.name} className="flex items-center gap-3">
          {showRank && (
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              idx === 0 ? 'bg-amber-500 text-black' :
              idx === 1 ? 'bg-zinc-400 text-black' :
              idx === 2 ? 'bg-amber-700 text-white' :
              'bg-zinc-700 text-zinc-400'
            }`}>
              {idx + 1}
            </span>
          )}
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white truncate max-w-[100px]">{item.name}</span>
              <span className="text-amber-400 font-medium">{item.value.toFixed(1)}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: barColor,
                  opacity: 1 - idx * 0.15,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
