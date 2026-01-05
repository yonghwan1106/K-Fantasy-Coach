'use client';

import { Info } from 'lucide-react';

interface Contributions {
  recentForm: number;
  seasonAvg: number;
  position: number;
  goals: number;
  assists: number;
}

interface ExplainableAIProps {
  playerName: string;
  predictedScore: number;
  contributions: Contributions;
}

const contributionLabels: Record<keyof Contributions, string> = {
  recentForm: '최근 폼',
  seasonAvg: '시즌 성적',
  position: '포지션 효율',
  goals: '골 기여',
  assists: '어시스트 기여',
};

export default function ExplainableAI({ playerName, predictedScore, contributions }: ExplainableAIProps) {
  // 기여도 정렬 (절대값 기준)
  const sortedContributions = Object.entries(contributions)
    .map(([key, value]) => ({
      key: key as keyof Contributions,
      value,
      label: contributionLabels[key as keyof Contributions],
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const maxValue = Math.max(...sortedContributions.map(c => Math.abs(c.value)), 30);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Info className="w-5 h-5 text-amber-400" />
        <h3 className="font-bold text-white">AI 추천 이유</h3>
      </div>

      <div className="mb-6">
        <p className="text-zinc-400 mb-2">
          <span className="text-white font-bold">{playerName}</span> 선수의 다음 라운드 예상 점수는
        </p>
        <p className="text-4xl font-bold gradient-text">{predictedScore.toFixed(1)}점</p>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-zinc-500 mb-2">기여 요인 분석</p>
        {sortedContributions.map(({ key, value, label }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-300">{label}</span>
              <span className={value >= 0 ? 'text-green-400' : 'text-red-400'}>
                {value >= 0 ? '+' : ''}{value.toFixed(1)}
              </span>
            </div>
            <div className="xai-bar">
              <div
                className={`xai-bar-fill ${value >= 0 ? 'xai-bar-positive' : 'xai-bar-negative'}`}
                style={{ width: `${Math.min(Math.abs(value) / maxValue * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-[rgba(251,191,36,0.1)]">
        <p className="text-xs text-zinc-500">
          * LightGBM 모델 기반 예측 결과입니다. 최근 5경기 성적과 시즌 평균이 주요 예측 요인입니다.
        </p>
      </div>
    </div>
  );
}
