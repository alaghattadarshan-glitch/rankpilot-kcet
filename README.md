# RankPilot - KCET Counselling Intelligence Platform

RankPilot is an AI-powered and ML-based counselling platform built to guide Karnataka CET (KCET) students through the highly competitive engineering seat allotment process. 

Unlike traditional platforms that rely on static $+/-$ margins, RankPilot leverages **XGBoost Quantile Regression** models to forecast dynamic cutoff ranges based on real, historical KEA volatility, combined with **Seat Matrix Intelligence** to flag high-risk choices.

## Key Features

1. **AI-Powered Expected Ranges (Quantile Regression)**
   - Instead of static predictions, the platform trains 3 separate XGBoost Regressors (10th, 50th, and 90th percentiles).
   - Highly volatile branches generate naturally wider ranges, while stable branches generate narrow ranges.
   - Built entirely on historical KCET data without synthetic interpolation.

2. **Seat Matrix Intelligence & Dynamic Risk Analysis**
   - Incorporates actual seating capacity for specific category/college/branch permutations.
   - Automatically flashes **High-Risk Anomaly** warnings if a student's safe recommendation has $\le 3$ actual seats available statewide.

3. **Optimized Option Entry PDF Export**
   - Students can shortlist their Dream, Target, and Safe colleges.
   - One-click export to a clean PDF formatted specifically to match the KEA official portal for easy copy-pasting.

4. **Automated Admin Data Pipeline**
   - Easy management interface to ingest updated KEA CSVs.
   - Background processes automatically trigger data ingestion, retrain the XGBoost Quantile models, and hot-reload `.pkl` assets into FastAPI memory without server downtime.

## Tech Stack

### Backend (Python)
- **FastAPI**: Asynchronous, high-performance web framework.
- **SQLAlchemy & PostgreSQL / SQLite**: Relational database ORM.
- **XGBoost**: Advanced gradient boosting library for Quantile Regression modelling.
- **Pandas / Scikit-Learn**: Data preprocessing and label encoding.

### Frontend (React + TypeScript)
- **Vite**: Ultra-fast build tool.
- **React Router**: Client-side navigation.
- **Tailwind CSS**: Utility-first CSS for sleek, modern UI.
- **Lucide React**: Crisp vector icons.
- **jsPDF & autoTable**: Client-side PDF generation for Option Entry lists.

## Deployment Ready
The repository includes configuration files required for seamless cloud deployment:
- `render.yaml` for zero-downtime backend deployment on Render.
- `vercel.json` for edge-optimized frontend deployment on Vercel.

## Local Setup

### 1. Start the Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend APIs at `http://localhost:8000`.

---
*Built with ❤️ for KCET Aspirants.*
