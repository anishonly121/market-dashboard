from typing import Annotated

from fastapi import APIRouter, Query

from ..schemas import CompareResponse, StockHistory, StockQuote
from ..services.market_data import get_comparison, get_history, get_quote

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/{ticker}", response_model=StockQuote)
def stock_quote(ticker: str):
    """Current quote for a ticker."""
    return get_quote(ticker)


@router.get("/{ticker}/history", response_model=StockHistory)
def stock_history(
    ticker: str,
    period: Annotated[str, Query(description="1mo 3mo 6mo 1y 2y 5y")] = "1y",
    interval: Annotated[str, Query(description="1d 1wk 1mo")] = "1d",
):
    """OHLCV history for a ticker."""
    return get_history(ticker, period, interval)


@router.get("/compare/many", response_model=CompareResponse)
def stock_compare(
    tickers: Annotated[list[str], Query(description="Comma-separated list passed as repeated params")],
    period: str = "1y",
):
    """Compare multiple tickers (normalized returns)."""
    return get_comparison(tickers, period)
