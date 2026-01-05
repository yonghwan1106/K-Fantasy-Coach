'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users, ChevronRight, TrendingUp, Star, Target, Award } from 'lucide-react';
import Link from 'next/link';
import PlayerCard from '@/components/PlayerCard';
import PlayerModal from '@/components/PlayerModal';
import { Player, getPositionGroup } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface TeamStats {
  name: string;
  playerCount: number;
  avgScore: number;
  topPlayer: Player | null;
  totalGoals: number;
  totalAssists: number;
  players: Player[];
}

export default function TeamsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch('/data/players.json')
      .then(r => r.json())
      .then(data => {
        setPlayers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // 팀별 통계 계산
  const teamStats = useMemo(() => {
    const teamMap: Record<string, TeamStats> = {};

    players.forEach(player => {
      if (!teamMap[player.team]) {
        teamMap[player.team] = {
          name: player.team,
          playerCount: 0,
          avgScore: 0,
          topPlayer: null,
          totalGoals: 0,
          totalAssists: 0,
          players: [],
        };
      }

      const team = teamMap[player.team];
      team.playerCount++;
      team.avgScore += player.predictedScore;
      team.totalGoals += player.totalGoals;
      team.totalAssists += player.totalAssists;
      team.players.push(player);

      if (!team.topPlayer || player.predictedScore > team.topPlayer.predictedScore) {
        team.topPlayer = player;
      }
    });

    // 평균 점수 계산
    Object.values(teamMap).forEach(team => {
      team.avgScore = team.avgScore / team.playerCount;
      team.players.sort((a, b) => b.predictedScore - a.predictedScore);
    });

    return Object.values(teamMap).sort((a, b) => b.avgScore - a.avgScore);
  }, [players]);

  // 차트 데이터
  const chartData = useMemo(() => {
    return teamStats.slice(0, 12).map((team, idx) => ({
      name: team.name.length > 6 ? team.name.slice(0, 6) + '...' : team.name,
      fullName: team.name,
      avgScore: team.avgScore,
      rank: idx + 1,
    }));
  }, [teamStats]);

  // 선택된 팀 데이터
  const selectedTeamData = useMemo(() => {
    return teamStats.find(t => t.name === selectedTeam);
  }, [teamStats, selectedTeam]);

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-amber-400" />
          팀별 선수
        </h1>
        <p className="text-zinc-400">K리그 팀별 선수 현황과 통계를 확인하세요</p>
      </div>

      {/* Team Ranking Chart */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          팀별 평균 예상 점수
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" domain={[0, 20]} tick={{ fill: '#71717A', fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#A1A1AA', fontSize: 11 }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(20, 20, 20, 0.95)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value, name, props) => [`${Number(value).toFixed(2)}점`, props.payload.fullName]}
            />
            <Bar
              dataKey="avgScore"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(data) => setSelectedTeam((data as unknown as { fullName: string }).fullName)}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.fullName === selectedTeam
                      ? '#FBBF24'
                      : index < 3
                        ? '#F59E0B'
                        : index < 6
                          ? '#F97316'
                          : '#3F3F46'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {teamStats.map((team, idx) => (
          <button
            key={team.name}
            onClick={() => setSelectedTeam(selectedTeam === team.name ? null : team.name)}
            className={`glass-card p-4 text-left transition-all ${
              selectedTeam === team.name
                ? 'border-amber-500 bg-amber-500/5'
                : 'hover:border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-bold text-white">#{idx + 1}</span>
              {idx < 3 && (
                <Star className={`w-5 h-5 ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-zinc-400' : 'text-amber-700'}`} />
              )}
            </div>
            <h3 className="font-bold text-white mb-1 truncate">{team.name}</h3>
            <p className="text-sm text-zinc-500 mb-3">{team.playerCount}명</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold gradient-text">{team.avgScore.toFixed(1)}</p>
                <p className="text-xs text-zinc-500">평균 점수</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-white">{team.totalGoals}</p>
                <p className="text-xs text-zinc-500">골</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Team Details */}
      {selectedTeamData && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-400" />
              {selectedTeamData.name}
            </h2>
            <button
              onClick={() => setSelectedTeam(null)}
              className="text-sm text-zinc-400 hover:text-white"
            >
              닫기
            </button>
          </div>

          {/* Team Stats Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold gradient-text">{selectedTeamData.avgScore.toFixed(1)}</p>
              <p className="text-xs text-zinc-500">평균 예상 점수</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-white">{selectedTeamData.playerCount}</p>
              <p className="text-xs text-zinc-500">등록 선수</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{selectedTeamData.totalGoals}</p>
              <p className="text-xs text-zinc-500">시즌 골</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{selectedTeamData.totalAssists}</p>
              <p className="text-xs text-zinc-500">시즌 어시스트</p>
            </div>
          </div>

          {/* Top Player */}
          {selectedTeamData.topPlayer && (
            <div className="glass-card p-4">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                팀 최고 기대주
              </h3>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg">
                <div className="w-16 h-16 rounded-xl gradient-gold flex items-center justify-center">
                  <span className="text-2xl font-bold text-black">
                    {selectedTeamData.topPlayer.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-white">{selectedTeamData.topPlayer.name}</h4>
                  <p className="text-zinc-400">{selectedTeamData.topPlayer.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold gradient-text">
                    {selectedTeamData.topPlayer.predictedScore.toFixed(1)}
                  </p>
                  <p className="text-sm text-zinc-500">예상 점수</p>
                </div>
              </div>
            </div>
          )}

          {/* Player List */}
          <div>
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              소속 선수 ({selectedTeamData.players.length}명)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {selectedTeamData.players.map((player, idx) => (
                <PlayerCard
                  key={player.id}
                  player={{ ...player, rank: idx + 1 }}
                  showRank={idx < 5}
                  onClick={() => handlePlayerClick(player)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      {!selectedTeam && (
        <div className="glass-card p-4">
          <p className="text-sm text-zinc-400">
            <span className="text-amber-400 font-bold">TIP:</span>{' '}
            팀 카드를 클릭하면 해당 팀의 상세 선수 목록을 확인할 수 있습니다.
            차트의 막대를 클릭해도 같은 결과를 볼 수 있어요!
          </p>
        </div>
      )}

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
