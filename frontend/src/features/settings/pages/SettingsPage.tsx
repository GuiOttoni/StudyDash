import { useState } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import { useConfig } from "../hooks/useConfig";
import { AiProviderTab } from "../components/AiProviderTab";
import { SkillsTab } from "../components/SkillsTab";
import { BackendTab } from "../components/BackendTab";
import { GenerateTab } from "../components/GenerateTab";

type Tab = "ai" | "skills" | "backend" | "generate";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "ai",       label: "Inteligência Artificial", icon: "Sparkles" },
  { id: "skills",   label: "Skills",                  icon: "Wrench"   },
  { id: "backend",  label: "Backend",                 icon: "Server"   },
  { id: "generate", label: "Gerar Estudo",            icon: "Wand2"    },
];

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>("ai");
  const { config, setConfig, models, codeLanguages, saving, saved, error, save } = useConfig();

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Configurações</h1>
        <p className="text-[var(--text-tertiary)] text-sm mt-1">
          Gerencie API keys, skills da IA e preferências do StudyDash.
        </p>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-md px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-emerald-950 border border-emerald-800 rounded-md px-4 py-3 text-emerald-300 text-sm">
          ✓ Configurações salvas com sucesso.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 flex-1 justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-[var(--bg-control)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <Icon name={t.icon} size={14} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {config && tab === "ai"       && <AiProviderTab config={config} setConfig={setConfig} models={models} codeLanguages={codeLanguages} saving={saving} save={save} />}
      {config && tab === "skills"   && <SkillsTab      config={config} setConfig={setConfig} saving={saving} save={save} />}
      {config && tab === "backend"  && <BackendTab     config={config} setConfig={setConfig} saving={saving} save={save} />}
      {tab === "generate" && <GenerateTab config={config} />}
    </div>
  );
}
