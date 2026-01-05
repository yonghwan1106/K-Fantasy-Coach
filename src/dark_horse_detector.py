#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
K-Fantasy AI - 다크호스 선수 탐지
===================================
저평가되었지만 폼이 급상승 중인 선수 발굴

다크호스 조건:
1. 최근 3경기 평균 > 시즌 평균 * 1.3 (폼 급상승)
2. 출장 경기수 < 15 (인지도 낮음)
3. 예측 순위 상위 30% 이내
"""

import pandas as pd
import numpy as np
from pathlib import Path

# 경로 설정
BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / 'outputs'


class DarkHorseDetector:
    """다크호스 선수 탐지기"""

    def __init__(self):
        self.dark_horses = []
        self.rising_stars = []
        self.underrated = []

    def load_data(self):
        """데이터 로드"""
        print("데이터 로드 중...")

        self.player_stats = pd.read_csv(OUTPUT_DIR / 'player_fantasy_stats.csv')
        self.predictions = pd.read_csv(OUTPUT_DIR / 'predictions.csv')
        self.match_scores = pd.read_csv(OUTPUT_DIR / 'fantasy_scores_by_match.csv')

        print(f"  - 선수 통계: {len(self.player_stats)}명")
        print(f"  - 예측 결과: {len(self.predictions)}건")

    def calculate_recent_form(self, n=3):
        """최근 N경기 평균 계산"""
        recent_form = []

        for player_id in self.player_stats['player_id'].unique():
            player_matches = self.match_scores[
                self.match_scores['player_id'] == player_id
            ].sort_values('game_id', ascending=False)

            if len(player_matches) >= n:
                recent_avg = player_matches.head(n)['fantasy_score'].mean()
            else:
                recent_avg = player_matches['fantasy_score'].mean() if len(player_matches) > 0 else 0

            recent_form.append({
                'player_id': player_id,
                f'recent_{n}_avg': recent_avg
            })

        return pd.DataFrame(recent_form)

    def detect_dark_horses(self):
        """다크호스 선수 탐지"""
        print("\n다크호스 탐지 중...")

        # 최근 3경기 폼 계산
        recent_3 = self.calculate_recent_form(n=3)

        # 데이터 병합
        df = self.player_stats.merge(recent_3, on='player_id', how='left')
        df = df.merge(
            self.predictions[['player_id', 'predicted_score']],
            on='player_id',
            how='left'
        )

        # NaN 처리
        df['recent_3_avg'] = df['recent_3_avg'].fillna(df['avg_fantasy_score'])
        df['predicted_score'] = df['predicted_score'].fillna(df['avg_fantasy_score'])

        # 예측 순위 계산
        df['predicted_rank'] = df['predicted_score'].rank(ascending=False, method='min')
        df['predicted_percentile'] = df['predicted_rank'] / len(df) * 100

        # 폼 상승률 계산
        df['form_surge'] = df['recent_3_avg'] / df['avg_fantasy_score']
        df['form_surge'] = df['form_surge'].replace([np.inf, -np.inf], 1.0).fillna(1.0)

        # === 다크호스 조건 ===
        dark_horse_mask = (
            (df['form_surge'] > 1.3) &                    # 폼 30% 이상 상승
            (df['matches_played'] < 15) &                 # 출장 15경기 미만
            (df['predicted_percentile'] <= 30)            # 상위 30%
        )

        dark_horses = df[dark_horse_mask].copy()
        dark_horses['detection_reason'] = dark_horses.apply(
            lambda x: self._get_dark_horse_reason(x), axis=1
        )

        # 폼 상승률 기준 정렬
        dark_horses = dark_horses.sort_values('form_surge', ascending=False)

        self.dark_horses = dark_horses
        print(f"  - 다크호스 발견: {len(dark_horses)}명")

        return dark_horses

    def detect_rising_stars(self):
        """급상승 중인 선수 (다크호스보다 넓은 조건)"""
        print("\n급상승 선수 탐지 중...")

        recent_3 = self.calculate_recent_form(n=3)

        df = self.player_stats.merge(recent_3, on='player_id', how='left')
        df['recent_3_avg'] = df['recent_3_avg'].fillna(df['avg_fantasy_score'])
        df['form_surge'] = df['recent_3_avg'] / df['avg_fantasy_score']
        df['form_surge'] = df['form_surge'].replace([np.inf, -np.inf], 1.0).fillna(1.0)

        # 급상승 조건: 폼 20% 이상 상승
        rising_mask = (df['form_surge'] > 1.2) & (df['matches_played'] >= 3)
        rising_stars = df[rising_mask].sort_values('form_surge', ascending=False)

        self.rising_stars = rising_stars
        print(f"  - 급상승 선수: {len(rising_stars)}명")

        return rising_stars

    def detect_underrated(self):
        """저평가된 선수 (출장 기회 적지만 효율 높음)"""
        print("\n저평가 선수 탐지 중...")

        df = self.player_stats.copy()

        # 출장 기회 적지만 평균 점수 높은 선수
        underrated_mask = (
            (df['matches_played'] < 10) &
            (df['avg_fantasy_score'] > df['avg_fantasy_score'].quantile(0.7))
        )

        underrated = df[underrated_mask].sort_values('avg_fantasy_score', ascending=False)

        self.underrated = underrated
        print(f"  - 저평가 선수: {len(underrated)}명")

        return underrated

    def _get_dark_horse_reason(self, row):
        """다크호스 선정 이유 생성"""
        reasons = []

        form_surge = row['form_surge']
        if form_surge >= 1.5:
            reasons.append(f"폼 {int((form_surge-1)*100)}% 급상승")
        elif form_surge >= 1.3:
            reasons.append(f"폼 {int((form_surge-1)*100)}% 상승")

        if row['matches_played'] < 10:
            reasons.append("출장 기회 제한적")
        elif row['matches_played'] < 15:
            reasons.append("인지도 낮음")

        if row['predicted_percentile'] <= 15:
            reasons.append("상위 15% 예측")
        elif row['predicted_percentile'] <= 30:
            reasons.append("상위 30% 예측")

        # 골/어시스트 효율
        if 'total_goals' in row and row['total_goals'] > 0:
            goals_per_game = row['total_goals'] / row['matches_played']
            if goals_per_game > 0.3:
                reasons.append(f"경기당 {goals_per_game:.2f}골")

        return " / ".join(reasons) if reasons else "잠재력 발견"

    def get_position_dark_horses(self):
        """포지션별 다크호스"""
        position_dh = {}

        for position in self.dark_horses['main_position'].unique():
            pos_df = self.dark_horses[self.dark_horses['main_position'] == position]
            if len(pos_df) > 0:
                position_dh[position] = pos_df.head(3).to_dict('records')

        return position_dh

    def save_results(self):
        """결과 저장"""
        # 다크호스 저장
        if len(self.dark_horses) > 0:
            output_path = OUTPUT_DIR / 'dark_horses.csv'
            self.dark_horses.to_csv(output_path, index=False, encoding='utf-8-sig')
            print(f"\n다크호스 저장: {output_path}")

        # 급상승 선수 저장
        if len(self.rising_stars) > 0:
            output_path = OUTPUT_DIR / 'rising_stars.csv'
            self.rising_stars.to_csv(output_path, index=False, encoding='utf-8-sig')
            print(f"급상승 선수 저장: {output_path}")

        # 저평가 선수 저장
        if len(self.underrated) > 0:
            output_path = OUTPUT_DIR / 'underrated.csv'
            self.underrated.to_csv(output_path, index=False, encoding='utf-8-sig')
            print(f"저평가 선수 저장: {output_path}")


def main():
    print("=" * 60)
    print("K-Fantasy AI - 다크호스 탐지")
    print("=" * 60)

    detector = DarkHorseDetector()

    # 1. 데이터 로드
    detector.load_data()

    # 2. 다크호스 탐지
    dark_horses = detector.detect_dark_horses()

    # 3. 급상승 선수 탐지
    rising_stars = detector.detect_rising_stars()

    # 4. 저평가 선수 탐지
    underrated = detector.detect_underrated()

    # 5. 결과 저장
    detector.save_results()

    # 6. 다크호스 TOP 10 출력
    print("\n" + "=" * 60)
    print("다크호스 TOP 10")
    print("-" * 60)

    if len(dark_horses) > 0:
        for i, (_, dh) in enumerate(dark_horses.head(10).iterrows(), 1):
            print(f"{i:2d}. {dh['player_name_ko']} ({dh['team_name_ko']}) - {dh['main_position']}")
            print(f"    폼 상승률: {dh['form_surge']:.1%} | 최근3경기: {dh['recent_3_avg']:.1f}점")
            print(f"    선정 이유: {dh['detection_reason']}")
    else:
        print("다크호스 조건을 충족하는 선수가 없습니다.")

    # 7. 포지션별 다크호스
    print("\n" + "-" * 60)
    print("포지션별 다크호스")
    print("-" * 60)

    position_dh = detector.get_position_dark_horses()
    for position, players in position_dh.items():
        print(f"\n[{position}]")
        for p in players[:2]:
            print(f"  - {p['player_name_ko']} ({p['team_name_ko']}) | 폼 상승: {p['form_surge']:.0%}")

    print("\n" + "=" * 60)
    print("다크호스 탐지 완료!")
    print("=" * 60)


if __name__ == '__main__':
    main()
