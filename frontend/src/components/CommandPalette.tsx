import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onClose: () => void;
}

const QUICK_NAV = [
  { label: "Dashboard",      icon: "📈", path: "/" },
  { label: "Compare Stocks", icon: "⚖️", path: "/compare" },
  { label: "Portfolio",      icon: "💼", path: "/portfolio" },
  { label: "Watchlist",      icon: "👁", path: "/watchlist" },
  { label: "Backtest",       icon: "⏪", path: "/backtest" },
  { label: "Market Overview",icon: "🌍", path: "/market" },
];

const HOT_TICKERS = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "META", "GOOGL", "SPY", "QQQ", "BTC-USD"];

export default function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  const goTicker = (t: string) => go(`/?ticker=${t}`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = query.trim().toUpperCase();
    if (t) goTicker(t);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-bg-elevated border border-bg-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3 border-b border-bg-border">
          <svg className="w-4 h-4 text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted font-mono uppercase tracking-wide"
            placeholder="Search ticker  (e.g. NVDA, AAPL, BTC-USD)…"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            maxLength={12}
          />
          <kbd className="text-[10px] text-muted border border-bg-border rounded px-1.5 py-0.5 shrink-0">ESC</kbd>
        </form>

        {query.length === 0 ? (
          <div className="p-3 space-y-4">
            {/* Quick nav */}
            <div>
              <p className="text-[10px] text-muted uppercase tracking-widest px-2 mb-1.5">Pages</p>
              <div className="flex flex-col gap-0.5">
                {QUICK_NAV.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-card transition-colors text-sm text-left w-full"
                  >
                    <span className="text-base w-5">{item.icon}</span>
                    <span className="text-slate-200">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular tickers */}
            <div>
              <p className="text-[10px] text-muted uppercase tracking-widest px-2 mb-1.5">Popular Tickers</p>
              <div className="flex flex-wrap gap-2 px-2">
                {HOT_TICKERS.map((t) => (
                  <button
                    key={t}
                    onClick={() => goTicker(t)}
                    className="font-mono text-xs px-2.5 py-1 rounded-md bg-bg-card hover:bg-brand/20 hover:text-brand border border-bg-border transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3">
            <button
              onClick={handleSubmit as unknown as React.MouseEventHandler}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-bg-card transition-colors text-sm text-left"
            >
              <span className="text-brand font-mono font-bold text-lg">{query}</span>
              <span className="text-muted">→ Open stock dashboard</span>
              <kbd className="ml-auto text-[10px] text-muted border border-bg-border rounded px-1.5 py-0.5">↵ Enter</kbd>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
