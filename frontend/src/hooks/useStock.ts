import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Period } from "../types";

export function useQuote(ticker: string) {
  return useQuery({
    queryKey: ["quote", ticker],
    queryFn: () => api.getQuote(ticker),
    enabled: ticker.length > 0,
    refetchInterval: 60_000,
  });
}

export function useHistory(ticker: string, period: Period = "1y") {
  const interval = period === "2y" || period === "5y" ? "1wk" : "1d";
  return useQuery({
    queryKey: ["history", ticker, period],
    queryFn: () => api.getHistory(ticker, period, interval),
    enabled: ticker.length > 0,
  });
}

export function useCompare(tickers: string[], period: Period = "1y") {
  return useQuery({
    queryKey: ["compare", tickers.join(","), period],
    queryFn: () => api.compare(tickers, period),
    enabled: tickers.length > 0,
  });
}
