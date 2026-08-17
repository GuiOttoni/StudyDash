import { Link } from "react-router";
import type { StudyDto } from "@/domain/types";
import { getCategoryColor } from "@/domain/category-colors";
import { Icon } from "@/shared/components/ui/Icon";

interface Props {
  study: StudyDto;
}

export function StudyCard({ study }: Props) {
  const badgeClass = getCategoryColor(study.category);

  const card = (
    <div
      className={`
        group relative rounded-md border p-6 flex flex-col gap-4 transition-all duration-200
        ${
          study.available
            ? "border-[var(--border-strong)] bg-[var(--bg-surface)] hover:border-[var(--border-emphasis)] hover:bg-[var(--bg-surface-hover)] cursor-pointer"
            : "border-[var(--border-default)] bg-[var(--bg-surface)]/50 opacity-60 cursor-not-allowed"
        }
      `}
    >
      <div className="flex items-start justify-between">
        <Icon name={study.icon} size={32} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
        {!study.available && (
          <span className="text-xs px-2 py-1 rounded-full bg-[var(--bg-surface-hover)] text-[var(--text-muted)] border border-[var(--border-strong)]">
            Em breve
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-lg text-[var(--text-primary)] group-hover:text-[var(--text-primary)]">
          {study.title}
        </h3>
        <span className={`self-start text-xs px-2 py-0.5 rounded-full border font-medium ${badgeClass}`}>
          {study.category}
        </span>
        <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
          {study.description}
        </p>
      </div>

      {study.available && (
        <div className="mt-auto pt-2">
          <span className="text-xs text-[var(--text-muted)] group-hover:text-[var(--text-tertiary)] transition-colors">
            Ver exemplo →
          </span>
        </div>
      )}
    </div>
  );

  if (!study.available) return card;

  return (
    <Link to={`/studies/${study.slug}`} className="block">
      {card}
    </Link>
  );
}
