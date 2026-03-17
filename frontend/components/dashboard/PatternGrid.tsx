import { patterns } from "@/lib/patterns-data";
import { PatternCard } from "./PatternCard";

export function PatternGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {patterns.map((pattern) => (
        <PatternCard key={pattern.slug} pattern={pattern} />
      ))}
    </div>
  );
}
