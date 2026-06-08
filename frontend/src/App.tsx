import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import CommandPalette from "./components/CommandPalette";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/layout/Navbar";
import TickerTape from "./components/layout/TickerTape";
import BacktestPage from "./pages/BacktestPage";
import ComparePage from "./pages/ComparePage";
import DashboardPage from "./pages/DashboardPage";
import MarketPage from "./pages/MarketPage";
import PortfolioPage from "./pages/PortfolioPage";
import WatchlistPage from "./pages/WatchlistPage";

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onCommandPalette={() => setPaletteOpen(true)} />
      <TickerTape />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 animate-fade-in">
        <ErrorBoundary>
          <Routes>
            <Route path="/"          element={<DashboardPage />} />
            <Route path="/market"    element={<MarketPage />} />
            <Route path="/compare"   element={<ComparePage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/backtest"  element={<BacktestPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}
