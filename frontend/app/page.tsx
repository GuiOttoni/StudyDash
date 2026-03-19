import Link from "next/link";
import { getSections, getStudies } from "@/lib/api";
import { StudyGrid } from "@/components/dashboard/StudyGrid";
import { Icon } from "@/components/ui/Icon";

export default async function HomePage() {
  const [sections, allStudies] = await Promise.all([getSections(), getStudies()]);

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
        const sectionStudies = allStudies.filter((s) =>
          section.categories.includes(s.category)
        );
        const availableCount = sectionStudies.filter((s) => s.available).length;

        return (
          <section key={section.slug} className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon name={section.icon} size={24} strokeWidth={1.5} className="text-zinc-300 shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                  <p className="text-sm text-zinc-500">
                    {availableCount} de {sectionStudies.length} disponíveis
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
            <StudyGrid studies={sectionStudies} />
          </section>
        );
      })}
    </div>
  );
}
