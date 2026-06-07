"""
Seed the database with a demo portfolio so the app has something to show on first run.
Run from the backend directory: python seed.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database import Base, SessionLocal, engine
from app.models import Holding, Portfolio

Base.metadata.create_all(bind=engine)

DEMO_HOLDINGS = [
    ("AAPL",  10,  150.00),
    ("MSFT",   5,  320.00),
    ("NVDA",   4,  450.00),
    ("GOOGL",  3,  130.00),
    ("AMZN",   6,  175.00),
]

db = SessionLocal()

if db.query(Portfolio).filter(Portfolio.name == "Demo Portfolio").first():
    print("Demo portfolio already exists — skipping.")
    db.close()
    sys.exit(0)

p = Portfolio(name="Demo Portfolio", description="Sample holdings to get started")
db.add(p)
db.flush()

for ticker, shares, avg_cost in DEMO_HOLDINGS:
    db.add(Holding(portfolio_id=p.id, ticker=ticker, shares=shares, avg_cost=avg_cost))

db.commit()
print(f"Created 'Demo Portfolio' (id={p.id}) with {len(DEMO_HOLDINGS)} holdings.")
db.close()
