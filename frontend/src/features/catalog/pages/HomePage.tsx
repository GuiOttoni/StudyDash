import { Link } from "react-router";
import { Icon } from "@/shared/components/ui/Icon";
import { useSections } from "@/shared/hooks/useSections";
import { useStudies } from "../hooks/useStudies";
import { StudyGrid } from "../components/StudyGrid";

export function HomePage() {
  const { sections } = useSections();
  const { studies: allStudies } = useStudies();

  return (
    <div className="flex flex-col gap-14">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold text-[var(--text-primary)]">
          Design Patterns & Algoritmos
        </h1>
        <p className="text-[var(--text-tertiary)] text-lg max-w-2xl">
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
                <Icon name={section.icon} size={24} strokeWidth={1.5} className="text-[var(--text-secondary)] shrink-0" />
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">{section.title}</h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    {availableCount} de {sectionStudies.length} disponíveis
                  </p>
                </div>
              </div>
              <Link
                to={`/${section.slug}`}
                className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
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
