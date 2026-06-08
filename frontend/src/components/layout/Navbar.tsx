import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const NAV = [
  { to: "/",        label: "Dashboard"  },
  { to: "/market",  label: "Market"     },
  { to: "/compare", label: "Compare"    },
  { to: "/portfolio",label: "Portfolio" },
  { to: "/watchlist",label: "Watchlist" },
  { to: "/backtest", label: "Backtest"  },
];

interface Props {
  onCommandPalette: () => void;
}

export default function Navbar({ onCommandPalette }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-bg-border bg-bg-elevated/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight shrink-0">
          <span className="text-brand text-2xl">📈</span>
          <span className="hidden sm:inline">Market Dashboard</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand text-white"
                    : "text-muted hover:text-slate-200 hover:bg-bg-card"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Cmd+K button */}
        <button
          onClick={onCommandPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-bg-border text-muted text-xs hover:border-brand/50 hover:text-slate-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search</span>
          <kbd className="border border-bg-border rounded px-1 py-0.5 text-[10px]">⌘K</kbd>
        </button>

        {/* Mobile hamburger */}
        <button
          className="md:hidden btn-ghost p-2"
          onClick={() => setOpen((s) => !s)}
          aria-label="Toggle menu"
        >
          <span className="text-lg">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-bg-border bg-bg-elevated px-4 py-2 flex flex-col gap-1 animate-slide-up">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-brand text-white" : "text-muted hover:text-slate-200 hover:bg-bg-card"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => { setOpen(false); onCommandPalette(); }}
            className="px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-slate-200 hover:bg-bg-card text-left"
          >
            🔍 Search ticker…
          </button>
        </div>
      )}
    </header>
  );
}
