import { notFound } from "next/navigation";
import { getSections, getStudies } from "@/lib/api";
import { StudyGrid } from "@/components/dashboard/StudyGrid";
import { Icon } from "@/components/ui/Icon";

interface Props {
  params: Promise<{ section: string }>;
}

// Rota genérica para qualquer seção (as ~9 originais e as criadas
// dinamicamente pela geração via IA usam a mesma página).
export default async function SectionPage({ params }: Props) {
  const { section: slug } = await params;
  const sections = await getSections();
  const section = sections.find((s) => s.slug === slug);
  if (!section) notFound();

  const studies = await getStudies(slug);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Icon name={section.icon} size={40} strokeWidth={1.5} className="text-zinc-300 shrink-0" />
          <h1 className="text-4xl font-bold text-white">{section.title}</h1>
        </div>
        <p className="text-zinc-400 text-lg max-w-2xl">{section.description}</p>
      </div>
      <StudyGrid studies={studies} />
    </div>
  );
}
