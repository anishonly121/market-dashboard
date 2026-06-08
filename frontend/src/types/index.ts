export interface StockQuote {
  ticker: string;
  name: string;
  price: number;
  prev_close: number;
  change: number;
  change_pct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  avg_volume: number;
  market_cap: number | null;
  pe_ratio: number | null;
  eps: number | null;
  dividend_yield: number | null;
  fifty_two_week_high: number;
  fifty_two_week_low: number;
  beta: number | null;
  exchange: string;
  sector: string | null;
  industry: string | null;
  description: string | null;
}

export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockHistory {
  ticker: string;
  period: string;
  interval: string;
  bars: OHLCVBar[];
}

export interface CompareItem {
  ticker: string;
  name: string;
  dates: string[];
  closes: number[];
  normalized: number[];
  total_return_pct: number;
}

export interface CompareResponse {
  tickers: string[];
  period: string;
  items: CompareItem[];
}

export interface Holding {
  id: number;
  portfolio_id: number;
  ticker: string;
  shares: number;
  avg_cost: number;
  added_at: string;
}

export interface Portfolio {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  holdings: Holding[];
}

export interface HoldingValue {
  ticker: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  cost_basis: number;
  pnl: number;
  pnl_pct: number;
  weight_pct: number;
}

export interface PortfolioValue {
  portfolio_id: number;
  name: string;
  total_value: number;
  total_cost: number;
  total_pnl: number;
  total_pnl_pct: number;
  holdings: HoldingValue[];
}

export type Period = "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y";
export type Interval = "1d" | "1wk" | "1mo";

export const PERIOD_LABELS: Record<Period, string> = {
  "5d":  "5D",
  "1mo": "1M",
  "3mo": "3M",
  "6mo": "6M",
  "1y":  "1Y",
  "2y":  "2Y",
  "5y":  "5Y",
};

export interface IndexQuote {
  symbol: string;
  label: string;
  price: number;
  change: number;
  change_pct: number;
}

export interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  published: number;
}

export interface AIAnalysis {
  analysis: string;
  model: string;
}

export interface RecSummary {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export interface PriceTargets {
  current: number | null;
  low: number | null;
  mean: number | null;
  high: number | null;
}

export interface EarningsQuarter {
  quarter: string;
  revenue: number | null;
  eps: number | null;
}

export interface Fundamentals {
  rec_summary: RecSummary;
  price_targets: PriceTargets;
  earnings_history: EarningsQuarter[];
  next_earnings: string | null;
}

export interface TopMover {
  symbol: string;
  label: string;
  price: number;
  change: number;
  change_pct: number;
}

export interface TopMovers {
  gainers: TopMover[];
  losers: TopMover[];
}
