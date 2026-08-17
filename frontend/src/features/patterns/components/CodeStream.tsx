"use client";

import { useRef, useEffect } from "react";

interface Props {
  logs: string[];
  running: boolean;
  onClear?: () => void;
  title?: string;
  emptyMessage?: string;
  renderLine?: (line: string, index: number) => React.ReactNode;
}

export function CodeStream({ 
  logs, 
  running, 
  onClear, 
  title = "Output", 
  emptyMessage = "Aguardando execução...",
  renderLine
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="rounded-md bg-[var(--bg-app)] border border-[var(--border-default)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
        <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">{title}</span>
        <div className="flex items-center gap-3">
          {running && (
            <span className="text-xs text-emerald-500 animate-pulse">● ao vivo</span>
          )}
          {logs.length > 0 && !running && onClear && (
            <button
              onClick={onClear}
              className="text-xs text-[var(--text-faint)] hover:text-[var(--text-tertiary)] transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      </div>
      <div className="p-4 font-mono text-sm min-h-[220px] max-h-[400px] overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-[var(--text-faint)] italic">
            {emptyMessage}
          </p>
        ) : (
          logs.map((line, i) => (
            renderLine ? renderLine(line, i) : (
              <div key={i} className="text-emerald-400 leading-7 whitespace-pre-wrap">
                {line}
              </div>
            )
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
