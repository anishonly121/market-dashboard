import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
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

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function BtTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-bg-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-muted mb-1">{label}</p>
      <p className="font-mono font-semibold">{moneyFmt(payload[0].value)}</p>
    </div>
  );
}

export default function BacktestPage() {
  const [ticker, setTicker]   = useState("AAPL");
  const [amount, setAmount]   = useState(10000);
  const [yearOpt, setYearOpt] = useState(YEAR_OPTIONS[0]);
  const [submitted, setSubmit] = useState(false);

  useEffect(() => { analytics.pageViewed("Backtest"); }, []);

  const { data: history, isLoading } = useHistory(
    submitted ? ticker : "",
    yearOpt.period,
  );

  const result = useMemo(() => {
    if (!history?.bars.length) return null;
    const closes  = history.bars.map((b) => b.close);
    const dates   = history.bars.map((b) =>
      new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));

    const startPrice  = closes[0];
    const endPrice    = closes[closes.length - 1];
    const shares      = amount / startPrice;
    const finalValue  = shares * endPrice;
    const totalReturn = ((finalValue / amount) - 1) * 100;
    const cagr        = calcCAGR(amount, finalValue, yearOpt.years);
    const maxDD       = calcMaxDrawdown(closes);
    const dailyRets   = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
    const bestDay     = Math.max(...dailyRets) * 100;
    const worstDay    = Math.min(...dailyRets) * 100;

    const chartData = closes.map((c, i) => ({
      date:  dates[i],
      value: parseFloat((shares * c).toFixed(2)),
    }));

    return { finalValue, totalReturn, cagr, maxDD, bestDay, worstDay, chartData };
  }, [history, amount, yearOpt.years]);

  const handleRun = () => {
    setSubmit(true);
    analytics.backtestRun(ticker, amount, yearOpt.years);
  };

  const up = (result?.totalReturn ?? 0) >= 0;

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
          <button className="btn-primary" onClick={handleRun}>
            Run Backtest
          </button>
        </div>
      </div>

      {isLoading && submitted && (
        <div className="skeleton h-80 rounded-xl" />
      )}

      {result && submitted && (
        <div className="flex flex-col gap-4 animate-slide-up">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Initial",       value: moneyFmt(amount),             cls: "" },
              { label: "Final Value",   value: moneyFmt(result.finalValue),  cls: up ? "text-green" : "text-red" },
              { label: "Total Return",  value: pctFmt(result.totalReturn),   cls: up ? "text-green" : "text-red" },
              { label: "CAGR",          value: pctFmt(result.cagr),          cls: up ? "text-green" : "text-red" },
              { label: "Max Drawdown",  value: `-${result.maxDD.toFixed(1)}%`, cls: "text-red" },
              { label: "Best Day",      value: pctFmt(result.bestDay),       cls: "text-green" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="card-sm text-center">
                <p className="text-xs uppercase tracking-widest text-muted mb-1">{label}</p>
                <p className={`text-lg font-bold font-mono ${cls}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Growth chart */}
          <div className="card">
            <h3 className="font-semibold mb-4">
              ${amount.toLocaleString()} invested in <span className="text-brand">{ticker}</span> — {yearOpt.label} ago
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={result.chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={up ? "#22c55e" : "#ef4444"} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={up ? "#22c55e" : "#ef4444"} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#8888aa", fontSize: 11 }} axisLine={false} tickLine={false}
                  interval={Math.floor(result.chartData.length / 6)} />
                <YAxis tick={{ fill: "#8888aa", fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => moneyFmt(v)} width={80} />
                <Tooltip content={<BtTooltip />} />
                <Area type="monotone" dataKey="value" stroke={up ? "#22c55e" : "#ef4444"}
                  strokeWidth={2} fill="url(#btGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card text-sm text-muted">
            <p>
              <b className="text-slate-300">{fmt(amount / result.chartData[0]?.value * (amount / result.chartData[0]?.value), 4)} shares</b> of <b className="text-brand">{ticker}</b> purchased at{" "}
              <b className="text-slate-300">${history?.bars[0]?.close.toFixed(2)}</b> on{" "}
              {new Date(history!.bars[0].date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
              Worth <b className={up ? "text-green" : "text-red"}>{moneyFmt(result.finalValue)}</b> today at{" "}
              <b className="text-slate-300">${history?.bars[history.bars.length - 1].close.toFixed(2)}</b>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
