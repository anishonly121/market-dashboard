import { Route, Routes } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import ComparePage from "./pages/ComparePage";
import DashboardPage from "./pages/DashboardPage";
import PortfolioPage from "./pages/PortfolioPage";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 animate-fade-in">
        <Routes>
          <Route path="/"          element={<DashboardPage />} />
          <Route path="/compare"   element={<ComparePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Routes>
      </main>
    </div>
  );
}
