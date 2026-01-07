'use client';

import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, ChevronLeft, ChevronRight, Target, Shield, Loader2 } from 'lucide-react';
import MatchupCard, { MatchupCardMini, RecommendedPlayerCard } from '@/components/MatchupCard';
import DifficultyBadge, { calculateMatchupDifficulty, DifficultyStars } from '@/components/DifficultyBadge';
import { Schedule, Match, TeamMatchup, HeadToHead, DifficultyLevel, Player } from '@/types';
import { SkeletonChart, SkeletonPlayerCard } from '@/components/SkeletonLoader';

interface MatchupsData {
  teamMatchups: Record<string, TeamMatchup>;
  headToHead: Record<string, HeadToHead>;
}

// 매치업 기반 추천 선수 찾기
function getRecommendedPlayers(
  players: Player[],
  match: Match,
  matchups: MatchupsData,
  isHome: boolean
): Array<{
  player: Player;
  difficulty: DifficultyLevel;
  reason: string;
}> {
  const team = isHome ? match.home : match.away;
  const opponent = isHome ? match.away : match.home;
  const opponentMatchup = matchups.teamMatchups[opponent];

  if (!opponentMatchup) return [];

  // 상대팀 약점 분석
  const difficulty = calculateMatchupDifficulty(
    opponentMatchup.defenseRating,
    opponentMatchup.attackRating,
    isHome
  );

  // 해당 팀 선수 중 예측점수 상위 + 출전가능 선수
  const teamPlayers = players
    .filter(p => p.team === team && (!p.availability || p.availability.status === 'available'))
    .sort((a, b) => (b.predictedScore || 0) - (a.predictedScore || 0))
    .slice(0, 3);

  return teamPlayers.map(player => {
    let reason = '';
    if (difficulty <= 2) {
      reason = `${opponent}의 낮은 수비력(${opponentMatchup.defenseRating.toFixed(1)})으로 득점 기회 높음`;
    } else if (difficulty === 3) {
      reason = `균형잡힌 매치업, ${player.position === 'FW' || player.position === 'MF' ? '공격 포인트' : '안정적 수비'} 기대`;
    } else {
      reason = `강팀 상대지만 ${isHome ? '홈 어드밴티지로' : '원정에서도'} 활약 가능`;
    }

    return {
      player,
      difficulty,
      reason
    };
  });
}

