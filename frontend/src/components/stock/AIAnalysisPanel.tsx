import { useEffect } from "react";
import { useAIAnalysis } from "../../hooks/useStock";

interface Props {
  ticker: string;
}

export default function AIAnalysisPanel({ ticker }: Props) {
  const { mutate, data, isPending, isError, error, reset } = useAIAnalysis();

  useEffect(() => {
    reset();
  }, [ticker, reset]);

  const errorMsg =
    isError && error instanceof Error
      ? error.message.includes("503")
        ? "AI analysis is not configured on this server. Set the ANTHROPIC_API_KEY environment variable to enable it."
        : "Failed to generate analysis. Please try again."
      : null;

  return (
    <div className="flex flex-col gap-4">
      {!data && !isPending && (
        <div className="card flex flex-col items-center gap-4 py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center text-2xl">
            🤖
          </div>
          <div>
            <p className="text-slate-200 font-semibold">AI-Powered Stock Analysis</p>
            <p className="text-muted text-sm mt-1 max-w-sm">
              Get a Claude-generated investment thesis — valuation snapshot, key risks, and investor fit — in seconds.
            </p>
          </div>
          <button
            onClick={() => mutate(ticker)}
            className="btn-primary px-6 py-2.5"
          >
            Analyse {ticker} with AI
          </button>
          {errorMsg && (
            <p className="text-red text-xs max-w-sm">{errorMsg}</p>
          )}
        </div>
      )}

      {isPending && (
        <div className="card flex flex-col items-center gap-4 py-12">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-muted text-sm">Claude is analysing {ticker}…</p>
        </div>
      )}

      {data && (
        <div className="card flex flex-col gap-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="font-semibold text-sm">AI Analysis — {ticker}</span>
              <span className="text-xs text-muted border border-bg-border rounded-full px-2 py-0.5">
                {data.model}
              </span>
            </div>
            <button
              onClick={() => mutate(ticker)}
              className="text-xs text-muted hover:text-slate-200 transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {data.analysis}
          </div>

          <p className="text-xs text-muted border-t border-bg-border pt-3">
            AI-generated analysis for informational purposes only. Not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}
