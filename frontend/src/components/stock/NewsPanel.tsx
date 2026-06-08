import { useNews } from "../../hooks/useStock";

function timeAgo(unix: number): string {
  if (!unix) return "";
  const diff = Math.floor((Date.now() / 1000) - unix);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface Props {
  ticker: string;
}

export default function NewsPanel({ ticker }: Props) {
  const { data: news, isLoading, isError } = useNews(ticker);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card-sm flex flex-col gap-2 animate-pulse">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/4 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (isError || !news) {
    return (
      <div className="card text-center py-10 text-muted text-sm">
        Could not load news for {ticker}.
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="card text-center py-10 text-muted text-sm">
        No recent news found for {ticker}.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {news.map((item, i) => (
        <a
          key={i}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="card-sm flex flex-col gap-1 hover:border-brand/40 hover:bg-bg-card transition-all group"
        >
          <p className="text-sm text-slate-200 group-hover:text-brand transition-colors leading-snug line-clamp-2">
            {item.title}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted">
            {item.publisher && (
              <span className="font-medium text-muted/80">{item.publisher}</span>
            )}
            {item.publisher && item.published > 0 && (
              <span className="text-muted/40">·</span>
            )}
            {item.published > 0 && (
              <span>{timeAgo(item.published)}</span>
            )}
            <span className="ml-auto text-brand/60 group-hover:text-brand transition-colors text-xs">↗</span>
          </div>
        </a>
      ))}
    </div>
  );
}
