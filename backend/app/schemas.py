from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


# ── Stock schemas ──────────────────────────────────────────────────────────────

class StockQuote(BaseModel):
    ticker: str
    name: str
    price: float
    prev_close: float
    change: float
    change_pct: float
    open: float
    high: float
    low: float
    volume: int
    avg_volume: int
    market_cap: Optional[int] = None
    pe_ratio: Optional[float] = None
    eps: Optional[float] = None
    dividend_yield: Optional[float] = None
    fifty_two_week_high: float
    fifty_two_week_low: float
    beta: Optional[float] = None
    exchange: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None


class OHLCVBar(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class StockHistory(BaseModel):
    ticker: str
    period: str
    interval: str
    bars: list[OHLCVBar]


class CompareItem(BaseModel):
    ticker: str
    name: str
    dates: list[str]
    closes: list[float]
    normalized: list[float]
    total_return_pct: float


class CompareResponse(BaseModel):
    tickers: list[str]
    period: str
    items: list[CompareItem]


# ── Portfolio schemas ──────────────────────────────────────────────────────────

class HoldingBase(BaseModel):
    ticker: str
    shares: float
    avg_cost: float

    @field_validator("ticker")
    @classmethod
    def upper_ticker(cls, v: str) -> str:
        return v.upper().strip()

    @field_validator("shares", "avg_cost")
    @classmethod
    def positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Must be positive")
        return v


class HoldingCreate(HoldingBase):
    pass


class HoldingOut(HoldingBase):
    id: int
    portfolio_id: int
    added_at: datetime

    model_config = {"from_attributes": True}


class PortfolioBase(BaseModel):
    name: str
    description: str = ""


class PortfolioCreate(PortfolioBase):
    holdings: list[HoldingCreate] = []


class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    holdings: Optional[list[HoldingCreate]] = None


class PortfolioOut(PortfolioBase):
    id: int
    created_at: datetime
    updated_at: datetime
    holdings: list[HoldingOut] = []

    model_config = {"from_attributes": True}


class HoldingValue(BaseModel):
    ticker: str
    shares: float
    avg_cost: float
    current_price: float
    market_value: float
    cost_basis: float
    pnl: float
    pnl_pct: float
    weight_pct: float


class PortfolioValue(BaseModel):
    portfolio_id: int
    name: str
    total_value: float
    total_cost: float
    total_pnl: float
    total_pnl_pct: float
    holdings: list[HoldingValue]
