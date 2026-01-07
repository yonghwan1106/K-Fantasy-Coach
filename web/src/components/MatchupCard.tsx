'use client';

import React from 'react';
import { MapPin, Clock, Swords, TrendingUp, Shield, Target } from 'lucide-react';
import { Match, TeamMatchup, HeadToHead, DifficultyLevel } from '@/types';
import DifficultyBadge, { calculateMatchupDifficulty, DifficultyStars } from './DifficultyBadge';

interface MatchupCardProps {
  match: Match;
  homeMatchup?: TeamMatchup;
  awayMatchup?: TeamMatchup;
  headToHead?: HeadToHead;
  onSelectTeam?: (team: string) => void;
  className?: string;
}

export default function MatchupCard({
  match,
  homeMatchup,
  awayMatchup,
  headToHead,
  onSelectTeam,
  className = '',
}: MatchupCardProps) {
  const homeDifficulty = awayMatchup
    ? calculateMatchupDifficulty(awayMatchup.defenseRating, awayMatchup.attackRating, true)
    : 3 as DifficultyLevel;

  const awayDifficulty = homeMatchup
    ? calculateMatchupDifficulty(homeMatchup.defenseRating, homeMatchup.attackRating, false)
    : 3 as DifficultyLevel;

  return (
    <div className={`glass-card p-5 card-interactive ${className}`}>
      {/* 경기 정보 헤더 */}
      <div className="flex items-center justify-between mb-4 text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{match.date} {match.kickoff}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span className="truncate max-w-[150px]">{match.venue}</span>
        </div>
      </div>

      {/* 팀 대결 */}
      <div className="grid grid-cols-3 gap-4 items-center mb-4">
        {/* 홈팀 */}
        <button
          onClick={() => onSelectTeam?.(match.home)}
          className="text-center p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors group"
        >
          <p className="font-bold text-white group-hover:text-gold-400 transition-colors truncate">
            {match.home}
          </p>
          <p className="text-xs text-green-400 mt-1">홈</p>
          {homeMatchup && (
            <div className="mt-2">
              <DifficultyBadge level={homeDifficulty} size="sm" showIcon={false} />
            </div>
          )}
        </button>

        {/* VS */}
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-r from-gold-500 to-orange-500 flex items-center justify-center">
            <Swords className="w-5 h-5 text-black" />
          </div>
          <p className="text-xs text-zinc-500 mt-2">R{match.round}</p>
        </div>

        {/* 어웨이팀 */}
        <button
          onClick={() => onSelectTeam?.(match.away)}
          className="text-center p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors group"
        >
          <p className="font-bold text-white group-hover:text-gold-400 transition-colors truncate">
            {match.away}
          </p>
          <p className="text-xs text-zinc-400 mt-1">원정</p>
          {awayMatchup && (
            <div className="mt-2">
              <DifficultyBadge level={awayDifficulty} size="sm" showIcon={false} />
            </div>
          )}
        </button>
      </div>

      {/* 팀 스탯 비교 */}
      {homeMatchup && awayMatchup && (
        <div className="space-y-2 py-3 border-t border-zinc-800">
          {/* 공격력 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gold-400 font-medium">{homeMatchup.attackRating.toFixed(1)}</span>
            <div className="flex items-center gap-2 text-zinc-500">
              <Target className="w-4 h-4" />
              <span>공격력</span>
            </div>
            <span className="text-gold-400 font-medium">{awayMatchup.attackRating.toFixed(1)}</span>
          </div>

          {/* 수비력 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-400 font-medium">{homeMatchup.defenseRating.toFixed(1)}</span>
            <div className="flex items-center gap-2 text-zinc-500">
              <Shield className="w-4 h-4" />
              <span>수비력</span>
            </div>
            <span className="text-blue-400 font-medium">{awayMatchup.defenseRating.toFixed(1)}</span>
          </div>

          {/* 최근 폼 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-400 font-medium">{homeMatchup.form.toFixed(1)}</span>
            <div className="flex items-center gap-2 text-zinc-500">
              <TrendingUp className="w-4 h-4" />
              <span>최근 폼</span>
            </div>
            <span className="text-green-400 font-medium">{awayMatchup.form.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* 상대 전적 */}
      {headToHead && (
        <div className="pt-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 mb-2">최근 5경기 상대전적</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center">
                {headToHead.last5[0]}
              </span>
              <span className="text-xs text-zinc-400">승</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-zinc-500/20 text-zinc-400 text-xs font-bold flex items-center justify-center">
                {headToHead.last5[1]}
              </span>
              <span className="text-xs text-zinc-400">무</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center">
                {headToHead.last5[2]}
              </span>
              <span className="text-xs text-zinc-400">패</span>
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-zinc-500">
            <span>평균 득점: {headToHead.avgTeam1Goals.toFixed(1)}</span>
            <span>평균 실점: {headToHead.avgTeam2Goals.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 미니 버전 (리스트용)
interface MatchupCardMiniProps {
  match: Match;
  difficulty?: DifficultyLevel;
  className?: string;
}

export function MatchupCardMini({
  match,
  difficulty,
  className = '',
}: MatchupCardMiniProps) {
  return (
    <div className={`flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg ${className}`}>
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <p className="font-medium text-white">{match.home}</p>
          <p className="text-zinc-500">vs {match.away}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right text-xs text-zinc-400">
          <p>{match.date}</p>
          <p>{match.kickoff}</p>
        </div>
        {difficulty && <DifficultyBadge level={difficulty} size="sm" showLabel={false} />}
      </div>
    </div>
  );
}

// 추천 선수 카드 (매치업 기반)
interface RecommendedPlayerCardProps {
  playerName: string;
  team: string;
  position: string;
  predictedScore: number;
  opponent: string;
  difficulty: DifficultyLevel;
  reason: string;
  className?: string;
}

export function RecommendedPlayerCard({
  playerName,
  team,
  position,
  predictedScore,
  opponent,
  difficulty,
  reason,
  className = '',
}: RecommendedPlayerCardProps) {
  return (
    <div className={`glass-card p-4 ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-white">{playerName}</p>
          <p className="text-xs text-zinc-500">{team} / {position}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold gradient-text">{predictedScore.toFixed(1)}</p>
          <p className="text-xs text-zinc-500">예상 점수</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">vs {opponent}</span>
          <DifficultyBadge level={difficulty} size="sm" />
        </div>
      </div>

      <p className="text-xs text-green-400 mt-2">{reason}</p>
    </div>
  );
}
