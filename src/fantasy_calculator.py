"""
K-Fantasy AI - 판타지 점수 계산 시스템
======================================
K리그 경기 이벤트 데이터를 기반으로 선수별 판타지 점수를 산정합니다.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple
import json

# 경로 설정
BASE_PATH = Path(r"C:\Users\user\Desktop\공모전 모음\0112 K리그-서울시립대 공개 AI 경진대회_120만")
DATA_PATH = BASE_PATH / "_shared" / "data"
OUTPUT_PATH = BASE_PATH / "Track2_K-Fantasy-Coach" / "outputs"

# 출력 폴더 생성
OUTPUT_PATH.mkdir(parents=True, exist_ok=True)


# ============================================================================
# 판타지 점수 설정
# ============================================================================

FANTASY_POINTS = {
    # 공격 지표
    'Goal': 10.0,                    # 골
    'Shot_on_target': 2.0,           # 유효 슈팅 (성공한 슈팅)
    'Shot': 1.0,                     # 슈팅 시도
    'Assist': 5.0,                   # 어시스트
    'Pass_Key': 2.0,                 # 키패스 (슈팅으로 이어진 패스)

    # 패스 지표
    'Pass_Successful': 0.1,          # 성공 패스
    'Pass_Failed': -0.05,            # 실패 패스

    # 드리블/캐리
    'Carry': 0.05,                   # 볼 캐리
    'Carry_Progressive': 0.3,        # 전진 캐리 (10m 이상)

    # 수비 지표
    'Tackle_Successful': 1.5,        # 성공 태클
    'Tackle_Failed': -0.3,           # 실패 태클
    'Interception': 1.5,             # 인터셉션
    'Block': 1.0,                    # 블록
    'Clearance': 0.5,                # 클리어런스
    'Recovery': 0.3,                 # 볼 회수

    # 경합
    'Duel_Won': 1.0,                 # 경합 승리
    'Duel_Lost': -0.2,               # 경합 패배
}

# 포지션별 보정 계수
POSITION_MULTIPLIERS = {
    'GK': {'defensive': 1.5, 'offensive': 0.3},
    'CB': {'defensive': 1.3, 'offensive': 0.7},
    'RB': {'defensive': 1.1, 'offensive': 0.9},
    'LB': {'defensive': 1.1, 'offensive': 0.9},
    'RWB': {'defensive': 1.0, 'offensive': 1.0},
    'LWB': {'defensive': 1.0, 'offensive': 1.0},
    'CDM': {'defensive': 1.2, 'offensive': 0.8},
    'CM': {'defensive': 1.0, 'offensive': 1.0},
    'CAM': {'defensive': 0.7, 'offensive': 1.3},
    'RM': {'defensive': 0.8, 'offensive': 1.2},
    'LM': {'defensive': 0.8, 'offensive': 1.2},
    'RW': {'defensive': 0.6, 'offensive': 1.4},
    'LW': {'defensive': 0.6, 'offensive': 1.4},
    'CF': {'defensive': 0.5, 'offensive': 1.5},
    'ST': {'defensive': 0.4, 'offensive': 1.6},
}


class FantasyCalculator:
    """K리그 판타지 점수 계산기"""

    def __init__(self):
        self.raw_data = None
        self.match_info = None
        self.player_stats = None
        self.fantasy_scores = None

    def load_data(self):
        """데이터 로드"""
        print("데이터 로드 중...")

        # raw_data.csv 로드
        self.raw_data = pd.read_csv(DATA_PATH / "raw_data.csv")
        print(f"  - raw_data: {len(self.raw_data):,}건")

        # match_info.csv 로드
        self.match_info = pd.read_csv(DATA_PATH / "match_info.csv")
        print(f"  - match_info: {len(self.match_info):,}경기")

        # 컬럼명 확인
        print(f"  - raw_data 컬럼: {list(self.raw_data.columns)}")

        return self

    def detect_goals(self) -> pd.DataFrame:
        """
        골 감지
        - type_name이 'Shot'이고 result_name이 'Goal'인 이벤트
        """
        goals = self.raw_data[
            (self.raw_data['type_name'] == 'Shot') &
            (self.raw_data['result_name'] == 'Goal')
        ].copy()

        print(f"  - 감지된 골: {len(goals)}개")
        return goals

    def detect_assists(self, goals: pd.DataFrame) -> pd.DataFrame:
        """
        어시스트 감지
        - 골 이벤트 직전 10초 이내의 성공 패스
        - 같은 팀, 같은 경기, 같은 에피소드
        """
        assists = []

        for _, goal in goals.iterrows():
            game_id = goal['game_id']
            team_id = goal['team_id']
            episode_id = goal.get('episode_id', None)
            goal_time = goal['time_seconds']
            goal_player = goal['player_id']

            # 같은 경기, 같은 팀, 골 직전 10초 이내의 성공 패스 찾기
            mask = (
                (self.raw_data['game_id'] == game_id) &
                (self.raw_data['team_id'] == team_id) &
                (self.raw_data['type_name'] == 'Pass') &
                (self.raw_data['result_name'] == 'Successful') &
                (self.raw_data['time_seconds'] >= goal_time - 10) &
                (self.raw_data['time_seconds'] < goal_time) &
                (self.raw_data['player_id'] != goal_player)  # 골 넣은 선수 제외
            )

            # 에피소드가 있으면 같은 에피소드로 제한
            if episode_id is not None and 'episode_id' in self.raw_data.columns:
                mask = mask & (self.raw_data['episode_id'] == episode_id)

            potential_assists = self.raw_data[mask].copy()

            if len(potential_assists) > 0:
                # 가장 마지막 패스가 어시스트
                last_pass = potential_assists.sort_values('time_seconds').iloc[-1]
                assists.append({
                    'game_id': game_id,
                    'player_id': last_pass['player_id'],
                    'player_name_ko': last_pass.get('player_name_ko', 'Unknown'),
                    'team_id': team_id,
                    'time_seconds': last_pass['time_seconds'],
                    'goal_scorer_id': goal_player
                })

        assists_df = pd.DataFrame(assists)
        print(f"  - 감지된 어시스트: {len(assists_df)}개")
        return assists_df

    def detect_key_passes(self) -> pd.DataFrame:
        """
        키패스 감지: 슈팅으로 이어진 패스
        """
        key_passes = []

        # 모든 슈팅 이벤트
        shots = self.raw_data[self.raw_data['type_name'] == 'Shot'].copy()

        for _, shot in shots.iterrows():
            game_id = shot['game_id']
            team_id = shot['team_id']
            shot_time = shot['time_seconds']
            shot_player = shot['player_id']

            # 슈팅 직전 5초 이내의 성공 패스
            mask = (
                (self.raw_data['game_id'] == game_id) &
                (self.raw_data['team_id'] == team_id) &
                (self.raw_data['type_name'] == 'Pass') &
                (self.raw_data['result_name'] == 'Successful') &
                (self.raw_data['time_seconds'] >= shot_time - 5) &
                (self.raw_data['time_seconds'] < shot_time) &
                (self.raw_data['player_id'] != shot_player)
            )

            potential_key = self.raw_data[mask]

            if len(potential_key) > 0:
                last_pass = potential_key.sort_values('time_seconds').iloc[-1]
                key_passes.append({
                    'game_id': game_id,
                    'player_id': last_pass['player_id'],
                    'time_seconds': last_pass['time_seconds']
                })

        key_passes_df = pd.DataFrame(key_passes)
        print(f"  - 감지된 키패스: {len(key_passes_df)}개")
        return key_passes_df

    def calculate_player_event_counts(self) -> pd.DataFrame:
        """선수별 이벤트 카운트 집계"""
        print("\n선수별 이벤트 집계 중...")

        # 기본 집계
        events = []

        # 선수별, 경기별 그룹화
        grouped = self.raw_data.groupby(['game_id', 'player_id'])

        for (game_id, player_id), group in grouped:
            player_name = group['player_name_ko'].iloc[0] if 'player_name_ko' in group.columns else 'Unknown'
            team_name = group['team_name_ko'].iloc[0] if 'team_name_ko' in group.columns else 'Unknown'
            position = group['main_position'].iloc[0] if 'main_position' in group.columns else 'Unknown'

            event = {
                'game_id': game_id,
                'player_id': player_id,
                'player_name_ko': player_name,
                'team_name_ko': team_name,
                'main_position': position,

                # 슈팅
                'shots': len(group[group['type_name'] == 'Shot']),
                'shots_on_target': len(group[(group['type_name'] == 'Shot') & (group['result_name'] == 'Successful')]),
                'goals': len(group[(group['type_name'] == 'Shot') & (group['result_name'] == 'Goal')]),

                # 패스
                'passes_total': len(group[group['type_name'] == 'Pass']),
                'passes_successful': len(group[(group['type_name'] == 'Pass') & (group['result_name'] == 'Successful')]),
                'passes_failed': len(group[(group['type_name'] == 'Pass') & (group['result_name'] == 'Unsuccessful')]),

                # 드리블/캐리
                'carries': len(group[group['type_name'] == 'Carry']),

                # 수비
                'tackles_total': len(group[group['type_name'] == 'Tackle']),
                'tackles_successful': len(group[(group['type_name'] == 'Tackle') & (group['result_name'] == 'Successful')]),
                'interceptions': len(group[group['type_name'] == 'Interception']),
                'blocks': len(group[group['type_name'] == 'Block']),
                'clearances': len(group[group['type_name'] == 'Clearance']),
                'recoveries': len(group[group['type_name'] == 'Recovery']),

                # 경합
                'duels_total': len(group[group['type_name'] == 'Duel']),
                'duels_won': len(group[(group['type_name'] == 'Duel') & (group['result_name'] == 'Successful')]),
            }

            # 전진 캐리 계산 (end_x > start_x + 10)
            carries = group[group['type_name'] == 'Carry']
            if len(carries) > 0 and 'start_x' in carries.columns and 'end_x' in carries.columns:
                progressive = carries[carries['end_x'] > carries['start_x'] + 10]
                event['carries_progressive'] = len(progressive)
            else:
                event['carries_progressive'] = 0

            events.append(event)

        events_df = pd.DataFrame(events)
        print(f"  - 선수-경기 조합: {len(events_df):,}건")

        return events_df

    def calculate_fantasy_scores(self, events_df: pd.DataFrame, assists_df: pd.DataFrame, key_passes_df: pd.DataFrame) -> pd.DataFrame:
        """판타지 점수 계산"""
        print("\n판타지 점수 계산 중...")

        # 어시스트 카운트 추가
        assist_counts = assists_df.groupby(['game_id', 'player_id']).size().reset_index(name='assists')
        events_df = events_df.merge(assist_counts, on=['game_id', 'player_id'], how='left')
        events_df['assists'] = events_df['assists'].fillna(0).astype(int)

        # 키패스 카운트 추가
        key_pass_counts = key_passes_df.groupby(['game_id', 'player_id']).size().reset_index(name='key_passes')
        events_df = events_df.merge(key_pass_counts, on=['game_id', 'player_id'], how='left')
        events_df['key_passes'] = events_df['key_passes'].fillna(0).astype(int)

        # 판타지 점수 계산
        events_df['fantasy_score'] = (
            events_df['goals'] * FANTASY_POINTS['Goal'] +
            events_df['shots_on_target'] * FANTASY_POINTS['Shot_on_target'] +
            events_df['shots'] * FANTASY_POINTS['Shot'] +
            events_df['assists'] * FANTASY_POINTS['Assist'] +
            events_df['key_passes'] * FANTASY_POINTS['Pass_Key'] +
            events_df['passes_successful'] * FANTASY_POINTS['Pass_Successful'] +
            events_df['passes_failed'] * FANTASY_POINTS['Pass_Failed'] +
            events_df['carries'] * FANTASY_POINTS['Carry'] +
            events_df['carries_progressive'] * FANTASY_POINTS['Carry_Progressive'] +
            events_df['tackles_successful'] * FANTASY_POINTS['Tackle_Successful'] +
            (events_df['tackles_total'] - events_df['tackles_successful']) * FANTASY_POINTS['Tackle_Failed'] +
            events_df['interceptions'] * FANTASY_POINTS['Interception'] +
            events_df['blocks'] * FANTASY_POINTS['Block'] +
            events_df['clearances'] * FANTASY_POINTS['Clearance'] +
            events_df['recoveries'] * FANTASY_POINTS['Recovery'] +
            events_df['duels_won'] * FANTASY_POINTS['Duel_Won'] +
            (events_df['duels_total'] - events_df['duels_won']) * FANTASY_POINTS['Duel_Lost']
        )

        # 포지션 보정 (선택사항 - 일단 제외)
        # events_df['fantasy_score'] = events_df.apply(self._apply_position_multiplier, axis=1)

        print(f"  - 평균 판타지 점수: {events_df['fantasy_score'].mean():.2f}")
        print(f"  - 최고 판타지 점수: {events_df['fantasy_score'].max():.2f}")

        return events_df

    def aggregate_player_stats(self, fantasy_df: pd.DataFrame) -> pd.DataFrame:
        """선수별 시즌 통계 집계"""
        print("\n선수별 시즌 통계 집계 중...")

        # 선수별 집계
        agg_dict = {
            'player_name_ko': 'first',
            'team_name_ko': 'first',
            'main_position': 'first',
            'game_id': 'count',  # 출전 경기 수
            'fantasy_score': ['sum', 'mean', 'std', 'max'],
            'goals': 'sum',
            'assists': 'sum',
            'shots': 'sum',
            'shots_on_target': 'sum',
            'passes_successful': 'sum',
            'passes_total': 'sum',
            'key_passes': 'sum',
            'tackles_successful': 'sum',
            'interceptions': 'sum',
            'duels_won': 'sum',
            'duels_total': 'sum',
        }

        player_stats = fantasy_df.groupby('player_id').agg(agg_dict)
        player_stats.columns = ['_'.join(col).strip('_') for col in player_stats.columns]
        player_stats = player_stats.reset_index()

        # 컬럼 이름 정리
        player_stats = player_stats.rename(columns={
            'player_name_ko_first': 'player_name_ko',
            'team_name_ko_first': 'team_name_ko',
            'main_position_first': 'main_position',
            'game_id_count': 'matches_played',
            'fantasy_score_sum': 'total_fantasy_score',
            'fantasy_score_mean': 'avg_fantasy_score',
            'fantasy_score_std': 'std_fantasy_score',
            'fantasy_score_max': 'max_fantasy_score',
            'goals_sum': 'total_goals',
            'assists_sum': 'total_assists',
            'shots_sum': 'total_shots',
            'shots_on_target_sum': 'total_shots_on_target',
            'passes_successful_sum': 'total_passes_successful',
            'passes_total_sum': 'total_passes',
            'key_passes_sum': 'total_key_passes',
            'tackles_successful_sum': 'total_tackles',
            'interceptions_sum': 'total_interceptions',
            'duels_won_sum': 'total_duels_won',
            'duels_total_sum': 'total_duels',
        })

        # 패스 성공률 계산
        player_stats['pass_success_rate'] = (
            player_stats['total_passes_successful'] /
            player_stats['total_passes'].replace(0, 1) * 100
        ).round(1)

        # 경합 승률 계산
        player_stats['duel_win_rate'] = (
            player_stats['total_duels_won'] /
            player_stats['total_duels'].replace(0, 1) * 100
        ).round(1)

        # 슈팅 결정력 계산
        player_stats['shot_conversion'] = (
            player_stats['total_goals'] /
            player_stats['total_shots'].replace(0, 1) * 100
        ).round(1)

        # 정렬
        player_stats = player_stats.sort_values('avg_fantasy_score', ascending=False)

        print(f"  - 총 선수 수: {len(player_stats)}명")

        return player_stats

    def calculate_recent_form(self, fantasy_df: pd.DataFrame, n_matches: int = 5) -> pd.DataFrame:
        """최근 N경기 폼 계산"""
        print(f"\n최근 {n_matches}경기 폼 계산 중...")

        # 경기 날짜 정보 추가
        fantasy_df = fantasy_df.merge(
            self.match_info[['game_id', 'game_date']],
            on='game_id',
            how='left'
        )

        # 최근 N경기 평균 계산
        recent_form = []

        for player_id in fantasy_df['player_id'].unique():
            player_data = fantasy_df[fantasy_df['player_id'] == player_id].copy()
            player_data = player_data.sort_values('game_date', ascending=False)

            recent_n = player_data.head(n_matches)

            if len(recent_n) >= 3:  # 최소 3경기 이상
                recent_form.append({
                    'player_id': player_id,
                    f'recent_{n_matches}_avg': recent_n['fantasy_score'].mean(),
                    f'recent_{n_matches}_matches': len(recent_n),
                    'last_match_score': recent_n.iloc[0]['fantasy_score'] if len(recent_n) > 0 else 0,
                })

        recent_form_df = pd.DataFrame(recent_form)
        print(f"  - 폼 계산 선수: {len(recent_form_df)}명")

        return recent_form_df

    def run(self):
        """전체 파이프라인 실행"""
        print("=" * 60)
        print("K-Fantasy AI - 판타지 점수 계산 시작")
        print("=" * 60)

        # 1. 데이터 로드
        self.load_data()

        # 2. 골/어시스트/키패스 감지
        print("\n이벤트 감지 중...")
        goals = self.detect_goals()
        assists = self.detect_assists(goals)
        key_passes = self.detect_key_passes()

        # 3. 선수별 이벤트 집계
        events_df = self.calculate_player_event_counts()

        # 4. 판타지 점수 계산
        fantasy_df = self.calculate_fantasy_scores(events_df, assists, key_passes)

        # 5. 선수별 시즌 통계 집계
        player_stats = self.aggregate_player_stats(fantasy_df)

        # 6. 최근 폼 계산
        recent_form = self.calculate_recent_form(fantasy_df, n_matches=5)

        # 7. 통합
        player_stats = player_stats.merge(recent_form, on='player_id', how='left')

        # 8. 폼 지수 계산 (최근 5경기 평균 / 시즌 평균)
        player_stats['form_index'] = (
            player_stats['recent_5_avg'] /
            player_stats['avg_fantasy_score'].replace(0, 1)
        ).round(2)

        # 9. 트렌드 판단
        player_stats['trend'] = player_stats['form_index'].apply(
            lambda x: 'up' if x > 1.1 else ('down' if x < 0.9 else 'stable')
        )

        # 저장
        self.fantasy_scores = fantasy_df
        self.player_stats = player_stats

        # CSV 저장
        fantasy_df.to_csv(OUTPUT_PATH / "fantasy_scores_by_match.csv", index=False, encoding='utf-8-sig')
        player_stats.to_csv(OUTPUT_PATH / "player_fantasy_stats.csv", index=False, encoding='utf-8-sig')

        print("\n" + "=" * 60)
        print("판타지 점수 계산 완료!")
        print(f"  - 경기별 점수: {OUTPUT_PATH / 'fantasy_scores_by_match.csv'}")
        print(f"  - 선수별 통계: {OUTPUT_PATH / 'player_fantasy_stats.csv'}")
        print("=" * 60)

        # 상위 10명 출력
        print("\n판타지 점수 TOP 10:")
        print("-" * 60)
        top10 = player_stats.head(10)[['player_name_ko', 'team_name_ko', 'main_position',
                                        'matches_played', 'avg_fantasy_score', 'total_goals',
                                        'total_assists', 'form_index', 'trend']]
        print(top10.to_string(index=False))

        return self


if __name__ == "__main__":
    calculator = FantasyCalculator()
    calculator.run()
