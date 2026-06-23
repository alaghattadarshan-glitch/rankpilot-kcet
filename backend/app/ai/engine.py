import os
import joblib
import pandas as pd

_ml_model_median = None
_ml_model_lower = None
_ml_model_upper = None
_ml_encoders = None

def load_ml_assets():
    global _ml_model_median, _ml_model_lower, _ml_model_upper, _ml_encoders
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    model_median_path = os.path.join(models_dir, "cutoff_model_median.pkl")
    model_lower_path = os.path.join(models_dir, "cutoff_model_lower.pkl")
    model_upper_path = os.path.join(models_dir, "cutoff_model_upper.pkl")
    encoders_path = os.path.join(models_dir, "label_encoders.joblib")
    
    if os.path.exists(model_median_path) and os.path.exists(encoders_path):
        try:
            _ml_model_median = joblib.load(model_median_path)
            _ml_model_lower = joblib.load(model_lower_path)
            _ml_model_upper = joblib.load(model_upper_path)
            _ml_encoders = joblib.load(encoders_path)
            print("✅ ML Quantile Models loaded successfully")
            return True
        except Exception as e:
            print(f"Error loading ML models: {e}")
            return False
    return False

def predict_cutoff(year, round_name, college_code, branch_code, category, district, prev_cutoff):
    if _ml_model_median is None or _ml_encoders is None:
        return prev_cutoff, prev_cutoff, prev_cutoff
    
    try:
        enc = _ml_encoders
        r_enc = enc['round'].transform([round_name])[0] if round_name in enc['round'].classes_ else -1
        c_enc = enc['college_code'].transform([college_code])[0] if college_code in enc['college_code'].classes_ else -1
        b_enc = enc['branch_code'].transform([branch_code])[0] if branch_code in enc['branch_code'].classes_ else -1
        cat_enc = enc['category'].transform([category])[0] if category in enc['category'].classes_ else -1
        dist_enc = enc['district'].transform([district])[0] if district in enc['district'].classes_ else -1
        
        if -1 in [r_enc, c_enc, b_enc, cat_enc, dist_enc]:
            return prev_cutoff, prev_cutoff, prev_cutoff

        df = pd.DataFrame([{
            'year': year,
            'round': r_enc,
            'college_code': c_enc,
            'branch_code': b_enc,
            'category': cat_enc,
            'district': dist_enc,
            'prev_year_cutoff': prev_cutoff
        }])
        
        median_pred = _ml_model_median.predict(df)[0]
        lower_pred = _ml_model_lower.predict(df)[0]
        upper_pred = _ml_model_upper.predict(df)[0]
        
        # Ensure logical ordering: lower bound <= median <= upper bound
        # Since smaller ranks are "higher/better", lower bound numerically might be lower rank.
        # But we sort them just in case.
        preds = sorted([max(1, int(lower_pred)), max(1, int(median_pred)), max(1, int(upper_pred))])
        
        return preds[0], preds[1], preds[2]
    except Exception as e:
        print(f"ML Predict Error: {e}")
        return prev_cutoff, prev_cutoff, prev_cutoff
