// Plain TypeScript types — sem ORM

export interface Section {
  id:          number
  slug:        string
  title:       string
  icon:        string
  description: string
  categories:  string   // JSON string[]
  order:       number
}

export interface Study {
  id:            number
  slug:          string
  title:         string
  icon:          string
  category:      string
  description:   string
  available:     number   // 0 | 1
  order:         number
  ai_content_id: number | null
}

export interface AiStudyContent {
  id:           number
  study_slug:   string
  content:      string   // JSON: GeneratedStudyContent
  generated_by: string
  prompt:       string
  created_at:   number
}
