import { useEffect, useState } from "react";
import { getSections, getStudies } from "@/shared/lib/api-client";
import type { SectionDto, StudyDto } from "@/domain/types";
import { SectionsTab } from "../components/SectionsTab";
import { StudiesTab } from "../components/StudiesTab";

type Tab = "sections" | "studies";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("sections");
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [studies, setStudies] = useState<StudyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [s, st] = await Promise.all([getSections(), getStudies()]);
    setSections(s);
    setStudies(st);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleError = (e: unknown) =>
    setError(e instanceof Error ? e.message : "Erro desconhecido");

  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Gerenciar Conteúdo</h1>
          <p className="text-[var(--text-tertiary)] text-sm mt-1">
            CRUD de seções e estudos — dados persistidos no banco de dados.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 font-bold ml-4">✕</button>
        </div>
      )}

      <div className="flex gap-1 border-b border-[var(--border-default)]">
        {(["sections", "studies"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t
                ? "bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border-b-2 border-[var(--border-emphasis)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t === "sections" ? "Seções" : "Estudos"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[var(--text-muted)] text-sm">Carregando...</p>
      ) : tab === "sections" ? (
        <SectionsTab sections={sections} onSaved={load} onError={handleError} />
      ) : (
        <StudiesTab studies={studies} sections={sections} onSaved={load} onError={handleError} />
      )}
    </div>
  );
}
