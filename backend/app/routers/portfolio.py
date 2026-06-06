from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Holding, Portfolio
from ..schemas import (
    HoldingCreate,
    HoldingOut,
    HoldingValue,
    PortfolioCreate,
    PortfolioOut,
    PortfolioUpdate,
    PortfolioValue,
)
from ..services.market_data import get_current_price

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


def _get_or_404(db: Session, portfolio_id: int) -> Portfolio:
    p = db.get(Portfolio, portfolio_id)
    if not p:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return p


@router.post("", response_model=PortfolioOut, status_code=201)
def create_portfolio(payload: PortfolioCreate, db: Session = Depends(get_db)):
    p = Portfolio(name=payload.name, description=payload.description)
    db.add(p)
    db.flush()
    for h in payload.holdings:
        db.add(Holding(portfolio_id=p.id, ticker=h.ticker, shares=h.shares, avg_cost=h.avg_cost))
    db.commit()
    db.refresh(p)
    return p


@router.get("", response_model=list[PortfolioOut])
def list_portfolios(db: Session = Depends(get_db)):
    return db.query(Portfolio).all()


@router.get("/{portfolio_id}", response_model=PortfolioOut)
def get_portfolio(portfolio_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, portfolio_id)


@router.put("/{portfolio_id}", response_model=PortfolioOut)
def update_portfolio(portfolio_id: int, payload: PortfolioUpdate, db: Session = Depends(get_db)):
    p = _get_or_404(db, portfolio_id)
    if payload.name is not None:
        p.name = payload.name
    if payload.description is not None:
        p.description = payload.description
    if payload.holdings is not None:
        for h in list(p.holdings):
            db.delete(h)
        db.flush()
        for h in payload.holdings:
            db.add(Holding(portfolio_id=p.id, ticker=h.ticker, shares=h.shares, avg_cost=h.avg_cost))
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{portfolio_id}", status_code=204)
def delete_portfolio(portfolio_id: int, db: Session = Depends(get_db)):
    p = _get_or_404(db, portfolio_id)
    db.delete(p)
    db.commit()


@router.post("/{portfolio_id}/holdings", response_model=HoldingOut, status_code=201)
def add_holding(portfolio_id: int, payload: HoldingCreate, db: Session = Depends(get_db)):
    _get_or_404(db, portfolio_id)
    existing = (
        db.query(Holding)
        .filter(Holding.portfolio_id == portfolio_id, Holding.ticker == payload.ticker.upper())
        .first()
    )
    if existing:
        existing.shares = payload.shares
        existing.avg_cost = payload.avg_cost
        db.commit()
        db.refresh(existing)
        return existing
    h = Holding(portfolio_id=portfolio_id, ticker=payload.ticker, shares=payload.shares, avg_cost=payload.avg_cost)
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


@router.delete("/{portfolio_id}/holdings/{holding_id}", status_code=204)
def remove_holding(portfolio_id: int, holding_id: int, db: Session = Depends(get_db)):
    h = db.query(Holding).filter(Holding.id == holding_id, Holding.portfolio_id == portfolio_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Holding not found")
    db.delete(h)
    db.commit()


@router.get("/{portfolio_id}/value", response_model=PortfolioValue)
def portfolio_value(portfolio_id: int, db: Session = Depends(get_db)):
    p = _get_or_404(db, portfolio_id)
    total_value = 0.0
    total_cost = 0.0
    hv_list: list[HoldingValue] = []

    for h in p.holdings:
        price = get_current_price(h.ticker)
        mv = price * h.shares
        cb = h.avg_cost * h.shares
        pnl = mv - cb
        pnl_pct = (pnl / cb * 100) if cb else 0.0
        total_value += mv
        total_cost += cb
        hv_list.append(HoldingValue(
            ticker=h.ticker,
            shares=h.shares,
            avg_cost=h.avg_cost,
            current_price=price,
            market_value=mv,
            cost_basis=cb,
            pnl=pnl,
            pnl_pct=pnl_pct,
            weight_pct=0.0,
        ))

    for hv in hv_list:
        hv.weight_pct = (hv.market_value / total_value * 100) if total_value else 0.0

    total_pnl = total_value - total_cost
    total_pnl_pct = (total_pnl / total_cost * 100) if total_cost else 0.0

    return PortfolioValue(
        portfolio_id=p.id,
        name=p.name,
        total_value=total_value,
        total_cost=total_cost,
        total_pnl=total_pnl,
        total_pnl_pct=total_pnl_pct,
        holdings=hv_list,
    )
