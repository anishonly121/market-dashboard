import datetime
import os

import yfinance as yf
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.market_data import _cached, _safe_float, get_quote

router = APIRouter(prefix="/market", tags=["market"])

INDICES = [
    {"symbol": "^GSPC",   "label": "S&P 500"},
    {"symbol": "^IXIC",   "label": "NASDAQ"},
    {"symbol": "^DJI",    "label": "DOW"},
    {"symbol": "BTC-USD", "label": "BTC"},
    {"symbol": "ETH-USD", "label": "ETH"},
    {"symbol": "GC=F",    "label": "Gold"},
    {"symbol": "^VIX",    "label": "VIX"},
]

SECTOR_ETFS = [
    {"symbol": "XLK",  "label": "Technology"},
    {"symbol": "XLF",  "label": "Financials"},
    {"symbol": "XLV",  "label": "Healthcare"},
    {"symbol": "XLE",  "label": "Energy"},
    {"symbol": "XLY",  "label": "Cons. Disc."},
    {"symbol": "XLP",  "label": "Cons. Staples"},
    {"symbol": "XLI",  "label": "Industrials"},
    {"symbol": "XLB",  "label": "Materials"},
    {"symbol": "XLU",  "label": "Utilities"},
    {"symbol": "XLRE", "label": "Real Estate"},
    {"symbol": "XLC",  "label": "Comm. Services"},
]


class IndexQuote(BaseModel):
    symbol: str
    label: str
    price: float
    change: float
    change_pct: float


class NewsItem(BaseModel):
    title: str
    publisher: str
    link: str
    published: int


class AIAnalysis(BaseModel):
    analysis: str
    model: str


def _quick_quote(symbol: str, label: str) -> dict | None:
    try:
        t = yf.Ticker(symbol)
        df = t.history(period="2d", interval="1d")
        if df.empty:
            return None
        price = float(df["Close"].iloc[-1])
        prev = float(df["Close"].iloc[-2]) if len(df) >= 2 else price
        change = price - prev
        change_pct = (change / prev * 100) if prev else 0.0
        return {"symbol": symbol, "label": label, "price": price, "change": change, "change_pct": change_pct}
    except Exception:
        return None


def _fetch_quote_list(items: list[dict], cache_key: str) -> list[IndexQuote]:
    def _fetch():
        return [IndexQuote(**q) for idx in items if (q := _quick_quote(idx["symbol"], idx["label"]))]
    return _cached(cache_key, _fetch, ttl=60)


@router.get("/indices", response_model=list[IndexQuote])
def get_indices():
    return _fetch_quote_list(INDICES, "market:indices")


@router.get("/sectors", response_model=list[IndexQuote])
def get_sectors():
    return _fetch_quote_list(SECTOR_ETFS, "market:sectors")


@router.get("/stocks/{ticker}/news", response_model=list[NewsItem])
def get_stock_news(ticker: str):
    ticker = ticker.upper().strip()

    def _fetch():
        t = yf.Ticker(ticker)
        raw = t.news or []
        items: list[NewsItem] = []
        for n in raw[:12]:
            try:
                content = n.get("content") or {}
                title = content.get("title") or n.get("title", "")
                publisher = (
                    (content.get("provider") or {}).get("displayName")
                    or n.get("publisher", "")
                )
                link = (
                    (content.get("canonicalUrl") or {}).get("url")
                    or n.get("link", "")
                )
                pub_date = content.get("pubDate") or ""
                try:
                    published = (
                        int(datetime.datetime.fromisoformat(pub_date.replace("Z", "+00:00")).timestamp())
                        if pub_date
                        else int(n.get("providerPublishTime", 0))
                    )
                except Exception:
                    published = 0
                if title:
                    items.append(NewsItem(title=title, publisher=publisher, link=link, published=published))
            except Exception:
                pass
        return items

    return _cached(f"news:{ticker}", _fetch, ttl=300)


class RecSummary(BaseModel):
    strongBuy: int = 0
    buy: int = 0
    hold: int = 0
    sell: int = 0
    strongSell: int = 0


class PriceTargets(BaseModel):
    current: float | None = None
    low: float | None = None
    mean: float | None = None
    high: float | None = None


class EarningsQuarter(BaseModel):
    quarter: str
    revenue: float | None = None
    eps: float | None = None


class Fundamentals(BaseModel):
    rec_summary: RecSummary = RecSummary()
    price_targets: PriceTargets = PriceTargets()
    earnings_history: list[EarningsQuarter] = []
    next_earnings: str | None = None


