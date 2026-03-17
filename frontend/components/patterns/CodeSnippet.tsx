import { codeToHtml } from "shiki";

interface Props {
  code: string;
  lang: string;
}

export async function CodeSnippet({ code, lang }: Props) {
  const html = await codeToHtml(code, {
    lang,
    theme: "github-dark",
  });

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700 text-sm leading-relaxed">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
        <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{lang}</span>
        <span className="text-xs text-zinc-600">exemplo</span>
      </div>
      <div
        className="overflow-auto p-4 bg-zinc-900"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
