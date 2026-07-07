import os
import logging

_ml_model_median = None
_ml_model_lower = None
_ml_model_upper = None
_ml_encoders = None
_ml_available = False

def load_ml_assets():
    global _ml_model_median, _ml_model_lower, _ml_model_upper, _ml_encoders, _ml_available
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    model_median_path = os.path.join(models_dir, "cutoff_model_median.pkl")
    model_lower_path = os.path.join(models_dir, "cutoff_model_lower.pkl")
    model_upper_path = os.path.join(models_dir, "cutoff_model_upper.pkl")
    encoders_path = os.path.join(models_dir, "label_encoders.joblib")

    if os.path.exists(model_median_path) and os.path.exists(encoders_path):
        try:
            import joblib
            _ml_model_median = joblib.load(model_median_path)
            _ml_model_lower = joblib.load(model_lower_path)
            _ml_model_upper = joblib.load(model_upper_path)
            _ml_encoders = joblib.load(encoders_path)
            _ml_available = True
            print("✅ ML Quantile Models loaded successfully")
            return True
        except Exception as e:
            logging.warning(f"ML models could not be loaded ({e}). Using statistical fallback.")
            _ml_available = False
            return False
    logging.warning("ML model files not found. Using statistical fallback.")
    return False


def _statistical_range(prev_cutoff: int, all_historical: list):
    """
    Compute a predicted cutoff range from historical data.
    - baseline  = previous year's cutoff (most recent)
    - range_min = tightest historical cutoff with a small buffer inward
    - range_max = most lenient historical cutoff with a small buffer outward
    Falls back to +/-10% of prev_cutoff when history is sparse.
    """
    if not all_historical:
        low  = max(1, int(prev_cutoff * 0.90))
        high = int(prev_cutoff * 1.10)
        return low, prev_cutoff, high

    hist_min = min(all_historical)
    hist_max = max(all_historical)

    # Spread ensures at least a 5% width even if all values are equal
    spread = max(hist_max - hist_min, int(prev_cutoff * 0.05))

    range_min = max(1, hist_min - int(spread * 0.10))
    range_max = hist_max + int(spread * 0.15)
    baseline  = prev_cutoff  # most recent actual cutoff

    return range_min, baseline, range_max


def predict_cutoff(year, round_name, college_code, branch_code, category,
                   district, prev_cutoff, all_historical: list = None):
    """
    Predict the cutoff range [range_min, baseline, range_max].

    Tries the XGBoost ML models first; falls back to a statistical
    calculation from `all_historical` cutoffs if models are unavailable.

    Parameters
    ----------
    all_historical : list of int
        All historical cutoff values for this college/branch/category
        combination across all years and rounds. Used for the fallback.
    """
    all_historical = all_historical or []

    if _ml_available and _ml_model_median is not None and _ml_encoders is not None:
        try:
            import pandas as pd
            enc = _ml_encoders
            r_enc    = enc['round'].transform([round_name])[0]        if round_name   in enc['round'].classes_        else -1
            c_enc    = enc['college_code'].transform([college_code])[0] if college_code in enc['college_code'].classes_ else -1
            b_enc    = enc['branch_code'].transform([branch_code])[0]  if branch_code  in enc['branch_code'].classes_  else -1
            cat_enc  = enc['category'].transform([category])[0]        if category     in enc['category'].classes_     else -1
            dist_enc = enc['district'].transform([district])[0]        if district     in enc['district'].classes_     else -1

            if -1 not in [r_enc, c_enc, b_enc, cat_enc, dist_enc]:
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
                lower_pred  = _ml_model_lower.predict(df)[0]
                upper_pred  = _ml_model_upper.predict(df)[0]
                preds = sorted([max(1, int(lower_pred)), max(1, int(median_pred)), max(1, int(upper_pred))])
                return preds[0], preds[1], preds[2]
        except Exception as e:
            logging.warning(f"ML Predict Error: {e} — using statistical fallback")

    # Statistical fallback
    return _statistical_range(prev_cutoff, all_historical)
