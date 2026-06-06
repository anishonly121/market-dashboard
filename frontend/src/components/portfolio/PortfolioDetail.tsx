import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { usePortfolioValue, useRemoveHolding } from "../../hooks/usePortfolio";
import type { Portfolio } from "../../types";
import { fmt, moneyFmt, pctFmt } from "../../utils/format";
import AddHoldingModal from "./AddHoldingModal";

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#f97316", "#14b8a6"];

interface Props { portfolio: Portfolio }

function StatCard({ label, value, up }: { label: string; value: string; up?: boolean }) {
  return (
    <div className="card-sm text-center">
      <p className="text-xs uppercase tracking-widest text-muted mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${up === true ? "text-green" : up === false ? "text-red" : ""}`}>{value}</p>
    </div>
  );
}

export default function PortfolioDetail({ portfolio }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab]             = useState<"table" | "chart">("table");
  const { data: pv, isLoading }   = usePortfolioValue(portfolio.id);
  const removeMut = useRemoveHolding(portfolio.id);

  const up = (pv?.total_pnl ?? 0) >= 0;

  return (
    <div className="animate-slide-up">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Value"  value={isLoading ? "…" : moneyFmt(pv?.total_value ?? 0)} />
        <StatCard label="Cost Basis"   value={isLoading ? "…" : moneyFmt(pv?.total_cost ?? 0)} />
        <StatCard label="Total P&L"    value={isLoading ? "…" : moneyFmt(pv?.total_pnl ?? 0)} up={up} />
        <StatCard label="Total Return" value={isLoading ? "…" : pctFmt(pv?.total_pnl_pct ?? 0)} up={up} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {(["table", "chart"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors capitalize ${
              tab === t ? "bg-brand text-white" : "text-muted hover:text-slate-200 bg-bg-elevated"
            }`}>
            {t}
          </button>
        ))}
        <button className="btn-primary ml-auto" onClick={() => setShowModal(true)}>
          + Add Holding
        </button>
      </div>

      {tab === "table" && (
        <div className="card overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2 py-4">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-8 rounded" />)}
            </div>
          ) : !pv?.holdings.length ? (
            <p className="text-center text-muted py-8">No holdings yet. Add one above.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border text-muted text-xs uppercase tracking-wider">
                  {["Ticker", "Shares", "Avg Cost", "Price", "Value", "P&L $", "P&L %", "Weight", ""].map((h) => (
                    <th key={h} className="text-left py-2 pr-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pv.holdings.map((h) => {
                  const holding = portfolio.holdings.find((ph) => ph.ticker === h.ticker);
                  const isUp = h.pnl >= 0;
                  return (
                    <tr key={h.ticker} className="border-b border-bg-border/50 hover:bg-bg-elevated/50 transition-colors">
                      <td className="py-2.5 pr-3 font-mono font-bold text-brand">{h.ticker}</td>
                      <td className="py-2.5 pr-3 font-mono">{h.shares}</td>
                      <td className="py-2.5 pr-3 font-mono">${fmt(h.avg_cost)}</td>
                      <td className="py-2.5 pr-3 font-mono">${fmt(h.current_price)}</td>
                      <td className="py-2.5 pr-3 font-mono">{moneyFmt(h.market_value)}</td>
                      <td className={`py-2.5 pr-3 font-mono font-semibold ${isUp ? "text-green" : "text-red"}`}>
                        {isUp ? "+" : ""}{moneyFmt(h.pnl)}
                      </td>
                      <td className={`py-2.5 pr-3 font-mono font-semibold ${isUp ? "text-green" : "text-red"}`}>
                        {pctFmt(h.pnl_pct)}
                      </td>
                      <td className="py-2.5 pr-3 text-muted">{h.weight_pct.toFixed(1)}%</td>
                      <td className="py-2.5">
                        {holding && (
                          <button
                            onClick={() => removeMut.mutate(holding.id)}
                            className="text-muted hover:text-red transition-colors text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "chart" && pv?.holdings.length && (
        <div className="card">
          <h4 className="font-semibold mb-4">Allocation by Market Value</h4>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pv.holdings.map((h) => ({ name: h.ticker, value: h.market_value }))}
                cx="50%" cy="50%"
                innerRadius={80} outerRadius={130}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                labelLine={{ stroke: "#8888aa" }}
              >
                {pv.holdings.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [moneyFmt(v), "Value"]}
                contentStyle={{ background: "#1e1e30", border: "1px solid #2d2d4e", borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {showModal && <AddHoldingModal portfolioId={portfolio.id} onClose={() => setShowModal(false)} />}
    </div>
  );
}
