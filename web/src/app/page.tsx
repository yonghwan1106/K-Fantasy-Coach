'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  TrendingUp,
  Zap,
  Trophy,
  ChevronRight,
  Star,
  Target,
  Scale,
  Building2,
  Clock,
  Calendar,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import PlayerCard from '@/components/PlayerCard';
import PlayerModal from '@/components/PlayerModal';
import { Player, DarkHorse, Summary } from '@/types';
import { useCountAnimation } from '@/hooks/useCountAnimation';
import AnimatedBarChart, { RankBarChart, StackedProgress } from '@/components/charts/AnimatedBarChart';
import GradientAreaChart from '@/components/charts/GradientAreaChart';

export default function Dashboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [darkHorses, setDarkHorses] = useState<DarkHorse[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 숫자 카운트 애니메이션
  const animatedTotalPlayers = useCountAnimation(summary?.totalPlayers || 0, { duration: 1000 });
  const animatedAvgScore = useCountAnimation(summary?.avgPredictedScore || 0, { duration: 1000, decimals: 1 });
  const animatedRisingCount = useCountAnimation(players.filter(p => p.formIndex > 1.1).length, { duration: 1000 });
  const animatedDarkHorses = useCountAnimation(summary?.totalDarkHorses || 0, { duration: 1000 });

  // 라운드 카운트다운 (예시: 다음 라운드까지 남은 시간)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0 });

  useEffect(() => {
    // 예시: 다음 주 토요일 14:00을 다음 라운드로 가정
    const getNextSaturday = () => {
      const now = new Date();
      const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
      const nextSat = new Date(now);
      nextSat.setDate(now.getDate() + daysUntilSat);
      nextSat.setHours(14, 0, 0, 0);
      return nextSat;
    };

    const updateCountdown = () => {
      const now = new Date();
      const target = getNextSaturday();
      const diff = target.getTime() - now.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setCountdown({ days, hours, mins });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [playersRes, darkHorsesRes, summaryRes] = await Promise.all([
          fetch('/data/players.json').then(r => r.json()),
          fetch('/data/dark_horses.json').then(r => r.json()),
          fetch('/data/summary.json').then(r => r.json())
        ]);

        setPlayers(playersRes);
        setDarkHorses(darkHorsesRes);
        setSummary(summaryRes);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  // 팀별 평균 점수 계산
  const teamChartData = useMemo(() => {
    const teamMap: Record<string, { total: number; count: number }> = {};

    players.forEach(player => {
      if (!teamMap[player.team]) {
        teamMap[player.team] = { total: 0, count: 0 };
      }
      teamMap[player.team].total += player.predictedScore;
      teamMap[player.team].count++;
    });

    return Object.entries(teamMap)
      .map(([name, data]) => ({
        name: name.length > 5 ? name.slice(0, 5) + '..' : name,
        fullName: name,
        avgScore: data.total / data.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 8);
  }, [players]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  const topPlayers = players.slice(0, 5);
  const topDarkHorse = darkHorses[0];

  // 포지션별 통계 데이터
  const positionData = [
    { name: 'GK', count: players.filter(p => p.position === 'GK').length, avg: players.filter(p => p.position === 'GK').reduce((sum, p) => sum + p.predictedScore, 0) / Math.max(players.filter(p => p.position === 'GK').length, 1) },
    { name: 'DF', count: players.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position)).length, avg: players.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position)).reduce((sum, p) => sum + p.predictedScore, 0) / Math.max(players.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position)).length, 1) },
    { name: 'MF', count: players.filter(p => ['DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'CM'].includes(p.position)).length, avg: players.filter(p => ['DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'CM'].includes(p.position)).reduce((sum, p) => sum + p.predictedScore, 0) / Math.max(players.filter(p => ['DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'CM'].includes(p.position)).length, 1) },
    { name: 'FW', count: players.filter(p => ['CF', 'SS', 'LWF', 'RWF', 'LW', 'RW'].includes(p.position)).length, avg: players.filter(p => ['CF', 'SS', 'LWF', 'RWF', 'LW', 'RW'].includes(p.position)).reduce((sum, p) => sum + p.predictedScore, 0) / Math.max(players.filter(p => ['CF', 'SS', 'LWF', 'RWF', 'LW', 'RW'].includes(p.position)).length, 1) },
  ];

  const COLORS = ['#22C55E', '#3B82F6', '#8B5CF6', '#EF4444'];
  const TEAM_COLORS = ['#FBBF24', '#F59E0B', '#F97316', '#EA580C', '#DC2626', '#B91C1C', '#78716C', '#57534E'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">대시보드</h1>
          <p className="text-zinc-400 text-sm sm:text-base">AI 기반 판타지 선수 추천 현황</p>
        </div>
        <div className="flex gap-2">
          <Link href="/recommend" className="btn-primary flex items-center gap-2 text-sm sm:text-base">
            <Star className="w-4 h-4 sm:w-5 sm:h-5" />
            AI 추천 보기
          </Link>
        </div>
      </div>

      {/* Round Countdown Banner */}
      <div className="glass-card p-4 gradient-gold-soft border border-amber-500/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">다음 라운드까지</p>
              <p className="text-white font-medium">R{summary?.currentRound ? summary.currentRound + 1 : 24} 마감</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{countdown.days}</p>
              <p className="text-xs text-zinc-500">일</p>
            </div>
            <span className="text-zinc-600">:</span>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{countdown.hours}</p>
              <p className="text-xs text-zinc-500">시간</p>
            </div>
            <span className="text-zinc-600">:</span>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{countdown.mins}</p>
              <p className="text-xs text-zinc-500">분</p>
            </div>
          </div>
          <Link href="/schedule" className="btn-primary text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            일정 보기
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card p-4 sm:p-6 card-interactive">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-white animate-count-up">{animatedTotalPlayers}</p>
              <p className="text-xs sm:text-sm text-zinc-500">분석 선수</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 sm:p-6 card-interactive">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold gradient-text animate-count-up">{animatedAvgScore}</p>
              <p className="text-xs sm:text-sm text-zinc-500">평균 예상 점수</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 sm:p-6 card-interactive">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-white animate-count-up">{animatedRisingCount}</p>
              <p className="text-xs sm:text-sm text-zinc-500">급상승 선수</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 sm:p-6 card-interactive">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-white animate-count-up">{animatedDarkHorses}</p>
              <p className="text-xs sm:text-sm text-zinc-500">다크호스</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TOP 추천 선수 */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              TOP 추천 선수
            </h2>
            <Link href="/players" className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
              전체 보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topPlayers.map((player, index) => (
              <PlayerCard
                key={player.id}
                player={{ ...player, rank: index + 1 }}
                showRank
                onClick={() => handlePlayerClick(player)}
              />
            ))}
          </div>
        </div>

        {/* 다크호스 배너 */}
        <div className="space-y-6">
          {topDarkHorse && (
            <div className="dark-horse-badge rounded-xl p-6">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400 font-bold">다크호스 발견!</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{topDarkHorse.name}</h3>
                <p className="text-zinc-400 mb-4">{topDarkHorse.team} / {topDarkHorse.position}</p>
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <p className="text-3xl font-bold gradient-text">
                      +{((topDarkHorse.formSurge - 1) * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-zinc-500">폼 상승률</p>
                  </div>
                  <div className="h-12 w-px bg-zinc-700" />
                  <div>
                    <p className="text-xl font-bold text-white">{topDarkHorse.recent3Avg.toFixed(1)}</p>
                    <p className="text-xs text-zinc-500">최근 3경기</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 mb-4">{topDarkHorse.reason}</p>
                <Link href="/dark-horse" className="btn-secondary text-sm inline-flex items-center gap-1">
                  다크호스 전체 보기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* 포지션별 차트 */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              포지션별 평균 예상 점수
            </h3>
            <RankBarChart
              data={positionData.map((p, i) => ({ name: p.name, value: p.avg, color: COLORS[i] }))}
              showRank={false}
              maxBars={4}
            />

            {/* 포지션별 분포 */}
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">포지션별 선수 분포</p>
              <StackedProgress
                segments={positionData.map((p, i) => ({
                  value: p.count,
                  color: COLORS[i],
                  label: p.name,
                }))}
                height={8}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Team Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            팀별 평균 예상 점수 TOP 8
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> 실시간
            </span>
            <Link href="/teams" className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
              전체 보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <AnimatedBarChart
          data={teamChartData.map((t, i) => ({
            name: t.name,
            value: t.avgScore,
            color: TEAM_COLORS[i % TEAM_COLORS.length],
          }))}
          height={250}
          showLabels
          labelPosition="top"
          animationDuration={1200}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Link href="/players" className="glass-card p-4 sm:p-6 text-center hover:border-blue-500/30 group">
          <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-white text-sm sm:text-base mb-1">선수 검색</h3>
          <p className="text-xs text-zinc-500 hidden sm:block">전체 선수 목록</p>
        </Link>

        <Link href="/recommend" className="glass-card p-4 sm:p-6 text-center hover:border-amber-500/30 group">
          <Star className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-white text-sm sm:text-base mb-1">AI 추천</h3>
          <p className="text-xs text-zinc-500 hidden sm:block">포지션별 TOP</p>
        </Link>

        <Link href="/compare" className="glass-card p-4 sm:p-6 text-center hover:border-cyan-500/30 group">
          <Scale className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-white text-sm sm:text-base mb-1">선수 비교</h3>
          <p className="text-xs text-zinc-500 hidden sm:block">스탯 비교 분석</p>
        </Link>

        <Link href="/my-team" className="glass-card p-4 sm:p-6 text-center hover:border-purple-500/30 group">
          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-white text-sm sm:text-base mb-1">팀 빌더</h3>
          <p className="text-xs text-zinc-500 hidden sm:block">나만의 팀 구성</p>
        </Link>

        <Link href="/dark-horse" className="glass-card p-4 sm:p-6 text-center hover:border-green-500/30 group col-span-2 lg:col-span-1">
          <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-white text-sm sm:text-base mb-1">다크호스</h3>
          <p className="text-xs text-zinc-500 hidden sm:block">숨은 강자 발굴</p>
        </Link>
      </div>

      {/* Update Time */}
      <div className="text-center text-xs text-zinc-600 flex items-center justify-center gap-2">
        <Clock className="w-3 h-3" />
        마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
      </div>

      {/* Player Modal */}
      <PlayerModal
        player={selectedPlayer}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPlayer(null);
        }}
        allPlayers={players}
        onSelectPlayer={(p) => setSelectedPlayer(p)}
      />
    </div>
  );
}
