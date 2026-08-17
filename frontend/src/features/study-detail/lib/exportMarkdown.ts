import type { AiStudyDto } from "@/domain/types";

/** Serializa um estudo gerado em Markdown — usado pelo botão "Exportar .md". */
export function studyToMarkdown({ content, generatedBy, prompt }: AiStudyDto): string {
  const { metadata, explanations, codeSnippets, comparisons, quiz, runnableCode } = content;
  const lines: string[] = [];

  lines.push(`# ${metadata.title}`, "");
  lines.push(`_${metadata.category} · gerado por IA (${generatedBy})_`, "");
  lines.push(metadata.description, "");

  for (const exp of explanations) {
    lines.push(`## ${exp.title}`, "");
    if (exp.type === "tip") lines.push("> 💡 " + exp.content.replace(/\n/g, "\n> "));
    else if (exp.type === "warning") lines.push("> ⚠️ " + exp.content.replace(/\n/g, "\n> "));
    else lines.push(exp.content);
    lines.push("");
    if (exp.items?.length) {
      for (const item of exp.items) lines.push(`- ${item}`);
      lines.push("");
    }
  }

  if (codeSnippets.length) {
    lines.push("## Exemplos de código", "");
    for (const snippet of codeSnippets) {
      lines.push(`### ${snippet.title}`, "");
      if (snippet.description) lines.push(snippet.description, "");
      lines.push("```" + snippet.language, snippet.code, "```", "");
    }
  }

  if (comparisons.length) {
    lines.push("## Comparações", "");
    for (const table of comparisons) {
      lines.push(`### ${table.title}`, "");
      for (const item of table.items) {
        lines.push(`**${item.name}** — ${item.description}`, "");
        if (item.pros?.length) lines.push(...item.pros.map((p) => `- ✓ ${p}`));
        if (item.cons?.length) lines.push(...item.cons.map((cItem) => `- ✗ ${cItem}`));
        lines.push("");
      }
    }
  }

  if (quiz.length) {
    lines.push("## Quiz de fixação", "");
    quiz.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.question}`, "");
      q.options.forEach((opt, j) => {
        const marker = j === q.answerIndex ? "**[correta]**" : "";
        lines.push(`   - ${String.fromCharCode(65 + j)}) ${opt} ${marker}`);
      });
      if (q.explanation) lines.push("", `   > ${q.explanation}`);
      lines.push("");
    });
  }

  if (runnableCode) {
    lines.push("## Código executável", "");
    if (runnableCode.description) lines.push(runnableCode.description, "");
    lines.push("```javascript", runnableCode.code, "```", "");
  }

  lines.push("---", "", `_Prompt original: ${prompt}_`);

  return lines.join("\n");
}

/** Dispara o download de um arquivo de texto no navegador (sem round-trip ao servidor). */
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
