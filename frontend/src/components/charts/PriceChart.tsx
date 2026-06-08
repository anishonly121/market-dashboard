import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { OHLCVBar, Period } from "../../types";
import { PERIOD_LABELS } from "../../types";
import { fmt, volFmt } from "../../utils/format";
import CandlestickChart from "./CandlestickChart";

interface Props {
  bars: OHLCVBar[];
  period: Period;
  onPeriodChange: (p: Period) => void;
  ticker: string;
  prevClose?: number;
}

const PERIODS: Period[] = ["1mo", "3mo", "6mo", "1y", "2y", "5y"];

function calcMA(data: number[], window: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < window - 1) return null;
    const slice = data.slice(i - window + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / window;
  });
}

function calcRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;
  const deltas = closes.slice(1).map((c, i) => c - closes[i]);
  let gains = deltas.slice(0, period).filter((d) => d > 0).reduce((a, b) => a + b, 0) / period;
  let losses = Math.abs(deltas.slice(0, period).filter((d) => d < 0).reduce((a, b) => a + b, 0)) / period;
  result[period] = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);
  for (let i = period; i < deltas.length; i++) {
    const gain = deltas[i] > 0 ? deltas[i] : 0;
    const loss = deltas[i] < 0 ? -deltas[i] : 0;
    gains  = (gains  * (period - 1) + gain)  / period;
    losses = (losses * (period - 1) + loss) / period;
    result[i + 1] = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);
  }
  return result;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-bg-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted">{p.name}:</span>
          <span className="font-mono font-semibold text-slate-200">${fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function RSITooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  const cls = v >= 70 ? "text-red" : v <= 30 ? "text-green" : "text-muted";
  return (
    <div className="bg-bg-card border border-bg-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-muted mb-1">{label}</p>
      <span className={`font-mono font-semibold ${cls}`}>RSI {v?.toFixed(1)}</span>
    </div>
  );
}

type ChartMode = "area" | "candle";

export default function PriceChart({ bars, period, onPeriodChange, ticker, prevClose }: Props) {
  const [showMA,   setShowMA]   = useState(true);
  const [showRSI,  setShowRSI]  = useState(false);
  const [mode,     setMode]     = useState<ChartMode>("area");

  const data = useMemo(() => {
    const closes = bars.map((b) => b.close);
    const ma20  = calcMA(closes, 20);
    const ma50  = calcMA(closes, 50);
    const rsi14 = calcRSI(closes, 14);
    return bars.map((b, i) => ({
      date: new Date(b.date).toLocaleDateString("en-US", {
        month: "short", day: "numeric",
        year: period === "5y" ? "numeric" : undefined,
      }),
      close:  b.close,
      volume: b.volume,
      ma20:   ma20[i]  ?? undefined,
      ma50:   ma50[i]  ?? undefined,
      rsi:    rsi14[i] ?? undefined,
    }));
  }, [bars, period]);

  const first = data[0]?.close ?? 0;
  const last  = data[data.length - 1]?.close ?? 0;
  const up    = last >= first;
  const color = up ? "#22c55e" : "#ef4444";
  const yMin  = Math.min(...data.map((d) => d.close)) * 0.97;
  const yMax  = Math.max(...data.map((d) => d.close)) * 1.03;

  const tickCount = data.length > 100 ? 6 : data.length > 30 ? 8 : data.length;
  const xTicks = data
    .filter((_, i) => i % Math.floor(data.length / Math.min(tickCount, 8)) === 0)
    .map((d) => d.date);

  return (
    <div className="card">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-slate-200">{ticker} · Price Chart</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart mode toggle */}
          <div className="flex rounded-lg overflow-hidden border border-bg-border text-xs">
            <button
              onClick={() => setMode("area")}
              className={`px-2.5 py-1 font-semibold transition-colors ${mode === "area" ? "bg-brand text-white" : "text-muted hover:text-slate-200"}`}
            >
              Line
            </button>
            <button
              onClick={() => setMode("candle")}
              className={`px-2.5 py-1 font-semibold transition-colors ${mode === "candle" ? "bg-brand text-white" : "text-muted hover:text-slate-200"}`}
            >
              Candles
            </button>
          </div>

          {mode === "area" && (
            <button
              onClick={() => setShowMA((s) => !s)}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${showMA ? "bg-amber/20 text-amber" : "bg-bg-border text-muted"}`}
            >
              MA 20/50
            </button>
          )}
          <button
            onClick={() => setShowRSI((s) => !s)}
            className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${showRSI ? "bg-cyan/20 text-cyan" : "bg-bg-border text-muted"}`}
          >
            RSI 14
          </button>

          {/* Period selector */}
          <div className="flex rounded-lg overflow-hidden border border-bg-border">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors ${p === period ? "bg-brand text-white" : "text-muted hover:text-slate-200 hover:bg-bg-card"}`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      {mode === "candle" ? (
        <CandlestickChart bars={bars} height={300} />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" vertical={false} />
            <XAxis dataKey="date" ticks={xTicks} tick={{ fill: "#8888aa", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[yMin, yMax]} tick={{ fill: "#8888aa", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} width={60} />
            <Tooltip content={<ChartTooltip />} />
            {prevClose && <ReferenceLine y={prevClose} stroke="#ffffff" strokeDasharray="4 4" strokeOpacity={0.2} />}
            <Area type="monotone" dataKey="close" name="Close" stroke={color} strokeWidth={2} fill="url(#priceGrad)" dot={false} activeDot={{ r: 4, fill: color }} />
            {showMA && <Area type="monotone" dataKey="ma20" name="MA 20" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" fill="none" dot={false} />}
            {showMA && <Area type="monotone" dataKey="ma50" name="MA 50" stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="4 2" fill="none" dot={false} />}
            {showMA && <Legend wrapperStyle={{ fontSize: 11, color: "#8888aa" }} />}
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* RSI panel */}
      {showRSI && (
        <div className="mt-3 border-t border-bg-border pt-2">
          <p className="text-xs text-muted mb-1 px-1">RSI (14)</p>
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={data} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" vertical={false} />
              <XAxis dataKey="date" hide />
              <YAxis domain={[0, 100]} ticks={[30, 50, 70]} tick={{ fill: "#8888aa", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<RSITooltip />} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Area type="monotone" dataKey="rsi" name="RSI" stroke="#06b6d4" strokeWidth={1.5} fill="url(#rsiGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Volume */}
      <div className="mt-2">
        <ResponsiveContainer width="100%" height={60}>
          <BarChart data={data} margin={{ top: 0, right: 4, bottom: 0, left: 4 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip formatter={(v: number) => [volFmt(v), "Volume"]} contentStyle={{ background: "#1e1e30", border: "1px solid #2d2d4e", borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="volume" name="Volume" fill="#6366f1" opacity={0.45} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-center text-xs text-muted mt-0.5">Volume</p>
      </div>
    </div>
  );
}
