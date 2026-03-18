"use client";

import { useState, useRef, useEffect } from "react";
import { ArrayChart } from "./ArrayChart";
import { CodeStream } from "../patterns/CodeStream";

interface SSEMessage {
  type: "log" | "state" | "done";
  msg?: string;
  array?: number[];
  comparing?: number[];
  sorted?: number[];
}

interface Props {
  apiUrl: string;
}

export function MergeSortRunSection({ apiUrl }: Props) {
  const [size, setSize] = useState(7);
  const [logs, setLogs] = useState<string[]>([]);
  const [chartState, setChartState] = useState<{
    array: number[];
    comparing: number[];
    sorted: number[];
  }>({ array: [], comparing: [], sorted: [] });
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const esRef = useRef<EventSource | null>(null);

  useEffect(() => () => esRef.current?.close(), []);

  const handleRun = () => {
    esRef.current?.close();
    setLogs([]);
    setChartState({ array: [], comparing: [], sorted: [] });
    setDone(false);
    setRunning(true);

    const url = `${apiUrl}?size=${size}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      const msg: SSEMessage = JSON.parse(event.data);

      if (msg.type === "done") {
        es.close();
        esRef.current = null;
        setRunning(false);
        setDone(true);
        return;
      }

      if (msg.type === "state" && msg.array) {
        setChartState({
          array: msg.array,
          comparing: msg.comparing ?? [],
          sorted: msg.sorted ?? [],
        });
      }

      if (msg.type === "log" && msg.msg) {
        setLogs((prev) => [...prev, msg.msg!]);
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setRunning(false);
      setLogs((prev) => [...prev, "❌ Erro na conexão com o servidor."]);
    };
  };

  const renderLogLine = (line: string, i: number) => {
    const isDividing = line.startsWith("Dividindo:");
    const isMerging = line.startsWith("Mesclando metades:");
    const isDone = line.startsWith("✓");

    const color = isDone
      ? "text-emerald-400"
      : isMerging
      ? "text-blue-400 font-semibold"
      : isDividing
      ? "text-orange-300"
      : "text-zinc-400";

    return (
      <div key={i} className={`leading-6 whitespace-pre-wrap ${color}`}>
        {line}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
        <div className="flex flex-col gap-2 flex-1 min-w-[180px]">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">
              Tamanho do array
            </label>
            <span className="text-sm font-mono font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">
              {size}
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={10}
            value={size}
            disabled={running}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-zinc-700 accent-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className={`
            px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap
            ${running
              ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg shadow-blue-900/30"
            }
          `}
        >
          {running ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
              Ordenando...
            </span>
          ) : (
            "▶ Executar"
          )}
        </button>

        {done && (
          <span className="text-sm text-emerald-400 flex items-center gap-1">
            ✓ Concluído
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Normal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" /> Comparando
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Ordenado
          </span>
        </div>

        {chartState.array.length > 0 ? (
          <ArrayChart
            array={chartState.array}
            comparing={chartState.comparing}
            sorted={chartState.sorted}
          />
        ) : (
          <div className="flex items-center justify-center h-56 bg-zinc-950 rounded-xl border border-zinc-800 border-dashed">
            <p className="text-zinc-600 text-sm">O gráfico aparecerá aqui após executar</p>
          </div>
        )}
      </div>

      {/* Logs */}
      <CodeStream 
        logs={logs} 
        running={running} 
        title="Log de execução"
        onClear={() => { 
          setLogs([]); 
          setChartState({ array: [], comparing: [], sorted: [] }); 
          setDone(false); 
        }}
        renderLine={renderLogLine}
      />
    </div>
  );
}
