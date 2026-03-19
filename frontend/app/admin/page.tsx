"use client";

import { useEffect, useState } from "react";
import type { SectionDto, StudyDto } from "@/lib/types";
import {
  createSection, updateSection, deleteSection, resetSections,
  createStudy,   updateStudy,   deleteStudy,   resetStudies,
  type SectionPayload, type StudyPayload,
} from "@/lib/api";
import { Icon, ICON_NAMES } from "@/components/ui/Icon";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "sections" | "studies";

// ── Helpers ───────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";

async function fetchSections(): Promise<SectionDto[]> {
  const res = await fetch(`${API_URL}/api/sections`);
  return res.ok ? res.json() : [];
}

async function fetchStudies(): Promise<StudyDto[]> {
  const res = await fetch(`${API_URL}/api/studies`);
  return res.ok ? res.json() : [];
}

// ── Blank states ──────────────────────────────────────────────────────────────

const blankSection = (): SectionPayload => ({
  slug: "", title: "", icon: "", description: "", categories: [], order: 0,
});

const blankStudy = (): StudyPayload => ({
  slug: "", title: "", category: "", description: "", available: false, icon: "", order: 0,
});

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("sections");
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [studies, setStudies] = useState<StudyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [s, st] = await Promise.all([fetchSections(), fetchStudies()]);
    setSections(s);
    setStudies(st);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleError = (e: unknown) =>
    setError(e instanceof Error ? e.message : "Erro desconhecido");

  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciar Conteúdo</h1>
          <p className="text-zinc-400 text-sm mt-1">
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {(["sections", "studies"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t
                ? "bg-zinc-800 text-white border-b-2 border-zinc-400"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t === "sections" ? "Seções" : "Estudos"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Carregando...</p>
      ) : tab === "sections" ? (
        <SectionsTab
          sections={sections}
          onSaved={load}
          onError={handleError}
        />
      ) : (
        <StudiesTab
          studies={studies}
          sections={sections}
          onSaved={load}
          onError={handleError}
        />
      )}
    </div>
  );
}

// ── Sections Tab ──────────────────────────────────────────────────────────────

