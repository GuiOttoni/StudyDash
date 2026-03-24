export interface SectionDto {
  id: number;
  slug: string;
  title: string;
  icon: string;
  description: string;
  categories: string[];
  order: number;
}

export interface StudyDto {
  id: number;
  slug: string;
  title: string;
  category: string;
  description: string;
  available: boolean;
  icon: string;
  order: number;
}

// ── Config ────────────────────────────────────────────────────────────────────

export interface AISkills {
  codeSnippet:  boolean;
  comparison:   boolean;
  quiz:         boolean;
  diagram:      boolean;
  explanation:  boolean;
}

export interface StudydashConfigDto {
  backend:  { port: number; host: string };
  frontend: { port: number };
  ai: {
    provider:   "anthropic" | "google";
    model:      string;
    hasApiKey:  boolean;
    apiKeyHint: string | null;
    skills:     AISkills;
  };
}

// ── AI Generated Study ────────────────────────────────────────────────────────

export interface StudyMetadata {
  title:       string;
  slug:        string;
  category:    string;
  description: string;
  icon:        string;
}

export interface ExplanationSection {
  title:   string;
  content: string;
  type:    "text" | "tip" | "warning";
  items?:  string[];
}

export interface CodeSnippet {
  language:     string;
  title:        string;
  code:         string;
  description?: string;
}

export interface ComparisonTable {
  title: string;
  items: { name: string; description: string; pros?: string[]; cons?: string[] }[];
}

export interface QuizQuestion {
  question:     string;
  options:      string[];
  answerIndex:  number;
  explanation?: string;
}

export interface GeneratedStudyContent {
  metadata:     StudyMetadata;
  explanations: ExplanationSection[];
  codeSnippets: CodeSnippet[];
  comparisons:  ComparisonTable[];
  quiz:         QuizQuestion[];
}

export interface AiStudyDto {
  id:          number;
  studySlug:   string;
  content:     GeneratedStudyContent;
  generatedBy: string;
  prompt:      string;
  createdAt:   number;
}
