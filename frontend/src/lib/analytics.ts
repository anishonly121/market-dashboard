/**
 * Mixpanel wrapper — all tracking goes through here.
 * The app works fine with no token; events are silently skipped.
 * Set VITE_MIXPANEL_TOKEN in .env.local to enable tracking.
 */

const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN as string | undefined;

type TrackFn = (event: string, props?: Record<string, unknown>) => void;
let trackFn: TrackFn | null = null;

if (TOKEN) {
  import("mixpanel-browser").then((lib) => {
    lib.default.init(TOKEN, {
      debug: import.meta.env.DEV,
      persistence: "localStorage",
    });
    trackFn = (event, props) => lib.default.track(event, props);
  });
}

function track(event: string, props?: Record<string, unknown>) {
  try { trackFn?.(event, props); } catch { /* never crash the app */ }
}

export const analytics = {
  pageViewed:       (page: string)                                  => track("Page Viewed",       { page }),
  stockSearched:    (ticker: string)                                => track("Stock Searched",    { ticker }),
  periodChanged:    (ticker: string, period: string)                => track("Period Changed",    { ticker, period }),
  compareViewed:    (tickers: string[], period: string)             => track("Compare Viewed",    { tickers, count: tickers.length, period }),
  portfolioCreated: (name: string)                                  => track("Portfolio Created", { name }),
  holdingAdded:     (ticker: string, shares: number)                => track("Holding Added",     { ticker, shares }),
  watchlistAdded:   (ticker: string)                                => track("Watchlist Added",   { ticker }),
  backtestRun:      (ticker: string, amount: number, years: number) => track("Backtest Run",      { ticker, amount, years }),
};
