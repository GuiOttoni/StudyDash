import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";
// import { YourRunSection } from "@/components/patterns/YourRunSection";

/**
 * Boilerplate para criação de novas páginas de algoritmos ou padrões.
 *
 * PASSO A PASSO:
 *   1. Copie esta pasta para app/patterns/seu-slug/
 *   2. Registre em lib/patterns-data.ts (slug, title, category, icon, available: true)
 *   3. Escolha o tipo de página abaixo e remova o que não se aplica
 *   4. Crie o RunSection em components/algorithms/ ou use LogRunSection pronto
 *
 * ─── TIPOS DE PÁGINA ────────────────────────────────────────────────────────
 *
 * 📊 ALGORITMO (category="Algoritmo")
 *   - Inclua: complexities (4 métricas), steps, RunSection customizada
 *   - RunSection: em components/algorithms/XxxRunSection.tsx com JSON SSE
 *     Protocolo JSON: { type: "log"|"state"|"done", msg?, ...campos de estado }
 *   - Exemplo de referência: components/algorithms/BubbleSortRunSection.tsx
 *
 * 🧩 PADRÃO DE DESIGN (Criacional / Estrutural / Comportamental)
 *   - Omita: complexities e steps
 *   - Use LogRunSection diretamente (sem criar RunSection customizada)
 *   - Adicione seções inline em children: "Quando usar?" e "Participantes"
 *     Protocolo SSE texto puro: cada linha é um event.data; sentinela = "[DONE]"
 *   - Exemplo de referência: app/patterns/builder/page.tsx
 *
 * 📄 DEFAULT / INFORMACIONAL (Clean Code ou multi-conceito)
 *   - Omita: complexities, steps, API_URL e o RunSection placeholder
 *   - Para layouts totalmente customizados, não use AlgorithmLayout
 *     (veja app/patterns/solid/page.tsx como referência)
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

const csharpCode = `// Seu código C# aqui
public class Example 
{
    public void Run() 
    {
        Console.WriteLine("Hello World");
    }
}`;

const sources = [
  {
    label: "Documentação Exemplo",
    url: "https://example.com",
    icon: "🌐",
  },
];

const complexities = [
  { label: "Melhor caso", value: "O(?)", note: "detalhe", color: "text-emerald-400" },
  { label: "Caso médio", value: "O(?)", note: "detalhe", color: "text-orange-400" },
  { label: "Pior caso", value: "O(?)", note: "detalhe", color: "text-red-400" },
  { label: "Espaço", value: "O(?)", note: "detalhe", color: "text-blue-400" },
];

const steps = [
  "Passo 1 do algoritmo.",
  "Passo 2 do algoritmo.",
  "Passo 3 do algoritmo.",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function NewPatternPage() {
  return (
    <AlgorithmLayout
      title="Nome do Padrão"
      icon="✨"
      category="Algoritmo" // Verifique PatternCategory em lib/patterns-data.ts
      description="Descrição clara e concisa do que é este padrão ou algoritmo."
      complexities={complexities}
      steps={steps}
      sources={sources}
      code={csharpCode}
      codeDescription="Breve explicação sobre esta implementação específica."
    >
      <div className="flex flex-col gap-3">
        <p className="text-zinc-500 text-sm">
          Breve instrução sobre como usar a visualização abaixo.
        </p>
        
        {/*
          Aqui você deve inserir o seu componente de RunSection, 
          ex: <YourRunSection apiUrl={`${API_URL}/api/path/to/run`} />
        */}
        <div className="p-12 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600">
           Componente de Visualização será inserido aqui
        </div>
      </div>
    </AlgorithmLayout>
  );
}
