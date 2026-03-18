import { CodeSnippet } from "@/components/patterns/CodeSnippet";
import { SourceLinks } from "@/components/patterns/SourceLinks";
import { LogRunSection } from "@/components/patterns/LogRunSection";
import Link from "next/link";
import { categoryColors } from "@/lib/patterns-data";

const principles = [
  {
    letter: "S",
    name: "Single Responsibility",
    subtitle: "Uma classe, uma razão para mudar",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    letterBg: "bg-blue-600",
    description: (
      <>
        Cada classe deve ter <strong>apenas uma responsabilidade</strong>. Se uma classe faz cálculo,
        persistência <em>e</em> envio de email, ela tem 3 motivos para mudar — isso viola o SRP.
      </>
    ),
    bad: "InvoiceService calcula, salva e envia email — 3 responsabilidades numa classe.",
    good: "Invoice (calcula) · InvoicePrinter (formata) · InvoiceRepository (persiste)",
    code: `// ✗ Viola SRP — 3 responsabilidades
public class InvoiceService {
    public decimal Calculate() { ... }
    public void SaveToDatabase() { ... } // responsabilidade 2
    public void SendEmail() { ... }      // responsabilidade 3
}

// ✓ SRP — cada classe tem 1 razão para mudar
public class Invoice {
    public decimal Calculate() => Items * UnitPrice;
}
public class InvoicePrinter {
    public void Print(Invoice inv) { Console.WriteLine(inv); }
}
public class InvoiceRepository {
    public void Save(Invoice inv) { db.Invoices.Add(inv); }
}`,
  },
  {
    letter: "O",
    name: "Open/Closed",
    subtitle: "Aberta para extensão, fechada para modificação",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    letterBg: "bg-purple-600",
    description: (
      <>
        Entidades de software devem ser <strong>abertas para extensão</strong> (novas funcionalidades)
        mas <strong>fechadas para modificação</strong> (sem alterar código existente e testado).
      </>
    ),
    bad: "AreaCalculator com switch/if por tipo — adicionar Triangle exige modificar a classe.",
    good: "Interface IShape — cada forma implementa Area(). AreaCalculator nunca muda.",
    code: `// ✗ Viola OCP — adicionar Triangle exige editar AreaCalculator
public double TotalArea(object[] shapes) {
    foreach (var s in shapes)
        if (s is Circle c) total += Math.PI * c.R * c.R;
        else if (s is Rectangle r) total += r.W * r.H;
        // adicionar Triangle? edita aqui...
}

// ✓ OCP — novas formas sem tocar em AreaCalculator
public interface IShape { double Area(); }

public record Circle(double R) : IShape {
    public double Area() => Math.PI * R * R;
}
public record Triangle(double B, double H) : IShape {
    public double Area() => 0.5 * B * H;
}
public class AreaCalculator {
    public double TotalArea(IShape[] shapes) => shapes.Sum(s => s.Area());
}`,
  },
  {
    letter: "L",
    name: "Liskov Substitution",
    subtitle: "Subtipos devem substituir seus tipos base",
    color: "text-green-400 bg-green-500/10 border-green-500/30",
    letterBg: "bg-green-600",
    description: (
      <>
        Se <code className="bg-zinc-800 px-1 rounded text-sm">S</code> é subtipo de{" "}
        <code className="bg-zinc-800 px-1 rounded text-sm">T</code>, então objetos do tipo{" "}
        <code className="bg-zinc-800 px-1 rounded text-sm">T</code> podem ser substituídos por{" "}
        <code className="bg-zinc-800 px-1 rounded text-sm">S</code> sem quebrar o programa.
      </>
    ),
    bad: "Penguin herda Bird e tem Fly() que lança exceção — viola o contrato da classe base.",
    good: "Bird abstrata + interfaces IFlyable / ISwimmable. Eagle voa, Penguin nada, Duck faz os dois.",
    code: `// ✗ Viola LSP — Penguin não pode voar mas herda Fly()
public class Bird { public virtual void Fly() { } }
public class Penguin : Bird {
    public override void Fly() => throw new NotImplementedException(); // BOOM!
}

// ✓ LSP — hierarquia coesa com interfaces separadas
public abstract class Bird { public abstract string Describe(); }
public interface IFlyable  { double Fly(); }
public interface ISwimmable { double Swim(); }

public class Eagle   : Bird, IFlyable   { ... } // só voa
public class Penguin : Bird, ISwimmable { ... } // só nada
public class Duck    : Bird, IFlyable, ISwimmable { ... } // voa e nada`,
  },
  {
    letter: "I",
    name: "Interface Segregation",
    subtitle: "Interfaces específicas são melhores que uma geral",
    color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    letterBg: "bg-orange-600",
    description: (
      <>
        Nenhum cliente deve ser forçado a depender de métodos que não usa.{" "}
        <strong>Interfaces grandes</strong> devem ser quebradas em interfaces menores e coesas.
      </>
    ),
    bad: "IWorker com Work() + Eat() + Sleep() — Robot é obrigado a implementar Eat() e Sleep().",
    good: "IWorkable · IFeedable · IRestable — Robot implementa só IWorkable.",
    code: `// ✗ Viola ISP — Robot forçado a implementar Eat() e Sleep()
public interface IWorker {
    void Work();
    void Eat();   // robô não come
    void Sleep(); // robô não dorme
}

// ✓ ISP — interfaces segregadas por capacidade
public interface IWorkable { void Work(); }
public interface IFeedable { void Eat(); }
public interface IRestable { void Sleep(); }

public class RobotWorker : IWorkable {
    public void Work() { /* executa tarefas */ }
    // Eat e Sleep? não conhece nem sabe que existem
}
public class HumanWorker : IWorkable, IFeedable, IRestable {
    public void Work() { ... }
    public void Eat()  { ... }
    public void Sleep() { ... }
}`,
  },
  {
    letter: "D",
    name: "Dependency Inversion",
    subtitle: "Dependa de abstrações, não de implementações",
    color: "text-pink-400 bg-pink-500/10 border-pink-500/30",
    letterBg: "bg-pink-600",
    description: (
      <>
        Módulos de alto nível não devem depender de módulos de baixo nível.{" "}
        <strong>Ambos devem depender de abstrações.</strong> Abstrações não devem depender de detalhes.
      </>
    ),
    bad: "OrderService cria new StripePayment() — acoplado a uma implementação concreta.",
    good: "OrderService depende de IPaymentGateway — injeção de dependência via construtor.",
    code: `// ✗ Viola DIP — acoplado a StripePayment
public class OrderService {
    private StripePayment _payment = new StripePayment(); // concreto!
    public void PlaceOrder(decimal total) => _payment.Charge(total);
}

// ✓ DIP — depende da abstração IPaymentGateway
public interface IPaymentGateway {
    string Charge(decimal amount);
}
public class StripeGateway  : IPaymentGateway { ... }
public class PayPalGateway  : IPaymentGateway { ... }

public class OrderService(IPaymentGateway gateway) {
    public void PlaceOrder(decimal total) => gateway.Charge(total);
    // Trocar Stripe por PayPal? Zero linhas alteradas aqui.
}`,
  },
];

