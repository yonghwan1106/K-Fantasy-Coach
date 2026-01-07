'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  secondary?: number;
  [key: string]: string | number | undefined;
}

interface GradientAreaChartProps {
  data: DataPoint[];
  dataKey?: string;
  secondaryKey?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showAnimation?: boolean;
  animationDuration?: number;
  primaryColor?: string;
  secondaryColor?: string;
  gradientOpacity?: { start: number; end: number };
  averageLine?: number;
  xAxisKey?: string;
  className?: string;
}

export default function GradientAreaChart({
  data,
  dataKey = 'value',
  secondaryKey,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showAnimation = true,
  animationDuration = 1500,
  primaryColor = '#FBBF24',
  secondaryColor = '#3B82F6',
  gradientOpacity = { start: 0.4, end: 0.05 },
  averageLine,
  xAxisKey = 'name',
  className = '',
}: GradientAreaChartProps) {
  const [animate, setAnimate] = useState(!showAnimation);

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setAnimate(true), 100);
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-sm">
          <p className="font-medium text-zinc-400 mb-1">{label}</p>
          {payload.map((entry: any, idx: number) => (
            <p key={idx} style={{ color: entry.color }} className="font-bold">
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const gradientId = `gradient-${dataKey}-${Math.random().toString(36).substr(2, 9)}`;
  const secondaryGradientId = secondaryKey ? `gradient-${secondaryKey}-${Math.random().toString(36).substr(2, 9)}` : null;

  return (
    <div className={`${className} ${animate ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={primaryColor} stopOpacity={gradientOpacity.start} />
              <stop offset="95%" stopColor={primaryColor} stopOpacity={gradientOpacity.end} />
            </linearGradient>
            {secondaryKey && secondaryGradientId && (
              <linearGradient id={secondaryGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={secondaryColor} stopOpacity={gradientOpacity.start} />
                <stop offset="95%" stopColor={secondaryColor} stopOpacity={gradientOpacity.end} />
              </linearGradient>
            )}
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />}
          <XAxis
            dataKey={xAxisKey}
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
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          {averageLine && (
            <ReferenceLine
              y={averageLine}
              stroke="#71717a"
              strokeDasharray="5 5"
              label={{
                value: `평균 ${averageLine.toFixed(1)}`,
                position: 'right',
                fill: '#71717a',
                fontSize: 10,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey={dataKey}
            name="값"
            stroke={primaryColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={showAnimation}
            animationDuration={animationDuration}
            animationEasing="ease-out"
          />
          {secondaryKey && secondaryGradientId && (
            <Area
              type="monotone"
              dataKey={secondaryKey}
              name="보조"
              stroke={secondaryColor}
              strokeWidth={2}
              fill={`url(#${secondaryGradientId})`}
              isAnimationActive={showAnimation}
              animationDuration={animationDuration}
              animationEasing="ease-out"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Mini Sparkline Area Chart
interface SparklineAreaProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function SparklineArea({
  data,
  width = 100,
  height = 30,
  color = '#FBBF24',
  className = '',
}: SparklineAreaProps) {
  const chartData = data.map((value, index) => ({ index, value }));
  const gradientId = `sparkline-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Comparison Area Chart (two overlapping areas)
interface ComparisonAreaChartProps {
  data: Array<{ name: string; value1: number; value2: number }>;
  label1?: string;
  label2?: string;
  color1?: string;
  color2?: string;
  height?: number;
  className?: string;
}

export function ComparisonAreaChart({
  data,
  label1 = '선수 1',
  label2 = '선수 2',
  color1 = '#FBBF24',
  color2 = '#3B82F6',
  height = 250,
  className = '',
}: ComparisonAreaChartProps) {
  const gradientId1 = `compare-1-${Math.random().toString(36).substr(2, 9)}`;
  const gradientId2 = `compare-2-${Math.random().toString(36).substr(2, 9)}`;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-sm">
          <p className="font-medium text-zinc-400 mb-2">{label}</p>
          {payload.map((entry: any, idx: number) => (
            <p key={idx} style={{ color: entry.color }} className="font-semibold">
              {entry.name}: {entry.value.toFixed(1)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId1} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color1} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color1} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={gradientId2} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color2} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color2} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value1"
            name={label1}
            stroke={color1}
            strokeWidth={2}
            fill={`url(#${gradientId1})`}
          />
          <Area
            type="monotone"
            dataKey="value2"
            name={label2}
            stroke={color2}
            strokeWidth={2}
            fill={`url(#${gradientId2})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
