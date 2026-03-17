import Link from "next/link";
import { type PatternMeta, categoryColors } from "@/lib/patterns-data";

interface Props {
  pattern: PatternMeta;
}

export function PatternCard({ pattern }: Props) {
  const badgeClass = categoryColors[pattern.category];

  const card = (
    <div
      className={`
        group relative rounded-xl border p-6 flex flex-col gap-4 transition-all duration-200
        ${
          pattern.available
            ? "border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800 cursor-pointer"
            : "border-zinc-800 bg-zinc-900/50 opacity-60 cursor-not-allowed"
        }
      `}
    >
      <div className="flex items-start justify-between">
        <span className="text-3xl">{pattern.icon}</span>
        {!pattern.available && (
          <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">
            Em breve
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-lg text-white group-hover:text-zinc-100">
          {pattern.title}
        </h3>
        <span className={`self-start text-xs px-2 py-0.5 rounded-full border font-medium ${badgeClass}`}>
          {pattern.category}
        </span>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {pattern.description}
        </p>
      </div>

      {pattern.available && (
        <div className="mt-auto pt-2">
          <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
            Ver exemplo →
          </span>
        </div>
      )}
    </div>
  );

  if (!pattern.available) return card;

  return (
    <Link href={`/patterns/${pattern.slug}`} className="block">
      {card}
    </Link>
  );
}
