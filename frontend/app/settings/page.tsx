"use client";

import { useEffect, useState } from "react";
import { Icon }   from "@/components/ui/Icon";
import { getConfig, patchConfig, getAiModels, CLIENT_API_URL } from "@/lib/api";
import type { StudydashConfigDto } from "@/lib/types";

// ── Tipos locais ───────────────────────────────────────────────────────────────
type Tab = "ai" | "skills" | "backend" | "generate";

// Prompt de exemplo pra quem não sabe por onde começar a gerar um estudo.
const EXAMPLE_PROMPT =
  "Crie um estudo completo sobre o padrão Observer: explique o problema que ele resolve, " +
  "compare com Pub/Sub e Mediator, gere um exemplo de código em C# e um quiz de fixação.";

// ── Helpers ────────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="font-semibold text-white text-base">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-600 transition-colors"
    />
  );
}

function Select({ value, onChange, children }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-600 transition-colors"
    >
      {children}
    </select>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-violet-600" : "bg-zinc-700"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
      <span className="text-sm text-zinc-300">{label}</span>
    </label>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="self-start px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
    >
      {saving ? "Salvando…" : "Salvar"}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function SettingsPage() {
  const [tab,     setTab]     = useState<Tab>("ai");
  const [config,  setConfig]  = useState<StudydashConfigDto | null>(null);
  const [models,  setModels]  = useState<{ anthropic: {id:string;label:string}[]; google: {id:string;label:string}[]; cli: {id:string;label:string}[] } | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState("");
  const [genLogs, setGenLogs] = useState<string[]>([]);
  const [fallbackEdits, setFallbackEdits] = useState<
    { provider: "anthropic" | "google"; model: string; label: string; newApiKey: string }[]
  >([]);

  // ── Generate tab state ─────────────────────────────────────────────────────
  const [genPrompt,   setGenPrompt]   = useState("");
  const [genLoading,  setGenLoading]  = useState(false);
  const [genResult,   setGenResult]   = useState<string | null>(null);
  const [genError,    setGenError]    = useState<string | null>(null);

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    getConfig().then(setConfig).catch(() => setError("Não foi possível conectar à API. Execute `studydash up`."));
    getAiModels().then(setModels).catch(() => {});
  }, []);

  useEffect(() => {
    if (config?.ai.fallbacks) {
      setFallbackEdits(config.ai.fallbacks.map(f => ({
        provider: f.provider, model: f.model, label: f.label, newApiKey: '',
      })));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.ai.fallbacks.length]);

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

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    setGenLoading(true);
    setGenLogs([]);
    setGenError(null);
    setGenResult(null);

    let jobId: string;
    try {
      const res = await fetch(`${CLIENT_API_URL}/api/ai/generate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt: genPrompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error ?? "Erro ao iniciar geração");
        setGenLoading(false);
        return;
      }
      jobId = data.jobId;
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : String(e));
      setGenLoading(false);
      return;
    }

    const es = new EventSource(`${CLIENT_API_URL}/api/ai/generate/stream/${jobId}`);

    es.addEventListener("log", (e) => {
      setGenLogs((prev) => [...prev, (e as MessageEvent).data]);
    });

    es.addEventListener("result", (e) => {
      try {
        const { study } = JSON.parse((e as MessageEvent).data);
        setGenResult(`Estudo "${study.title}" criado com sucesso! Acesse /studies/${study.slug}`);
        setGenPrompt("");
      } catch {
        setGenResult("Estudo gerado com sucesso!");
      }
      es.close();
      setGenLoading(false);
    });

    es.addEventListener("error", (e) => {
      setGenError((e as MessageEvent).data ?? "Erro desconhecido");
      es.close();
      setGenLoading(false);
    });

    es.onerror = () => { es.close(); setGenLoading(false); };
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "ai",       label: "Inteligência Artificial", icon: "Sparkles" },
    { id: "skills",   label: "Skills",                  icon: "Wrench"   },
    { id: "backend",  label: "Backend",                 icon: "Server"   },
    { id: "generate", label: "Gerar Estudo",            icon: "Wand2"    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Gerencie API keys, skills da IA e preferências do StudyDash.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Saved toast */}
      {saved && (
        <div className="bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3 text-emerald-300 text-sm">
          ✓ Configurações salvas com sucesso.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-zinc-700 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon name={t.icon} size={14} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: AI ──────────────────────────────────────────────────────── */}
      {tab === "ai" && config && (
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
              <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-400 text-sm leading-relaxed">
                Usa o Claude Code CLI já instalado e autenticado nesta máquina (mesma sessão do{" "}
                <code className="text-zinc-300">claude</code> no terminal) — não precisa colar nenhuma API key aqui.
                Se ainda não instalou: <code className="text-zinc-300">npm install -g @anthropic-ai/claude-code</code>{" "}
                e depois <code className="text-zinc-300">claude login</code>.
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

            <SaveButton
              saving={saving}
              onClick={() => {
                const patch: Record<string, unknown> = {
                  provider: config.ai.provider,
                  model:    config.ai.model,
                };
                if (newApiKey.trim()) patch.apiKey = newApiKey.trim();
                save({ ai: patch }).then(() => setNewApiKey(""));
              }}
            />
          </Section>
          <Section title="Provedores de Fallback">
            <p className="text-zinc-500 text-sm leading-relaxed">
              Se o provedor principal falhar por cota esgotada, o StudyDash tentará os provedores abaixo em ordem.
            </p>

            {fallbackEdits.map((fb, i) => (
              <div key={i} className="flex flex-col gap-3 border border-zinc-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 text-sm font-medium">Fallback {i + 1}</span>
                  <button
                    onClick={() => setFallbackEdits((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-zinc-600 hover:text-red-400 text-xs transition-colors"
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
                  hint={config?.ai.fallbacks[i]?.hasApiKey ? `Chave configurada (…${config.ai.fallbacks[i]?.apiKeyHint}). Cole uma nova para substituir.` : "Nenhuma chave configurada."}
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
              className="self-start px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
            >
              + Adicionar fallback
            </button>

            <SaveButton
              saving={saving}
              onClick={() =>
                save({
                  ai: {
                    fallbacks: fallbackEdits.map((edit, i) => ({
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
      )}

      {/* ── TAB: SKILLS ──────────────────────────────────────────────────── */}
      {tab === "skills" && config && (
        <div className="flex flex-col gap-4">
          <Section title="Skills da IA">
            <p className="text-zinc-500 text-sm leading-relaxed">
              Skills são as ferramentas que a IA pode invocar ao gerar um estudo.
              Desabilitar uma skill remove o tipo de conteúdo correspondente do estudo gerado.
            </p>

            <div className="flex flex-col gap-4 pt-2">
              {(Object.entries(config.ai.skills) as [keyof typeof config.ai.skills, boolean][]).map(([key, val]) => {
                const labels: Record<string, string> = {
                  codeSnippet:  "Snippets de código — exemplos práticos comentados",
                  comparison:   "Tabelas de comparação — prós e contras entre abordagens",
                  quiz:         "Quiz de fixação — questões de múltipla escolha",
                  explanation:  "Seções de explicação — contexto, conceitos e trade-offs",
                  diagram:      "Diagramas — descrição textual de fluxos (experimental)",
                };
                return (
                  <Toggle
                    key={key}
                    checked={val}
                    label={labels[key] ?? key}
                    onChange={(v) =>
                      setConfig({ ...config, ai: { ...config.ai, skills: { ...config.ai.skills, [key]: v } } })
                    }
                  />
                );
              })}
            </div>

            <SaveButton
              saving={saving}
              onClick={() => save({ ai: { skills: config.ai.skills } })}
            />
          </Section>
        </div>
      )}

      {/* ── TAB: BACKEND ─────────────────────────────────────────────────── */}
      {tab === "backend" && config && (
        <div className="flex flex-col gap-4">
          <Section title="Endereço da API">
            <p className="text-zinc-500 text-sm leading-relaxed">
              Útil se você quiser rodar o backend em outro host ou porta.
              O frontend usa esta URL para todas as chamadas de API.
            </p>
            <Field label="Porta da API" hint="Padrão: 5055">
              <Input
                type="number"
                value={config.backend.port}
                onChange={(e) =>
                  setConfig({ ...config, backend: { ...config.backend, port: Number(e.target.value) } })
                }
              />
            </Field>
            <Field label="Porta do Frontend" hint="Padrão: 8085">
              <Input
                type="number"
                value={config.frontend.port}
                onChange={(e) =>
                  setConfig({ ...config, frontend: { port: Number(e.target.value) } })
                }
              />
            </Field>
            <SaveButton
              saving={saving}
              onClick={() => save({ backend: config.backend, frontend: config.frontend })}
            />
          </Section>

          <Section title="Código Gerado">
            <p className="text-zinc-500 text-sm leading-relaxed">
              Pasta local onde os arquivos JavaScript executáveis gerados pela IA serão salvos.
              Obrigatório para gerar estudos.
            </p>
            <Field
              label="Pasta de código"
              hint={config.codePath ? `Atual: ${config.codePath}` : "Nenhuma pasta configurada."}
            >
              <Input
                value={config.codePath ?? ""}
                placeholder="Ex: C:\Users\seu-usuario\studydash-code"
                onChange={(e) => setConfig({ ...config, codePath: e.target.value })}
              />
            </Field>
            <SaveButton
              saving={saving}
              onClick={() => save({ codePath: config.codePath })}
            />
          </Section>
        </div>
      )}

      {/* ── TAB: GENERATE ────────────────────────────────────────────────── */}
      {tab === "generate" && (
        <div className="flex flex-col gap-4">
          <Section title="Gerar estudo com IA">
            <p className="text-zinc-500 text-sm leading-relaxed">
              Descreva o tópico que você quer aprender. A IA vai usar as skills habilitadas
              para gerar um estudo completo com código, comparações e quiz.
            </p>

            {!(config?.ai.provider === "cli" || config?.ai.hasApiKey) && (
              <div className="bg-amber-950 border border-amber-800 rounded-lg px-4 py-3 text-amber-300 text-sm">
                Configure sua API key (ou selecione o provider <strong>Claude Code CLI local</strong>) na aba{" "}
                <strong>Inteligência Artificial</strong> antes de gerar.
              </div>
            )}

            {!config?.codePath && (
              <div className="bg-amber-950 border border-amber-800 rounded-lg px-4 py-3 text-amber-300 text-sm">
                Configure a <strong>Pasta de código</strong> na aba <strong>Backend</strong> antes de gerar.
              </div>
            )}

            <Field label="Descreva o tópico">
              <textarea
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                rows={3}
                placeholder="Ex: Crie um estudo sobre Observer Pattern em C#, com comparação com Event-Driven Architecture"
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-600 transition-colors resize-none"
              />
              <button
                type="button"
                onClick={() => setGenPrompt(EXAMPLE_PROMPT)}
                className="self-start text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Usar prompt de exemplo
              </button>
            </Field>

            {genError && (
              <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
                {genError}
              </div>
            )}

            {genResult && (
              <div className="bg-emerald-950 border border-emerald-800 rounded-lg px-4 py-3 text-emerald-300 text-sm">
                ✓ {genResult}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={genLoading || !genPrompt.trim() || !(config?.ai.provider === "cli" || config?.ai.hasApiKey) || !config?.codePath}
              className="self-start flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              <Icon name="Wand2" size={14} />
              {genLoading ? "Gerando…" : "Gerar estudo"}
            </button>

            {(genLoading || genLogs.length > 0) && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900 text-zinc-500 text-xs font-mono">
                  studydash / ai generate
                </div>
                <div className="p-4 font-mono text-xs space-y-0.5 max-h-56 overflow-y-auto">
                  {genLogs.map((line, i) => (
                    <div key={i} className="text-zinc-300 leading-relaxed">{line}</div>
                  ))}
                  {genLoading && (
                    <span className="inline-block w-1.5 h-3 bg-violet-400 animate-pulse ml-0.5" />
                  )}
                </div>
              </div>
            )}
          </Section>
        </div>
      )}
    </div>
  );
}
