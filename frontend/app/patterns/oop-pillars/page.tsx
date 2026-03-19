import { CodeSnippet } from "@/components/patterns/CodeSnippet";
import { SourceLinks } from "@/components/patterns/SourceLinks";
import { LogRunSection } from "@/components/patterns/LogRunSection";
import Link from "next/link";
import { getCategoryColor } from "@/lib/category-colors";
import { Icon } from "@/components/ui/Icon";

const pillars = [
  {
    number: "1",
    name: "Encapsulamento",
    subtitle: "Protege o estado interno, expõe apenas o necessário",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    numberBg: "bg-blue-600",
    description: (
      <>
        O objeto <strong>controla seu próprio estado</strong> — campos internos são
        privados e só podem ser alterados por métodos que validam as regras de negócio.
        Elimina estados inválidos e concentra a lógica onde ela pertence.
      </>
    ),
    bad: "Campo public balance — qualquer código pode setar -99999 sem validação.",
    good: "BankAccount com _balance privado: Deposit/Withdraw validam antes de alterar.",
    code: `// ✗ Sem encapsulamento — estado exposto, sem proteção
public class BankAccountBad
{
    public decimal Balance; // qualquer um pode corromper
}
var bad = new BankAccountBad();
bad.Balance = -99999; // nenhuma regra de negócio aplicada

// ✓ Encapsulamento — estado privado, acesso controlado
public class BankAccount(string owner)
{
    private decimal _balance;

    public void Deposit(decimal amount)
    {
        if (amount <= 0) throw new ArgumentException("Valor inválido");
        _balance += amount;
    }

    public bool Withdraw(decimal amount)
    {
        if (amount > _balance) return false; // invariante garantida
        _balance -= amount;
        return true;
    }

    public decimal Balance => _balance; // somente leitura
}

var account = new BankAccount("Ana");
account.Deposit(1000);
account.Withdraw(250);
Console.WriteLine(account.Balance); // 750
// account._balance = -99999;       // erro de compilação ✓`,
  },
  {
    number: "2",
    name: "Abstração",
    subtitle: "Esconde o 'como', expõe apenas o 'o quê'",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    numberBg: "bg-purple-600",
    description: (
      <>
        A abstração define <strong>contratos de alto nível</strong> — classes abstratas
        e interfaces expõem <em>o que</em> pode ser feito, sem revelar{" "}
        <em>como</em> é implementado. O cliente depende da abstração, não dos detalhes.
      </>
    ),
    bad: "Cliente calcula 3.14159 * r * r diretamente — conhece a fórmula de cada forma.",
    good: "Shape abstrata com Area() — cliente chama Area() sem saber a fórmula usada.",
    code: `// ✗ Sem abstração — cliente precisa conhecer cada fórmula
double circleArea    = 3.14159 * r * r;
double rectangleArea = w * h;
double triangleArea  = 0.5 * b * h; // cliente sabe demais

// ✓ Abstração — esconde implementação por trás de contrato
public abstract class Shape
{
    public abstract string Name { get; }
    public abstract double Area();
    public override string ToString() => $"{Name}: área = {Area():F2}";
}

public class Circle(double radius) : Shape
{
    public override string Name => "Círculo";
    public override double Area() => Math.PI * radius * radius;
}

public class Rectangle(double w, double h) : Shape
{
    public override string Name => "Retângulo";
    public override double Area() => w * h;
}

public class Triangle(double b, double h) : Shape
{
    public override string Name => "Triângulo";
    public override double Area() => 0.5 * b * h;
}

Shape[] shapes = [new Circle(5), new Rectangle(4, 6), new Triangle(3, 8)];
foreach (var s in shapes)
    Console.WriteLine(s); // cliente não sabe nada das fórmulas`,
  },
  {
    number: "3",
    name: "Herança",
    subtitle: "Reutiliza e especializa comportamentos sem duplicação",
    color: "text-green-400 bg-green-500/10 border-green-500/30",
    numberBg: "bg-green-600",
    description: (
      <>
        Herança permite que uma classe <strong>reutilize código de sua classe base</strong>{" "}
        e <strong>sobrescreva ou estenda</strong> o que precisa ser diferente.
        Evita duplicação, mas deve ser usada com cuidado — prefira composição
        quando a relação não for claramente &ldquo;é um&rdquo;.
      </>
    ),
    bad: "Car, Truck e Motorcycle cada um com brand, year e Start() duplicados.",
    good: "Vehicle com lógica comum; filhos sobrescrevem apenas o que é específico.",
    code: `// ✗ Sem herança — Model/Year/Start() duplicados em cada classe
public class CarBad        { public string Model; public int Year; public void Start() { } }
public class MotorcycleBad { public string Model; public int Year; public void Start() { } }
public class TruckBad      { public string Model; public int Year; public void Start() { } }

// ✓ Herança — lógica comum na base, especialização nos filhos
public abstract class Vehicle(string model, int year)
{
    public string Model { get; } = model;
    public int Year     { get; } = year;
    public abstract string Type { get; }
    public virtual string Start() => $"{Type}: {Model} ({Year}) — motor ligado";
}

public class Car(string model, int year, int doors) : Vehicle(model, year)
{
    public override string Type => "Carro";
    public override string Start() => base.Start() + $" | {doors} portas";
}

public class Motorcycle(string model, int year) : Vehicle(model, year)
{
    public override string Type => "Moto";
    public override string Start() => base.Start() + " | vroom!";
}

public class Truck(string model, int year, int tons) : Vehicle(model, year)
{
    public override string Type => "Caminhão";
    public override string Start() => base.Start() + $" | {tons}t de carga";
}

Vehicle[] fleet = [new Car("Toyota", 2024, 4), new Motorcycle("Honda", 2023), new Truck("Volvo", 2022, 18)];
foreach (var v in fleet)
    Console.WriteLine(v.Start());`,
  },
  {
    number: "4",
    name: "Polimorfismo",
    subtitle: "Mesma interface, comportamentos distintos em runtime",
    color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    numberBg: "bg-orange-600",
    description: (
      <>
        Polimorfismo permite que <strong>o mesmo código trabalhe com tipos diferentes</strong>{" "}
        de forma transparente. Em C# é realizado via{" "}
        <code className="bg-zinc-800 px-1 rounded text-sm">virtual/override</code>,
        interfaces e genéricos. Elimina if/switch por tipo e torna o sistema extensível.
      </>
    ),
    bad: "if (type == \"Dog\") ... else if (type == \"Cat\") — adicionar Cow exige editar o código.",
    good: "Animal[] com Sound() — mesmo laço, dispatch automático para cada implementação.",
    code: `// ✗ Sem polimorfismo — if/switch por tipo, não escala
void MakeNoise(string animalType)
{
    if      (animalType == "Dog") Console.WriteLine("Au!");
    else if (animalType == "Cat") Console.WriteLine("Miau!");
    // adicionar Cow? edita aqui, e em todo lugar que usa isso...
}

// ✓ Polimorfismo — mesma chamada, comportamento correto em runtime
public abstract class Animal(string name)
{
    public string Name { get; } = name;
    public abstract string Sound();
    public override string ToString() => $"{GetType().Name}({Name}): {Sound()}";
}

public class Dog(string name) : Animal(name) { public override string Sound() => "Au au!"; }
public class Cat(string name) : Animal(name) { public override string Sound() => "Miau!"; }
public class Cow(string name) : Animal(name) { public override string Sound() => "Muuu!"; }

// Adicionar Parrot? Só criar a classe — zero mudanças no laço abaixo
Animal[] animals = [new Dog("Rex"), new Cat("Mimi"), new Cow("Mimosa"), new Dog("Buddy")];
foreach (var a in animals)
    Console.WriteLine(a); // dispatch para a implementação correta em runtime`,
  },
];

