#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
K-Fantasy AI - JSON 내보내기
=============================
웹앱용 JSON 데이터 생성
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path
from datetime import datetime

# 경로 설정
BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / 'outputs'
WEB_DATA_DIR = BASE_DIR / 'web' / 'src' / 'data'


def clean_for_json(obj):
    """JSON 변환을 위한 데이터 정리"""
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(i) for i in obj]
    elif isinstance(obj, (np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.float64, np.float32)):
        if np.isnan(obj) or np.isinf(obj):
            return 0.0
        return round(float(obj), 2)
    elif pd.isna(obj):
        return None
    else:
        return obj


def load_all_data():
    """모든 CSV 데이터 로드"""
    print("CSV 데이터 로드 중...")

    data = {}

    # 선수 판타지 통계
    data['player_stats'] = pd.read_csv(OUTPUT_DIR / 'player_fantasy_stats.csv')
    print(f"  - player_stats: {len(data['player_stats'])}건")

    # 예측 결과
    data['predictions'] = pd.read_csv(OUTPUT_DIR / 'predictions.csv')
    print(f"  - predictions: {len(data['predictions'])}건")

    # 다크호스
    try:
        data['dark_horses'] = pd.read_csv(OUTPUT_DIR / 'dark_horses.csv')
        print(f"  - dark_horses: {len(data['dark_horses'])}건")
    except FileNotFoundError:
        data['dark_horses'] = pd.DataFrame()
        print("  - dark_horses: 없음")

    # 급상승 선수
    try:
        data['rising_stars'] = pd.read_csv(OUTPUT_DIR / 'rising_stars.csv')
        print(f"  - rising_stars: {len(data['rising_stars'])}건")
    except FileNotFoundError:
        data['rising_stars'] = pd.DataFrame()

    # 저평가 선수
    try:
        data['underrated'] = pd.read_csv(OUTPUT_DIR / 'underrated.csv')
        print(f"  - underrated: {len(data['underrated'])}건")
    except FileNotFoundError:
        data['underrated'] = pd.DataFrame()

    return data


def create_players_json(data):
    """선수 데이터 JSON 생성"""
    print("\n선수 JSON 생성 중...")

    players = []

    # 예측 데이터와 통계 병합
    df = data['predictions'].copy()

    for _, row in df.iterrows():
        player = {
            'id': int(row['player_id']),
            'name': row['player_name_ko'],
            'team': row['team_name_ko'],
            'position': row['main_position'],
            'predictedScore': round(row['predicted_score'], 1),
            'recentAvg': round(row['recent_5_avg'], 1),
            'seasonAvg': round(row['season_avg'], 1),
            'formIndex': round(row['form_index'], 2),
            'matchesPlayed': int(row['matches_played']),
            'totalGoals': int(row.get('total_goals', 0)),
            'totalAssists': int(row.get('total_assists', 0)),
            # XAI 기여도
            'contributions': {
                'recentForm': round(row.get('contribution_recent_form', 0), 1),
                'seasonAvg': round(row.get('contribution_season_avg', 0), 1),
                'position': round(row.get('contribution_position', 0), 1),
                'goals': round(row.get('contribution_goals', 0), 1),
                'assists': round(row.get('contribution_assists', 0), 1)
            }
        }
        players.append(clean_for_json(player))

    # 예측 점수 기준 정렬
    players.sort(key=lambda x: x['predictedScore'], reverse=True)

    # 순위 추가
    for i, p in enumerate(players, 1):
        p['rank'] = i

    print(f"  - 선수 {len(players)}명 처리 완료")
    return players


def create_dark_horses_json(data):
    """다크호스 JSON 생성"""
    print("다크호스 JSON 생성 중...")

    if len(data['dark_horses']) == 0:
        return []

    dark_horses = []
    df = data['dark_horses']

    for _, row in df.iterrows():
        dh = {
            'id': int(row['player_id']),
            'name': row['player_name_ko'],
            'team': row['team_name_ko'],
            'position': row['main_position'],
            'formSurge': round(row['form_surge'], 2),
            'recent3Avg': round(row['recent_3_avg'], 1),
            'seasonAvg': round(row['avg_fantasy_score'], 1),
            'matchesPlayed': int(row['matches_played']),
            'reason': row.get('detection_reason', '잠재력 발견'),
            'predictedRank': int(row.get('predicted_rank', 0)),
        }
        dark_horses.append(clean_for_json(dh))

    print(f"  - 다크호스 {len(dark_horses)}명 처리 완료")
    return dark_horses


