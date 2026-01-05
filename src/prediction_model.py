#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
K-Fantasy AI - LightGBM 기반 판타지 점수 예측 모델
==================================================
다음 라운드 선수별 예상 판타지 점수 예측

피처:
1. recent_5_avg: 최근 5경기 평균 판타지 점수
2. season_avg: 시즌 평균 판타지 점수
3. vs_opponent_avg: 해당 상대팀 상대 과거 평균
4. is_home: 홈/원정 여부
5. form_index: 폼 지수 (최근 3경기 / 전체 평균)
6. position_percentile: 포지션별 상대 성적
"""

import pandas as pd
import numpy as np
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False
    print("Warning: LightGBM not installed. Using fallback prediction.")

# 경로 설정
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR.parent / '_shared' / 'data'
OUTPUT_DIR = BASE_DIR / 'outputs'


class FantasyPredictor:
    """판타지 점수 예측 모델"""

    def __init__(self):
        self.model = None
        self.feature_columns = [
            'recent_5_avg', 'season_avg', 'form_index',
            'position_percentile', 'matches_played', 'total_goals', 'total_assists'
        ]
        self.feature_importance = {}

    def load_data(self):
        """데이터 로드"""
        print("데이터 로드 중...")

        # 판타지 통계 로드
        self.player_stats = pd.read_csv(OUTPUT_DIR / 'player_fantasy_stats.csv')
        self.match_scores = pd.read_csv(OUTPUT_DIR / 'fantasy_scores_by_match.csv')
        self.match_info = pd.read_csv(DATA_DIR / 'match_info.csv')

        print(f"  - 선수 통계: {len(self.player_stats)}명")
        print(f"  - 경기별 점수: {len(self.match_scores)}건")
        print(f"  - 경기 정보: {len(self.match_info)}경기")

    def prepare_training_data(self):
        """학습 데이터 준비"""
        print("\n학습 데이터 준비 중...")

        # 경기별 점수에 라운드 정보 추가 (game_day를 라운드로 사용)
        df = self.match_scores.merge(
            self.match_info[['game_id', 'game_day', 'home_team_name', 'away_team_name']],
            on='game_id',
            how='left'
        )

        # 라운드별 정렬
        df = df.sort_values(['player_id', 'game_day'])

        # 각 선수별 피처 계산
        features_list = []

        for player_id, player_df in df.groupby('player_id'):
            player_df = player_df.sort_values('game_day')

            for i in range(len(player_df)):
                row = player_df.iloc[i]
                past_data = player_df.iloc[:i]

                # 최소 3경기 이상 데이터가 있어야 학습
                if len(past_data) < 3:
                    continue

                # 피처 계산
                recent_5 = past_data.tail(5)['fantasy_score'].mean() if len(past_data) >= 1 else 0
                season_avg = past_data['fantasy_score'].mean()
                form_index = recent_5 / season_avg if season_avg > 0 else 1.0

                # 포지션별 백분위
                position = row.get('main_position', 'MF')
                position_stats = self.player_stats[self.player_stats['main_position'] == position]
                if len(position_stats) > 0:
                    percentile = (position_stats['avg_fantasy_score'] <= season_avg).sum() / len(position_stats) * 100
                else:
                    percentile = 50.0

                features_list.append({
                    'player_id': player_id,
                    'game_day': row['game_day'],
                    'game_id': row['game_id'],
                    'recent_5_avg': recent_5,
                    'season_avg': season_avg,
                    'form_index': form_index,
                    'position_percentile': percentile,
                    'matches_played': len(past_data),
                    'total_goals': past_data['goal_count'].sum() if 'goal_count' in past_data.columns else 0,
                    'total_assists': past_data['assist_count'].sum() if 'assist_count' in past_data.columns else 0,
                    'target': row['fantasy_score']  # 예측 대상
                })

        self.train_df = pd.DataFrame(features_list)
        print(f"  - 학습 샘플: {len(self.train_df)}건")

        return self.train_df

    def train_model(self):
        """LightGBM 모델 학습"""
        print("\nLightGBM 모델 학습 중...")

        if not HAS_LIGHTGBM:
            print("  - LightGBM 미설치, 폴백 모델 사용")
            return

        # 학습/검증 분할 (game_day 기준)
        max_day = self.train_df['game_day'].max()
        train_days = int(max_day * 0.8)

        train_mask = self.train_df['game_day'] <= train_days
        X_train = self.train_df[train_mask][self.feature_columns]
        y_train = self.train_df[train_mask]['target']
        X_val = self.train_df[~train_mask][self.feature_columns]
        y_val = self.train_df[~train_mask]['target']

        print(f"  - 학습 데이터: {len(X_train)}건 (라운드 1-{train_days})")
        print(f"  - 검증 데이터: {len(X_val)}건 (라운드 {train_days+1}-{max_day})")

        # LightGBM 파라미터
        params = {
            'objective': 'regression',
            'metric': 'rmse',
            'boosting_type': 'gbdt',
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.8,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'verbose': -1,
            'random_state': 42
        }

        # 데이터셋 생성
        train_data = lgb.Dataset(X_train, label=y_train)
        val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)

        # 모델 학습
        self.model = lgb.train(
            params,
            train_data,
            num_boost_round=500,
            valid_sets=[train_data, val_data],
            valid_names=['train', 'valid'],
            callbacks=[lgb.early_stopping(50), lgb.log_evaluation(0)]
        )

        # 피처 중요도
        importance = self.model.feature_importance(importance_type='gain')
        total_importance = sum(importance)
        for i, col in enumerate(self.feature_columns):
            self.feature_importance[col] = round(importance[i] / total_importance * 100, 2)

        print(f"\n  피처 중요도:")
        for feat, imp in sorted(self.feature_importance.items(), key=lambda x: -x[1]):
            print(f"    - {feat}: {imp}%")

        # 검증 성능
        y_pred = self.model.predict(X_val)
        rmse = np.sqrt(np.mean((y_val - y_pred) ** 2))
        mae = np.mean(np.abs(y_val - y_pred))
        print(f"\n  검증 성능:")
        print(f"    - RMSE: {rmse:.2f}")
        print(f"    - MAE: {mae:.2f}")

    def predict_next_round(self):
        """다음 라운드 예측"""
        print("\n다음 라운드 예측 중...")

        predictions = []

        for _, player in self.player_stats.iterrows():
            player_id = player['player_id']

            # 피처 준비
            features = {
                'recent_5_avg': player.get('recent_5_avg', player['avg_fantasy_score']),
                'season_avg': player['avg_fantasy_score'],
                'form_index': player.get('form_index', 1.0),
                'position_percentile': self._get_position_percentile(player),
                'matches_played': player['matches_played'],
                'total_goals': player.get('total_goals', 0),
                'total_assists': player.get('total_assists', 0)
            }

            # NaN 처리
            for key in features:
                if pd.isna(features[key]):
                    features[key] = 0 if key in ['total_goals', 'total_assists'] else player['avg_fantasy_score']

            # 예측
            if HAS_LIGHTGBM and self.model is not None:
                X = pd.DataFrame([features])[self.feature_columns]
                predicted_score = self.model.predict(X)[0]
            else:
                # 폴백: 가중 평균 (최근 폼 반영)
                recent = features['recent_5_avg']
                season = features['season_avg']
                form = features['form_index']
                predicted_score = recent * 0.5 + season * 0.3 + (season * form) * 0.2

            # 피처 기여도 계산 (XAI용)
            contributions = self._calculate_contributions(features, predicted_score)

            predictions.append({
                'player_id': player_id,
                'player_name_ko': player['player_name_ko'],
                'team_name_ko': player['team_name_ko'],
                'main_position': player['main_position'],
                'predicted_score': round(predicted_score, 2),
                'recent_5_avg': round(features['recent_5_avg'], 2),
                'season_avg': round(features['season_avg'], 2),
                'form_index': round(features['form_index'], 2),
                'matches_played': int(features['matches_played']),
                'total_goals': int(features['total_goals']),
                'total_assists': int(features['total_assists']),
                'contribution_recent_form': contributions.get('recent_form', 0),
                'contribution_season_avg': contributions.get('season_avg', 0),
                'contribution_position': contributions.get('position', 0),
                'contribution_goals': contributions.get('goals', 0),
                'contribution_assists': contributions.get('assists', 0)
            })

        self.predictions_df = pd.DataFrame(predictions)
        self.predictions_df = self.predictions_df.sort_values('predicted_score', ascending=False)

        print(f"  - 예측 완료: {len(self.predictions_df)}명")

        return self.predictions_df

    def _get_position_percentile(self, player):
        """포지션별 백분위 계산"""
        position = player['main_position']
        position_stats = self.player_stats[self.player_stats['main_position'] == position]

        if len(position_stats) == 0:
            return 50.0

        player_avg = player['avg_fantasy_score']
        percentile = (position_stats['avg_fantasy_score'] <= player_avg).sum() / len(position_stats) * 100
        return round(percentile, 1)

    def _calculate_contributions(self, features, predicted_score):
        """XAI용 피처 기여도 계산"""
        # 단순화된 기여도 계산 (실제로는 SHAP 사용 권장)
        total = 0
        contributions = {}

        # 최근 폼 기여도
        form_impact = features['form_index'] - 1.0
        contributions['recent_form'] = round(form_impact * 30, 1)  # 폼 영향

        # 시즌 평균 기여도
        contributions['season_avg'] = round(features['season_avg'] / predicted_score * 30, 1)

        # 포지션 기여도
        percentile = features['position_percentile']
        contributions['position'] = round((percentile - 50) / 50 * 15, 1)

        # 골 기여도
        contributions['goals'] = round(min(features['total_goals'] * 2, 15), 1)

        # 어시스트 기여도
        contributions['assists'] = round(min(features['total_assists'] * 1.5, 10), 1)

        return contributions

    def get_position_rankings(self):
        """포지션별 TOP 선수"""
        rankings = {}

        for position in ['GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'AMF', 'LMF', 'RMF', 'LWF', 'RWF', 'CF']:
            pos_df = self.predictions_df[self.predictions_df['main_position'] == position]
            if len(pos_df) > 0:
                rankings[position] = pos_df.head(5).to_dict('records')

        return rankings

    def save_predictions(self):
        """예측 결과 저장"""
        output_path = OUTPUT_DIR / 'predictions.csv'
        self.predictions_df.to_csv(output_path, index=False, encoding='utf-8-sig')
        print(f"\n예측 결과 저장: {output_path}")

        # 포지션별 랭킹도 저장
        rankings = self.get_position_rankings()
        rankings_rows = []
        for position, players in rankings.items():
            for rank, player in enumerate(players, 1):
                player['position_rank'] = rank
                rankings_rows.append(player)

        rankings_df = pd.DataFrame(rankings_rows)
        rankings_path = OUTPUT_DIR / 'position_rankings.csv'
        rankings_df.to_csv(rankings_path, index=False, encoding='utf-8-sig')
        print(f"포지션별 랭킹 저장: {rankings_path}")


def main():
    print("=" * 60)
    print("K-Fantasy AI - LightGBM 예측 모델")
    print("=" * 60)

    predictor = FantasyPredictor()

    # 1. 데이터 로드
    predictor.load_data()

    # 2. 학습 데이터 준비
    predictor.prepare_training_data()

    # 3. 모델 학습
    predictor.train_model()

    # 4. 다음 라운드 예측
    predictions = predictor.predict_next_round()

    # 5. 결과 저장
    predictor.save_predictions()

    # 6. TOP 10 출력
    print("\n" + "=" * 60)
    print("다음 라운드 예상 판타지 점수 TOP 10")
    print("-" * 60)

    top10 = predictions.head(10)
    print(top10[['player_name_ko', 'team_name_ko', 'main_position',
                 'predicted_score', 'recent_5_avg', 'form_index']].to_string(index=False))

    # 7. 포지션별 TOP 3 출력
    print("\n" + "-" * 60)
    print("포지션별 TOP 선수")
    print("-" * 60)

    for position in ['GK', 'CB', 'CMF', 'CF']:
        pos_df = predictions[predictions['main_position'] == position].head(3)
        if len(pos_df) > 0:
            print(f"\n[{position}]")
            for _, p in pos_df.iterrows():
                print(f"  {p['player_name_ko']} ({p['team_name_ko']}) - {p['predicted_score']:.1f}점")

    print("\n" + "=" * 60)
    print("예측 완료!")
    print("=" * 60)


if __name__ == '__main__':
    main()
