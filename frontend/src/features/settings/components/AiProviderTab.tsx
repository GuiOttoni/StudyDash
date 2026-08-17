import { useEffect, useState } from "react";
import { Section, Field, Input, Select, SaveButton } from "@/shared/components/ui/FormControls";
import type { StudydashConfigDto } from "@/domain/types";
import type { AiModels } from "../hooks/useConfig";

interface Props {
  config: StudydashConfigDto;
  setConfig: (c: StudydashConfigDto) => void;
  models: AiModels | null;
  codeLanguages: { id: string; label: string }[];
  saving: boolean;
  save: (patch: Record<string, unknown>) => Promise<void>;
}

interface FallbackEdit {
  provider: "anthropic" | "google";
  model: string;
  label: string;
  newApiKey: string;
}

export function AiProviderTab({ config, setConfig, models, codeLanguages, saving, save }: Props) {
  const [newApiKey, setNewApiKey] = useState("");
  const [fallbackEdits, setFallbackEdits] = useState<FallbackEdit[]>([]);

  useEffect(() => {
    setFallbackEdits(config.ai.fallbacks.map(f => ({
      provider: f.provider as "anthropic" | "google", model: f.model, label: f.label, newApiKey: "",
    })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.ai.fallbacks.length]);

  return (
    <div className="flex flex-col gap-4">
      <Section title="Provider de IA">
        <Field label="Provider">
          <Select
            value={config.ai.provider}
            onChange={(v) => setConfig({ ...config, ai: { ...config.ai, provider: v as "anthropic" | "google" | "cli", model: "" } })}
          >
            <option value="anthropic">Anthropic (Claude) — requer API key</option>
            <option value="google">Google (Gemini) — requer API key</option>
            <option value="cli">Claude Code CLI local — sem API key</option>
          </Select>
        </Field>

        {config.ai.provider === "cli" ? (
          <div className="bg-[var(--bg-surface-hover)]/60 border border-[var(--border-strong)] rounded-lg px-4 py-3 text-[var(--text-tertiary)] text-sm leading-relaxed">
            Usa o Claude Code CLI já instalado e autenticado nesta máquina (mesma sessão do{" "}
            <code className="text-[var(--text-secondary)]">claude</code> no terminal) — não precisa colar nenhuma API key aqui.
            Se ainda não instalou: <code className="text-[var(--text-secondary)]">npm install -g @anthropic-ai/claude-code</code>{" "}
            e depois <code className="text-[var(--text-secondary)]">claude login</code>.
          </div>
        ) : (
          <Field
            label="API Key"
            hint={config.ai.hasApiKey
              ? `Chave configurada (…${config.ai.apiKeyHint}). Cole uma nova para substituir.`
              : "Nenhuma chave configurada."}
          >
            <Input
              type="password"
              value={newApiKey}
              placeholder={config.ai.provider === "anthropic" ? "sk-ant-..." : "AIza..."}
              onChange={(e) => setNewApiKey(e.target.value)}
            />
          </Field>
        )}

        <Field label="Modelo">
          <Select
            value={config.ai.model}
            onChange={(v) => setConfig({ ...config, ai: { ...config.ai, model: v } })}
          >
            {(models?.[config.ai.provider] ?? []).map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Linguagem dos exemplos de código" hint="Linguagem principal usada nos snippets gerados pela IA (o código executável interativo continua sempre em Node.js).">
          <Select
            value={config.ai.codeLanguage}
            onChange={(v) => setConfig({ ...config, ai: { ...config.ai, codeLanguage: v } })}
          >
            {codeLanguages.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </Select>
        </Field>

        <SaveButton
          saving={saving}
          onClick={() => {
            const patch: Record<string, unknown> = {
              provider:     config.ai.provider,
              model:        config.ai.model,
              codeLanguage: config.ai.codeLanguage,
            };
            if (newApiKey.trim()) patch.apiKey = newApiKey.trim();
            save({ ai: patch }).then(() => setNewApiKey(""));
          }}
        />
      </Section>

      <Section title="Provedores de Fallback">
        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
          Se o provedor principal falhar por cota esgotada, o StudyDash tentará os provedores abaixo em ordem.
        </p>

        {fallbackEdits.map((fb, i) => (
          <div key={i} className="flex flex-col gap-3 border border-[var(--border-strong)] rounded-md p-4">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)] text-sm font-medium">Fallback {i + 1}</span>
              <button
                onClick={() => setFallbackEdits((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-[var(--text-faint)] hover:text-red-400 text-xs transition-colors"
              >
                Remover
              </button>
            </div>
            <Field label="Label (opcional)">
              <Input
                value={fb.label}
                placeholder="Ex: Anthropic backup"
                onChange={(e) => setFallbackEdits((prev) => prev.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
              />
            </Field>
            <Field label="Provider">
              <Select
                value={fb.provider}
                onChange={(v) => setFallbackEdits((prev) => prev.map((x, idx) => idx === i ? { ...x, provider: v as "anthropic" | "google", model: (models?.[v as "anthropic"|"google"]?.[0]?.id ?? '') } : x))}
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="google">Google (Gemini)</option>
              </Select>
            </Field>
            <Field label="Modelo">
              <Select
                value={fb.model}
                onChange={(v) => setFallbackEdits((prev) => prev.map((x, idx) => idx === i ? { ...x, model: v } : x))}
              >
                {(models?.[fb.provider] ?? []).map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </Select>
            </Field>
            <Field
              label="API Key"
              hint={config.ai.fallbacks[i]?.hasApiKey ? `Chave configurada (…${config.ai.fallbacks[i]?.apiKeyHint}). Cole uma nova para substituir.` : "Nenhuma chave configurada."}
            >
              <Input
                type="password"
                value={fb.newApiKey}
                placeholder={fb.provider === "anthropic" ? "sk-ant-..." : "AIza..."}
                onChange={(e) => setFallbackEdits((prev) => prev.map((x, idx) => idx === i ? { ...x, newApiKey: e.target.value } : x))}
              />
            </Field>
          </div>
        ))}

        <button
          onClick={() => setFallbackEdits((prev) => [...prev, { provider: "anthropic", model: models?.anthropic?.[1]?.id ?? "claude-sonnet-4-6", label: "", newApiKey: "" }])}
          className="self-start px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs font-medium transition-colors"
        >
          + Adicionar fallback
        </button>

        <SaveButton
          saving={saving}
          onClick={() =>
            save({
              ai: {
                fallbacks: fallbackEdits.map((edit) => ({
                  provider: edit.provider,
                  model:    edit.model,
                  label:    edit.label,
                  ...(edit.newApiKey.trim() ? { apiKey: edit.newApiKey.trim() } : {}),
                })),
              },
            }).then(() => setFallbackEdits((prev) => prev.map((fb) => ({ ...fb, newApiKey: "" }))))
          }
        />
      </Section>
    </div>
  );
}
