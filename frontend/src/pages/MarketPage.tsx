import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analytics } from "../lib/analytics";
import { useIndices, useSectors } from "../hooks/useStock";
import type { IndexQuote } from "../types";

function heatColor(pct: number): string {
  if (pct >= 2)   return "bg-green/30 border-green/40 text-green";
  if (pct >= 0.5) return "bg-green/15 border-green/25 text-green";
  if (pct >= 0)   return "bg-green/5  border-green/10 text-green";
  if (pct >= -0.5) return "bg-red/5   border-red/10   text-red";
  if (pct >= -2)  return "bg-red/15   border-red/25   text-red";
  return                 "bg-red/30   border-red/40   text-red";
}

function IndexCard({ idx }: { idx: IndexQuote }) {
  const up = idx.change_pct >= 0;
  const isCrypto = idx.symbol.includes("-USD");
  const priceStr = isCrypto
    ? `$${idx.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : idx.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={`card-sm border ${up ? "border-green/20" : "border-red/20"}`}>
      <p className="text-xs text-muted uppercase tracking-widest mb-1">{idx.label}</p>
      <p className="font-mono font-bold text-lg text-slate-200">{priceStr}</p>
      <p className={`font-mono text-sm font-semibold ${up ? "text-green" : "text-red"}`}>
        {up ? "▲" : "▼"} {Math.abs(idx.change_pct).toFixed(2)}%
      </p>
    </div>
  );
}

function SectorCard({ idx, onClick }: { idx: IndexQuote; onClick: () => void }) {
  const colorClass = heatColor(idx.change_pct);
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-4 transition-all hover:scale-105 active:scale-95 ${colorClass}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide">{idx.label}</p>
      <p className="font-mono font-bold text-lg">
        {idx.change_pct >= 0 ? "+" : ""}{idx.change_pct.toFixed(2)}%
      </p>
    </button>
  );
}

export default function MarketPage() {
  const { data: indices = [], isLoading: iLoading } = useIndices();
  const { data: sectors = [], isLoading: sLoading } = useSectors();
  const navigate = useNavigate();

  useEffect(() => { analytics.pageViewed("Market"); }, []);

  const advancing = sectors.filter((s) => s.change_pct >= 0).length;
  const declining = sectors.filter((s) => s.change_pct < 0).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Global indices */}
      <div>
        <h2 className="text-lg font-bold mb-3">Global Indices</h2>
        {iLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[...Array(7)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {indices.map((idx) => <IndexCard key={idx.symbol} idx={idx} />)}
          </div>
        )}
      </div>

      {/* Sector heatmap */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Sector Heatmap</h2>
          <div className="text-xs text-muted">
            <span className="text-green font-semibold">{advancing} advancing</span>
            <span className="mx-2 text-muted/40">·</span>
            <span className="text-red font-semibold">{declining} declining</span>
          </div>
        </div>
        {sLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(11)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...sectors]
              .sort((a, b) => b.change_pct - a.change_pct)
              .map((s) => (
                <SectorCard
                  key={s.symbol}
                  idx={s}
                  onClick={() => navigate(`/?ticker=${s.symbol}`)}
                />
              ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="card">
        <div className="flex flex-wrap gap-3 text-xs text-muted items-center">
          <span className="font-semibold text-slate-300">Colour key:</span>
          {[
            { cls: "bg-green/30 text-green border-green/40", label: "> +2%" },
            { cls: "bg-green/15 text-green border-green/25", label: "+0.5% – +2%" },
            { cls: "bg-green/5  text-green border-green/10", label: "0% – +0.5%" },
            { cls: "bg-red/5    text-red   border-red/10",   label: "0% – −0.5%" },
            { cls: "bg-red/15   text-red   border-red/25",   label: "−0.5% – −2%" },
            { cls: "bg-red/30   text-red   border-red/40",   label: "< −2%" },
          ].map(({ cls, label }) => (
            <span key={label} className={`border rounded px-2 py-0.5 ${cls}`}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
