// 선수 데이터 보강 유틸리티
// 가격, 가성비, 출전 정보 등을 동적으로 추가

import { Player, AvailabilityStatus, PlayerAvailability, PlayerHistory, GameHistory } from '@/types';

// 시드 기반 난수 생성 (일관된 데이터 생성용)
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// 가격 생성 함수
export function generatePlayerPrice(player: Player): number {
  const seed = player.id;
  const basePrice = 3; // 최소 3M

  // 예측 점수 기반 가격 (높을수록 비쌈)
  const scoreMultiplier = 0.35;
  const scorePrice = player.predictedScore * scoreMultiplier;

  // 시즌 평균 기반 추가 가격
  const seasonBonus = player.seasonAvg * 0.1;

  // 포지션별 가격 조정
  const positionMultiplier: Record<string, number> = {
    GK: 0.9,
    CB: 1.0,
    LB: 0.95,
    RB: 0.95,
    LWB: 0.95,
    RWB: 0.95,
    DMF: 1.0,
    CMF: 1.05,
    AMF: 1.1,
    LMF: 1.0,
    RMF: 1.0,
    CF: 1.15,
    SS: 1.1,
    LWF: 1.1,
    RWF: 1.1,
  };
  const posMultiplier = positionMultiplier[player.position] || 1.0;

  // 랜덤 변동 (+/- 1M)
  const variance = (seededRandom(seed) - 0.5) * 2;

  const price = (basePrice + scorePrice + seasonBonus) * posMultiplier + variance;

  // 3M ~ 15M 범위로 제한
  return Math.round(Math.max(3, Math.min(15, price)) * 10) / 10;
}

// 가성비 계산
export function calculateValueRating(player: Player, price: number): number {
  return price > 0 ? Math.round((player.predictedScore / price) * 100) / 100 : 0;
}

// 가격 변동 생성 (이전 라운드 대비)
export function generatePriceChange(player: Player): number {
  const seed = player.id + 1000;
  const random = seededRandom(seed);

  // 70% 확률로 변동 없음, 15% 상승, 15% 하락
  if (random < 0.7) return 0;
  if (random < 0.85) return Math.round((seededRandom(seed + 1) * 1.5 + 0.5) * 10) / 10;
  return -Math.round((seededRandom(seed + 2) * 1.5 + 0.5) * 10) / 10;
}