def create_position_rankings_json(players):
    """포지션별 랭킹 JSON 생성"""
    print("포지션별 랭킹 JSON 생성 중...")

    # 포지션 그룹핑
    position_groups = {
        'GK': ['GK'],
        'DF': ['CB', 'LB', 'RB', 'LWB', 'RWB'],
        'MF': ['DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'CM'],
        'FW': ['CF', 'SS', 'LWF', 'RWF', 'LW', 'RW']
    }

    rankings = {}

    for group_name, positions in position_groups.items():
        group_players = [p for p in players if p['position'] in positions]
        group_players.sort(key=lambda x: x['predictedScore'], reverse=True)

        # 그룹 내 순위
        for i, p in enumerate(group_players, 1):
            p['positionRank'] = i

        rankings[group_name] = group_players[:10]  # TOP 10

    print(f"  - 4개 포지션 그룹 처리 완료")
    return rankings


def create_team_stats_json(data):
    """팀별 통계 JSON 생성"""
    print("팀별 통계 JSON 생성 중...")

    df = data['player_stats']
    team_stats = []

    for team in df['team_name_ko'].unique():
        team_df = df[df['team_name_ko'] == team]

        stats = {
            'name': team,
            'playerCount': len(team_df),
            'avgFantasyScore': round(team_df['avg_fantasy_score'].mean(), 1),
            'totalGoals': int(team_df['total_goals'].sum()),
            'totalAssists': int(team_df['total_assists'].sum()),
            'topPlayer': team_df.nlargest(1, 'avg_fantasy_score').iloc[0]['player_name_ko']
            if len(team_df) > 0 else None
        }
        team_stats.append(clean_for_json(stats))

    # 평균 점수 기준 정렬
    team_stats.sort(key=lambda x: x['avgFantasyScore'], reverse=True)

    print(f"  - {len(team_stats)}개 팀 처리 완료")
    return team_stats


def create_summary_json(data, players, dark_horses):
    """요약 통계 JSON 생성"""
    print("요약 통계 JSON 생성 중...")

    summary = {
        'generatedAt': datetime.now().isoformat(),
        'totalPlayers': len(players),
        'totalDarkHorses': len(dark_horses),
        'avgPredictedScore': round(sum(p['predictedScore'] for p in players) / len(players), 1),
        'topPredictedPlayer': players[0] if players else None,
        'topDarkHorse': dark_horses[0] if dark_horses else None,
        'positionCounts': {},
    }

    # 포지션별 선수 수
    for p in players:
        pos = p['position']
        summary['positionCounts'][pos] = summary['positionCounts'].get(pos, 0) + 1

    return clean_for_json(summary)


def save_json(data, filename):
    """JSON 파일 저장"""
    filepath = WEB_DATA_DIR / filename

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"  저장: {filepath}")


def main():
    print("=" * 60)
    print("K-Fantasy AI - JSON 내보내기")
    print("=" * 60)

    # 웹 데이터 폴더 생성
    WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)

    # 1. 데이터 로드
    data = load_all_data()

    # 2. JSON 생성
    players = create_players_json(data)
    dark_horses = create_dark_horses_json(data)
    position_rankings = create_position_rankings_json(players)
    team_stats = create_team_stats_json(data)
    summary = create_summary_json(data, players, dark_horses)

    # 3. JSON 저장
    print("\nJSON 파일 저장 중...")
    save_json(players, 'players.json')
    save_json(dark_horses, 'dark_horses.json')
    save_json(position_rankings, 'position_rankings.json')
    save_json(team_stats, 'teams.json')
    save_json(summary, 'summary.json')

    # 4. 통합 데이터 저장 (웹앱에서 한 번에 로드용)
    all_data = {
        'players': players,
        'darkHorses': dark_horses,
        'positionRankings': position_rankings,
        'teamStats': team_stats,
        'summary': summary
    }
    save_json(all_data, 'all_data.json')

    print("\n" + "=" * 60)
    print("JSON 내보내기 완료!")
    print(f"  - 위치: {WEB_DATA_DIR}")
    print("=" * 60)


if __name__ == '__main__':
    main()
