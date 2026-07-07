import os
import sys
import joblib
import pandas as pd
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder

# Add backend directory to sys path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.database import SessionLocal
from app.models.cutoff import Cutoff
from app.models.college import College

def train_model():
    print("Fetching data from DB...")
    db = SessionLocal()
    
    # Query all cutoffs along with district
    query = db.query(
        Cutoff.year, 
        Cutoff.round, 
        Cutoff.college_code, 
        Cutoff.branch_code, 
        Cutoff.category, 
        Cutoff.cutoff_rank,
        College.district
    ).join(College, Cutoff.college_code == College.code)
    
    df = pd.read_sql(query.statement, db.bind)
    db.close()
    
    if df.empty:
        print("No cutoff data found. Run ingestion first.")
        return

    print(f"Loaded {len(df)} cutoff records.")
    df.dropna(subset=['cutoff_rank'], inplace=True)

    # Map previous year cutoff
    prev_df = df[['year', 'round', 'college_code', 'branch_code', 'category', 'cutoff_rank']].copy()
    prev_df['year'] = prev_df['year'] + 1
    prev_df.rename(columns={'cutoff_rank': 'prev_year_cutoff'}, inplace=True)
    
    df = pd.merge(df, prev_df, on=['year', 'round', 'college_code', 'branch_code', 'category'], how='left')
    df['prev_year_cutoff'] = df['prev_year_cutoff'].fillna(df['cutoff_rank'])

    # Encode categoricals
    encoders = {}
    cat_columns = ['round', 'college_code', 'branch_code', 'category', 'district']
    
    for col in cat_columns:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    # Prepare X and y
    feature_cols = ['year', 'round', 'college_code', 'branch_code', 'category', 'district', 'prev_year_cutoff']
    X = df[feature_cols]
    y = df['cutoff_rank']

    save_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(save_dir, exist_ok=True)

    print("Training XGBoost Quantile Regressors...")

    # Train Median (50th Percentile)
    print(" -> Training Median Model (50th Percentile)...")
    model_median = xgb.XGBRegressor(
        objective='reg:quantileerror',
        quantile_alpha=0.5,
        n_estimators=150, 
        max_depth=6, 
        learning_rate=0.1, 
        random_state=42,
        n_jobs=-1
    )
    model_median.fit(X, y)
    joblib.dump(model_median, os.path.join(save_dir, 'cutoff_model_median.pkl'))

    # Train Lower Bound (10th Percentile)
    print(" -> Training Lower Bound Model (10th Percentile)...")
    model_lower = xgb.XGBRegressor(
        objective='reg:quantileerror',
        quantile_alpha=0.1,
        n_estimators=150, 
        max_depth=6, 
        learning_rate=0.1, 
        random_state=42,
        n_jobs=-1
    )
    model_lower.fit(X, y)
    joblib.dump(model_lower, os.path.join(save_dir, 'cutoff_model_lower.pkl'))

    # Train Upper Bound (90th Percentile)
    print(" -> Training Upper Bound Model (90th Percentile)...")
    model_upper = xgb.XGBRegressor(
        objective='reg:quantileerror',
        quantile_alpha=0.9,
        n_estimators=150, 
        max_depth=6, 
        learning_rate=0.1, 
        random_state=42,
        n_jobs=-1
    )
    model_upper.fit(X, y)
    joblib.dump(model_upper, os.path.join(save_dir, 'cutoff_model_upper.pkl'))

    print("Training complete. Evaluating performance metrics...")
    
    # Evaluate performance metrics
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    import numpy as np
    import json
    from datetime import datetime
    
    y_pred = model_median.predict(X)
    mae = float(mean_absolute_error(y, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y, y_pred)))
    r2 = float(r2_score(y, y_pred))
    
    stats = {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "r2_score": round(r2, 4),
        "records_count": len(X),
        "last_training_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "model_version": "XGBoost-v3.2"
    }
    
    metadata_path = os.path.join(save_dir, 'metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(stats, f, indent=4)
    print(f"Saved training metadata to {metadata_path}")

    encoders_path = os.path.join(save_dir, 'label_encoders.joblib')
    joblib.dump(encoders, encoders_path)
    print(f"Saved encoders to {encoders_path}")

if __name__ == "__main__":
    train_model()

