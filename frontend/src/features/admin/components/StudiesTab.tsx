import { useState } from "react";
import { Icon } from "@/shared/components/ui/Icon";
import { createStudy, updateStudy, deleteStudy, resetStudies, type StudyPayload } from "@/shared/lib/api-client";
import type { SectionDto, StudyDto } from "@/domain/types";
import { StudyFormModal } from "./StudyFormModal";

const blankStudy = (): StudyPayload => ({
  slug: "", title: "", category: "", description: "", available: false, icon: "", order: 0,
});

interface Props {
  studies: StudyDto[];
  sections: SectionDto[];
  onSaved: () => void;
  onError: (e: unknown) => void;
}

export function StudiesTab({ studies, sections, onSaved, onError }: Props) {
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
          <span className="text-[var(--text-tertiary)] text-sm">{visible.length} estudos</span>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-emphasis)]"
          >
            <option value="">Todas as seções</option>
            {sections.map((s) => (
              <option key={s.slug} value={s.slug}>{s.title}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            Resetar seed
          </button>
          <button onClick={openCreate} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-control)] text-[var(--text-primary)] hover:bg-[var(--bg-control-hover)] transition-colors">
            + Novo estudo
          </button>
        </div>
      </div>

      <div className="rounded-md border border-[var(--border-default)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
            <tr>
              <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Icon</th>
              <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Slug</th>
              <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Título</th>
              <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Categoria</th>
              <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Disponível</th>
              <th className="px-4 py-3 text-left text-[var(--text-tertiary)] font-medium">Ordem</th>
              <th className="px-4 py-3 text-right text-[var(--text-tertiary)] font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-default)]">
            {visible.map((s) => (
              <tr key={s.id} className="bg-[var(--bg-app)] hover:bg-[var(--bg-surface)]/50 transition-colors">
                <td className="px-4 py-3 text-[var(--text-secondary)]"><Icon name={s.icon} size={20} strokeWidth={1.5} /></td>
                <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">{s.slug}</td>
                <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{s.title}</td>
                <td className="px-4 py-3 text-[var(--text-tertiary)]">{s.category}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.available ? "bg-green-900/40 text-green-400 border border-green-800" : "bg-[var(--bg-surface-hover)] text-[var(--text-muted)] border border-[var(--border-strong)]"}`}>
                    {s.available ? "Sim" : "Em breve"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--text-tertiary)]">{s.order}</td>
                <td className="px-4 py-3 text-right">
                  {confirmDelete === s.id ? (
                    <span className="flex items-center justify-end gap-2">
                      <span className="text-[var(--text-tertiary)] text-xs">Confirmar?</span>
                      <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:text-red-200 font-medium">Sim</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Não</button>
                    </span>
                  ) : (
                    <span className="flex items-center justify-end gap-3">
                      <button onClick={() => openEdit(s)} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors text-xs">Editar</button>
                      <button onClick={() => setConfirmDelete(s.id)} className="text-[var(--text-faint)] hover:text-red-400 transition-colors text-xs">Excluir</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form !== null && (
        <StudyFormModal form={form} editId={editId} saving={saving} categories={allCategories} onChange={setForm} onSave={handleSave} onClose={closeForm} />
      )}
    </div>
  );
}
