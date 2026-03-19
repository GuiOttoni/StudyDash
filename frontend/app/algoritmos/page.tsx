import { getSections, getStudies } from "@/lib/api";
import { StudyGrid } from "@/components/dashboard/StudyGrid";
import { Icon } from "@/components/ui/Icon";

export default async function AlgoritmosPage() {
  const [sections, studies] = await Promise.all([getSections(), getStudies("algoritmos")]);
  const section = sections.find((s) => s.slug === "algoritmos");
  if (!section) return null;

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
