'use client';

import React from 'react';
import { Home, Plane, ChevronUp, ChevronDown } from 'lucide-react';
import { GameHistory } from '@/types';

interface HistoryTableProps {
  history: GameHistory[];
  seasonAvg?: number;
  showGoals?: boolean;
  showAssists?: boolean;
  maxRows?: number;
  className?: string;
}

export default function HistoryTable({
  history,
  seasonAvg,
  showGoals = true,
  showAssists = true,
  maxRows,
  className = '',
}: HistoryTableProps) {
  // 라운드 내림차순 정렬 (최근 경기가 위로)
  const sortedHistory = [...history].sort((a, b) => b.round - a.round);
  const displayHistory = maxRows ? sortedHistory.slice(0, maxRows) : sortedHistory;

  const getScoreColor = (score: number, avg?: number) => {
    if (!avg) {
      if (score >= 30) return 'text-green-400';
      if (score >= 20) return 'text-gold-400';
      if (score >= 10) return 'text-zinc-300';
      return 'text-red-400';
    }

    const diff = score - avg;
    if (diff >= 5) return 'text-green-400';
    if (diff >= -5) return 'text-gold-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score: number, avg?: number) => {
    if (!avg) return null;
    const diff = score - avg;
    if (Math.abs(diff) < 3) return null;

    return (
      <span className={`ml-1 text-xs ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
        {diff > 0 ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />}
        {Math.abs(diff).toFixed(0)}
      </span>
    );
  };

  return (
    <div className={`overflow-hidden rounded-lg border border-zinc-800 ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-900/80">
            <th className="px-3 py-2 text-left text-zinc-500 font-medium">라운드</th>
            <th className="px-3 py-2 text-left text-zinc-500 font-medium">상대</th>
            <th className="px-3 py-2 text-right text-zinc-500 font-medium">점수</th>
            {showGoals && (
              <th className="px-3 py-2 text-center text-zinc-500 font-medium">G</th>
            )}
            {showAssists && (
              <th className="px-3 py-2 text-center text-zinc-500 font-medium">A</th>
            )}
          </tr>
        </thead>
        <tbody>
          {displayHistory.map((game, index) => (
            <tr
              key={game.round}
              className={`border-t border-zinc-800/50 ${
                index % 2 === 0 ? 'bg-zinc-900/30' : ''
              } hover:bg-zinc-800/50 transition-colors`}
            >
              <td className="px-3 py-2">
                <span className="text-zinc-300 font-medium">R{game.round}</span>
                {game.date && (
                  <span className="text-zinc-600 text-xs ml-1.5">{game.date}</span>
                )}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  {game.home ? (
                    <Home className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Plane className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                  <span className="text-white truncate max-w-[100px]">{game.opponent}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-right">
                <span className={`font-bold ${getScoreColor(game.score, seasonAvg)}`}>
                  {game.score.toFixed(1)}
                </span>
                {getScoreBadge(game.score, seasonAvg)}
              </td>
              {showGoals && (
                <td className="px-3 py-2 text-center">
                  {game.goals !== undefined && game.goals > 0 ? (
                    <span className="text-green-400 font-medium">{game.goals}</span>
                  ) : (
                    <span className="text-zinc-600">-</span>
                  )}
                </td>
              )}
              {showAssists && (
                <td className="px-3 py-2 text-center">
                  {game.assists !== undefined && game.assists > 0 ? (
                    <span className="text-blue-400 font-medium">{game.assists}</span>
                  ) : (
                    <span className="text-zinc-600">-</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 평균 표시 */}
      {seasonAvg && (
        <div className="px-3 py-2 bg-zinc-900/50 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500">시즌 평균</span>
          <span className="text-sm font-bold text-gold-400">{seasonAvg.toFixed(1)}</span>
        </div>
      )}

      {/* 더보기 표시 */}
      {maxRows && history.length > maxRows && (
        <div className="px-3 py-2 bg-zinc-900/30 text-center">
          <span className="text-xs text-zinc-500">
            +{history.length - maxRows} 경기 더 있음
          </span>
        </div>
      )}
    </div>
  );
}

// 미니 히스토리 (가로 스크롤)
interface MiniHistoryProps {
  history: GameHistory[];
  className?: string;
}

export function MiniHistory({ history, className = '' }: MiniHistoryProps) {
  const sortedHistory = [...history].sort((a, b) => a.round - b.round);

  const getScoreColor = (score: number) => {
    if (score >= 30) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 20) return 'bg-gold-500/20 text-gold-400 border-gold-500/30';
    if (score >= 10) return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <div className={`flex items-center gap-1 overflow-x-auto pb-2 ${className}`}>
      {sortedHistory.map((game) => (
        <div
          key={game.round}
          className={`flex-shrink-0 px-2 py-1 rounded border text-xs font-medium ${getScoreColor(game.score)}`}
          title={`R${game.round} vs ${game.opponent}: ${game.score.toFixed(1)}점`}
        >
          {game.score.toFixed(0)}
        </div>
      ))}
    </div>
  );
}

// 홈/원정 성적 비교
interface HomeAwayCompareProps {
  history: GameHistory[];
  className?: string;
}

export function HomeAwayCompare({ history, className = '' }: HomeAwayCompareProps) {
  const homeGames = history.filter((g) => g.home);
  const awayGames = history.filter((g) => !g.home);

  const homeAvg = homeGames.length > 0
    ? homeGames.reduce((sum, g) => sum + g.score, 0) / homeGames.length
    : 0;
  const awayAvg = awayGames.length > 0
    ? awayGames.reduce((sum, g) => sum + g.score, 0) / awayGames.length
    : 0;

  const diff = homeAvg - awayAvg;

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Home className="w-4 h-4 text-green-400" />
          <span className="text-xs text-green-400">홈 경기</span>
        </div>
        <p className="text-xl font-bold text-white">{homeAvg.toFixed(1)}</p>
        <p className="text-xs text-zinc-500">{homeGames.length}경기 평균</p>
      </div>
      <div className="p-3 rounded-lg bg-zinc-500/10 border border-zinc-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Plane className="w-4 h-4 text-zinc-400" />
          <span className="text-xs text-zinc-400">원정 경기</span>
        </div>
        <p className="text-xl font-bold text-white">{awayAvg.toFixed(1)}</p>
        <p className="text-xs text-zinc-500">{awayGames.length}경기 평균</p>
      </div>

      {/* 차이 표시 */}
      <div className="col-span-2 text-center">
        <p className="text-xs text-zinc-500">
          홈에서{' '}
          <span className={diff >= 0 ? 'text-green-400' : 'text-red-400'}>
            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}점
          </span>{' '}
          {diff >= 0 ? '더 높음' : '더 낮음'}
        </p>
      </div>
    </div>
  );
}

// 최근 폼 요약
interface RecentFormSummaryProps {
  history: GameHistory[];
  games?: number;
  className?: string;
}

export function RecentFormSummary({
  history,
  games = 5,
  className = '',
}: RecentFormSummaryProps) {
  const recentGames = [...history]
    .sort((a, b) => b.round - a.round)
    .slice(0, games);

  const avgScore = recentGames.reduce((sum, g) => sum + g.score, 0) / recentGames.length;
  const totalGoals = recentGames.reduce((sum, g) => sum + (g.goals || 0), 0);
  const totalAssists = recentGames.reduce((sum, g) => sum + (g.assists || 0), 0);
  const best = Math.max(...recentGames.map(g => g.score));
  const worst = Math.min(...recentGames.map(g => g.score));

  return (
    <div className={`glass-card p-4 ${className}`}>
      <h4 className="text-sm font-medium text-zinc-400 mb-3">최근 {games}경기 요약</h4>
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-xl font-bold gradient-text">{avgScore.toFixed(1)}</p>
          <p className="text-xs text-zinc-500">평균</p>
        </div>
        <div>
          <p className="text-xl font-bold text-green-400">{best.toFixed(1)}</p>
          <p className="text-xs text-zinc-500">최고</p>
        </div>
        <div>
          <p className="text-xl font-bold text-red-400">{worst.toFixed(1)}</p>
          <p className="text-xs text-zinc-500">최저</p>
        </div>
        <div>
          <p className="text-lg font-bold text-white">
            {totalGoals}<span className="text-green-400 text-sm">G</span>{' '}
            {totalAssists}<span className="text-blue-400 text-sm">A</span>
          </p>
          <p className="text-xs text-zinc-500">공헌</p>
        </div>
      </div>
    </div>
  );
}
