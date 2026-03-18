"use client";

import { useState, useRef, useEffect } from "react";
import { CodeStream } from "./CodeStream";

interface Props {
  apiUrl: string;
}

export function BuilderRunSection({ apiUrl }: Props) {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const esRef = useRef<EventSource | null>(null);

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
      </div>

      <CodeStream 
        logs={logs} 
        running={running} 
        title="Output"
        onClear={() => { setLogs([]); setDone(false); }}
        emptyMessage="Clique em &quot;Executar Código&quot; para ver os logs em tempo real..."
      />
    </div>
  );
}
