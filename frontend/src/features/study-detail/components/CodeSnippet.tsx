import { useEffect, useState } from "react";
import { highlightCode } from "@/shared/lib/highlighter";

interface Props {
  code: string;
  lang: string;
}

export function CodeSnippet({ code, lang }: Props) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    highlightCode(code, lang).then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => { cancelled = true; };
  }, [code, lang]);

  return (
    <div className="rounded-md overflow-hidden border border-[var(--border-strong)] text-sm leading-relaxed">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-surface-hover)] border-b border-[var(--border-strong)]">
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">{lang}</span>
        <span className="text-xs text-[var(--text-faint)]">exemplo</span>
      </div>
      {html ? (
        <div className="overflow-auto p-4 bg-[var(--bg-surface)]" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="overflow-auto p-4 bg-[var(--bg-surface)] text-[var(--text-secondary)]">{code}</pre>
      )}
    </div>
  );
}
