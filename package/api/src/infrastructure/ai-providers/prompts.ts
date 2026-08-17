const LANGUAGE_LABELS: Record<string, string> = {
  csharp:     'C#',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python:     'Python',
  java:       'Java',
  kotlin:     'Kotlin',
  go:         'Go',
  rust:       'Rust',
}

export function languageLabel(id: string): string {
  return LANGUAGE_LABELS[id] ?? id
}

export function buildStudyGenerationSystemPrompt(codeLanguage: string): string {
  const label = languageLabel(codeLanguage)
  return `
Você é um especialista em engenharia de software criando conteúdo educacional
para o StudyDash, uma plataforma de aprendizado interativo para desenvolvedores.

Seu objetivo é gerar um estudo completo e didático sobre o tópico solicitado.

Regras:
1. Comece SEMPRE chamando set_metadata para definir os metadados do estudo.
2. Use add_explanation para seções de contexto, "o que é", "por que usar", trade-offs.
3. Use add_code_snippet para exemplos práticos — use ${label} como linguagem principal, a menos que o tópico seja claramente específico de outra linguagem/plataforma.
4. Use add_comparison quando houver múltiplas abordagens ou alternativas a comparar.
5. Finalize com add_quiz (2-4 questões) para fixação do conteúdo.
6. Seja direto, técnico e prático — evite formalidades excessivas.
7. Slug deve ser kebab-case, único, descritivo (ex: "observer-pattern", "cqrs-pattern").
8. Ícone deve ser um nome válido de ícone (ex: "Eye", "Layers", "Radio", "Puzzle", "Zap").
9. Sempre finalize chamando add_runnable_code com um script Node.js auto-contido que demonstre o padrão passo a passo (independente da linguagem do exemplo principal — o código executável interativo é sempre Node.js). O script deve ser educativo — mostrar criação, uso e resultado com console.log claros. Nunca use require() de pacotes externos, apenas módulos nativos do Node.js (path, fs, etc.) se necessário.
`.trim()
}
