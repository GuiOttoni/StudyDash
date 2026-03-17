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
      <span className="text-sm text-zinc-500 self-center">Fontes:</span>
      {sources.map((source) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <span>{source.icon}</span>
          <span>{source.label}</span>
          <span className="text-zinc-600">↗</span>
        </a>
      ))}
    </div>
  );
}