function SectionsTab({
  sections,
  onSaved,
  onError,
}: {
  sections: SectionDto[];
  onSaved: () => void;
  onError: (e: unknown) => void;
}) {
  const [form, setForm] = useState<SectionPayload | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditId(null); setForm(blankSection()); };
  const openEdit   = (s: SectionDto) => { setEditId(s.id); setForm({ slug: s.slug, title: s.title, icon: s.icon, description: s.description, categories: s.categories, order: s.order }); };
  const closeForm  = () => { setForm(null); setEditId(null); };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      if (editId !== null) await updateSection(editId, form);
      else                  await createSection(form);
      closeForm();
      onSaved();
    } catch (e) {
      onError(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSection(id);
      setConfirmDelete(null);
      onSaved();
    } catch (e) {
      onError(e);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Isso vai apagar todas as seções e restaurar o seed padrão. Continuar?")) return;
    try {
      await resetSections();
      onSaved();
    } catch (e) {
      onError(e);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-sm">{sections.length} seções</span>
        <div className="flex gap-2">
          <button onClick={handleReset} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            Resetar seed
          </button>
          <button onClick={openCreate} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-700 text-white hover:bg-zinc-600 transition-colors">
            + Nova seção
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Icon</th>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Slug</th>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Título</th>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Categorias</th>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Ordem</th>
              <th className="px-4 py-3 text-right text-zinc-400 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {sections.map((s) => (
              <tr key={s.id} className="bg-zinc-950 hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-3 text-zinc-300"><Icon name={s.icon} size={20} strokeWidth={1.5} /></td>
                <td className="px-4 py-3 font-mono text-zinc-300">{s.slug}</td>
                <td className="px-4 py-3 text-white font-medium">{s.title}</td>
                <td className="px-4 py-3 text-zinc-400">{s.categories.join(", ")}</td>
                <td className="px-4 py-3 text-zinc-400">{s.order}</td>
                <td className="px-4 py-3 text-right">
                  {confirmDelete === s.id ? (
                    <span className="flex items-center justify-end gap-2">
                      <span className="text-zinc-400 text-xs">Confirmar?</span>
                      <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:text-red-200 font-medium">Sim</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-zinc-400 hover:text-white">Não</button>
                    </span>
                  ) : (
                    <span className="flex items-center justify-end gap-3">
                      <button onClick={() => openEdit(s)} className="text-zinc-400 hover:text-white transition-colors text-xs">Editar</button>
                      <button onClick={() => setConfirmDelete(s.id)} className="text-zinc-600 hover:text-red-400 transition-colors text-xs">Excluir</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form !== null && (
        <SectionFormModal
          form={form}
          editId={editId}
          saving={saving}
          onChange={setForm}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  );
}

// ── Section Form Modal ────────────────────────────────────────────────────────

function SectionFormModal({
  form, editId, saving, onChange, onSave, onClose,
}: {
  form: SectionPayload;
  editId: number | null;
  saving: boolean;
  onChange: (f: SectionPayload) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg flex flex-col gap-5 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">
            {editId !== null ? "Editar Seção" : "Nova Seção"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug" value={form.slug} onChange={(v) => onChange({ ...form, slug: v })} placeholder="ex: padroes" />
            <Field label="Título" value={form.title} onChange={(v) => onChange({ ...form, title: v })} placeholder="ex: Padrões" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 font-medium block mb-1">Ícone (Lucide)</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                value={form.icon}
                onChange={(e) => onChange({ ...form, icon: e.target.value })}
              >
                <option value="">Selecione...</option>
                {ICON_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-400 font-medium">Preview</span>
              <div className="flex items-center justify-center flex-1 bg-zinc-800 border border-zinc-700 rounded-lg min-h-[40px]">
                {form.icon ? <Icon name={form.icon} size={24} strokeWidth={1.5} className="text-zinc-300" /> : <span className="text-zinc-600 text-xs">—</span>}
              </div>
            </div>
          </div>
          <Field label="Ordem" type="number" value={String(form.order)} onChange={(v) => onChange({ ...form, order: Number(v) })} placeholder="ex: 1" />
          <div>
            <label className="text-xs text-zinc-400 font-medium block mb-1">Categorias (vírgula separadas)</label>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              value={form.categories.join(", ")}
              onChange={(e) => onChange({ ...form, categories: e.target.value.split(",").map((c) => c.trim()).filter(Boolean) })}
              placeholder="ex: Criacional, Estrutural"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-medium block mb-1">Descrição</label>
            <textarea
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              placeholder="Descrição da seção"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Studies Tab ───────────────────────────────────────────────────────────────

function StudiesTab({
  studies,
  sections,
  onSaved,
  onError,
}: {
  studies: StudyDto[];
  sections: SectionDto[];
  onSaved: () => void;
  onError: (e: unknown) => void;
}) {
  const [form, setForm] = useState<StudyPayload | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterSection, setFilterSection] = useState<string>("");

  const allCategories = [...new Set(sections.flatMap((s) => s.categories))].sort();
  const sectionCategories = filterSection
    ? sections.find((s) => s.slug === filterSection)?.categories ?? []
    : null;

  const visible = sectionCategories
    ? studies.filter((st) => sectionCategories.includes(st.category))
    : studies;

  const openCreate = () => { setEditId(null); setForm(blankStudy()); };
  const openEdit   = (s: StudyDto) => {
    setEditId(s.id);
    setForm({ slug: s.slug, title: s.title, category: s.category, description: s.description, available: s.available, icon: s.icon, order: s.order });
  };
  const closeForm  = () => { setForm(null); setEditId(null); };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      if (editId !== null) await updateStudy(editId, form);
      else                  await createStudy(form);
      closeForm();
      onSaved();
    } catch (e) {
      onError(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteStudy(id);
      setConfirmDelete(null);
      onSaved();
    } catch (e) {
      onError(e);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Isso vai apagar todos os estudos e restaurar o seed padrão. Continuar?")) return;
    try {
      await resetStudies();
      onSaved();
    } catch (e) {
      onError(e);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-zinc-400 text-sm">{visible.length} estudos</span>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
          >
            <option value="">Todas as seções</option>
            {sections.map((s) => (
              <option key={s.slug} value={s.slug}>{s.title}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            Resetar seed
          </button>
          <button onClick={openCreate} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-700 text-white hover:bg-zinc-600 transition-colors">
            + Novo estudo
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Icon</th>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Slug</th>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Título</th>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Categoria</th>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Disponível</th>
              <th className="px-4 py-3 text-left text-zinc-400 font-medium">Ordem</th>
              <th className="px-4 py-3 text-right text-zinc-400 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {visible.map((s) => (
              <tr key={s.id} className="bg-zinc-950 hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-3 text-zinc-300"><Icon name={s.icon} size={20} strokeWidth={1.5} /></td>
                <td className="px-4 py-3 font-mono text-zinc-300">{s.slug}</td>
                <td className="px-4 py-3 text-white font-medium">{s.title}</td>
                <td className="px-4 py-3 text-zinc-400">{s.category}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.available ? "bg-green-900/40 text-green-400 border border-green-800" : "bg-zinc-800 text-zinc-500 border border-zinc-700"}`}>
                    {s.available ? "Sim" : "Em breve"}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{s.order}</td>
                <td className="px-4 py-3 text-right">
                  {confirmDelete === s.id ? (
                    <span className="flex items-center justify-end gap-2">
                      <span className="text-zinc-400 text-xs">Confirmar?</span>
                      <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:text-red-200 font-medium">Sim</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-zinc-400 hover:text-white">Não</button>
                    </span>
                  ) : (
                    <span className="flex items-center justify-end gap-3">
                      <button onClick={() => openEdit(s)} className="text-zinc-400 hover:text-white transition-colors text-xs">Editar</button>
                      <button onClick={() => setConfirmDelete(s.id)} className="text-zinc-600 hover:text-red-400 transition-colors text-xs">Excluir</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form !== null && (
        <StudyFormModal
          form={form}
          editId={editId}
          saving={saving}
          categories={allCategories}
          onChange={setForm}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  );
}

// ── Study Form Modal ──────────────────────────────────────────────────────────

function StudyFormModal({
  form, editId, saving, categories, onChange, onSave, onClose,
}: {
  form: StudyPayload;
  editId: number | null;
  saving: boolean;
  categories: string[];
  onChange: (f: StudyPayload) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg flex flex-col gap-5 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">
            {editId !== null ? "Editar Estudo" : "Novo Estudo"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug" value={form.slug} onChange={(v) => onChange({ ...form, slug: v })} placeholder="ex: bubble-sort" />
            <Field label="Título" value={form.title} onChange={(v) => onChange({ ...form, title: v })} placeholder="ex: Bubble Sort" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 font-medium block mb-1">Ícone (Lucide)</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                value={form.icon}
                onChange={(e) => onChange({ ...form, icon: e.target.value })}
              >
                <option value="">Selecione...</option>
                {ICON_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-400 font-medium">Preview</span>
              <div className="flex items-center justify-center flex-1 bg-zinc-800 border border-zinc-700 rounded-lg min-h-[40px]">
                {form.icon ? <Icon name={form.icon} size={24} strokeWidth={1.5} className="text-zinc-300" /> : <span className="text-zinc-600 text-xs">—</span>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-zinc-400 font-medium block mb-1">Categoria</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                value={form.category}
                onChange={(e) => onChange({ ...form, category: e.target.value })}
              >
                <option value="">Selecione...</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <Field label="Ordem" type="number" value={String(form.order)} onChange={(v) => onChange({ ...form, order: Number(v) })} placeholder="ex: 7" />
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) => onChange({ ...form, available: e.target.checked })}
                  className="w-4 h-4 accent-zinc-400"
                />
                Disponível
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 font-medium block mb-1">Descrição</label>
            <textarea
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              placeholder="Descrição do estudo"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared Field Component ────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-400 font-medium block mb-1">{label}</label>
      <input
        type={type}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
