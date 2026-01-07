// K-Fantasy AI - 공통 타입 정의

export interface Player {
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
  rank?: number;
  // XAI 관련
  contributions?: {
    recent_form: number;
    season_avg: number;
    vs_opponent: number;
    home_advantage: number;
    position_rank: number;
  };
  // 최근 경기 점수 (차트용)
  recentGames?: number[];
  // 가격/예산 시스템 (Phase 2)
  price?: number;           // 단위: 백만원 (예: 5.5 = 5.5M)
  valueRating?: number;     // 가성비 (predictedScore / price)
  priceChange?: number;     // 전 라운드 대비 가격 변동
  // 부상/출전 정보 (Phase 4)
  availability?: PlayerAvailability;
}

// 선수 출전 가능 상태
export type AvailabilityStatus =
  | 'available'      // 출전 가능 (녹색)
  | 'doubtful'       // 출전 불투명 (노랑)
  | 'injured'        // 부상 (빨강)
  | 'suspended'      // 출장 정지 (주황)
  | 'international'; // 대표팀 차출 (파랑)

export interface PlayerAvailability {
  status: AvailabilityStatus;
  reason?: string;           // "햄스트링 부상", "경고 누적" 등
  expectedReturn?: string;   // "R30" 또는 "2024-10-01"
  lastUpdated: string;
}

// 예산 제약
export interface BudgetConstraint {
  totalBudget: number;       // 총 예산 (기본: 100M)
  spentAmount: number;       // 사용 금액
  remainingBudget: number;   // 남은 예산
}

// 예산 포함 저장된 팀
export interface SavedTeamWithBudget extends SavedTeam {
  totalCost: number;         // 팀 총 비용
  budget: number;            // 선택한 예산
  valueScore: number;        // 총 예측점수 / 총 비용
}

