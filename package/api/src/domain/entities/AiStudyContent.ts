import type { GeneratedStudy } from '../value-objects/GeneratedStudy.js'

export class AiStudyContent {
  constructor(
    public readonly id:          number,
    public readonly studySlug:   string,
    public readonly content:     GeneratedStudy,
    public readonly generatedBy: string,
    public readonly prompt:      string,
    public readonly createdAt:   number,
  ) {}
}

export interface NewAiStudyContentData {
  studySlug:   string
  content:     GeneratedStudy
  generatedBy: string
  prompt:      string
  createdAt:   number
}
