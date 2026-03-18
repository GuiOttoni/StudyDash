import { patterns, type PatternCategory } from "@/lib/patterns-data";
import { PatternCard } from "./PatternCard";

interface Props {
  categories?: PatternCategory[];
}

export function PatternGrid({ categories }: Props) {
  const filtered = categories
    ? patterns.filter((p) => categories.includes(p.category))
    : patterns;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filtered.map((pattern) => (
        <PatternCard key={pattern.slug} pattern={pattern} />
      ))}
    </div>
  );
}
