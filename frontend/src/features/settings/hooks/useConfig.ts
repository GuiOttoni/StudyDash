import { useEffect, useState } from "react";
import { getConfig, patchConfig, getAiModels, getCodeLanguages } from "@/shared/lib/api-client";
import type { StudydashConfigDto } from "@/domain/types";

export type AiModels = {
  anthropic: { id: string; label: string }[];
  google:    { id: string; label: string }[];
  cli:       { id: string; label: string }[];
};

export function useConfig() {
  const [config, setConfig] = useState<StudydashConfigDto | null>(null);
  const [models, setModels] = useState<AiModels | null>(null);
  const [codeLanguages, setCodeLanguages] = useState<{ id: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    getConfig().then(setConfig).catch(() => setError("Não foi possível conectar à API. Execute `studydash up`."));
    getAiModels().then(setModels).catch(() => {});
    getCodeLanguages().then(setCodeLanguages).catch(() => {});
  }, []);

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      await patchConfig(patch);
      const updated = await getConfig();
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return { config, setConfig, models, codeLanguages, saving, saved, error, save };
}
