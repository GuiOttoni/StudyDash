import { useParams } from "react-router";
import { Icon } from "@/shared/components/ui/Icon";
import { NotFoundPage } from "@/shared/components/ui/NotFoundPage";
import { useSections } from "@/shared/hooks/useSections";
import { useStudies } from "../hooks/useStudies";
import { StudyGrid } from "../components/StudyGrid";

// Rota genérica para qualquer seção (as originais e as criadas
// dinamicamente pela geração via IA usam a mesma página).
export function SectionPage() {
  const { section: slug } = useParams<{ section: string }>();
  const { sections, loading: loadingSections } = useSections();
  const { studies } = useStudies(slug);

  if (loadingSections) return null;

  const section = sections.find((s) => s.slug === slug);
  if (!section) return <NotFoundPage message="Seção não encontrada." />;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Icon name={section.icon} size={40} strokeWidth={1.5} className="text-[var(--text-secondary)] shrink-0" />
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">{section.title}</h1>
        </div>
        <p className="text-[var(--text-tertiary)] text-lg max-w-2xl">{section.description}</p>
      </div>
      <StudyGrid studies={studies} />
    </div>
  );
}
