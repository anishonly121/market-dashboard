import { useState } from "react";
import CompareChart from "../components/charts/CompareChart";
import { useCompare } from "../hooks/useStock";
import type { Period } from "../types";
import { PERIOD_LABELS } from "../types";
import { pctFmt, moneyFmt } from "../utils/format";

const PERIODS: Period[] = ["1mo", "3mo", "6mo", "1y", "2y", "5y"];
const PRESETS = [
  { label: "FAANG+", tickers: ["META", "AAPL", "AMZN", "NVDA", "GOOGL"] },
  { label: "EVs",    tickers: ["TSLA", "RIVN", "NIO", "F", "GM"] },
  { label: "Chips",  tickers: ["NVDA", "AMD", "INTC", "QCOM", "AVGO"] },
  { label: "Banks",  tickers: ["JPM", "BAC", "GS", "MS", "C"] },
];

export default function ComparePage() {
  const [input, setInput]   = useState("AAPL, MSFT, GOOGL, NVDA");
  const [period, setPeriod] = useState<Period>("1y");

  const tickers = input.split(/[,\s]+/).map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 6);
  const { data, isLoading, error } = useCompare(tickers, period);

  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <h2 className="text-lg font-bold mb-4">Compare Stocks</h2>

        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => setInput(p.tickers.join(", "))}
              className="btn-ghost text-xs">
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            className="input flex-1 min-w-0 uppercase"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="AAPL, TSLA, AMZN (up to 6)"
          />
          <div className="flex rounded-lg overflow-hidden border border-bg-border">
            {PERIODS.map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
                  p === period ? "bg-brand text-white" : "text-muted hover:bg-bg-card hover:text-slate-200"
                }`}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted mt-2">{tickers.length} ticker{tickers.length !== 1 ? "s" : ""} selected · max 6</p>
      </div>

      {error && (
        <div className="card border-red/30 bg-red/5 text-red text-sm">
          Error loading comparison data.
        </div>
      )}

      {isLoading && (
        <div className="skeleton h-96 rounded-xl" />
      )}

      {data && (
        <div className="flex flex-col gap-4 animate-slide-up">
          <CompareChart items={data.items} />

          {/* Summary table */}
          <div className="card overflow-x-auto">
            <h3 className="font-semibold mb-3">Performance Summary</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border text-muted text-xs uppercase tracking-wider">
                  {["Ticker", "Company", "Period Return", "First Price", "Last Price"].map((h) => (
                    <th key={h} className="text-left py-2 pr-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...data.items].sort((a, b) => b.total_return_pct - a.total_return_pct).map((item) => {
                  const up = item.total_return_pct >= 0;
                  return (
                    <tr key={item.ticker} className="border-b border-bg-border/50 hover:bg-bg-elevated/50">
                      <td className="py-2.5 pr-4 font-mono font-bold text-brand">{item.ticker}</td>
                      <td className="py-2.5 pr-4 text-muted text-xs">{item.name}</td>
                      <td className={`py-2.5 pr-4 font-mono font-bold ${up ? "text-green" : "text-red"}`}>
                        {pctFmt(item.total_return_pct)}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-muted">${item.closes[0]?.toFixed(2) ?? "—"}</td>
                      <td className="py-2.5 pr-4 font-mono">${item.closes[item.closes.length - 1]?.toFixed(2) ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
