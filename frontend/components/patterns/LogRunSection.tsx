"use client";

import { useState, useRef, useEffect } from "react";
import { CodeStream } from "./CodeStream";

interface Props {
  apiUrl: string;
  buttonLabel?: string;
  accentColor?: "emerald" | "violet" | "blue";
}

const accent = {
  emerald: {
    btn: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30",
    pulse: "bg-emerald-400",
    live: "text-emerald-500",
    done: "text-emerald-400",
  },
  violet: {
    btn: "bg-violet-600 hover:bg-violet-500 shadow-violet-900/30",
    pulse: "bg-violet-400",
    live: "text-violet-500",
    done: "text-violet-400",
  },
  blue: {
    btn: "bg-blue-600 hover:bg-blue-500 shadow-blue-900/30",
    pulse: "bg-blue-400",
    live: "text-blue-500",
    done: "text-blue-400",
  },
};

export function LogRunSection({
  apiUrl,
  buttonLabel = "▶ Executar Código",
  accentColor = "emerald",
}: Props) {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const colors = accent[accentColor];

  useEffect(() => () => esRef.current?.close(), []);

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

  const renderLogLine = (line: string, i: number) => {
    const isEmpty = line === "";
    const isSection = line.startsWith("━━") || line.startsWith("──");
    const isSuccess = line.startsWith("✓") || line.includes("✓");
    const isError = line.startsWith("  ✗") || line.includes("✗");
    const isInfo = line.startsWith("»") || line.startsWith("  »");
    const isSubLog = line.startsWith("    ");

    const color = isEmpty
      ? ""
      : isSection
      ? "text-blue-400 font-semibold"
      : isSuccess && !isSubLog
      ? "text-emerald-400"
      : isError
      ? "text-red-400"
      : isInfo
      ? "text-yellow-300"
      : isSubLog
      ? "text-zinc-400"
      : "text-zinc-300";

    return (
      <div key={i} className={`leading-6 whitespace-pre-wrap ${color}`}>
        {isEmpty ? "\u00A0" : line}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={handleRun}
          disabled={running}
          className={`
            px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
            ${running
              ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
              : `${colors.btn} text-white cursor-pointer shadow-lg`
            }
          `}
        >
          {running ? (
            <span className="flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-full ${colors.pulse} animate-pulse`} />
              Executando...
            </span>
          ) : (
            buttonLabel
          )}
        </button>

        {done && (
          <span className={`text-sm flex items-center gap-1 ${colors.done}`}>
            ✓ Execução concluída
          </span>
        )}
      </div>

      <CodeStream 
        logs={logs} 
        running={running} 
        title="Output"
        onClear={() => { setLogs([]); setDone(false); }}
        emptyMessage={`Clique em "${buttonLabel}" para ver os logs em tempo real...`}
        renderLine={renderLogLine}
      />
    </div>
  );
}
