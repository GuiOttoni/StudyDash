import Link from "next/link";
import type { StudyDto } from "@/lib/types";
import { getCategoryColor } from "@/lib/category-colors";
import { Icon } from "@/components/ui/Icon";

interface Props {
  study: StudyDto;
}

export function StudyCard({ study }: Props) {
  const badgeClass = getCategoryColor(study.category);

  const card = (
    <div
      className={`
        group relative rounded-xl border p-6 flex flex-col gap-4 transition-all duration-200
        ${
          study.available
            ? "border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800 cursor-pointer"
            : "border-zinc-800 bg-zinc-900/50 opacity-60 cursor-not-allowed"
        }
      `}
    >
      <div className="flex items-start justify-between">
        <Icon name={study.icon} size={32} strokeWidth={1.5} className="text-zinc-300" />
        {!study.available && (
          <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">
            Em breve
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-lg text-white group-hover:text-zinc-100">
          {study.title}
        </h3>
        <span className={`self-start text-xs px-2 py-0.5 rounded-full border font-medium ${badgeClass}`}>
          {study.category}
        </span>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {study.description}
        </p>
      </div>

      {study.available && (
        <div className="mt-auto pt-2">
          <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
            Ver exemplo →
          </span>
        </div>
      )}
    </div>
  );

  if (!study.available) return card;

  return (
    <Link href={`/patterns/${study.slug}`} className="block">
      {card}
    </Link>
  );
}
