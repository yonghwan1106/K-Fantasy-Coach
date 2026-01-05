'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import PlayerCard from '@/components/PlayerCard';
import ExplainableAI from '@/components/ExplainableAI';

interface Player {
  id: number;
  name: string;
  team: string;
  position: string;
  predictedScore: number;
  recentAvg: number;
  seasonAvg: number;
  formIndex: number;
  matchesPlayed: number;
  totalGoals: number;
  totalAssists: number;
  contributions: {
    recentForm: number;
    seasonAvg: number;
    position: number;
    goals: number;
    assists: number;
  };
}

interface PositionRankings {
  GK: Player[];
  DF: Player[];
  MF: Player[];
  FW: Player[];
}

const POSITION_LABELS: Record<keyof PositionRankings, { label: string; color: string }> = {
  GK: { label: '골키퍼', color: 'bg-green-500' },
  DF: { label: '수비수', color: 'bg-blue-500' },
  MF: { label: '미드필더', color: 'bg-purple-500' },
  FW: { label: '공격수', color: 'bg-red-500' },
};

export default function RecommendPage() {
  const [rankings, setRankings] = useState<PositionRankings | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/position_rankings.json')
      .then(r => r.json())
      .then(data => {
        setRankings(data);
        // 첫 번째 선수를 기본 선택
        if (data.FW?.[0]) {
          setSelectedPlayer(data.FW[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-amber-400" />
          AI 추천
        </h1>
        <p className="text-zinc-400">LightGBM 모델 기반 포지션별 TOP 선수 추천</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Position Rankings */}
        <div className="col-span-2 space-y-6">
          {rankings && Object.entries(POSITION_LABELS).map(([key, { label, color }]) => {
            const players = rankings[key as keyof PositionRankings] || [];
            if (players.length === 0) return null;

            return (
              <div key={key} className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <h2 className="text-xl font-bold text-white">{label}</h2>
                  <span className="text-sm text-zinc-500">TOP {players.length}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {players.slice(0, 4).map((player, index) => (
                    <div
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className={`player-card p-3 cursor-pointer ${
                        selectedPlayer?.id === player.id ? 'border-amber-500 glow-gold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-black font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-white">{player.name}</p>
                          <p className="text-xs text-zinc-500">{player.team}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold gradient-text">{player.predictedScore.toFixed(1)}</p>
                          <p className="text-xs text-zinc-500">예상 점수</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: XAI Panel */}
        <div className="space-y-6">
          {selectedPlayer && (
            <>
              <ExplainableAI
                playerName={selectedPlayer.name}
                predictedScore={selectedPlayer.predictedScore}
                contributions={selectedPlayer.contributions || {
                  recentForm: 0,
                  seasonAvg: 0,
                  position: 0,
                  goals: 0,
                  assists: 0
                }}
              />

              <div className="glass-card p-6">
                <h3 className="font-bold text-white mb-4">선수 상세 정보</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">소속팀</span>
                    <span className="text-white">{selectedPlayer.team}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">포지션</span>
                    <span className="text-white">{selectedPlayer.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">출장 경기</span>
                    <span className="text-white">{selectedPlayer.matchesPlayed}경기</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">시즌 골</span>
                    <span className="text-white">{selectedPlayer.totalGoals}골</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">시즌 어시스트</span>
                    <span className="text-white">{selectedPlayer.totalAssists}도움</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">폼 지수</span>
                    <span className={`font-bold ${
                      selectedPlayer.formIndex > 1 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedPlayer.formIndex > 1 ? '+' : ''}{((selectedPlayer.formIndex - 1) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {!selectedPlayer && (
            <div className="glass-card p-6 text-center">
              <p className="text-zinc-400">선수를 선택하면 AI 추천 이유를 확인할 수 있습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
