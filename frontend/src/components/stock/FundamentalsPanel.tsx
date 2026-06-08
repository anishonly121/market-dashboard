import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFundamentals } from "../../hooks/useStock";
import type { RecSummary } from "../../types";

function volBillions(v: number | null) {
  if (!v) return "—";
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toFixed(0)}`;
}

function consensusLabel(r: RecSummary): { label: string; color: string } {
  const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
  if (!total) return { label: "No Data", color: "text-muted" };
  const bullish = r.strongBuy + r.buy;
  const bearish = r.sell + r.strongSell;
  const pct = bullish / total;
  if (pct >= 0.7) return { label: "Strong Buy", color: "text-green" };
  if (pct >= 0.5) return { label: "Buy",         color: "text-green" };
  if (bearish / total >= 0.5) return { label: "Sell",  color: "text-red" };
  return { label: "Hold", color: "text-amber" };
}

function AnalystGauge({ rec }: { rec: RecSummary }) {
  const total = rec.strongBuy + rec.buy + rec.hold + rec.sell + rec.strongSell;
  if (!total) return <p className="text-sm text-muted">No analyst data available.</p>;

  const bars = [
    { label: "Strong Buy", value: rec.strongBuy,  color: "#16a34a" },
    { label: "Buy",        value: rec.buy,         color: "#22c55e" },
    { label: "Hold",       value: rec.hold,        color: "#f59e0b" },
    { label: "Sell",       value: rec.sell,        color: "#ef4444" },
    { label: "Strong Sell",value: rec.strongSell,  color: "#b91c1c" },
  ];

  const consensus = consensusLabel(rec);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted uppercase tracking-wider">Analyst Consensus</p>
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm ${consensus.color}`}>{consensus.label}</span>
          <span className="text-xs text-muted">{total} analysts</span>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="flex rounded-full overflow-hidden h-3 gap-px">
        {bars.map((b) =>
          b.value > 0 ? (
            <div
              key={b.label}
              style={{ width: `${(b.value / total) * 100}%`, background: b.color }}
              title={`${b.label}: ${b.value}`}
            />
          ) : null
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="w-2 h-2 rounded-sm" style={{ background: b.color }} />
            <span>{b.label}</span>
            <span className="font-mono text-slate-300">{b.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriceTargetBar({
  current,
  low,
  mean,
  high,
  price,
}: {
  current: number | null;
  low: number | null;
  mean: number | null;
  high: number | null;
  price?: number;
}) {
  if (!low || !mean || !high) return <p className="text-sm text-muted">No price target data.</p>;

  const range = high - low;
  const meanPct  = range ? ((mean  - low) / range) * 100 : 50;
  const pricePct = price && range ? Math.max(0, Math.min(100, ((price - low) / range) * 100)) : null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted uppercase tracking-wider">Analyst Price Target</p>
      <div className="relative h-2 rounded-full bg-bg-border mx-2">
        {/* Range fill */}
        <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-red/30 via-amber/30 to-green/30" />
        {/* Mean target */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-brand rounded-full"
          style={{ left: `${meanPct}%` }}
          title={`Mean: $${mean.toFixed(2)}`}
        />
        {/* Current price marker */}
        {pricePct !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-slate-200 bg-bg-card"
            style={{ left: `${pricePct}%`, transform: "translate(-50%, -50%)" }}
            title={`Current: $${price?.toFixed(2)}`}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-muted px-2 mt-1">
        <span>Low <span className="font-mono text-red">${low.toFixed(2)}</span></span>
        <span>Mean <span className="font-mono text-brand">${mean.toFixed(2)}</span></span>
        <span>High <span className="font-mono text-green">${high.toFixed(2)}</span></span>
      </div>
    </div>
  );
}

function EarningsChart({ data }: { data: { quarter: string; revenue: number | null; eps: number | null }[] }) {
  if (!data.length) return <p className="text-sm text-muted">No earnings data available.</p>;

  const revData = data.filter((d) => d.revenue != null);
  const epsData = data.filter((d) => d.eps != null);

  return (
    <div className="flex flex-col gap-5">
      {revData.length > 0 && (
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Quarterly Revenue</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={revData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fill: "#8888aa", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => [volBillions(v), "Revenue"]}
                contentStyle={{ background: "#1e1e30", border: "1px solid #2d2d4e", borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: "#8888aa" }}
              />
              <Bar dataKey="revenue" radius={[3, 3, 0, 0]} fill="#6366f1">
                {revData.map((_, i) => (
                  <Cell key={i} fill={i === revData.length - 1 ? "#818cf8" : "#4f46e5"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {epsData.length > 0 && (
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-2">Earnings Per Share (EPS)</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={epsData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4e" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fill: "#8888aa", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => [`$${v.toFixed(3)}`, "EPS"]}
                contentStyle={{ background: "#1e1e30", border: "1px solid #2d2d4e", borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: "#8888aa" }}
              />
              <Bar dataKey="eps" radius={[3, 3, 0, 0]}>
                {epsData.map((d, i) => (
                  <Cell key={i} fill={(d.eps ?? 0) >= 0 ? "#22c55e" : "#ef4444"} opacity={i === epsData.length - 1 ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

interface Props {
  ticker: string;
  currentPrice?: number;
}

export default function FundamentalsPanel({ ticker, currentPrice }: Props) {
  const { data, isLoading, isError } = useFundamentals(ticker);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
      </div>
    );
  }

  if (isError || !data) {
    return <div className="card text-center py-10 text-muted text-sm">Could not load fundamentals for {ticker}.</div>;
  }

  const hasEarnings = data.next_earnings && data.next_earnings !== "NaT" && data.next_earnings !== "None";
  const earnDate = hasEarnings ? new Date(data.next_earnings!) : null;
  const daysToEarn = earnDate ? Math.ceil((earnDate.getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Analyst consensus */}
      <div className="card">
        <AnalystGauge rec={data.rec_summary} />
      </div>

      {/* Price target */}
      <div className="card">
        <PriceTargetBar {...data.price_targets} price={currentPrice} />
      </div>

      {/* Earnings countdown */}
      {daysToEarn !== null && daysToEarn > 0 && daysToEarn < 90 && (
        <div className="card-sm flex items-center justify-between border border-amber/20 bg-amber/5">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span className="text-sm font-medium">Next Earnings</span>
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-amber text-sm">
              {daysToEarn === 0 ? "Today" : daysToEarn === 1 ? "Tomorrow" : `${daysToEarn} days`}
            </span>
            <p className="text-xs text-muted">{earnDate!.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p>
          </div>
        </div>
      )}

      {/* Earnings / revenue history */}
      <div className="card">
        <EarningsChart data={data.earnings_history} />
      </div>
    </div>
  );
}