// 출전 상태 생성
export function generateAvailability(player: Player): PlayerAvailability {
  const seed = player.id + 2000;
  const random = seededRandom(seed);

  // 분포: 85% 출전가능, 8% 불투명, 4% 부상, 2% 정지, 1% 대표팀
  let status: AvailabilityStatus = 'available';
  let reason: string | undefined;
  let expectedReturn: string | undefined;

  if (random >= 0.85 && random < 0.93) {
    status = 'doubtful';
    reason = ['가벼운 근육 피로', '발목 염좌', '허벅지 통증', '컨디션 난조'][
      Math.floor(seededRandom(seed + 1) * 4)
    ];
  } else if (random >= 0.93 && random < 0.97) {
    status = 'injured';
    reason = ['햄스트링 부상', '무릎 부상', '발목 인대 손상', '허리 부상'][
      Math.floor(seededRandom(seed + 1) * 4)
    ];
    expectedReturn = `R${28 + Math.floor(seededRandom(seed + 2) * 4)}`;
  } else if (random >= 0.97 && random < 0.99) {
    status = 'suspended';
    reason = ['경고 누적', '퇴장', '징계'][Math.floor(seededRandom(seed + 1) * 3)];
    expectedReturn = `R${28 + Math.floor(seededRandom(seed + 2) * 2)}`;
  } else if (random >= 0.99) {
    status = 'international';
    reason = '국가대표팀 차출';
    expectedReturn = `R${29}`;
  }

  return {
    status,
    reason,
    expectedReturn,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

// 최근 경기 기록 생성
export function generateRecentGames(player: Player, count: number = 5): number[] {
  const seed = player.id + 3000;
  const baseScore = player.seasonAvg;

  return Array.from({ length: count }, (_, i) => {
    const variance = (seededRandom(seed + i) - 0.5) * baseScore * 0.6;
    return Math.round((baseScore + variance) * 10) / 10;
  });
}

// 플레이어 히스토리 생성
export function generatePlayerHistory(player: Player): PlayerHistory {
  const seed = player.id + 4000;
  const teams = [
    '울산 HD', '전북 현대', '포항', 'FC서울', '인천',
    '대구', '강원', '제주', '광주', '대전', '수원FC', '김천'
  ];

  const history: GameHistory[] = Array.from({ length: 10 }, (_, i) => {
    const round = 27 - i;
    const baseSeed = seed + i * 100;
    const score = Math.round(
      (player.seasonAvg + (seededRandom(baseSeed) - 0.5) * player.seasonAvg * 0.6) * 10
    ) / 10;
    const opponent = teams[Math.floor(seededRandom(baseSeed + 1) * teams.length)];
    const home = seededRandom(baseSeed + 2) > 0.5;

    return {
      round,
      score,
      opponent,
      home,
      date: `2024-${9 - Math.floor(i / 4)}-${15 - (i % 4) * 7}`.replace(/-(\d)(?!\d)/g, '-0$1'),
      goals: Math.floor(seededRandom(baseSeed + 3) * 2),
      assists: Math.floor(seededRandom(baseSeed + 4) * 2),
    };
  });

  // 최고/최저 경기 찾기
  const sortedHistory = [...history].sort((a, b) => b.score - a.score);
  const best = sortedHistory[0];
  const worst = sortedHistory[sortedHistory.length - 1];

  // 트렌드 계산 (최근 5경기 vs 이전 5경기)
  const recent5Avg =
    history.slice(0, 5).reduce((sum, g) => sum + g.score, 0) / 5;
  const prev5Avg =
    history.slice(5, 10).reduce((sum, g) => sum + g.score, 0) / 5;

  let trend: 'rising' | 'falling' | 'stable' = 'stable';
  if (recent5Avg > prev5Avg * 1.1) trend = 'rising';
  else if (recent5Avg < prev5Avg * 0.9) trend = 'falling';

  // 일관성 계산 (표준편차 기반)
  const mean = history.reduce((sum, g) => sum + g.score, 0) / history.length;
  const variance =
    history.reduce((sum, g) => sum + Math.pow(g.score - mean, 2), 0) /
    history.length;
  const stdDev = Math.sqrt(variance);
  const consistency = Math.max(0, Math.min(1, 1 - stdDev / mean));

  return {
    playerId: player.id,
    name: player.name,
    history,
    seasonBest: {
      round: best.round,
      score: best.score,
      opponent: best.opponent,
    },
    seasonWorst: {
      round: worst.round,
      score: worst.score,
      opponent: worst.opponent,
    },
    consistency: Math.round(consistency * 100) / 100,
    trend,
    avgLast5: Math.round(recent5Avg * 10) / 10,
    avgLast10: Math.round(mean * 10) / 10,
  };
}

// 전체 선수 데이터 보강
export function enrichPlayerData(player: Player): Player {
  const price = generatePlayerPrice(player);
  const valueRating = calculateValueRating(player, price);
  const priceChange = generatePriceChange(player);
  const availability = generateAvailability(player);
  const recentGames = generateRecentGames(player);

  return {
    ...player,
    price,
    valueRating,
    priceChange,
    availability,
    recentGames,
  };
}

// 여러 선수 데이터 일괄 보강
export function enrichPlayersData(players: Player[]): Player[] {
  return players.map(enrichPlayerData);
}

// 예산 내 선수 필터링
export function filterByBudget(
  players: Player[],
  maxPrice: number
): Player[] {
  return players.filter((p) => (p.price ?? 0) <= maxPrice);
}

// 가성비순 정렬
export function sortByValue(
  players: Player[],
  direction: 'asc' | 'desc' = 'desc'
): Player[] {
  return [...players].sort((a, b) => {
    const valueA = a.valueRating ?? 0;
    const valueB = b.valueRating ?? 0;
    return direction === 'desc' ? valueB - valueA : valueA - valueB;
  });
}

// 출전 가능 선수만 필터링
export function filterAvailable(players: Player[]): Player[] {
  return players.filter(
    (p) => !p.availability || p.availability.status === 'available'
  );
}
