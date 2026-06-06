# Market Dashboard

A full-stack financial dashboard built in two phases — from a fast Streamlit prototype to a production-quality React + FastAPI app.

## Architecture

```
market-dashboard/
├── phase1-streamlit/   # Phase 1: Streamlit dashboard (Python only)
└── backend/            # Phase 2: FastAPI REST API
    frontend/           # Phase 2: React + TypeScript UI
```

---

## Phase 1 — Streamlit Dashboard

**Stack:** Python · yfinance · pandas · Plotly · Streamlit

**Features:**
- Real-time stock quotes (any ticker via Yahoo Finance)
- Candlestick & line charts with Moving Averages (20/50/200) and Bollinger Bands
- RSI indicator panel
- Multi-stock comparison with normalized returns & correlation heatmap
- Portfolio tracker (session-based) with P&L, allocation pie chart
- One-click deploy to Streamlit Community Cloud

### Run Phase 1

```bash
cd phase1-streamlit
pip install -r requirements.txt
streamlit run app.py
```

Open [http://localhost:8501](http://localhost:8501)

---

## Phase 2 — Full-Stack App

### Backend (FastAPI)

**Stack:** Python · FastAPI · SQLAlchemy · SQLite · yfinance · Pydantic

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stocks/{ticker}` | Current quote |
| GET | `/api/stocks/{ticker}/history` | OHLCV history |
| GET | `/api/stocks/compare/many?tickers=…` | Normalized comparison |
| POST | `/api/portfolios` | Create portfolio |
| GET | `/api/portfolios` | List portfolios |
| GET | `/api/portfolios/{id}` | Get portfolio |
| PUT | `/api/portfolios/{id}` | Update portfolio |
| DELETE | `/api/portfolios/{id}` | Delete portfolio |
| POST | `/api/portfolios/{id}/holdings` | Add / update holding |
| DELETE | `/api/portfolios/{id}/holdings/{hid}` | Remove holding |
| GET | `/api/portfolios/{id}/value` | Live portfolio valuation |

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Frontend (React)

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS · Recharts · TanStack Query · React Router

**Pages:**
- **Dashboard** — search any ticker, view price chart with MA overlays, key metrics
- **Compare** — compare up to 6 stocks with normalized returns chart + summary table
- **Portfolio** — create/manage portfolios, track live P&L, view allocation chart

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy

| Service | What |
|---------|------|
| [Streamlit Community Cloud](https://streamlit.io/cloud) | Phase 1 (free, connect GitHub repo) |
| [Render](https://render.com) / [Railway](https://railway.app) | FastAPI backend (free tier) |
| [Vercel](https://vercel.com) / [Netlify](https://netlify.com) | React frontend (free tier) |

---

## Screenshots

> Add screenshots here after running the app.

---

## What I learned

- **Phase 1** revealed what working with financial data _feels_ like — fetching, cleaning, visualising.
- **Phase 2** showed how a real full-stack system is wired: REST API → database → typed frontend.
- The gap between a Streamlit prototype and a proper app is mostly _structure_, not magic.
