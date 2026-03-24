import type { SectionDto, StudyDto, StudydashConfigDto, GeneratedStudyContent, AiStudyDto } from "./types";

// Server-side URL: uses INTERNAL_API_URL inside Docker (where localhost:5055 doesn't exist).
// Falls back to NEXT_PUBLIC_API_URL for local dev without Docker.
const SERVER_API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5055";

// Client-side URL: NEXT_PUBLIC_* vars are inlined at build time by Next.js,
// so this is safe to use in both browser and server contexts.
const CLIENT_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";

// ── Read (Server Components) ──────────────────────────────────────────────────

export async function getSections(): Promise<SectionDto[]> {
  try {
    const res = await fetch(`${SERVER_API_URL}/api/sections`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getStudies(section?: string): Promise<StudyDto[]> {
  try {
    const url = section
      ? `${SERVER_API_URL}/api/studies?section=${section}`
      : `${SERVER_API_URL}/api/studies`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ── Section CRUD (Client Components / admin) ──────────────────────────────────

export type SectionPayload = Omit<SectionDto, "id">;

export async function createSection(data: SectionPayload): Promise<SectionDto> {
  const res = await fetch(`${CLIENT_API_URL}/api/sections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateSection(id: number, data: SectionPayload): Promise<SectionDto> {
  const res = await fetch(`${CLIENT_API_URL}/api/sections/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteSection(id: number): Promise<void> {
  const res = await fetch(`${CLIENT_API_URL}/api/sections/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

export async function resetSections(): Promise<SectionDto[]> {
  const res = await fetch(`${CLIENT_API_URL}/api/sections/reset`, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Study CRUD (Client Components / admin) ────────────────────────────────────

export type StudyPayload = Omit<StudyDto, "id">;

export async function createStudy(data: StudyPayload): Promise<StudyDto> {
  const res = await fetch(`${CLIENT_API_URL}/api/studies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateStudy(id: number, data: StudyPayload): Promise<StudyDto> {
  const res = await fetch(`${CLIENT_API_URL}/api/studies/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteStudy(id: number): Promise<void> {
  const res = await fetch(`${CLIENT_API_URL}/api/studies/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

export async function resetStudies(): Promise<StudyDto[]> {
  const res = await fetch(`${CLIENT_API_URL}/api/studies/reset`, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Config ────────────────────────────────────────────────────────────────────

export async function getConfig(): Promise<StudydashConfigDto> {
  const res = await fetch(`${CLIENT_API_URL}/api/config`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function patchConfig(patch: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${CLIENT_API_URL}/api/config`, {
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
  const res = await fetch(`${CLIENT_API_URL}/api/ai/generate`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getAiStudy(slug: string): Promise<AiStudyDto> {
  const res = await fetch(`${CLIENT_API_URL}/api/ai/study/${slug}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getAiModels(): Promise<{
  anthropic: { id: string; label: string }[];
  google:    { id: string; label: string }[];
}> {
  const res = await fetch(`${CLIENT_API_URL}/api/ai/models`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