const sources = [
  {
    label: "Microsoft — C# OOP",
    url: "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/",
    icon: "📖",
  },
  {
    label: "Wikipedia — OOP",
    url: "https://en.wikipedia.org/wiki/Object-oriented_programming",
    icon: "🌐",
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default async function OopPillarsPage() {
  const { codeToHtml } = await import("shiki");
  const renderedCodes = await Promise.all(
    pillars.map((p) =>
      codeToHtml(p.code, { lang: "csharp", theme: "github-dark" })
    )
  );

  return (
    <div className="flex flex-col gap-10 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300 transition-colors">Padrões</Link>
        <span>/</span>
        <span className="text-zinc-300">4 Pilares da POO</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Icon name="BookOpen" size={40} strokeWidth={1.5} className="text-zinc-300 shrink-0" />
          <div>
            <h1 className="text-3xl font-bold text-white">4 Pilares da POO</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getCategoryColor("Clean Code")}`}>
              Clean Code
            </span>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="font-semibold text-white text-lg">O que é?</h2>
          <p className="text-zinc-400 leading-relaxed mt-2">
            A <strong className="text-zinc-200">Programação Orientada a Objetos (POO)</strong> organiza
            o software em torno de objetos que encapsulam dados e comportamento. Seus quatro pilares
            fundamentais — definidos por <strong className="text-zinc-200">Alan Kay</strong> e
            consolidados pela comunidade — são a base para código{" "}
            <strong className="text-zinc-200">modular, reutilizável e manutenível</strong>.
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            {pillars.map((p) => (
              <span key={p.number} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm ${p.color}`}>
                <span className={`w-5 h-5 rounded text-white text-xs font-bold flex items-center justify-center ${p.numberBg}`}>
                  {p.number}
                </span>
                {p.name}
              </span>
            ))}
          </div>
        </div>

        <SourceLinks sources={sources} />
      </div>

      {/* One section per pillar */}
      {pillars.map((p, i) => (
        <div key={p.number} className="flex flex-col gap-4">
          <div className={`flex items-start gap-4 p-5 rounded-xl border ${p.color}`}>
            <span className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xl ${p.numberBg}`}>
              {p.number}
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="font-bold text-white text-lg">{p.name}</h2>
              <p className="text-zinc-500 text-sm italic">{p.subtitle}</p>
              <p className="text-zinc-400 leading-relaxed mt-1">{p.description}</p>
              <div className="mt-2 flex flex-col gap-1 text-sm">
                <span className="text-red-400 flex gap-2"><span>✗</span><span>{p.bad}</span></span>
                <span className="text-emerald-400 flex gap-2"><span>✓</span><span>{p.good}</span></span>
              </div>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-zinc-700 text-sm leading-relaxed">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">csharp</span>
              <span className="text-xs text-zinc-600">{p.number} — {p.name}</span>
            </div>
            <div
              className="overflow-auto p-4 bg-zinc-900"
              dangerouslySetInnerHTML={{ __html: renderedCodes[i] }}
            />
          </div>
        </div>
      ))}

      {/* Run all */}
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-white text-xl">Demonstração Completa</h2>
        <p className="text-zinc-500 text-sm">
          Executa todos os 4 pilares no backend .NET — instancia as classes de exemplo e demonstra
          o comportamento correto de cada um.
        </p>
        <LogRunSection
          apiUrl={`${API_URL}/api/principles/oop-pillars/run`}
          buttonLabel="▶ Executar todos os pilares"
          accentColor="violet"
        />
      </div>
    </div>
  );
}