export interface DarkHorse {
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

export interface Team {
  id: string;
  name: string;
  avgScore: number;
  playerCount: number;
  topPlayer?: Player;
  color?: string;
}

export interface Summary {
  totalPlayers: number;
  totalDarkHorses: number;
  avgPredictedScore: number;
  topPredictedPlayer: Player | null;
  currentRound: number;
}

export interface PositionRanking {
  position: string;
  players: Player[];
}

// 팀 빌더 관련
export type Formation = '4-3-3' | '4-4-2' | '3-5-2';

export interface SavedTeam {
  id: string;
  name: string;
  formation: Formation;
  players: Record<string, Player>;
  totalScore: number;
  createdAt: string;
}

// 포지션 그룹 유틸리티
export const getPositionGroup = (position: string): 'GK' | 'DF' | 'MF' | 'FW' => {
  if (position === 'GK') return 'GK';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) return 'DF';
  if (['DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'CM'].includes(position)) return 'MF';
  return 'FW';
};

// 폼 지수 정규화 (이상치 처리)
export const normalizeFormIndex = (formIndex: number): number => {
  if (formIndex > 3) return 3; // 상한선 300%
  if (formIndex < 0.3) return 0.3; // 하한선 30%
  return formIndex;
};

// K리그 팀 목록
export const K_LEAGUE_TEAMS = [
  { id: 'ulsan', name: '울산 HD', color: '#004A9F' },
  { id: 'jeonbuk', name: '전북 현대', color: '#1F5C29' },
  { id: 'pohang', name: '포항 스틸러스', color: '#D60F23' },
  { id: 'suwon', name: '수원 삼성', color: '#004899' },
  { id: 'seoul', name: 'FC 서울', color: '#B71234' },
  { id: 'incheon', name: '인천 유나이티드', color: '#003D7D' },
  { id: 'daegu', name: '대구 FC', color: '#1A2674' },
  { id: 'gangwon', name: '강원 FC', color: '#F36F21' },
  { id: 'jeju', name: '제주 유나이티드', color: '#FF6600' },
  { id: 'gwangju', name: '광주 FC', color: '#FFCC00' },
  { id: 'daejeon', name: '대전 시티즌', color: '#7B2D8E' },
  { id: 'suwonfc', name: '수원 FC', color: '#00A3E0' },
];

// ========================================
// Phase 3: 일정/매치업 관련 타입
// ========================================

export interface Match {
  id: string;
  round: number;
  home: string;
  away: string;
  homeRating: number;      // 홈팀 공격력
  awayRating: number;      // 어웨이팀 공격력
  kickoff: string;         // "14:00"
  date: string;            // "2024-09-14"
  venue: string;
  status: 'scheduled' | 'live' | 'finished';
  homeScore?: number;
  awayScore?: number;
}

export interface Round {
  round: number;
  date: string;
  matches: Match[];
}

export interface Schedule {
  currentRound: number;
  rounds: Round[];
}

export interface TeamMatchup {
  teamId: string;
  teamName: string;
  attackRating: number;     // 공격력 (1-5)
  defenseRating: number;    // 수비력 (1-5)
  homeAdvantage: number;    // 홈 이점 배율 (1.0-1.3)
  form: number;             // 최근 폼 (1-5)
  weakAgainst: string[];    // 상대하기 어려운 팀
  strongAgainst: string[];  // 상대하기 쉬운 팀
}

export interface HeadToHead {
  team1: string;
  team2: string;
  last5: [number, number, number]; // [team1 승, 무, team2 승]
  avgTeam1Goals: number;
  avgTeam2Goals: number;
  lastMeetingDate: string;
}

export interface Matchups {
  teamMatchups: Record<string, TeamMatchup>;
  headToHead: Record<string, HeadToHead>;
}

// 난이도 레벨 (1: 매우 쉬움 ~ 5: 매우 어려움)
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export const getDifficultyLabel = (level: DifficultyLevel): string => {
  const labels = {
    1: '매우 쉬움',
    2: '쉬움',
    3: '보통',
    4: '어려움',
    5: '매우 어려움',
  };
  return labels[level];
};

export const getDifficultyColor = (level: DifficultyLevel): string => {
  const colors = {
    1: '#22C55E',
    2: '#84CC16',
    3: '#FBBF24',
    4: '#F97316',
    5: '#EF4444',
  };
  return colors[level];
};

// ========================================
// Phase 5: 히스토리/트렌드 관련 타입
// ========================================

export interface GameHistory {
  round: number;
  score: number;
  opponent: string;
  home: boolean;
  date: string;
  goals?: number;
  assists?: number;
  cleanSheet?: boolean;
}

export interface PlayerHistory {
  playerId: number;
  name: string;
  history: GameHistory[];
  seasonBest: {
    round: number;
    score: number;
    opponent: string;
  };
  seasonWorst: {
    round: number;
    score: number;
    opponent: string;
  };
  consistency: number;    // 0-1 (높을수록 꾸준함)
  trend: 'rising' | 'falling' | 'stable';
  avgLast5: number;
  avgLast10: number;
}

export type TrendDirection = 'rising' | 'falling' | 'stable';

export const getTrendIcon = (trend: TrendDirection): string => {
  const icons = {
    rising: '📈',
    falling: '📉',
    stable: '➡️',
  };
  return icons[trend];
};

export const getTrendLabel = (trend: TrendDirection): string => {
  const labels = {
    rising: '상승세',
    falling: '하락세',
    stable: '유지',
  };
  return labels[trend];
};

// ========================================
// 유틸리티 함수
// ========================================

// 가격 등급 계산
export const getPriceLevel = (price: number): 'high' | 'medium' | 'low' => {
  if (price >= 10) return 'high';
  if (price >= 6) return 'medium';
  return 'low';
};

// 가성비 등급 계산
export const getValueLevel = (valueRating: number): 'excellent' | 'good' | 'poor' => {
  if (valueRating >= 3) return 'excellent';
  if (valueRating >= 2) return 'good';
  return 'poor';
};

// 출전 상태 라벨
export const getAvailabilityLabel = (status: AvailabilityStatus): string => {
  const labels = {
    available: '출전 가능',
    doubtful: '출전 불투명',
    injured: '부상',
    suspended: '출장 정지',
    international: '대표팀 차출',
  };
  return labels[status];
};

// 출전 상태 색상
export const getAvailabilityColor = (status: AvailabilityStatus): string => {
  const colors = {
    available: '#22C55E',
    doubtful: '#FBBF24',
    injured: '#EF4444',
    suspended: '#F97316',
    international: '#3B82F6',
  };
  return colors[status];
};
