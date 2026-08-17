"use client";

import { useState, useRef } from "react";
import { Icon } from "@/components/ui/Icon";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";

interface OutputLine {
  type: "stdout" | "stderr" | "error";
  text: string;
}

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
  const [lines,    setLines]    = useState<OutputLine[]>([]);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [showCode, setShowCode] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const run = () => {
    if (esRef.current) esRef.current.close();
    setRunning(true);
    setLines([]);
    setExitCode(null);

    const es = new EventSource(`${API_URL}/api/ai/run/${slug}`);
    esRef.current = es;

    es.addEventListener("stdout", (e) => {
      setLines((prev) => [...prev, { type: "stdout", text: e.data }]);
    });

    es.addEventListener("stderr", (e) => {
      setLines((prev) => [...prev, { type: "stderr", text: e.data }]);
    });

    es.addEventListener("error", (e) => {
      const msg = (e as MessageEvent).data ?? "Erro desconhecido";
      setLines((prev) => [...prev, { type: "error", text: msg }]);
      es.close();
      setRunning(false);
    });

    es.addEventListener("done", (e) => {
      const code = Number(e.data);
      setExitCode(code);
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
        <h2 className="font-semibold text-white text-xl flex items-center gap-2">
          <Icon name="Terminal" size={20} />
          Código Executável
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCode((v) => !v)}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
          >
            {showCode ? "Ocultar código" : "Ver código"}
          </button>
          <button
            onClick={run}
            disabled={running}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            <Icon name={running ? "Loader" : "Play"} size={13} />
            {running ? "Executando…" : "Executar"}
          </button>
        </div>
      </div>

      {description && (
        <p className="text-zinc-500 text-sm">{description}</p>
      )}

      {/* Source code toggle */}
      {showCode && (
        <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 overflow-x-auto leading-relaxed">
          {code}
        </pre>
      )}

      {/* Terminal output */}
      {(lines.length > 0 || running) && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-600" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
            <span className="text-zinc-600 text-xs ml-1 font-mono">node {slug}.js</span>
          </div>
          <div className="p-4 font-mono text-sm space-y-0.5 min-h-[80px] max-h-96 overflow-y-auto">
            {lines.map((line, i) => (
              <pre
                key={i}
                className={`whitespace-pre-wrap break-all ${
                  line.type === "stderr" || line.type === "error"
                    ? "text-red-400"
                    : "text-green-300"
                }`}
              >
                {line.text}
              </pre>
            ))}
            {running && (
              <span className="inline-block w-2 h-4 bg-green-400 animate-pulse" />
            )}
          </div>
          {exitCode !== null && (
            <div className={`px-4 py-2 border-t border-zinc-800 text-xs font-mono ${
              exitCode === 0 ? "text-emerald-500" : "text-red-500"
            }`}>
              Processo encerrado com código {exitCode}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
