import { useEffect, useRef, useState } from "react";
import { Icon } from "@/shared/components/ui/Icon";

// Nota: /api/roadmap/* é servido pelo backend .NET separado deste monorepo
// (backend/StudyDash.Api/Features/Roadmap), não pela API do pacote npm —
// então esta página fica vazia quando rodando via `studydash up` (mesmo
// comportamento de antes da migração, não é uma regressão introduzida aqui).
const API_BASE = "/api";

type FilterKey = "all" | "pending" | "done";

interface RoadmapTask {
  id: number;
  title: string;
  description: string;
  section: string;
  completed: boolean;
  createdAt: string;
}

interface SectionMeta {
  key: string;
  title: string;
  icon: string;
}

export function RoadmapPage() {
  const [items, setItems] = useState<RoadmapTask[]>([]);
  const [sections, setSections] = useState<SectionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [addingSection, setAddingSection] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    try {
      const [tasksRes, sectionsRes] = await Promise.all([
        fetch(`${API_BASE}/roadmap/tasks`),
        fetch(`${API_BASE}/sections`),
      ]);
      const tasks: RoadmapTask[] = tasksRes.ok ? await tasksRes.json() : [];
      const navSections: { slug: string; title: string; icon: string }[] = sectionsRes.ok ? await sectionsRes.json() : [];
      setItems(tasks);
      setSections(navSections.map((s) => ({ key: s.slug, title: s.title, icon: s.icon })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (editingId !== null && titleInputRef.current) titleInputRef.current.focus();
  }, [editingId]);

  useEffect(() => {
    if (addingSection && addInputRef.current) addInputRef.current.focus();
  }, [addingSection]);

  const toggle = async (item: RoadmapTask) => {
    const updated = { ...item, completed: !item.completed };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    await fetch(`${API_BASE}/roadmap/tasks/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  };

  const remove = async (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`${API_BASE}/roadmap/tasks/${id}`, { method: "DELETE" });
  };

  const startEdit = (item: RoadmapTask) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDesc(item.description);
  };

  const saveEdit = async (item: RoadmapTask) => {
    if (!editTitle.trim()) return;
    const updated = { ...item, title: editTitle.trim(), description: editDesc.trim() };
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    setEditingId(null);
    await fetch(`${API_BASE}/roadmap/tasks/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  };

  const cancelEdit = () => setEditingId(null);

  const startAdd = (section: string) => {
    setAddingSection(section);
    setNewTitle("");
    setNewDesc("");
  };

  const saveAdd = async () => {
    if (!newTitle.trim() || !addingSection) return;
    const payload = { title: newTitle.trim(), description: newDesc.trim(), section: addingSection, completed: false };
    setAddingSection(null);
    const res = await fetch(`${API_BASE}/roadmap/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    const created: RoadmapTask = await res.json();
    setItems((prev) => [...prev, created]);
  };

  const cancelAdd = () => setAddingSection(null);

  const resetToSeed = async () => {
    if (!confirm("Resetar para os itens originais? Todos os seus itens personalizados serão perdidos.")) return;
    setLoading(true);
    const res = await fetch(`${API_BASE}/roadmap/tasks/reset`, { method: "POST" });
    const data: RoadmapTask[] = res.ok ? await res.json() : [];
    setItems(data);
    setLoading(false);
  };

  const totalDone = items.filter((i) => i.completed).length;
  const totalAll = items.length;
  const progressPct = totalAll === 0 ? 0 : Math.round((totalDone / totalAll) * 100);

  const filtered = (section: string) =>
    items.filter((i) => {
      if (i.section !== section) return false;
      if (filter === "pending") return !i.completed;
      if (filter === "done") return i.completed;
      return true;
    });

  if (loading) {
    return (
      <div className="flex flex-col gap-8 max-w-4xl">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Icon name="Map" size={32} strokeWidth={1.5} /> Roadmap
          </h1>
          <div className="text-[var(--text-muted)] text-sm animate-pulse">Carregando tarefas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Icon name="Map" size={32} strokeWidth={1.5} /> Roadmap
            </h1>
            <p className="text-[var(--text-tertiary)] text-lg mt-1">
              Próximas implementações do repositório — adicione, edite e acompanhe o progresso.
            </p>
          </div>
          <button
            onClick={resetToSeed}
            className="text-xs text-[var(--text-faint)] hover:text-[var(--text-tertiary)] transition-colors px-2 py-1 rounded border border-[var(--border-default)] hover:border-[var(--border-strong)] shrink-0 mt-1"
          >
            Resetar
          </button>
        </div>

        {/* Global progress */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-tertiary)]">Progresso total</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">
              {totalDone}/{totalAll}{" "}
              <span className="text-[var(--text-muted)] font-normal">({progressPct}%)</span>
            </span>
          </div>
          <div className="w-full bg-[var(--bg-surface-hover)] rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(["all", "pending", "done"] as FilterKey[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[var(--bg-control)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]/60"
              }`}
            >
              {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : "Concluídos"}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      {sections.map(({ key, title, icon }) => {
        const sectionItems = filtered(key);
        const totalSection = items.filter((i) => i.section === key).length;
        const doneSection = items.filter((i) => i.section === key && i.completed).length;

        return (
          <div key={key} className="flex flex-col gap-3">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name={icon} size={22} strokeWidth={1.5} className="text-[var(--text-secondary)] shrink-0" />
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
                <span className="text-xs text-[var(--text-muted)] font-mono bg-[var(--bg-surface-hover)] px-2 py-0.5 rounded-full">
                  {doneSection}/{totalSection}
                </span>
              </div>
              <button
                onClick={() => startAdd(key)}
                className="text-sm text-[var(--text-muted)] hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <span>+</span> Adicionar
              </button>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-2">
              {sectionItems.length === 0 && filter !== "all" && (
                <p className="text-[var(--text-faint)] text-sm italic px-1">
                  Nenhum item {filter === "pending" ? "pendente" : "concluído"}.
                </p>
              )}

              {sectionItems.map((item) => (
                <div
                  key={item.id}
                  className={`group bg-[var(--bg-surface)] border rounded-md px-4 py-3 flex gap-3 transition-colors ${
                    item.completed ? "border-[var(--border-default)]/50 opacity-60" : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggle(item)}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      item.completed
                        ? "bg-indigo-500 border-indigo-500 text-[var(--text-primary)]"
                        : "border-[var(--border-strong)] hover:border-indigo-400"
                    }`}
                    aria-label="Marcar como concluído"
                  >
                    {item.completed && <span className="text-xs leading-none">✓</span>}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {editingId === item.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          ref={titleInputRef}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(item);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500"
                          placeholder="Título"
                        />
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Escape") cancelEdit(); }}
                          rows={2}
                          className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] outline-none focus:border-indigo-500 resize-none"
                          placeholder="Descrição (opcional)"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(item)}
                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] px-3 py-1 rounded-lg transition-colors"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-3 py-1 rounded-lg transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={`font-medium text-sm ${item.completed ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-[var(--text-muted)] text-xs mt-0.5 leading-relaxed">{item.description}</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {editingId !== item.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-xs"
                        aria-label="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => remove(item.id)}
                        className="p-1.5 rounded-lg text-[var(--text-faint)] hover:text-red-400 hover:bg-[var(--bg-surface-hover)] transition-colors text-xs"
                        aria-label="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add form */}
              {addingSection === key && (
                <div className="bg-[var(--bg-surface)] border border-indigo-500/40 rounded-md px-4 py-3 flex flex-col gap-2">
                  <input
                    ref={addInputRef}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveAdd();
                      if (e.key === "Escape") cancelAdd();
                    }}
                    className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500"
                    placeholder="Título do novo item *"
                  />
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Escape") cancelAdd(); }}
                    rows={2}
                    className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] outline-none focus:border-indigo-500 resize-none"
                    placeholder="Descrição (opcional)"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveAdd}
                      disabled={!newTitle.trim()}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-[var(--text-primary)] px-3 py-1 rounded-lg transition-colors"
                    >
                      Adicionar
                    </button>
                    <button
                      onClick={cancelAdd}
                      className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] px-3 py-1 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
