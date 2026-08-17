import type { Skill } from '../value-objects/Skill.js'
import type { GeneratedStudy } from '../value-objects/GeneratedStudy.js'

export type GenerationLogFn = (message: string) => void

/**
 * Contrato único que todo provider de IA (Anthropic, Google, Claude Code CLI
 * local) implementa. `GenerateStudy` (application/use-cases) depende só
 * disso — nunca de um SDK concreto.
 */
export interface AiProvider {
  readonly label: string
  /** Modelo usado por este provider (string vazia = modelo padrão do provider). */
  readonly model: string
  generate(prompt: string, skills: Skill[], systemPrompt: string, log?: GenerationLogFn): Promise<GeneratedStudy>
}
