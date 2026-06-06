import type { StockQuote } from "../../types";
import { fmt, pctFmt, moneyFmt } from "../../utils/format";

interface Props {
  quote: StockQuote;
}

export default function StockHeader({ quote }: Props) {
  const up = quote.change >= 0;
  return (
    <div className="animate-slide-up">
      <div className="flex flex-wrap items-baseline gap-3 mb-1">
        <span className="text-3xl font-extrabold tracking-tight font-mono">{quote.ticker}</span>
        <span className="text-muted text-base">{quote.name}</span>
        <span className="badge-neu">{quote.exchange}</span>
        {quote.sector && <span className="badge-neu">{quote.sector}</span>}
      </div>

      <div className="flex flex-wrap items-baseline gap-4">
        <span className="text-4xl font-bold font-mono">${fmt(quote.price)}</span>
        <span className={`text-xl font-semibold ${up ? "text-green" : "text-red"}`}>
          {up ? "▲" : "▼"} ${Math.abs(quote.change).toFixed(2)} ({pctFmt(quote.change_pct)})
        </span>
      </div>

      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted">
        <span>Open: <span className="text-slate-300">${fmt(quote.open)}</span></span>
        <span>H: <span className="text-green">${fmt(quote.high)}</span></span>
        <span>L: <span className="text-red">${fmt(quote.low)}</span></span>
        <span>Vol: <span className="text-slate-300">{moneyFmt(quote.volume)}</span></span>
        <span>Avg Vol: <span className="text-slate-300">{moneyFmt(quote.avg_volume)}</span></span>
      </div>
    </div>
  );
}
