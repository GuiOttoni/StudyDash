import type {
  SectionDto, StudyDto, StudydashConfigDto, GeneratedStudyContent, AiStudyDto,
} from "@/domain/types";

// Mesma origem, mesma porta (a API serve o build estático do frontend) —
// em dev, o proxy do Vite (vite.config.ts) encaminha /api pra API local.
const API_BASE = "/api";

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getSections(): Promise<SectionDto[]> {
  const res = await fetch(`${API_BASE}/sections`);
  if (!res.ok) return [];
  return res.json();
}

export async function getStudies(section?: string): Promise<StudyDto[]> {
  const url = section ? `${API_BASE}/studies?section=${section}` : `${API_BASE}/studies`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

// ── Section CRUD (admin) ───────────────────────────────────────────────────────

export type SectionPayload = Omit<SectionDto, "id">;

export async function createSection(data: SectionPayload): Promise<SectionDto> {
  const res = await fetch(`${API_BASE}/sections`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateSection(id: number, data: SectionPayload): Promise<SectionDto> {
  const res = await fetch(`${API_BASE}/sections/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteSection(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/sections/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

export async function resetSections(): Promise<SectionDto[]> {
  const res = await fetch(`${API_BASE}/sections/reset`, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Study CRUD (admin) ──────────────────────────────────────────────────────────

export type StudyPayload = Omit<StudyDto, "id">;

export async function createStudy(data: StudyPayload): Promise<StudyDto> {
  const res = await fetch(`${API_BASE}/studies`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateStudy(id: number, data: StudyPayload): Promise<StudyDto> {
  const res = await fetch(`${API_BASE}/studies/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteStudy(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/studies/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

export async function resetStudies(): Promise<StudyDto[]> {
  const res = await fetch(`${API_BASE}/studies/reset`, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Config ────────────────────────────────────────────────────────────────────

export async function getConfig(): Promise<StudydashConfigDto> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function patchConfig(patch: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${API_BASE}/config`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await res.text());
}

// ── AI ────────────────────────────────────────────────────────────────────────

export async function generateStudy(
  prompt: string
): Promise<{ study: StudyDto; content: GeneratedStudyContent }> {
  const res = await fetch(`${API_BASE}/ai/generate`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getAiStudy(slug: string): Promise<AiStudyDto> {
  const res = await fetch(`${API_BASE}/ai/study/${slug}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Salva edições feitas pelo desenvolvedor no conteúdo de um estudo (texto/código/quiz/etc). */
export async function updateAiStudy(slug: string, content: GeneratedStudyContent): Promise<void> {
  const res = await fetch(`${API_BASE}/ai/study/${slug}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await res.text());
}

/** Salva edições feitas pelo desenvolvedor no código executável (.js) de um estudo. */
export async function updateRunnableCode(slug: string, code: string): Promise<void> {
  const res = await fetch(`${API_BASE}/ai/study/${slug}/code`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function getAiModels(): Promise<{
  anthropic: { id: string; label: string }[];
  google:    { id: string; label: string }[];
  cli:       { id: string; label: string }[];
}> {
  const res = await fetch(`${API_BASE}/ai/models`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getCodeLanguages(): Promise<{ id: string; label: string }[]> {
  const res = await fetch(`${API_BASE}/ai/code-languages`);
  if (!res.ok) return [];
  return res.json();
}

/** SSE de logs de um job de geração — usado pelo Terminal (ver GenerateTab). */
export function streamGenerationLogs(jobId: string): EventSource {
  return new EventSource(`${API_BASE}/ai/generate/stream/${jobId}`);
}

/** SSE de stdout/stderr da execução do código gerado — usado pelo Terminal (ver RunCode). */
export function streamCodeRun(slug: string): EventSource {
  return new EventSource(`${API_BASE}/ai/run/${slug}`);
}
