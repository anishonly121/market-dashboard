import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const NAV = [
  { to: "/",          label: "Dashboard"  },
  { to: "/compare",   label: "Compare"    },
  { to: "/portfolio", label: "Portfolio"  },
  { to: "/watchlist", label: "Watchlist"  },
  { to: "/backtest",  label: "Backtest"   },
];

export default function Navbar() {
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
              end
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
              end
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
        </div>
      )}
    </header>
  );
}
