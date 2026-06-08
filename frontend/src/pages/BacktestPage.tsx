import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { analytics } from "../lib/analytics";
import { useHistory } from "../hooks/useStock";
import type { Period } from "../types";
import { fmt, moneyFmt, pctFmt } from "../utils/format";

const YEAR_OPTIONS: { label: string; period: Period; years: number }[] = [
  { label: "1 Year",  period: "1y",  years: 1 },
  { label: "2 Years", period: "2y",  years: 2 },
  { label: "5 Years", period: "5y",  years: 5 },
];

const RF_ANNUAL = 0.045;

function calcCAGR(start: number, end: number, years: number) {
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}

function calcMaxDrawdown(closes: number[]) {
  let peak = closes[0] ?? 0;
  let maxDD = 0;
  for (const c of closes) {
    if (c > peak) peak = c;
    const dd = (peak - c) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD * 100;
}

function calcStats(dailyRets: number[], cagr: number) {
  if (!dailyRets.length) return { sharpe: 0, volatility: 0, winRate: 0 };
  const mean = dailyRets.reduce((a, b) => a + b, 0) / dailyRets.length;
  const variance = dailyRets.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyRets.length;
  const annualVol = Math.sqrt(variance) * Math.sqrt(252) * 100;
  const sharpe = annualVol > 0 ? ((cagr - RF_ANNUAL * 100) / annualVol) : 0;
  const winRate = (dailyRets.filter((r) => r > 0).length / dailyRets.length) * 100;
  return { sharpe, volatility: annualVol, winRate };
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function BtTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-bg-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-muted mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-mono font-semibold" style={{ color: p.color }}>
          {p.name}: {moneyFmt(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function BacktestPage() {
  const [ticker,    setTicker]  = useState("AAPL");
  const [amount,    setAmount]  = useState(10000);
  const [yearOpt,   setYearOpt] = useState(YEAR_OPTIONS[0]);
  const [submitted, setSubmit]  = useState(false);
  const [benchmark, setBench]   = useState(true);

  useEffect(() => { analytics.pageViewed("Backtest"); }, []);

  const { data: history,    isLoading: hLoading } = useHistory(submitted ? ticker : "", yearOpt.period);
  const { data: spyHistory, isLoading: sLoading  } = useHistory(submitted && benchmark ? "SPY" : "", yearOpt.period);

  const result = useMemo(() => {
    if (!history?.bars.length) return null;
    const closes = history.bars.map((b) => b.close);
    const dates  = history.bars.map((b) =>
      new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));

    const startPrice = closes[0];
    const endPrice   = closes[closes.length - 1];
    const shares     = amount / startPrice;
    const finalValue = shares * endPrice;
    const totalReturn = ((finalValue / amount) - 1) * 100;
    const cagr       = calcCAGR(amount, finalValue, yearOpt.years);
    const maxDD      = calcMaxDrawdown(closes);
    const dailyRets  = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
    const bestDay    = Math.max(...dailyRets) * 100;
    const worstDay   = Math.min(...dailyRets) * 100;
    const { sharpe, volatility, winRate } = calcStats(dailyRets, cagr);

    let spyByDate: Map<string, number> | null = null;
    if (spyHistory?.bars.length) {
      const spyCloses = spyHistory.bars.map((b) => b.close);
      const spyShares = amount / spyCloses[0];
      spyByDate = new Map(
        spyHistory.bars.map((b, i) => [
          new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          parseFloat((spyShares * spyCloses[i]).toFixed(2)),
        ])
      );
    }

    const chartData = closes.map((c, i) => {
      const entry: Record<string, unknown> = {
        date:   dates[i],
        [ticker]: parseFloat((shares * c).toFixed(2)),
      };
      if (spyByDate) {
        const spyVal = spyByDate.get(dates[i]);
        if (spyVal !== undefined) entry["S&P 500"] = spyVal;
      }
      return entry;
    });

    const spyFinalVal = spyByDate ? chartData[chartData.length - 1]["S&P 500"] as number | undefined : null;
    const spyCagr = spyFinalVal != null ? calcCAGR(amount, spyFinalVal, yearOpt.years) : null;
    const alpha   = spyCagr != null ? cagr - spyCagr : null;

    return { finalValue, totalReturn, cagr, maxDD, bestDay, worstDay,
             sharpe, volatility, winRate, chartData, spyFinalVal, spyCagr, alpha, shares };
  }, [history, spyHistory, amount, yearOpt.years, ticker, benchmark]);

  const handleRun = () => {
    setSubmit(true);
    analytics.backtestRun(ticker, amount, yearOpt.years);
  };

  const up = (result?.totalReturn ?? 0) >= 0;
  const isLoading = submitted && (hLoading || sLoading);

  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <h2 className="text-lg font-bold mb-1">Backtest</h2>
        <p className="text-muted text-sm mb-4">
          "If I'd invested $X in this stock N years ago, what would it be worth today?"
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Ticker</label>
            <input
              className="input mt-1 w-28 uppercase font-mono"
              value={ticker}
              onChange={(e) => { setTicker(e.target.value.toUpperCase()); setSubmit(false); }}
              maxLength={10}
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Initial Investment</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
              <input
                className="input pl-6 w-36"
                type="number" min={100} step={100}
                value={amount}
                onChange={(e) => { setAmount(Number(e.target.value)); setSubmit(false); }}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Period</label>
            <div className="flex mt-1 rounded-lg overflow-hidden border border-bg-border">
              {YEAR_OPTIONS.map((o) => (
                <button
                  key={o.label}
                  onClick={() => { setYearOpt(o); setSubmit(false); }}
                  className={`px-3 py-2 text-xs font-semibold transition-colors ${
                    o.label === yearOpt.label
                      ? "bg-brand text-white"
                      : "text-muted hover:bg-bg-card hover:text-slate-200"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted cursor-pointer select-none self-end pb-2">
            <input
              type="checkbox"
              className="accent-brand w-3.5 h-3.5"
              checked={benchmark}
              onChange={(e) => setBench(e.target.checked)}
            />
            vs S&amp;P 500 (SPY)
          </label>
          <button className="btn-primary" onClick={handleRun}>
            Run Backtest
          </button>
        </div>
      </div>

      {isLoading && <div className="skeleton h-80 rounded-xl" />}

      {result && submitted && (
        <div className="flex flex-col gap-4 animate-slide-up">
          {/* Primary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Initial",      value: moneyFmt(amount),            cls: "" },
              { label: "Final Value",  value: moneyFmt(result.finalValue), cls: up ? "text-green" : "text-red" },
              { label: "Total Return", value: pctFmt(result.totalReturn),  cls: up ? "text-green" : "text-red" },
              { label: "CAGR",         value: pctFmt(result.cagr),         cls: up ? "text-green" : "text-red" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="card-sm text-center">
                <p className="text-xs uppercase tracking-widest text-muted mb-1">{label}</p>
                <p className={`text-xl font-bold font-mono ${cls}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Risk / quality metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Sharpe Ratio", value: result.sharpe.toFixed(2),          cls: result.sharpe >= 1 ? "text-green" : result.sharpe >= 0 ? "text-amber" : "text-red" },
              { label: "Ann. Volatility", value: `${result.volatility.toFixed(1)}%`, cls: "text-muted" },
              { label: "Max Drawdown",  value: `-${result.maxDD.toFixed(1)}%`,   cls: "text-red" },
              { label: "Win Rate",      value: `${result.winRate.toFixed(1)}%`,  cls: result.winRate >= 50 ? "text-green" : "text-red" },
              { label: "Best Day",      value: pctFmt(result.bestDay),           cls: "text-green" },
              { label: "Worst Day",     value: pctFmt(result.worstDay),          cls: "text-red" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="card-sm text-center">
                <p className="text-[10px] uppercase tracking-widest text-muted mb-1">{label}</p>
                <p className={`text-base font-bold font-mono ${cls}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Alpha strip */}
          {result.alpha != null && result.spyCagr != null && (
            <div className={`card-sm flex items-center justify-between text-sm border ${result.alpha >= 0 ? "border-green/20 bg-green/5" : "border-red/20 bg-red/5"}`}>
              <span className="text-muted">vs S&amp;P 500 benchmark</span>
              <span className="font-mono font-semibold">
                <span className="text-muted mr-3">SPY CAGR {pctFmt(result.spyCagr)}</span>
                <span className={result.alpha >= 0 ? "text-green" : "text-red"}>
                  Alpha {result.alpha >= 0 ? "+" : ""}{result.alpha.toFixed(2)}%
                </span>
              </span>
            </div>
          )}

          {/* Growth chart */}
          <div className="card">
            <h3 className="font-semibold mb-4">
              ${amount.toLocaleString()} invested in <span className="text-brand">{ticker}</span> — {yearOpt.label} ago
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={result.chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={up ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={up ? "#22c55e" : "#ef4444"} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="spyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#8888aa", fontSize: 11 }} axisLine={false} tickLine={false}
                  interval={Math.floor(result.chartData.length / 5)} />
                <YAxis tick={{ fill: "#8888aa", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => moneyFmt(v)} width={80} />
                <Tooltip content={<BtTooltip />} />
                {benchmark && result.spyCagr != null && (
                  <Area type="monotone" dataKey="S&P 500"
                    stroke="#6366f1" strokeWidth={1.5} fill="url(#spyGrad)" dot={false} strokeDasharray="4 3" />
                )}
                <Area type="monotone" dataKey={ticker}
                  stroke={up ? "#22c55e" : "#ef4444"} strokeWidth={2} fill="url(#btGrad)" dot={false} />
                <Legend wrapperStyle={{ fontSize: 12, color: "#8888aa", paddingTop: "12px" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Narrative */}
          <div className="card text-sm text-muted leading-relaxed">
            <b className="text-slate-300">{fmt(result.shares, 4)} shares</b> of{" "}
            <b className="text-brand">{ticker}</b> purchased at{" "}
            <b className="text-slate-300">${history?.bars[0]?.close.toFixed(2)}</b> on{" "}
            {new Date(history!.bars[0].date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
            {" "}Worth{" "}
            <b className={up ? "text-green" : "text-red"}>{moneyFmt(result.finalValue)}</b> today at{" "}
            <b className="text-slate-300">${history?.bars[history.bars.length - 1].close.toFixed(2)}</b>.
            {result.sharpe >= 1 && <span className="text-green"> Sharpe ≥ 1 — strong risk-adjusted return.</span>}
            {result.sharpe < 0 && <span className="text-red"> Negative Sharpe — returns lagged the risk-free rate.</span>}
          </div>
        </div>
      )}
    </div>
  );
}
