"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  apiUrl: string;
}

export function BuilderRunSection({ apiUrl }: Props) {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    return () => {
      esRef.current?.close();
    };
  }, []);

  const handleRun = () => {
    esRef.current?.close();
    setLogs([]);
    setDone(false);
    setRunning(true);

    const es = new EventSource(apiUrl);
    esRef.current = es;

    es.onmessage = (event) => {
      if (event.data === "[DONE]") {
        es.close();
        esRef.current = null;
        setRunning(false);
        setDone(true);
        return;
      }
      setLogs((prev) => [...prev, event.data]);
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setRunning(false);
      setLogs((prev) => [...prev, "❌ Erro na conexão com o servidor."]);
    };
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={handleRun}
          disabled={running}
          className={`
            px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
            ${
              running
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-900/30"
            }
          `}
        >
          {running ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              Executando...
            </span>
          ) : (
            "▶ Executar Código"
          )}
        </button>

        {done && (
          <span className="text-sm text-emerald-400 flex items-center gap-1">
            ✓ Execução concluída
          </span>
        )}

        {logs.length > 0 && !running && !done && (
          <button
            onClick={() => { setLogs([]); setDone(false); }}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Output</span>
          {running && (
            <span className="text-xs text-emerald-500 animate-pulse">● ao vivo</span>
          )}
        </div>
        <div className="p-4 font-mono text-sm min-h-[220px] max-h-[400px] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-zinc-600 italic">
              Clique em &quot;Executar Código&quot; para ver os logs em tempo real...
            </p>
          ) : (
            logs.map((line, i) => (
              <div key={i} className="text-emerald-400 leading-7 whitespace-pre-wrap">
                {line}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
