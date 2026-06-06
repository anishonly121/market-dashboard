import { useState } from "react";
import { useAddHolding } from "../../hooks/usePortfolio";

interface Props {
  portfolioId: number;
  onClose: () => void;
}

export default function AddHoldingModal({ portfolioId, onClose }: Props) {
  const [ticker, setTicker]   = useState("");
  const [shares, setShares]   = useState("");
  const [cost, setCost]       = useState("");
  const mutation = useAddHolding(portfolioId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !shares || !cost) return;
    await mutation.mutateAsync({ ticker: ticker.toUpperCase(), shares: parseFloat(shares), avg_cost: parseFloat(cost) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md animate-slide-up">
        <h3 className="text-lg font-bold mb-4">Add / Update Holding</h3>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Ticker</label>
            <input
              className="input w-full mt-1 uppercase font-mono"
              placeholder="AAPL"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              required maxLength={10}
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Shares</label>
            <input
              className="input w-full mt-1"
              type="number" min="0.001" step="0.001" placeholder="10"
              value={shares} onChange={(e) => setShares(e.target.value)} required
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Average Cost ($)</label>
            <input
              className="input w-full mt-1"
              type="number" min="0.01" step="0.01" placeholder="150.00"
              value={cost} onChange={(e) => setCost(e.target.value)} required
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save Holding"}
            </button>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