export default function SchedulePage() {
  const [scheduleData, setScheduleData] = useState<Schedule | null>(null);
  const [matchupsData, setMatchupsData] = useState<MatchupsData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedRound, setSelectedRound] = useState<number>(28);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        const [scheduleRes, matchupsRes, playersRes] = await Promise.all([
          fetch('/data/schedule.json'),
          fetch('/data/matchups.json'),
          fetch('/data/players.json')
        ]);

        const schedule = await scheduleRes.json();
        const matchups = await matchupsRes.json();
        const playersData = await playersRes.json();

        setScheduleData(schedule);
        setMatchupsData(matchups);
        setPlayers(playersData.players || playersData);
        setSelectedRound(schedule.currentRound || 28);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // 현재 라운드 경기 가져오기
  const currentRoundData = scheduleData?.rounds.find(r => r.round === selectedRound);
  const matches = currentRoundData?.matches || [];

  // 라운드 이동
  const handlePrevRound = () => {
    const rounds = scheduleData?.rounds.map(r => r.round) || [];
    const currentIndex = rounds.indexOf(selectedRound);
    if (currentIndex > 0) {
      setSelectedRound(rounds[currentIndex - 1]);
      setSelectedMatch(null);
    }
  };

  const handleNextRound = () => {
    const rounds = scheduleData?.rounds.map(r => r.round) || [];
    const currentIndex = rounds.indexOf(selectedRound);
    if (currentIndex < rounds.length - 1) {
      setSelectedRound(rounds[currentIndex + 1]);
      setSelectedMatch(null);
    }
  };

  // Head to Head 데이터 찾기
  const getHeadToHead = (home: string, away: string): HeadToHead | undefined => {
    if (!matchupsData) return undefined;
    const key1 = `${home}_vs_${away}`;
    const key2 = `${away}_vs_${home}`;
    return matchupsData.headToHead[key1] || matchupsData.headToHead[key2];
  };

  // 선택된 경기의 추천 선수
  const recommendedPlayers = selectedMatch && matchupsData
    ? [
        ...getRecommendedPlayers(players, selectedMatch, matchupsData, true),
        ...getRecommendedPlayers(players, selectedMatch, matchupsData, false)
      ]
    : [];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto animate-page-enter">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center">
            <Calendar className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">일정 / 매치업 분석</h1>
            <p className="text-zinc-500">라운드별 경기 일정과 팀간 매치업을 분석합니다</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <SkeletonChart key={i} height={240} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-page-enter">
      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center">
            <Calendar className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">일정 / 매치업 분석</h1>
            <p className="text-zinc-500">라운드별 경기 일정과 팀간 매치업을 분석합니다</p>
          </div>
        </div>

        {/* 뷰 모드 토글 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            카드뷰
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            리스트
          </button>
        </div>
      </div>

      {/* 라운드 선택 */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevRound}
            disabled={selectedRound === scheduleData?.rounds[0]?.round}
            className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            {scheduleData?.rounds.map(round => (
              <button
                key={round.round}
                onClick={() => {
                  setSelectedRound(round.round);
                  setSelectedMatch(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedRound === round.round
                    ? 'gradient-gold text-black scale-105'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                R{round.round}
                {round.round === scheduleData.currentRound && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">현재</span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleNextRound}
            disabled={selectedRound === scheduleData?.rounds[scheduleData.rounds.length - 1]?.round}
            className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 라운드 날짜 정보 */}
        {currentRoundData && (
          <p className="text-center text-sm text-zinc-500 mt-3">
            {currentRoundData.date} ~ {matches[matches.length - 1]?.date || currentRoundData.date}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 경기 목록 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-400" />
              Round {selectedRound} 경기
            </h2>
            <span className="text-sm text-zinc-500">{matches.length}경기</span>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map(match => (
                <div
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className={`cursor-pointer transition-all ${
                    selectedMatch?.id === match.id ? 'ring-2 ring-gold-500 scale-[1.02]' : ''
                  }`}
                >
                  <MatchupCard
                    match={match}
                    homeMatchup={matchupsData?.teamMatchups[match.home]}
                    awayMatchup={matchupsData?.teamMatchups[match.away]}
                    headToHead={getHeadToHead(match.home, match.away)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map(match => {
                const homeMatchup = matchupsData?.teamMatchups[match.home];
                const awayMatchup = matchupsData?.teamMatchups[match.away];
                const homeDifficulty = awayMatchup
                  ? calculateMatchupDifficulty(awayMatchup.defenseRating, awayMatchup.attackRating, true)
                  : 3 as DifficultyLevel;

                return (
                  <div
                    key={match.id}
                    onClick={() => setSelectedMatch(match)}
                    className={`cursor-pointer transition-all ${
                      selectedMatch?.id === match.id ? 'ring-2 ring-gold-500' : ''
                    }`}
                  >
                    <MatchupCardMini match={match} difficulty={homeDifficulty} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 선택된 경기 상세 분석 */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold-400" />
            매치업 분석
          </h2>

          {selectedMatch ? (
            <>
              {/* 선택된 경기 요약 */}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white font-bold">{selectedMatch.home}</span>
                  <span className="text-zinc-500">vs</span>
                  <span className="text-white font-bold">{selectedMatch.away}</span>
                </div>

                {/* 팀별 상세 분석 */}
                {matchupsData && (
                  <div className="space-y-4">
                    {/* 홈팀 분석 */}
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-green-400">{selectedMatch.home} (홈)</span>
                        {matchupsData.teamMatchups[selectedMatch.away] && (
                          <DifficultyBadge
                            level={calculateMatchupDifficulty(
                              matchupsData.teamMatchups[selectedMatch.away].defenseRating,
                              matchupsData.teamMatchups[selectedMatch.away].attackRating,
                              true
                            )}
                            size="sm"
                          />
                        )}
                      </div>
                      {matchupsData.teamMatchups[selectedMatch.home] && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-gold-400" />
                            <span className="text-zinc-400">공격력:</span>
                            <span className="text-white">{matchupsData.teamMatchups[selectedMatch.home].attackRating.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-blue-400" />
                            <span className="text-zinc-400">수비력:</span>
                            <span className="text-white">{matchupsData.teamMatchups[selectedMatch.home].defenseRating.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 어웨이팀 분석 */}
                    <div className="p-3 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-400">{selectedMatch.away} (원정)</span>
                        {matchupsData.teamMatchups[selectedMatch.home] && (
                          <DifficultyBadge
                            level={calculateMatchupDifficulty(
                              matchupsData.teamMatchups[selectedMatch.home].defenseRating,
                              matchupsData.teamMatchups[selectedMatch.home].attackRating,
                              false
                            )}
                            size="sm"
                          />
                        )}
                      </div>
                      {matchupsData.teamMatchups[selectedMatch.away] && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-gold-400" />
                            <span className="text-zinc-400">공격력:</span>
                            <span className="text-white">{matchupsData.teamMatchups[selectedMatch.away].attackRating.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-blue-400" />
                            <span className="text-zinc-400">수비력:</span>
                            <span className="text-white">{matchupsData.teamMatchups[selectedMatch.away].defenseRating.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 상성 정보 */}
                    {matchupsData.teamMatchups[selectedMatch.home]?.weakAgainst?.includes(selectedMatch.away) && (
                      <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-xs text-red-400">
                          {selectedMatch.home}은(는) {selectedMatch.away}에게 약세!
                        </p>
                      </div>
                    )}
                    {matchupsData.teamMatchups[selectedMatch.home]?.strongAgainst?.includes(selectedMatch.away) && (
                      <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-xs text-green-400">
                          {selectedMatch.home}이(가) {selectedMatch.away}에 강세!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 추천 선수 */}
              {recommendedPlayers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-zinc-400">이 경기 추천 선수</h3>
                  {recommendedPlayers.slice(0, 4).map(({ player, difficulty, reason }) => (
                    <RecommendedPlayerCard
                      key={player.id}
                      playerName={player.name}
                      team={player.team}
                      position={player.position}
                      predictedScore={player.predictedScore || 0}
                      opponent={player.team === selectedMatch.home ? selectedMatch.away : selectedMatch.home}
                      difficulty={difficulty}
                      reason={reason}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="glass-card p-8 text-center">
              <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-400">경기를 선택하면</p>
              <p className="text-zinc-400">상세 매치업 분석을 확인할 수 있습니다</p>
            </div>
          )}

          {/* 난이도 범례 */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">난이도 범례</h3>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(level => (
                <div key={level} className="flex items-center justify-between">
                  <DifficultyBadge level={level as DifficultyLevel} size="sm" />
                  <DifficultyStars level={level as DifficultyLevel} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
