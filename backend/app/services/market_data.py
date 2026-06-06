"""
Thin wrapper around yfinance with in-process caching.
"""

import time
from typing import Optional

import numpy as np
import pandas as pd
import yfinance as yf
from fastapi import HTTPException

from ..schemas import (
    CompareItem,
    CompareResponse,
    OHLCVBar,
    StockHistory,
    StockQuote,
)

_CACHE: dict[str, tuple[float, object]] = {}
TTL = 120  # seconds


def _cached(key: str, fn, ttl: int = TTL):
    now = time.time()
    if key in _CACHE and now - _CACHE[key][0] < ttl:
        return _CACHE[key][1]
    result = fn()
    _CACHE[key] = (now, result)
    return result


VALID_PERIODS = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"}
VALID_INTERVALS = {"1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"}


def _safe_float(v, default: Optional[float] = None) -> Optional[float]:
    try:
        f = float(v)
        return None if (np.isnan(f) or np.isinf(f)) else f
    except Exception:
        return default


def _safe_int(v, default: int = 0) -> int:
    try:
        return int(v) if v and not np.isnan(float(v)) else default
    except Exception:
        return default


def get_quote(ticker: str) -> StockQuote:
    ticker = ticker.upper().strip()

    def _fetch():
        t = yf.Ticker(ticker)
        info = t.info
        if not info or info.get("quoteType") is None:
            raise HTTPException(status_code=404, detail=f"Ticker '{ticker}' not found")

        price = _safe_float(info.get("currentPrice") or info.get("regularMarketPrice"), 0.0)
        prev_close = _safe_float(info.get("previousClose") or info.get("regularMarketPreviousClose"), price)
        change = (price - prev_close) if price and prev_close else 0.0
        change_pct = (change / prev_close * 100) if prev_close else 0.0

        return StockQuote(
            ticker=ticker,
            name=info.get("longName") or info.get("shortName") or ticker,
            price=price or 0.0,
            prev_close=prev_close or 0.0,
            change=change,
            change_pct=change_pct,
            open=_safe_float(info.get("open") or info.get("regularMarketOpen"), 0.0) or 0.0,
            high=_safe_float(info.get("dayHigh") or info.get("regularMarketDayHigh"), 0.0) or 0.0,
            low=_safe_float(info.get("dayLow") or info.get("regularMarketDayLow"), 0.0) or 0.0,
            volume=_safe_int(info.get("volume") or info.get("regularMarketVolume")),
            avg_volume=_safe_int(info.get("averageVolume")),
            market_cap=_safe_int(info.get("marketCap")),
            pe_ratio=_safe_float(info.get("trailingPE")),
            eps=_safe_float(info.get("trailingEps")),
            dividend_yield=_safe_float(info.get("dividendYield")),
            fifty_two_week_high=_safe_float(info.get("fiftyTwoWeekHigh"), 0.0) or 0.0,
            fifty_two_week_low=_safe_float(info.get("fiftyTwoWeekLow"), 0.0) or 0.0,
            beta=_safe_float(info.get("beta")),
            exchange=info.get("exchange") or "—",
            sector=info.get("sector"),
            industry=info.get("industry"),
            description=info.get("longBusinessSummary"),
        )

    return _cached(f"quote:{ticker}", _fetch)


def get_history(ticker: str, period: str = "1y", interval: str = "1d") -> StockHistory:
    ticker = ticker.upper().strip()
    if period not in VALID_PERIODS:
        raise HTTPException(status_code=400, detail=f"Invalid period: {period}")
    if interval not in VALID_INTERVALS:
        raise HTTPException(status_code=400, detail=f"Invalid interval: {interval}")

    def _fetch():
        t = yf.Ticker(ticker)
        df = t.history(period=period, interval=interval)
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No history for '{ticker}'")

        bars = []
        for ts, row in df.iterrows():
            bars.append(OHLCVBar(
                date=ts.strftime("%Y-%m-%dT%H:%M:%S"),
                open=float(row["Open"]),
                high=float(row["High"]),
                low=float(row["Low"]),
                close=float(row["Close"]),
                volume=int(row["Volume"]),
            ))
        return StockHistory(ticker=ticker, period=period, interval=interval, bars=bars)

    return _cached(f"hist:{ticker}:{period}:{interval}", _fetch)


def get_comparison(tickers: list[str], period: str = "1y") -> CompareResponse:
    tickers = [t.upper().strip() for t in tickers]
    key = f"cmp:{'_'.join(sorted(tickers))}:{period}"

    def _fetch():
        frames: dict[str, pd.Series] = {}
        for sym in tickers:
            try:
                t = yf.Ticker(sym)
                df = t.history(period=period, interval="1d")
                if not df.empty:
                    frames[sym] = df["Close"].rename(sym)
            except Exception:
                pass

        if not frames:
            raise HTTPException(status_code=404, detail="No data for provided tickers")

        combined = pd.DataFrame(frames).dropna(how="all")
        items = []
        for sym in combined.columns:
            series = combined[sym].dropna()
            if series.empty:
                continue
            base = series.iloc[0]
            norm = ((series / base) * 100).tolist()
            dates = [d.strftime("%Y-%m-%d") for d in series.index]
            total_ret = ((series.iloc[-1] / base) - 1) * 100

            try:
                info = yf.Ticker(sym).info
                name = info.get("shortName") or sym
            except Exception:
                name = sym

            items.append(CompareItem(
                ticker=sym,
                name=name,
                dates=dates,
                closes=[float(v) for v in series.tolist()],
                normalized=norm,
                total_return_pct=float(total_ret),
            ))

        return CompareResponse(tickers=list(combined.columns), period=period, items=items)

    return _cached(key, _fetch)


def get_current_price(ticker: str) -> float:
    try:
        q = get_quote(ticker)
        return q.price
    except Exception:
        t = yf.Ticker(ticker.upper())
        df = t.history(period="2d", interval="1d")
        if df.empty:
            raise HTTPException(status_code=404, detail=f"Cannot get price for {ticker}")
        return float(df["Close"].iloc[-1])
