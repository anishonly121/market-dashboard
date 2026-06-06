import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../api/client";

export function usePortfolios() {
  return useQuery({ queryKey: ["portfolios"], queryFn: api.listPortfolios });
}

export function usePortfolioValue(portfolioId: number | null) {
  return useQuery({
    queryKey: ["portfolio-value", portfolioId],
    queryFn: () => api.getPortfolioValue(portfolioId!),
    enabled: portfolioId !== null,
    refetchInterval: 90_000,
  });
}

export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      api.createPortfolio(name, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success("Portfolio created");
    },
    onError: () => toast.error("Failed to create portfolio"),
  });
}

export function useDeletePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deletePortfolio(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success("Portfolio deleted");
    },
    onError: () => toast.error("Failed to delete portfolio"),
  });
}

export function useAddHolding(portfolioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticker, shares, avg_cost }: { ticker: string; shares: number; avg_cost: number }) =>
      api.addHolding(portfolioId, ticker, shares, avg_cost),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolios"] });
      qc.invalidateQueries({ queryKey: ["portfolio-value", portfolioId] });
      toast.success("Holding saved");
    },
    onError: () => toast.error("Failed to save holding"),
  });
}

export function useRemoveHolding(portfolioId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (holdingId: number) => api.removeHolding(portfolioId, holdingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolios"] });
      qc.invalidateQueries({ queryKey: ["portfolio-value", portfolioId] });
      toast.success("Holding removed");
    },
    onError: () => toast.error("Failed to remove holding"),
  });
}
