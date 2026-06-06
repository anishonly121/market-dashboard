import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CompareItem } from "../../types";
import { pctFmt } from "../../utils/format";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

interface Props {
  items: CompareItem[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CmpTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-bg-border rounded-lg px-3 py-2 text-xs shadow-xl min-w-[140px]">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted">{p.name}</span>
          </div>
          <span className={`font-mono font-semibold ${p.value >= 100 ? "text-green" : "text-red"}`}>
            {pctFmt(p.value - 100)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CompareChart({ items }: Props) {
  if (!items.length) return null;

  const maxLen = Math.max(...items.map((i) => i.dates.length));
  const data = Array.from({ length: maxLen }, (_, idx) => {
    const row: Record<string, string | number> = { date: items[0]?.dates[idx] ?? "" };
    items.forEach((item) => {
      if (item.normalized[idx] != null) row[item.ticker] = parseFloat(item.normalized[idx].toFixed(2));
    });
    return row;
  });

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <h3 className="font-semibold text-slate-200">Normalized Returns (base = 100)</h3>
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <div key={item.ticker} className="flex items-center gap-1.5 text-xs">
              <span className="w-3 h-0.5 rounded" style={{ background: COLORS[i % COLORS.length], display: "inline-block" }} />
              <span className="font-mono font-semibold">{item.ticker}</span>
              <span className={item.total_return_pct >= 0 ? "text-green" : "text-red"}>
                ({pctFmt(item.total_return_pct)})
              </span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#8888aa", fontSize: 11 }} axisLine={false} tickLine={false}
            interval={Math.floor(maxLen / 6)} />
          <YAxis tick={{ fill: "#8888aa", fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `${(v - 100).toFixed(0)}%`} width={55} />
          <Tooltip content={<CmpTooltip />} />
          <ReferenceLine y={100} stroke="#ffffff" strokeDasharray="4 4" strokeOpacity={0.25} />
          {items.map((item, i) => (
            <Line
              key={item.ticker}
              type="monotone"
              dataKey={item.ticker}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 11, color: "#8888aa" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
