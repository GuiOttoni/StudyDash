import { PatternGrid } from "@/components/dashboard/PatternGrid";
import { sections } from "@/lib/patterns-data";

const section = sections.find((s) => s.slug === "padroes")!;

export default function PadroesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{section.icon}</span>
          <h1 className="text-4xl font-bold text-white">{section.title}</h1>
        </div>
        <p className="text-zinc-400 text-lg max-w-2xl">{section.description}</p>
      </div>
      <PatternGrid categories={section.categories} />
    </div>
  );
}
