import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { analytics } from "../lib/analytics";
import { useQuote, useSparkline } from "../hooks/useStock";
import { fmt, pctFmt } from "../utils/format";

const STORAGE_KEY = "market_watchlist";

function loadWatchlist(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}

function saveWatchlist(tickers: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickers));
}

function Sparkline({ ticker }: { ticker: string }) {
  const { data: hist } = useSparkline(ticker);
  if (!hist?.bars.length) return <div className="w-16 h-8" />;
  const bars = hist.bars;
  const up = bars[bars.length - 1].close >= bars[0].close;
  const sparkData = bars.map((b) => ({ v: b.close }));
  return (
    <ResponsiveContainer width={72} height={32}>
      <LineChart data={sparkData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={up ? "#22c55e" : "#ef4444"}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function WatchRow({ ticker, onRemove }: { ticker: string; onRemove: () => void }) {
  const { data, isLoading, isError } = useQuote(ticker);
  const navigate = useNavigate();
  const up = (data?.change ?? 0) >= 0;

  return (
    <tr
      className="border-b border-bg-border/50 hover:bg-bg-elevated/50 transition-colors cursor-pointer"
      onClick={() => navigate(`/?ticker=${ticker}`)}
    >
      <td className="py-3 pr-4 font-mono font-bold text-brand w-20">{ticker}</td>
      <td className="py-3 pr-4 text-muted text-sm hidden sm:table-cell max-w-[160px] truncate">{data?.name ?? "—"}</td>
      <td className="py-3 pr-4 hidden md:table-cell">
        <Sparkline ticker={ticker} />
      </td>
      {isLoading ? (
        <td colSpan={4} className="py-3"><div className="skeleton h-4 w-32 rounded" /></td>
      ) : isError ? (
        <td colSpan={4} className="py-3 text-red text-sm">Failed to load</td>
      ) : data ? (
        <>
          <td className="py-3 pr-4 font-mono text-right">${fmt(data.price)}</td>
          <td className={`py-3 pr-4 font-mono font-semibold text-right ${up ? "text-green" : "text-red"}`}>
            {pctFmt(data.change_pct)}
          </td>
          <td className="py-3 pr-4 text-muted text-sm text-right hidden lg:table-cell">
            {data.market_cap ? `$${(data.market_cap / 1e9).toFixed(1)}B` : "—"}
          </td>
          <td className="py-3 pr-4 text-muted text-sm hidden md:table-cell">{data.sector ?? "—"}</td>
        </>
      ) : null}
      <td className="py-3 text-right">
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-muted hover:text-red transition-colors text-xs px-1 py-1"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

export default function WatchlistPage() {
  const [tickers, setTickers] = useState<string[]>(loadWatchlist);
  const [input, setInput]     = useState("");

  useEffect(() => { saveWatchlist(tickers); }, [tickers]);
  useEffect(() => { analytics.pageViewed("Watchlist"); }, []);

  const add = () => {
    const t = input.trim().toUpperCase();
    if (!t || tickers.includes(t)) return;
    setTickers((prev) => [...prev, t]);
    analytics.watchlistAdded(t);
    setInput("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <h2 className="text-lg font-bold mb-1">Watchlist</h2>
        <p className="text-muted text-sm mb-4">Click any row to open the stock dashboard.</p>
        <div className="flex gap-2">
          <input
            className="input flex-1 uppercase font-mono"
            placeholder="Add ticker… e.g. AAPL"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && add()}
            maxLength={10}
          />
          <button className="btn-primary" onClick={add}>Add</button>
        </div>
      </div>

      {tickers.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-muted">Your watchlist is empty.</p>
          <p className="text-muted text-sm mt-1">Add tickers above to track them here.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-muted text-xs uppercase tracking-wider">
                <th className="text-left py-2 pr-4">Ticker</th>
                <th className="text-left py-2 pr-4 hidden sm:table-cell">Name</th>
                <th className="text-left py-2 pr-4 hidden md:table-cell">1M Trend</th>
                <th className="text-right py-2 pr-4">Price</th>
                <th className="text-right py-2 pr-4">1D %</th>
                <th className="text-right py-2 pr-4 hidden lg:table-cell">Mkt Cap</th>
                <th className="text-left py-2 pr-4 hidden md:table-cell">Sector</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {tickers.map((t) => (
                <WatchRow
                  key={t}
                  ticker={t}
                  onRemove={() => setTickers((prev) => prev.filter((x) => x !== t))}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
