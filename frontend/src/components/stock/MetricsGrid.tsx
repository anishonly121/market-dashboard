import type { StockQuote } from "../../types";
import { fmt, moneyFmt, pctFmt } from "../../utils/format";

interface Props { quote: StockQuote }

interface MetricTile { label: string; value: string; sub?: string }

function Tile({ label, value, sub }: MetricTile) {
  return (
    <div className="card-sm flex flex-col gap-1">
      <span className="text-xs uppercase tracking-widest text-muted">{label}</span>
      <span className="text-lg font-bold font-mono">{value}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  );
}

export default function MetricsGrid({ quote }: Props) {
  const range52 = quote.fifty_two_week_high - quote.fifty_two_week_low;
  const pos52 = range52 > 0
    ? ((quote.price - quote.fifty_two_week_low) / range52) * 100
    : 50;

  const tiles: MetricTile[] = [
    { label: "Market Cap",       value: moneyFmt(quote.market_cap ?? 0) },
    { label: "P/E Ratio",        value: quote.pe_ratio != null ? fmt(quote.pe_ratio) : "N/A" },
    { label: "EPS (TTM)",        value: quote.eps != null ? `$${fmt(quote.eps)}` : "N/A" },
    { label: "Div Yield",        value: quote.dividend_yield != null ? pctFmt(quote.dividend_yield * 100) : "N/A" },
    { label: "Beta",             value: quote.beta != null ? fmt(quote.beta) : "N/A" },
    { label: "52W High",         value: `$${fmt(quote.fifty_two_week_high)}` },
    { label: "52W Low",          value: `$${fmt(quote.fifty_two_week_low)}` },
    { label: "52W Position",     value: `${pos52.toFixed(0)}%`, sub: "from 52-week low" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tiles.map((t) => <Tile key={t.label} {...t} />)}
      </div>

      {/* 52-week range bar */}
      <div className="mt-3 card-sm">
        <div className="flex justify-between text-xs text-muted mb-2">
          <span>52W Low: <b className="text-red">${fmt(quote.fifty_two_week_low)}</b></span>
          <span className="text-slate-300 font-semibold">Current: ${fmt(quote.price)}</span>
          <span>52W High: <b className="text-green">${fmt(quote.fifty_two_week_high)}</b></span>
        </div>
        <div className="relative h-2 rounded-full bg-bg-border overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red via-amber to-green"
            style={{ width: "100%" }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-brand shadow"
            style={{ left: `calc(${pos52}% - 6px)` }}
          />
        </div>
      </div>

      {quote.description && (
        <details className="mt-3">
          <summary className="card-sm cursor-pointer text-sm text-muted hover:text-slate-200 transition-colors">
            About {quote.name}
          </summary>
          <p className="mt-2 text-sm text-muted leading-relaxed px-1">{quote.description}</p>
        </details>
      )}
    </div>
  );
}
