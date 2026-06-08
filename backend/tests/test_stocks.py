"""
Stock endpoint tests.
yfinance is mocked so tests run offline and stay fast.
"""

from unittest.mock import MagicMock, patch

import pandas as pd
import pytest


def _mock_ticker(price=150.0, prev_close=148.0):
    t = MagicMock()
    t.info = {
        "quoteType": "EQUITY",
        "longName": "Apple Inc.",
        "shortName": "Apple",
        "currentPrice": price,
        "previousClose": prev_close,
        "regularMarketOpen": 149.0,
        "dayHigh": 151.0,
        "dayLow": 147.0,
        "volume": 60_000_000,
        "averageVolume": 55_000_000,
        "marketCap": 2_400_000_000_000,
        "trailingPE": 28.5,
        "trailingEps": 6.11,
        "dividendYield": 0.005,
        "fiftyTwoWeekHigh": 200.0,
        "fiftyTwoWeekLow": 120.0,
        "beta": 1.2,
        "exchange": "NMS",
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "longBusinessSummary": "Apple designs and sells electronics.",
    }
    idx = pd.date_range("2024-01-01", periods=5, freq="B")
    t.history.return_value = pd.DataFrame(
        {"Open": [148, 149, 150, 149, 150],
         "High": [152, 151, 153, 150, 152],
         "Low":  [146, 147, 148, 147, 149],
         "Close": [150, 149, 151, 148, 150],
         "Volume": [60e6] * 5},
        index=idx,
    )
    return t


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@patch("app.services.market_data.yf.Ticker")
def test_quote_returns_correct_shape(mock_yf, client):
    mock_yf.return_value = _mock_ticker()
    r = client.get("/api/stocks/AAPL")
    assert r.status_code == 200
    data = r.json()
    assert data["ticker"] == "AAPL"
    assert data["price"] == 150.0
    assert data["change"] == pytest.approx(2.0)
    assert data["exchange"] == "NMS"


@patch("app.services.market_data.yf.Ticker")
def test_quote_calculates_change_pct(mock_yf, client):
    mock_yf.return_value = _mock_ticker(price=154.8, prev_close=150.0)
    r = client.get("/api/stocks/MSFT")
    assert r.status_code == 200
    data = r.json()
    assert data["change_pct"] == pytest.approx(3.2, abs=0.01)


@patch("app.services.market_data.yf.Ticker")
def test_history_returns_bars(mock_yf, client):
    mock_yf.return_value = _mock_ticker()
    r = client.get("/api/stocks/AAPL/history?period=1mo&interval=1d")
    assert r.status_code == 200
    data = r.json()
    assert data["ticker"] == "AAPL"
    assert len(data["bars"]) == 5
    bar = data["bars"][0]
    assert {"date", "open", "high", "low", "close", "volume"} == set(bar.keys())


def test_history_invalid_period(client):
    r = client.get("/api/stocks/AAPL/history?period=99y")
    assert r.status_code == 400


def test_history_invalid_interval(client):
    r = client.get("/api/stocks/AAPL/history?interval=2y")
    assert r.status_code == 400
