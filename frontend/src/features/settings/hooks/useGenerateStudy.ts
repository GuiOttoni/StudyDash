import { useRef, useState } from "react";
import { streamGenerationLogs } from "@/shared/lib/api-client";
import type { TerminalLine } from "@/shared/components/ui/Terminal";

export function useGenerateStudy() {
  const [jobId,    setJobId]    = useState<string | null>(null);
  const [lines,    setLines]    = useState<TerminalLine[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const generate = async (prompt: string) => {
    if (!prompt.trim()) return;
    esRef.current?.close();
    setLoading(true);
    setLines([]);
    setError(null);
    setResult(null);

    let newJobId: string;
    try {
      const res = await fetch("/api/ai/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao iniciar geração");
        setLoading(false);
        return;
      }
      newJobId = data.jobId;
      setJobId(newJobId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
      return;
    }

    const es = streamGenerationLogs(newJobId);
    esRef.current = es;

    es.addEventListener("log", (e) => {
      setLines((prev) => [...prev, { text: (e as MessageEvent).data }]);
    });

    es.addEventListener("result", (e) => {
      try {
        const { study } = JSON.parse((e as MessageEvent).data);
        setResult(`Estudo "${study.title}" criado com sucesso! Acesse /studies/${study.slug}`);
      } catch {
        setResult("Estudo gerado com sucesso!");
      }
      setLines((prev) => [...prev, { text: "✅ Concluído", kind: "success" }]);
      es.close();
      setLoading(false);
    });

    es.addEventListener("error", (e) => {
      const msg = (e as MessageEvent).data ?? "Erro desconhecido";
      setError(msg);
      setLines((prev) => [...prev, { text: msg, kind: "error" }]);
      es.close();
      setLoading(false);
    });

    es.onerror = () => { es.close(); setLoading(false); };
  };

  return { jobId, lines, loading, result, error, generate };
}
