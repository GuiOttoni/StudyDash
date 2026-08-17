interface Source {
  label: string;
  url: string;
  icon: string;
}

interface Props {
  sources: Source[];
}

export function SourceLinks({ sources }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <span className="text-sm text-[var(--text-muted)] self-center">Fontes:</span>
      {sources.map((source) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-control)] hover:text-[var(--text-primary)] transition-colors"
        >
          <span>{source.icon}</span>
          <span>{source.label}</span>
          <span className="text-[var(--text-faint)]">↗</span>
        </a>
      ))}
    </div>
  );
}
