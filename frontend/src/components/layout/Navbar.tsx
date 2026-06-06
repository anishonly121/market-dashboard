import { Link, NavLink } from "react-router-dom";

const NAV = [
  { to: "/",          label: "Dashboard" },
  { to: "/compare",   label: "Compare" },
  { to: "/portfolio", label: "Portfolio" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-bg-border bg-bg-elevated/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="text-brand text-2xl">📈</span>
          <span>Market Dashboard</span>
        </Link>

        <nav className="flex items-center gap-1">
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
      </div>
    </header>
  );
}
