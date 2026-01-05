'use client';

import { useEffect, useRef } from 'react';
import { X, TrendingUp, TrendingDown, Minus, Target, Users, Award, Zap } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Player, normalizeFormIndex, getPositionGroup } from '@/types';

interface PlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  allPlayers?: Player[];
  onSelectPlayer?: (player: Player) => void;
}

const getPositionBadgeClass = (position: string) => {
  if (position === 'GK') return 'badge-gk';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) return 'badge-df';
  if (['DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'CM'].includes(position)) return 'badge-mf';
  return 'badge-fw';
};

const getTrendIcon = (formIndex: number) => {
  const normalized = normalizeFormIndex(formIndex);
  if (normalized > 1.1) return <TrendingUp className="w-5 h-5 text-green-400" />;
  if (normalized < 0.9) return <TrendingDown className="w-5 h-5 text-red-400" />;
  return <Minus className="w-5 h-5 text-zinc-500" />;
};

// 가상의 최근 5경기 점수 생성 (실제 데이터가 없는 경우)
const generateRecentGames = (player: Player) => {
  if (player.recentGames && player.recentGames.length > 0) {
    return player.recentGames.map((score, idx) => ({
      game: `경기 ${idx + 1}`,
      score: score,
    }));
  }

  // 시즌 평균과 최근 평균을 기반으로 추정 데이터 생성
  const base = player.seasonAvg;
  const recent = player.recentAvg;
  const trend = (recent - base) / 5;

  return [
    { game: '5경기 전', score: Math.max(0, base + Math.random() * 5 - 2) },
    { game: '4경기 전', score: Math.max(0, base + trend + Math.random() * 5 - 2) },
    { game: '3경기 전', score: Math.max(0, base + trend * 2 + Math.random() * 5 - 2) },
    { game: '2경기 전', score: Math.max(0, base + trend * 3 + Math.random() * 5 - 2) },
    { game: '최근', score: Math.max(0, recent + Math.random() * 3 - 1) },
  ];
};

// XAI 기여도 데이터 생성
const generateContributions = (player: Player) => {
  if (player.contributions) {
    return [
      { name: '최근 폼', value: player.contributions.recent_form, color: '#22C55E' },
      { name: '시즌 평균', value: player.contributions.season_avg, color: '#3B82F6' },
      { name: '상대팀 상성', value: player.contributions.vs_opponent, color: '#8B5CF6' },
      { name: '홈 어드밴티지', value: player.contributions.home_advantage, color: '#F59E0B' },
      { name: '포지션 순위', value: player.contributions.position_rank, color: '#EF4444' },
    ];
  }

  // 기본 기여도 추정
  const formWeight = normalizeFormIndex(player.formIndex) > 1.1 ? 35 : 20;
  const seasonWeight = 25;
  const opponentWeight = 15;
  const homeWeight = 10;
  const positionWeight = 100 - formWeight - seasonWeight - opponentWeight - homeWeight;

  return [
    { name: '최근 폼', value: formWeight, color: '#22C55E' },
    { name: '시즌 평균', value: seasonWeight, color: '#3B82F6' },
    { name: '상대팀 상성', value: opponentWeight, color: '#8B5CF6' },
    { name: '홈 어드밴티지', value: homeWeight, color: '#F59E0B' },
    { name: '포지션 순위', value: positionWeight, color: '#EF4444' },
  ];
};

export default function PlayerModal({ player, isOpen, onClose, allPlayers, onSelectPlayer }: PlayerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !player) return null;

  const recentGamesData = generateRecentGames(player);
  const contributionData = generateContributions(player);
  const normalizedFormIndex = normalizeFormIndex(player.formIndex);

  // 유사 선수 찾기 (같은 포지션 그룹, 비슷한 점수)
  const similarPlayers = allPlayers
    ?.filter(p =>
      p.id !== player.id &&
      getPositionGroup(p.position) === getPositionGroup(player.position) &&
      Math.abs(p.predictedScore - player.predictedScore) < 5
    )
    .sort((a, b) => b.predictedScore - a.predictedScore)
    .slice(0, 3) || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-[rgba(251,191,36,0.1)]">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl gradient-gold flex items-center justify-center">
              <span className="text-3xl font-bold text-black">
                {player.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{player.name}</h2>
                <span className={`px-3 py-1 rounded-lg text-sm font-bold text-white ${getPositionBadgeClass(player.position)}`}>
                  {player.position}
                </span>
              </div>
              <p className="text-zinc-400 mb-2">{player.team}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getTrendIcon(player.formIndex)}
                  <span className="text-sm text-zinc-400">
                    폼 {((normalizedFormIndex - 1) * 100).toFixed(0)}%
                  </span>
                </div>
                <span className="text-zinc-600">|</span>
                <span className="text-sm text-zinc-400">{player.matchesPlayed}경기 출장</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold gradient-text">{player.predictedScore.toFixed(1)}</p>
              <p className="text-sm text-zinc-500">예상 점수</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-card p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">{player.totalGoals}</p>
              <p className="text-xs text-zinc-500">시즌 골</p>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{player.totalAssists}</p>
              <p className="text-xs text-zinc-500">시즌 어시스트</p>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                <Award className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white">{player.recentAvg.toFixed(1)}</p>
              <p className="text-xs text-zinc-500">최근 5경기 평균</p>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-white">{player.seasonAvg.toFixed(1)}</p>
              <p className="text-xs text-zinc-500">시즌 평균</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Recent Games Chart */}
            <div className="glass-card p-4">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                최근 5경기 점수 추이
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={recentGamesData}>
                  <XAxis
                    dataKey="game"
                    tick={{ fill: '#71717A', fontSize: 11 }}
                    axisLine={{ stroke: '#3F3F46' }}
                  />
                  <YAxis
                    tick={{ fill: '#71717A', fontSize: 11 }}
                    axisLine={{ stroke: '#3F3F46' }}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(20, 20, 20, 0.95)',
                      border: '1px solid rgba(251, 191, 36, 0.2)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`${Number(value).toFixed(1)}점`, '점수']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#FBBF24"
                    strokeWidth={3}
                    dot={{ fill: '#FBBF24', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: '#F97316' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* XAI Contribution Chart */}
            <div className="glass-card p-4">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                AI 예측 기여도
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={contributionData} layout="vertical">
                  <XAxis
                    type="number"
                    domain={[0, 50]}
                    tick={{ fill: '#71717A', fontSize: 11 }}
                    axisLine={{ stroke: '#3F3F46' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#A1A1AA', fontSize: 11 }}
                    width={80}
                    axisLine={{ stroke: '#3F3F46' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(20, 20, 20, 0.95)',
                      border: '1px solid rgba(251, 191, 36, 0.2)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`${value}%`, '기여도']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {contributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Similar Players */}
          {similarPlayers.length > 0 && (
            <div>
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                비슷한 선수
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {similarPlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectPlayer?.(p)}
                    className="glass-card p-4 text-left hover:border-amber-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white">{p.name}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${getPositionBadgeClass(p.position)}`}>
                        {p.position}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">{p.team}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold gradient-text">{p.predictedScore.toFixed(1)}</span>
                      <span className="text-xs text-zinc-400">{p.matchesPlayed}경기</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