const sources = [
  {
    label: "Refactoring.Guru",
    url: "https://refactoring.guru/solid",
    icon: "📖",
  },
  {
    label: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/SOLID",
    icon: "🌐",
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default async function SolidPage() {
  // Pre-render all code snippets server-side
  const { codeToHtml } = await import("shiki");
  const renderedCodes = await Promise.all(
    principles.map((p) =>
      codeToHtml(p.code, { lang: "csharp", theme: "github-dark" })
    )
  );

  return (
    <div className="flex flex-col gap-10 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300 transition-colors">Padrões</Link>
        <span>/</span>
        <span className="text-zinc-300">Princípios SOLID</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🧱</span>
          <div>
            <h1 className="text-3xl font-bold text-white">Princípios SOLID</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryColors["Clean Code"]}`}>
              Clean Code
            </span>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="font-semibold text-white text-lg">O que é?</h2>
          <p className="text-zinc-400 leading-relaxed mt-2">
            SOLID é um acrônimo para cinco princípios de design orientado a objetos introduzidos por{" "}
            <strong className="text-zinc-200">Robert C. Martin (Uncle Bob)</strong>. Seguir esses princípios
            resulta em código mais <strong className="text-zinc-200">flexível, testável e manutenível</strong>.
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            {principles.map((p) => (
              <span key={p.letter} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm ${p.color}`}>
                <span className={`w-5 h-5 rounded text-white text-xs font-bold flex items-center justify-center ${p.letterBg}`}>
                  {p.letter}
                </span>
                {p.name}
              </span>
            ))}
          </div>
        </div>

        <SourceLinks sources={sources} />
      </div>

      {/* One section per principle */}
      {principles.map((p, i) => (
        <div key={p.letter} className="flex flex-col gap-4">
          <div className={`flex items-start gap-4 p-5 rounded-xl border ${p.color}`}>
            <span className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xl ${p.letterBg}`}>
              {p.letter}
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
              <span className="text-xs text-zinc-600">{p.letter} — {p.name}</span>
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
          Executa todos os 5 princípios no backend .NET — instancia as classes e demonstra o comportamento correto de cada um.
        </p>
        <LogRunSection
          apiUrl={`${API_URL}/api/principles/solid/run`}
          buttonLabel="▶ Executar todos os princípios"
          accentColor="violet"
        />
      </div>
    </div>
  );
}
