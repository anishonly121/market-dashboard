import { useState, KeyboardEvent } from "react";

interface Props {
  value: string;
  onChange: (ticker: string) => void;
}

const POPULAR = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "BRK-B"];

export default function StockSearch({ value, onChange }: Props) {
  const [input, setInput] = useState(value);

  const submit = () => {
    const t = input.trim().toUpperCase();
    if (t) onChange(t);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          className="input flex-1 text-base uppercase placeholder:normal-case placeholder:text-muted"
          placeholder="Search ticker… e.g. AAPL"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={handleKey}
          maxLength={10}
        />
        <button className="btn-primary" onClick={submit}>
          Search
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {POPULAR.map((t) => (
          <button
            key={t}
            onClick={() => { setInput(t); onChange(t); }}
            className={`text-xs px-2.5 py-1 rounded-md font-mono font-semibold transition-colors ${
              value === t
                ? "bg-brand text-white"
                : "bg-bg-elevated hover:bg-bg-border text-muted hover:text-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
