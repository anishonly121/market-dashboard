import { useMutation, useQuery } from "@tanstack/react-query";
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

export function useSparkline(ticker: string) {
  return useQuery({
    queryKey: ["sparkline", ticker],
    queryFn: () => api.getHistory(ticker, "1mo", "1d"),
    enabled: ticker.length > 0,
    staleTime: 300_000,
  });
}

export function useCompare(tickers: string[], period: Period = "1y") {
  return useQuery({
    queryKey: ["compare", tickers.join(","), period],
    queryFn: () => api.compare(tickers, period),
    enabled: tickers.length > 0,
  });
}

export function useIndices() {
  return useQuery({
    queryKey: ["indices"],
    queryFn: api.getIndices,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useSectors() {
  return useQuery({
    queryKey: ["sectors"],
    queryFn: api.getSectors,
    refetchInterval: 300_000,
    staleTime: 60_000,
  });
}

export function useNews(ticker: string) {
  return useQuery({
    queryKey: ["news", ticker],
    queryFn: () => api.getNews(ticker),
    enabled: ticker.length > 0,
    staleTime: 300_000,
  });
}

export function useAIAnalysis() {
  return useMutation({
    mutationFn: (ticker: string) => api.analyzeStock(ticker),
  });
}

export function useFundamentals(ticker: string) {
  return useQuery({
    queryKey: ["fundamentals", ticker],
    queryFn: () => api.getFundamentals(ticker),
    enabled: ticker.length > 0,
    staleTime: 3_600_000,
  });
}

export function useTopMovers() {
  return useQuery({
    queryKey: ["movers"],
    queryFn: api.getTopMovers,
    refetchInterval: 120_000,
    staleTime: 60_000,
  });
}
