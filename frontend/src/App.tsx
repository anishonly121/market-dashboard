import { Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/layout/Navbar";
import BacktestPage from "./pages/BacktestPage";
import ComparePage from "./pages/ComparePage";
import DashboardPage from "./pages/DashboardPage";
import PortfolioPage from "./pages/PortfolioPage";
import WatchlistPage from "./pages/WatchlistPage";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 animate-fade-in">
        <ErrorBoundary>
          <Routes>
            <Route path="/"          element={<DashboardPage />} />
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
