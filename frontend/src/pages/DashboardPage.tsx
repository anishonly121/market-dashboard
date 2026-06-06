import { useState } from "react";
import PriceChart from "../components/charts/PriceChart";
import MetricsGrid from "../components/stock/MetricsGrid";
import StockHeader from "../components/stock/StockHeader";
import StockSearch from "../components/stock/StockSearch";
import { useHistory, useQuote } from "../hooks/useStock";
import type { Period } from "../types";

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
  const [ticker, setTicker] = useState("AAPL");
  const [period, setPeriod] = useState<Period>("1y");

  const { data: quote, isLoading: qLoading, error: qError } = useQuote(ticker);
  const { data: history, isLoading: hLoading } = useHistory(ticker, period);

  const loading = qLoading || hLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <StockSearch value={ticker} onChange={setTicker} />
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

          {history && history.bars.length > 0 ? (
            <PriceChart
              bars={history.bars}
              period={period}
              onPeriodChange={setPeriod}
              ticker={ticker}
              prevClose={quote.prev_close}
            />
          ) : hLoading ? (
            <div className="skeleton h-96 rounded-xl" />
          ) : null}

          <MetricsGrid quote={quote} />
        </div>
      )}
    </div>
  );
}
