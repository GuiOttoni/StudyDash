import type { StudyDto } from "@/lib/types";
import { StudyCard } from "./StudyCard";

interface Props {
  studies: StudyDto[];
}

export function StudyGrid({ studies }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {studies.map((study) => (
        <StudyCard key={study.slug} study={study} />
      ))}
    </div>
  );
}
