import { PatternGrid } from "@/components/dashboard/PatternGrid";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold text-white">
          Design Patterns & Algoritmos
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl">
          Exemplos interativos com código real executado em tempo real. Explore padrões de design,
          algoritmos, clean code e boas práticas de engenharia de software.
        </p>
      </div>

      <PatternGrid />
    </div>
  );
}
