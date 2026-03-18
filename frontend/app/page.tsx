import Link from "next/link";
import { sections, patterns } from "@/lib/patterns-data";
import { PatternGrid } from "@/components/dashboard/PatternGrid";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold text-white">
          Design Patterns & Algoritmos
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Exemplos interativos com código real executado em tempo real. Explore padrões de design,
          algoritmos, clean code e boas práticas de engenharia de software.
        </p>
      </div>

      {sections.map((section) => {
        const count = patterns.filter((p) => section.categories.includes(p.category)).length;
        const availableCount = patterns.filter(
          (p) => section.categories.includes(p.category) && p.available
        ).length;

        return (
          <section key={section.slug} className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <div>
                  <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                  <p className="text-sm text-zinc-500">
                    {availableCount} de {count} disponíveis
                  </p>
                </div>
              </div>
              <Link
                href={`/${section.slug}`}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Ver seção →
              </Link>
            </div>
            <PatternGrid categories={section.categories} />
          </section>
        );
      })}
    </div>
  );
}
