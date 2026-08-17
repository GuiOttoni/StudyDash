// Forma do conteúdo educacional gerado por um AiProvider — o mesmo shape,
// independente de qual provider (Anthropic, Gemini, Claude Code CLI) gerou.

export interface StudyMetadata {
  title:       string
  slug:        string
  category:    string
  description: string
  icon:        string
}

export interface ExplanationSection {
  title:   string
  content: string
  type:    'text' | 'tip' | 'warning'
  items?:  string[]
}

export interface CodeSnippet {
  language:     string
  title:        string
  code:         string
  description?: string
}

export interface ComparisonTable {
  title: string
  items: { name: string; description: string; pros?: string[]; cons?: string[] }[]
}

export interface QuizQuestion {
  question:     string
  options:      string[]
  answerIndex:  number
  explanation?: string
}

export interface RunnableCode {
  filename:     string
  code:         string
  description?: string
}

export interface GeneratedStudy {
  metadata:      StudyMetadata
  explanations:  ExplanationSection[]
  codeSnippets:  CodeSnippet[]
  comparisons:   ComparisonTable[]
  quiz:          QuizQuestion[]
  runnableCode?: RunnableCode
}
