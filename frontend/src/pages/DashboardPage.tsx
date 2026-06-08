import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PriceChart from "../components/charts/PriceChart";
import AIAnalysisPanel from "../components/stock/AIAnalysisPanel";
import FundamentalsPanel from "../components/stock/FundamentalsPanel";
import MetricsGrid from "../components/stock/MetricsGrid";
import NewsPanel from "../components/stock/NewsPanel";
import StockHeader from "../components/stock/StockHeader";
import StockSearch from "../components/stock/StockSearch";
import { useHistory, useQuote } from "../hooks/useStock";
import { analytics } from "../lib/analytics";
import type { Period } from "../types";

type Tab = "chart" | "fundamentals" | "news" | "ai";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "chart",        label: "Chart",        icon: "📊" },
  { id: "fundamentals", label: "Fundamentals", icon: "📋" },
  { id: "news",         label: "News",         icon: "📰" },
  { id: "ai",           label: "AI Analysis",  icon: "🤖" },
];

function Skeleton() {
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="skeleton h-20 rounded-xl" />
      <div className="skeleton h-8 rounded-xl w-1/3" />
      <div className="skeleton h-96 rounded-xl" />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTicker = searchParams.get("ticker") || "AAPL";
  const [ticker, setTicker] = useState(urlTicker);
  const [period, setPeriod] = useState<Period>("1y");
  const [tab, setTab] = useState<Tab>("chart");

  useEffect(() => { analytics.pageViewed("Dashboard"); }, []);

  const handleTickerChange = (t: string) => {
    setTicker(t);
    setSearchParams({ ticker: t }, { replace: true });
    setTab("chart");
  };

  useEffect(() => {
    if (urlTicker !== ticker) {
      setTicker(urlTicker);
      setTab("chart");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTicker]);

  const { data: quote, isLoading: qLoading, error: qError } = useQuote(ticker);
  const { data: history, isLoading: hLoading } = useHistory(ticker, period);

  const loading = qLoading || hLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <StockSearch value={ticker} onChange={handleTickerChange} />
      </div>

      {qError && (
        <div className="card border-red/30 bg-red/5 text-red text-sm">
          Could not load <b>{ticker}</b>. Check the ticker symbol and try again.
        </div>
      )}

      {loading && !quote && <Skeleton />}

      {quote && (
        <div className="flex flex-col gap-4 animate-slide-up">
          <div className="card">
            <StockHeader quote={quote} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-bg-border">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-brand text-brand"
                    : "border-transparent text-muted hover:text-slate-200"
                }`}
              >
                <span className="hidden sm:inline">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="animate-fade-in">
            {tab === "chart" && (
              history && history.bars.length > 0 ? (
                <PriceChart
                  bars={history.bars}
                  period={period}
                  onPeriodChange={setPeriod}
                  ticker={ticker}
                  prevClose={quote.prev_close}
                />
              ) : hLoading ? (
                <div className="skeleton h-96 rounded-xl" />
              ) : null
            )}

            {tab === "fundamentals" && (
              <FundamentalsPanel ticker={ticker} currentPrice={quote.price} />
            )}

            {tab === "news" && <NewsPanel ticker={ticker} />}
            {tab === "ai"  && <AIAnalysisPanel ticker={ticker} />}
          </div>

          <MetricsGrid quote={quote} />

          {quote.description && (
            <div className="card">
              <h3 className="text-xs uppercase tracking-widest text-muted font-semibold mb-2">About</h3>
              <p className="text-sm text-muted leading-relaxed line-clamp-4">{quote.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
