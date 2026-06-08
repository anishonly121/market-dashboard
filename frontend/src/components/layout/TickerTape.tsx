import { useIndices } from "../../hooks/useStock";

function fmt(idx: { symbol: string; price: number }) {
  const isCrypto = idx.symbol.includes("-USD");
  const isIndex = idx.symbol.startsWith("^");
  if (isCrypto) return `$${idx.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (isIndex) return idx.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `$${idx.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TickerTape() {
  const { data: indices = [] } = useIndices();

  if (indices.length === 0) return null;

  // Duplicate list for seamless infinite scroll
  const items = [...indices, ...indices];

  return (
    <div className="border-b border-bg-border bg-bg-elevated/60 overflow-hidden select-none">
      <div className="flex animate-ticker min-w-max">
        {items.map((idx, i) => {
          const up = idx.change_pct >= 0;
          return (
            <span
              key={`${idx.symbol}-${i}`}
              className="inline-flex items-center gap-2 px-6 py-1.5 text-xs font-mono border-r border-bg-border/40 shrink-0"
            >
              <span className="text-muted font-medium tracking-wide">{idx.label}</span>
              <span className="text-slate-200 font-semibold">{fmt(idx)}</span>
              <span className={`font-semibold ${up ? "text-green" : "text-red"}`}>
                {up ? "▲" : "▼"} {Math.abs(idx.change_pct).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
