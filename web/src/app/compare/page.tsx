'use client';

import { useState, useEffect, useMemo } from 'react';
import { Scale, Search, X, TrendingUp, TrendingDown, Minus, Target, Users, Award } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Player, getPositionGroup, normalizeFormIndex } from '@/types';

const getPositionBadgeClass = (position: string) => {
  if (position === 'GK') return 'badge-gk';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) return 'badge-df';
  if (['DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'CM'].includes(position)) return 'badge-mf';
  return 'badge-fw';
};

const getTrendIcon = (formIndex: number) => {
  const normalized = normalizeFormIndex(formIndex);
  if (normalized > 1.1) return <TrendingUp className="w-4 h-4 text-green-400" />;
  if (normalized < 0.9) return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-zinc-500" />;
};

export default function ComparePage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlot, setActiveSlot] = useState<1 | 2 | null>(null);

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

  // 검색된 선수 목록
  const searchResults = useMemo(() => {
    if (!searchQuery || !activeSlot) return [];
    const query = searchQuery.toLowerCase();
    return players
      .filter(p =>
        (p.name.toLowerCase().includes(query) || p.team.toLowerCase().includes(query)) &&
        p.id !== player1?.id && p.id !== player2?.id
      )
      .slice(0, 10);
  }, [searchQuery, players, player1, player2, activeSlot]);

  // 레이더 차트 데이터
  const radarData = useMemo(() => {
    if (!player1 || !player2) return [];

    // 정규화를 위한 최대값
    const maxScore = Math.max(
      player1.predictedScore, player2.predictedScore,
      player1.recentAvg, player2.recentAvg,
      player1.seasonAvg, player2.seasonAvg,
      40
    );
    const maxGoalsAssists = Math.max(
      player1.totalGoals + player1.totalAssists,
      player2.totalGoals + player2.totalAssists,
      20
    );
    const maxMatches = Math.max(player1.matchesPlayed, player2.matchesPlayed, 30);

    return [
      {
        subject: '예상 점수',
        player1: (player1.predictedScore / maxScore) * 100,
        player2: (player2.predictedScore / maxScore) * 100,
        fullMark: 100,
      },
      {
        subject: '최근 폼',
        player1: (player1.recentAvg / maxScore) * 100,
        player2: (player2.recentAvg / maxScore) * 100,
        fullMark: 100,
      },
      {
        subject: '시즌 평균',
        player1: (player1.seasonAvg / maxScore) * 100,
        player2: (player2.seasonAvg / maxScore) * 100,
        fullMark: 100,
      },
      {
        subject: '공격 기여',
        player1: ((player1.totalGoals + player1.totalAssists) / maxGoalsAssists) * 100,
        player2: ((player2.totalGoals + player2.totalAssists) / maxGoalsAssists) * 100,
        fullMark: 100,
      },
      {
        subject: '출장 경기',
        player1: (player1.matchesPlayed / maxMatches) * 100,
        player2: (player2.matchesPlayed / maxMatches) * 100,
        fullMark: 100,
      },
    ];
  }, [player1, player2]);

  // 비교 결과 요약
  const comparisonSummary = useMemo(() => {
    if (!player1 || !player2) return null;

    const items = [
      { label: '예상 점수', p1: player1.predictedScore, p2: player2.predictedScore, format: (v: number) => v.toFixed(1) },
      { label: '최근 5경기', p1: player1.recentAvg, p2: player2.recentAvg, format: (v: number) => v.toFixed(1) },
      { label: '시즌 평균', p1: player1.seasonAvg, p2: player2.seasonAvg, format: (v: number) => v.toFixed(1) },
      { label: '폼 지수', p1: normalizeFormIndex(player1.formIndex), p2: normalizeFormIndex(player2.formIndex), format: (v: number) => `${((v - 1) * 100).toFixed(0)}%` },
      { label: '골', p1: player1.totalGoals, p2: player2.totalGoals, format: (v: number) => String(v) },
      { label: '어시스트', p1: player1.totalAssists, p2: player2.totalAssists, format: (v: number) => String(v) },
      { label: '출장 경기', p1: player1.matchesPlayed, p2: player2.matchesPlayed, format: (v: number) => String(v) },
    ];

    return items.map(item => ({
      ...item,
      winner: item.p1 > item.p2 ? 1 : item.p1 < item.p2 ? 2 : 0,
    }));
  }, [player1, player2]);

  const handleSelectPlayer = (player: Player) => {
    if (activeSlot === 1) {
      setPlayer1(player);
    } else if (activeSlot === 2) {
      setPlayer2(player);
    }
    setActiveSlot(null);
    setSearchQuery('');
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
          <Scale className="w-8 h-8 text-amber-400" />
          선수 비교
        </h1>
        <p className="text-zinc-400">두 선수의 스탯을 비교 분석하세요</p>
      </div>

      {/* Player Selection */}
      <div className="grid grid-cols-2 gap-6">
        {/* Player 1 */}
        <div className="relative">
          {player1 ? (
            <div className="glass-card p-6 border-l-4 border-amber-500">
              <button
                onClick={() => setPlayer1(null)}
                className="absolute top-4 right-4 p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl gradient-gold flex items-center justify-center">
                  <span className="text-2xl font-bold text-black">{player1.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{player1.name}</h3>
                  <p className="text-zinc-400">{player1.team}</p>
                  <span className={`inline-block px-2 py-0.5 mt-1 rounded text-xs font-bold text-white ${getPositionBadgeClass(player1.position)}`}>
                    {player1.position}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold gradient-text">{player1.predictedScore.toFixed(1)}</p>
                <p className="text-sm text-zinc-500">예상 점수</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setActiveSlot(1)}
              className={`glass-card p-8 w-full text-center hover:border-amber-500/30 transition-colors ${activeSlot === 1 ? 'border-amber-500' : ''}`}
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-zinc-400">선수 1 선택</p>
            </button>
          )}
        </div>

        {/* Player 2 */}
        <div className="relative">
          {player2 ? (
            <div className="glass-card p-6 border-l-4 border-blue-500">
              <button
                onClick={() => setPlayer2(null)}
                className="absolute top-4 right-4 p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-blue-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{player2.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{player2.name}</h3>
                  <p className="text-zinc-400">{player2.team}</p>
                  <span className={`inline-block px-2 py-0.5 mt-1 rounded text-xs font-bold text-white ${getPositionBadgeClass(player2.position)}`}>
                    {player2.position}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-400">{player2.predictedScore.toFixed(1)}</p>
                <p className="text-sm text-zinc-500">예상 점수</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setActiveSlot(2)}
              className={`glass-card p-8 w-full text-center hover:border-blue-500/30 transition-colors ${activeSlot === 2 ? 'border-blue-500' : ''}`}
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-zinc-400">선수 2 선택</p>
            </button>
          )}
        </div>
      </div>

      {/* Search Dropdown */}
      {activeSlot && (
        <div className="glass-card p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="선수 이름 또는 팀 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4"
              autoFocus
            />
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {searchResults.map(player => (
                <button
                  key={player.id}
                  onClick={() => handleSelectPlayer(player)}
                  className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${getPositionBadgeClass(player.position)}`}>
                      {player.position}
                    </span>
                    <div>
                      <p className="font-bold text-white">{player.name}</p>
                      <p className="text-xs text-zinc-500">{player.team}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold gradient-text">{player.predictedScore.toFixed(1)}</p>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      {getTrendIcon(player.formIndex)}
                      <span>{((normalizeFormIndex(player.formIndex) - 1) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && (
            <p className="text-center text-zinc-500 py-4">검색 결과가 없습니다</p>
          )}
        </div>
      )}

      {/* Comparison Results */}
      {player1 && player2 && (
        <div className="space-y-6">
          {/* Radar Chart */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-400" />
              능력치 비교
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#3F3F46" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#A1A1AA', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#71717A', fontSize: 10 }} />
                <Radar
                  name={player1.name}
                  dataKey="player1"
                  stroke="#FBBF24"
                  fill="#FBBF24"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name={player2.name}
                  dataKey="player2"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Legend
                  wrapperStyle={{ color: '#fff', paddingTop: '20px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Comparison */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              상세 비교
            </h3>
            <div className="space-y-4">
              {comparisonSummary?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  {/* Player 1 Value */}
                  <div className={`flex-1 text-right ${item.winner === 1 ? 'font-bold' : ''}`}>
                    <span className={item.winner === 1 ? 'text-amber-400' : 'text-zinc-400'}>
                      {item.format(item.p1)}
                    </span>
                    {item.winner === 1 && <span className="ml-2 text-green-400">+</span>}
                  </div>

                  {/* Label */}
                  <div className="w-24 text-center">
                    <span className="text-sm text-zinc-500">{item.label}</span>
                  </div>

                  {/* Player 2 Value */}
                  <div className={`flex-1 ${item.winner === 2 ? 'font-bold' : ''}`}>
                    {item.winner === 2 && <span className="mr-2 text-green-400">+</span>}
                    <span className={item.winner === 2 ? 'text-blue-400' : 'text-zinc-400'}>
                      {item.format(item.p2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-6 border-t border-[rgba(251,191,36,0.1)]">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-amber-400">
                    {comparisonSummary?.filter(i => i.winner === 1).length || 0}
                  </p>
                  <p className="text-sm text-zinc-500">{player1.name} 우위</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-400">
                    {comparisonSummary?.filter(i => i.winner === 2).length || 0}
                  </p>
                  <p className="text-sm text-zinc-500">{player2.name} 우위</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="glass-card p-4">
            <p className="text-sm text-zinc-400">
              <span className="text-amber-400 font-bold">AI 분석:</span>{' '}
              {player1.predictedScore > player2.predictedScore ? (
                <>다음 라운드 예상 점수 기준으로 <span className="text-amber-400 font-bold">{player1.name}</span>이(가) {(player1.predictedScore - player2.predictedScore).toFixed(1)}점 높은 활약이 예상됩니다.</>
              ) : player1.predictedScore < player2.predictedScore ? (
                <>다음 라운드 예상 점수 기준으로 <span className="text-blue-400 font-bold">{player2.name}</span>이(가) {(player2.predictedScore - player1.predictedScore).toFixed(1)}점 높은 활약이 예상됩니다.</>
              ) : (
                <>두 선수의 예상 점수가 동일합니다. 최근 폼과 상대팀 상성을 추가로 고려해보세요.</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!player1 || !player2) && !activeSlot && (
        <div className="glass-card p-12 text-center">
          <Scale className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">두 선수를 선택하세요</h3>
          <p className="text-zinc-400">위에서 비교할 선수를 선택하면 상세 분석 결과를 확인할 수 있습니다.</p>
        </div>
      )}
    </div>
  );
}
