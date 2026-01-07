'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Player, PlayerAvailability, getAvailabilityColor } from '@/types';
import { AvailabilityIcon } from './AvailabilityBadge';
import { PriceTag } from './ValueRatingBadge';

interface PlayerCardProps {
  player: Player & { rank?: number };
  showRank?: boolean;
  showPrice?: boolean;
  showAvailability?: boolean;
  onClick?: () => void;
}

const getPositionBadgeClass = (position: string) => {
  if (position === 'GK') return 'badge-gk';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) return 'badge-df';
  if (['DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'CM'].includes(position)) return 'badge-mf';
  return 'badge-fw';
};

const getTrendIcon = (formIndex: number) => {
  if (formIndex > 1.1) return <TrendingUp className="w-4 h-4 text-green-400" />;
  if (formIndex < 0.9) return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-zinc-500" />;
};

export default function PlayerCard({
  player,
  showRank = false,
  showPrice = true,
  showAvailability = true,
  onClick
}: PlayerCardProps) {
  const isUnavailable = player.availability && player.availability.status !== 'available';

  return (
    <div
      className={`player-card p-4 cursor-pointer relative ${isUnavailable ? 'opacity-80' : ''}`}
      onClick={onClick}
    >
      {/* 출전 상태 아이콘 (우상단) */}
      {showAvailability && player.availability && player.availability.status !== 'available' && (
        <div
          className="absolute top-2 right-2 z-10"
          title={player.availability.reason || '출전 불확실'}
        >
          <AvailabilityIcon availability={player.availability} size="md" />
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {showRank && player.rank && (
            <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-black font-bold text-sm">
              {player.rank}
            </div>
          )}
          <div>
            <h3 className="font-bold text-white">{player.name}</h3>
            <p className="text-sm text-zinc-500">{player.team}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getPositionBadgeClass(player.position)}`}>
          {player.position}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-2xl font-bold gradient-text">{player.predictedScore.toFixed(1)}</p>
          <p className="text-xs text-zinc-500">예상 점수</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-300">{player.recentAvg.toFixed(1)}</p>
          <p className="text-xs text-zinc-500">최근 5경기</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-300">{player.seasonAvg.toFixed(1)}</p>
          <p className="text-xs text-zinc-500">시즌 평균</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[rgba(251,191,36,0.1)]">
        <div className="flex items-center gap-2">
          {getTrendIcon(player.formIndex)}
          <span className="text-sm text-zinc-400">
            폼 {(player.formIndex * 100 - 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          {showPrice && player.price !== undefined ? (
            <PriceTag price={player.price} priceChange={player.priceChange} size="sm" />
          ) : (
            <>
              <span>{player.totalGoals}G</span>
              <span>{player.totalAssists}A</span>
              <span>{player.matchesPlayed}경기</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
