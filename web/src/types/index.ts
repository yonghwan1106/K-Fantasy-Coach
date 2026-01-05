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
