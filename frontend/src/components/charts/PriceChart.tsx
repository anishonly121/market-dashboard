import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Legend,
} from "recharts";
import type { OHLCVBar, Period } from "../../types";
import { PERIOD_LABELS } from "../../types";
import { fmt, volFmt } from "../../utils/format";

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

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
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

function VolumeTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-bg-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-muted mb-1">{label}</p>
      <span className="font-mono font-semibold text-slate-200">{volFmt(payload[0].value)}</span>
    </div>
  );
}

export default function PriceChart({ bars, period, onPeriodChange, ticker, prevClose }: Props) {
  const [showMA, setShowMA] = useState(true);

  const data = useMemo(() => {
    const closes = bars.map((b) => b.close);
    const ma20 = calcMA(closes, 20);
    const ma50 = calcMA(closes, 50);

    return bars.map((b, i) => ({
      date: new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: period === "5y" ? "numeric" : undefined }),
      close: b.close,
      volume: b.volume,
      ma20: ma20[i] ?? undefined,
      ma50: ma50[i] ?? undefined,
    }));
  }, [bars, period]);

  const first = data[0]?.close ?? 0;
  const last  = data[data.length - 1]?.close ?? 0;
  const up    = last >= first;
  const color = up ? "#22c55e" : "#ef4444";

  const yMin = Math.min(...data.map((d) => d.close)) * 0.97;
  const yMax = Math.max(...data.map((d) => d.close)) * 1.03;

  const tickCount = data.length > 100 ? 6 : data.length > 30 ? 8 : data.length;
  const xTicks = data
    .filter((_, i) => i % Math.floor(data.length / Math.min(tickCount, 8)) === 0)
    .map((d) => d.date);

  return (
    <div className="card">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-slate-200">{ticker} · Price Chart</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMA((s) => !s)}
            className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
              showMA ? "bg-amber/20 text-amber" : "bg-bg-border text-muted"
            }`}
          >
            MA 20/50
          </button>
          <div className="flex rounded-lg overflow-hidden border border-bg-border">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
                  p === period ? "bg-brand text-white" : "text-muted hover:text-slate-200 hover:bg-bg-card"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Price chart */}
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

      {/* Volume chart */}
      <div className="mt-2">
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={data} margin={{ top: 0, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip content={<VolumeTooltip />} />
            <Bar dataKey="volume" name="Volume" fill="#6366f1" opacity={0.5} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-center text-xs text-muted mt-1">Volume</p>
      </div>
    </div>
  );
}
