import axios from "axios";
import type {
  CompareResponse,
  Holding,
  Portfolio,
  PortfolioValue,
  StockHistory,
  StockQuote,
} from "../types";

const http = axios.create({ baseURL: "/api", timeout: 30_000 });

export const api = {
  // Stocks
  getQuote: (ticker: string) =>
    http.get<StockQuote>(`/stocks/${ticker}`).then((r) => r.data),

  getHistory: (ticker: string, period = "1y", interval = "1d") =>
    http.get<StockHistory>(`/stocks/${ticker}/history`, { params: { period, interval } }).then((r) => r.data),

  compare: (tickers: string[], period = "1y") =>
    http
      .get<CompareResponse>("/stocks/compare/many", {
        params: { tickers, period },
        paramsSerializer: (params) => {
          const parts: string[] = [];
          for (const t of params.tickers) parts.push(`tickers=${encodeURIComponent(t)}`);
          parts.push(`period=${params.period}`);
          return parts.join("&");
        },
      })
      .then((r) => r.data),

  // Portfolios
  listPortfolios: () =>
    http.get<Portfolio[]>("/portfolios").then((r) => r.data),

  createPortfolio: (name: string, description = "") =>
    http.post<Portfolio>("/portfolios", { name, description, holdings: [] }).then((r) => r.data),

  deletePortfolio: (id: number) =>
    http.delete(`/portfolios/${id}`),

  addHolding: (portfolioId: number, ticker: string, shares: number, avg_cost: number) =>
    http.post<Holding>(`/portfolios/${portfolioId}/holdings`, { ticker, shares, avg_cost }).then((r) => r.data),

  removeHolding: (portfolioId: number, holdingId: number) =>
    http.delete(`/portfolios/${portfolioId}/holdings/${holdingId}`),

  getPortfolioValue: (portfolioId: number) =>
    http.get<PortfolioValue>(`/portfolios/${portfolioId}/value`).then((r) => r.data),
};
