import { useState, useRef } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import { TerminalView, type TerminalLine } from "@/shared/components/ui/Terminal";
import { streamCodeRun } from "@/shared/lib/api-client";

export function RunCode({
  slug,
  code,
  description,
}: {
  slug: string;
  code: string;
  description?: string;
}) {
  const [running,  setRunning]  = useState(false);
  const [lines,    setLines]    = useState<TerminalLine[]>([]);
  const [showCode, setShowCode] = useState(false);
  const [runId,    setRunId]    = useState(0);
  const esRef = useRef<EventSource | null>(null);

  const run = () => {
    if (esRef.current) esRef.current.close();
    setRunning(true);
    setLines([]);
    setRunId((n) => n + 1);

    const es = streamCodeRun(slug);
    esRef.current = es;

    es.addEventListener("stdout", (e) => {
      setLines((prev) => [...prev, { text: (e as MessageEvent).data }]);
    });

    es.addEventListener("stderr", (e) => {
      setLines((prev) => [...prev, { text: (e as MessageEvent).data, kind: "error" }]);
    });

    es.addEventListener("error", (e) => {
      const msg = (e as MessageEvent).data ?? "Erro desconhecido";
      setLines((prev) => [...prev, { text: msg, kind: "error" }]);
      es.close();
      setRunning(false);
    });

    es.addEventListener("done", (e) => {
      const code = Number((e as MessageEvent).data);
      setLines((prev) => [...prev, { text: `\nProcesso encerrado com código ${code}`, kind: code === 0 ? "success" : "error" }]);
      es.close();
      esRef.current = null;
      setRunning(false);
    });

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setRunning(false);
    };
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[var(--text-primary)] text-xl flex items-center gap-2">
          <Icon name="Terminal" size={20} />
          Código Executável
        </h2>
        <div data-print-hide className="flex items-center gap-2">
          <button
            onClick={() => setShowCode((v) => !v)}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors"
          >
            {showCode ? "Ocultar código" : "Ver código"}
          </button>
          <button
            onClick={run}
            disabled={running}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-[var(--text-primary)] text-sm font-medium transition-colors"
          >
            <Icon name={running ? "Loader" : "Play"} size={13} />
            {running ? "Executando…" : "Executar"}
          </button>
        </div>
      </div>

      {description && (
        <p className="text-[var(--text-muted)] text-sm">{description}</p>
      )}

      {/* Source code toggle (tela) — no PDF o código sempre aparece, ver bloco abaixo */}
      {showCode && (
        <pre data-print-hide className="bg-[var(--bg-app)] border border-[var(--border-default)] rounded-md p-4 text-xs text-[var(--text-secondary)] overflow-x-auto leading-relaxed">
          {code}
        </pre>
      )}
      <pre className="hidden print:block bg-[var(--bg-app)] border border-[var(--border-default)] rounded-md p-4 text-xs text-[var(--text-secondary)] overflow-x-auto leading-relaxed">
        {code}
      </pre>

      {/* Terminal output — canvas do xterm não imprime bem, escondido no PDF */}
      {(lines.length > 0 || running) && (
        <div data-print-hide>
          <TerminalView lines={lines} sessionKey={runId} className="h-72 rounded-md overflow-hidden border border-[var(--border-default)] p-2 bg-[#09090b]" />
        </div>
      )}
    </div>
  );
}
