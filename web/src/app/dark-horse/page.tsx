'use client';

import { useState, useEffect } from 'react';
import { Zap, TrendingUp, Target, Info } from 'lucide-react';

interface DarkHorse {
  id: number;
  name: string;
  team: string;
  position: string;
  formSurge: number;
  recent3Avg: number;
  seasonAvg: number;
  matchesPlayed: number;
  reason: string;
  predictedRank: number;
}

export default function DarkHorsePage() {
  const [darkHorses, setDarkHorses] = useState<DarkHorse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/dark_horses.json')
      .then(r => r.json())
      .then(data => {
        setDarkHorses(data);
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
          <Zap className="w-8 h-8 text-amber-400" />
          다크호스
        </h1>
        <p className="text-zinc-400">저평가되었지만 폼이 급상승 중인 숨은 강자들</p>
      </div>

      {/* 다크호스 조건 설명 */}
      <div className="glass-card p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-zinc-400">
          <p className="font-bold text-white mb-1">다크호스 선정 조건</p>
          <ul className="space-y-1">
            <li>1. 최근 3경기 평균이 시즌 평균 대비 30% 이상 상승</li>
            <li>2. 출장 경기수 15경기 미만 (인지도 낮음)</li>
            <li>3. 예측 순위 상위 30% 이내</li>
          </ul>
        </div>
      </div>

      {/* Dark Horses Grid */}
      {darkHorses.length > 0 ? (
        <div className="grid grid-cols-2 gap-6">
          {darkHorses.map((dh, index) => (
            <div
              key={dh.id}
              className="dark-horse-badge rounded-xl p-6 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-black font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{dh.name}</h3>
                      <p className="text-zinc-400">{dh.team} / {dh.position}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-bold">
                    {dh.position}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-zinc-900/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-2xl font-bold gradient-text">
                        +{((dh.formSurge - 1) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">폼 상승률</p>
                  </div>

                  <div className="text-center p-3 bg-zinc-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-white">{dh.recent3Avg.toFixed(1)}</p>
                    <p className="text-xs text-zinc-500">최근 3경기</p>
                  </div>

                  <div className="text-center p-3 bg-zinc-900/50 rounded-lg">
                    <p className="text-2xl font-bold text-zinc-400">{dh.seasonAvg.toFixed(1)}</p>
                    <p className="text-xs text-zinc-500">시즌 평균</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>폼 상승률</span>
                    <span>{((dh.formSurge - 1) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-gold rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((dh.formSurge - 1) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Reason */}
                <div className="flex items-start gap-2 p-3 bg-zinc-900/30 rounded-lg">
                  <Target className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-zinc-300">{dh.reason}</p>
                </div>

                {/* Additional Info */}
                <div className="mt-4 flex justify-between text-sm text-zinc-500">
                  <span>출장: {dh.matchesPlayed}경기</span>
                  <span>예측 순위: #{dh.predictedRank}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Zap className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">다크호스가 없습니다</h3>
          <p className="text-zinc-400">현재 조건을 충족하는 다크호스 선수가 없습니다.</p>
        </div>
      )}

      {/* Legend */}
      <div className="glass-card p-4">
        <p className="text-sm text-zinc-400">
          <span className="text-amber-400 font-bold">TIP:</span> 다크호스는 대중에게 덜 알려졌지만 최근 폼이 급상승 중인 선수들입니다.
          판타지 리그에서 차별화된 전략을 위해 활용해보세요!
        </p>
      </div>
    </div>
  );
}