@router.get("/stocks/{ticker}/fundamentals", response_model=Fundamentals)
def get_fundamentals(ticker: str):
    ticker = ticker.upper().strip()

    def _fetch():
        t = yf.Ticker(ticker)
        rec = RecSummary()
        pt = PriceTargets()
        history: list[EarningsQuarter] = []
        next_earn: str | None = None

        # Analyst consensus
        try:
            rs = t.recommendations_summary
            if rs is not None and not rs.empty:
                row = rs.iloc[0]
                rec = RecSummary(
                    strongBuy=int(row.get("strongBuy", 0) or 0),
                    buy=int(row.get("buy", 0) or 0),
                    hold=int(row.get("hold", 0) or 0),
                    sell=int(row.get("sell", 0) or 0),
                    strongSell=int(row.get("strongSell", 0) or 0),
                )
        except Exception:
            pass

        # Price targets
        try:
            raw_pt = t.analyst_price_targets
            if raw_pt and isinstance(raw_pt, dict):
                pt = PriceTargets(
                    current=_safe_float(raw_pt.get("current")),
                    low=_safe_float(raw_pt.get("low")),
                    mean=_safe_float(raw_pt.get("mean")),
                    high=_safe_float(raw_pt.get("high")),
                )
        except Exception:
            pass

        # Quarterly revenue + EPS
        try:
            qf = t.quarterly_income_stmt
            if qf is not None and not qf.empty:
                rev_row = qf.loc["Total Revenue"] if "Total Revenue" in qf.index else None
                ni_row = qf.loc["Net Income"] if "Net Income" in qf.index else None
                shares = _safe_float(t.info.get("sharesOutstanding"))

                for col in list(qf.columns)[:8]:
                    try:
                        quarter = col.strftime("%b '%y") if hasattr(col, "strftime") else str(col)[:7]
                        revenue = _safe_float(rev_row[col]) if rev_row is not None else None
                        eps: float | None = None
                        if ni_row is not None and shares and shares > 0:
                            ni = _safe_float(ni_row[col])
                            if ni is not None:
                                eps = ni / shares
                        history.append(EarningsQuarter(quarter=quarter, revenue=revenue, eps=eps))
                    except Exception:
                        pass
                history.reverse()
        except Exception:
            pass

        # Next earnings date
        try:
            cal = t.calendar
            if cal is not None:
                if isinstance(cal, dict):
                    ed = cal.get("Earnings Date")
                    next_earn = str(ed[0] if isinstance(ed, (list, tuple)) else ed) if ed else None
                elif hasattr(cal, "index") and "Earnings Date" in cal.index:
                    ed = cal.loc["Earnings Date"]
                    next_earn = str(ed.iloc[0] if hasattr(ed, "iloc") else ed)
        except Exception:
            pass

        return Fundamentals(
            rec_summary=rec,
            price_targets=pt,
            earnings_history=history,
            next_earnings=next_earn,
        )

    return _cached(f"fundamentals:{ticker}", _fetch, ttl=3600)


# Top movers from a curated list of liquid stocks
UNIVERSE = [
    "AAPL","MSFT","NVDA","GOOGL","AMZN","META","TSLA","AVGO","ORCL","CRM",
    "NFLX","AMD","INTC","QCOM","TXN","ADBE","SHOP","SNOW","UBER","LYFT",
    "JPM","BAC","GS","MS","V","MA","PYPL","SQ","COIN","BRK-B",
    "JNJ","UNH","PFE","MRK","ABBV","LLY","CVS","CI",
    "XOM","CVX","OXY","BP","COP",
    "COST","WMT","TGT","HD","NKE","SBUX",
    "SPY","QQQ","IWM",
]


@router.get("/movers")
def get_top_movers():
    def _fetch():
        results = []
        for sym in UNIVERSE:
            q = _quick_quote(sym, sym)
            if q:
                results.append(q)
        gainers = sorted(results, key=lambda x: x["change_pct"], reverse=True)[:5]
        losers  = sorted(results, key=lambda x: x["change_pct"])[:5]
        return {"gainers": gainers, "losers": losers}
    return _cached("market:movers", _fetch, ttl=120)


@router.post("/stocks/{ticker}/analyze", response_model=AIAnalysis)
def analyze_stock(ticker: str):
    ticker = ticker.upper().strip()
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI analysis not configured — set ANTHROPIC_API_KEY")

    quote = get_quote(ticker)

    market_cap_str = f"${quote.market_cap:,}" if quote.market_cap else "N/A"
    div_str = f"{quote.dividend_yield * 100:.2f}%" if quote.dividend_yield else "None"
    eps_str = f"${quote.eps:.2f}" if quote.eps else "N/A"

    price_pct_52w = 0.0
    w_range = (quote.fifty_two_week_high or 0) - (quote.fifty_two_week_low or 0)
    if w_range and quote.price:
        price_pct_52w = ((quote.price - (quote.fifty_two_week_low or 0)) / w_range) * 100

    prompt = (
        f"Analyze {quote.name} ({ticker}) based on current market data:\n"
        f"Price: ${quote.price:.2f} ({quote.change_pct:+.2f}% today)\n"
        f"Market Cap: {market_cap_str} | P/E: {quote.pe_ratio or 'N/A'} | EPS: {eps_str} | Beta: {quote.beta or 'N/A'}\n"
        f"52-Week: ${quote.fifty_two_week_low:.2f}–${quote.fifty_two_week_high:.2f} "
        f"(currently at {price_pct_52w:.0f}th percentile of range)\n"
        f"Dividend Yield: {div_str} | Sector: {quote.sector or 'N/A'} | Industry: {quote.industry or 'N/A'}\n\n"
        "Write a 3-paragraph investment analysis: (1) current valuation and price momentum, "
        "(2) the single biggest risk to watch, (3) which investor profile this suits. "
        "Be concrete, reference the specific numbers, max 280 words total."
    )

    try:
        import anthropic  # type: ignore
        client = anthropic.Anthropic(api_key=api_key)
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}],
        )
        return AIAnalysis(analysis=msg.content[0].text, model="claude-haiku-4-5-20251001")
    except ImportError:
        raise HTTPException(status_code=503, detail="anthropic package not installed")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
