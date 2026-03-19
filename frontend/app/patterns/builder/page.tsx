import { BuilderRunSection } from "@/components/patterns/BuilderRunSection";
import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";

const csharpCode = `// ── Produto ────────────────────────────────────────────
public class Computer
{
    public string CPU { get; set; } = "";
    public string GPU { get; set; } = "";
    public string RAM { get; set; } = "";
    public string Storage { get; set; } = "";
    public string OperatingSystem { get; set; } = "";

    public string Describe() =>
        $"CPU={CPU} | GPU={GPU} | RAM={RAM} | Storage={Storage} | OS={OperatingSystem}";
}

// ── Interface do Builder ────────────────────────────────
public interface IComputerBuilder
{
    IComputerBuilder SetCPU(string cpu);
    IComputerBuilder SetGPU(string gpu);
    IComputerBuilder SetRAM(string ram);
    IComputerBuilder SetStorage(string storage);
    IComputerBuilder SetOS(string os);
    Computer Build();
}

// ── Builder Concreto ────────────────────────────────────
public class GamingComputerBuilder : IComputerBuilder
{
    private readonly Computer _computer = new();

    public IComputerBuilder SetCPU(string cpu)     { _computer.CPU = cpu; return this; }
    public IComputerBuilder SetGPU(string gpu)     { _computer.GPU = gpu; return this; }
    public IComputerBuilder SetRAM(string ram)     { _computer.RAM = ram; return this; }
    public IComputerBuilder SetStorage(string s)   { _computer.Storage = s; return this; }
    public IComputerBuilder SetOS(string os)       { _computer.OperatingSystem = os; return this; }
    public Computer Build() => _computer;
}

// ── Director ───────────────────────────────────────────
public class ComputerDirector(IComputerBuilder builder)
{
    public void BuildGamingComputer()
    {
        builder
            .SetCPU("Intel Core i9-14900K")
            .SetGPU("NVIDIA RTX 4090")
            .SetRAM("64GB DDR5-6000")
            .SetStorage("SSD NVMe 2TB")
            .SetOS("Windows 11 Pro");
    }
}

// ── Uso ────────────────────────────────────────────────
var builder = new GamingComputerBuilder();
var director = new ComputerDirector(builder);

director.BuildGamingComputer();

var computer = builder.Build();
Console.WriteLine(computer.Describe());
// CPU=Intel Core i9-14900K | GPU=NVIDIA RTX 4090 | ...`;

const sources = [
  {
    label: "Refactoring.Guru",
    url: "https://refactoring.guru/design-patterns/builder",
    icon: "📖",
  },
  {
    label: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Builder_pattern",
    icon: "🌐",
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function BuilderPage() {
  return (
    <AlgorithmLayout
      title="Builder"
      icon="Hammer"
      category="Criacional"
      description="O Builder é um padrão de design criacional que separa a construção de um objeto complexo de sua representação final. Isso permite que o mesmo processo de construção possa criar diferentes representações."
      sources={sources}
      code={csharpCode}
      codeDescription="Implementação em C# (.NET 10) — o mesmo código executado pelo backend abaixo."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-white text-lg">Quando usar?</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
            <li>Quando a criação de um objeto envolve muitos parâmetros opcionais.</li>
            <li>Quando você quer evitar construtores com muitos argumentos (telescoping constructor).</li>
            <li>Quando diferentes representações de um produto precisam ser construídas passo a passo.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-white text-lg">Participantes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { role: "Product", desc: "O objeto complexo sendo construído (Computer)." },
              { role: "Builder (Interface)", desc: "Define os passos de construção." },
              { role: "ConcreteBuilder", desc: "Implementa os passos e guarda o estado parcial." },
              { role: "Director", desc: "Orquestra os passos de construção usando o Builder." },
            ].map(({ role, desc }) => (
              <div key={role} className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                <span className="font-medium text-zinc-200">{role}</span>
                <p className="text-zinc-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-white text-xl">Executar no Backend</h2>
          <p className="text-zinc-500 text-sm">
            Clique para executar o código no servidor .NET e acompanhar os logs em tempo real via{" "}
            <span className="text-zinc-400 font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded">SSE</span>.
          </p>
          <BuilderRunSection apiUrl={`${API_URL}/api/patterns/builder/run`} />
        </div>
      </div>
    </AlgorithmLayout>
  );
}
