import { useState } from "react";
import PortfolioDetail from "../components/portfolio/PortfolioDetail";
import { useCreatePortfolio, useDeletePortfolio, usePortfolios } from "../hooks/usePortfolio";

export default function PortfolioPage() {
  const { data: portfolios, isLoading } = usePortfolios();
  const createMut = useCreatePortfolio();
  const deleteMut = useDeletePortfolio();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newName, setNewName]        = useState("");
  const [showCreate, setShowCreate]  = useState(false);

  const selected = portfolios?.find((p) => p.id === selectedId) ?? portfolios?.[0] ?? null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const p = await createMut.mutateAsync({ name: newName.trim() });
    setSelectedId(p.id);
    setNewName("");
    setShowCreate(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">My Portfolios</h2>
          <button className="btn-primary text-sm" onClick={() => setShowCreate((s) => !s)}>
            + New Portfolio
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="flex gap-2 mb-4 animate-slide-up">
            <input
              className="input flex-1"
              placeholder="Portfolio name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-primary" disabled={createMut.isPending}>
              {createMut.isPending ? "Creating…" : "Create"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
          </form>
        )}

        {isLoading && <div className="skeleton h-12 rounded-lg" />}

        {portfolios?.length === 0 && (
          <p className="text-muted text-sm">No portfolios yet. Create one to get started.</p>
        )}

        <div className="flex flex-wrap gap-2">
          {portfolios?.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                (selected?.id === p.id)
                  ? "bg-brand text-white"
                  : "bg-bg-elevated hover:bg-bg-border text-muted hover:text-slate-200"
              }`}
            >
              <span>{p.name}</span>
              <span className="text-xs opacity-70">({p.holdings.length})</span>
              <span
                onClick={(e) => { e.stopPropagation(); deleteMut.mutate(p.id); }}
                className="ml-1 opacity-50 hover:opacity-100 hover:text-red transition-all text-xs"
                title="Delete"
              >
                ✕
              </span>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xl font-bold">{selected.name}</h3>
            <span className="badge-neu">{selected.holdings.length} holdings</span>
          </div>
          <PortfolioDetail key={selected.id} portfolio={selected} />
        </div>
      )}
    </div>
  );
}
