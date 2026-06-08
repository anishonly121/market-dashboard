import datetime
import os

import yfinance as yf
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.market_data import _cached, get_quote

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
