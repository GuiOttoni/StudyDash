import { SourceLinks } from "@/components/patterns/SourceLinks";
import { LogRunSection } from "@/components/patterns/LogRunSection";
import Link from "next/link";
import { getCategoryColor } from "@/lib/category-colors";
import { Icon } from "@/components/ui/Icon";

const principles = [
  {
    abbr: "IE",
    name: "Information Expert",
    subtitle: "Atribua a responsabilidade a quem tem a informação",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    abbrBg: "bg-blue-600",
    description: (
      <>
        Atribua a responsabilidade à classe que possui{" "}
        <strong>a informação necessária para cumpri-la</strong>. Evita que uma
        classe precise pedir dados de outra para realizar um cálculo que poderia
        fazer por conta própria — reduzindo acoplamento e expondo comportamento
        onde ele naturalmente pertence.
      </>
    ),
    bad: "PaymentService calcula o total da Invoice — precisa conhecer a estrutura interna dos itens.",
    good: "Invoice tem os itens, logo Invoice.Total() é o Information Expert.",
    code: `// ✗ Viola IE — PaymentService calcula o total mas não tem os dados
class PaymentServiceBad {
    public decimal TotalOf(List<OrderLine> lines) =>
        lines.Sum(l => l.Price * l.Qty); // acessa estrutura alheia
}

// ✓ Information Expert — Invoice tem os itens; ela é responsável pelo total
public record OrderLine(string Name, decimal Price, int Qty)
{
    public decimal Subtotal => Price * Qty;
}

public class Invoice
{
    private readonly List<OrderLine> _lines = [];
    public void    Add(OrderLine l) => _lines.Add(l);
    public decimal Total()          => _lines.Sum(l => l.Subtotal); // ← Expert
    public string  Summary          => $"{_lines.Count} itens — R$ {Total():F2}";
}

var inv = new Invoice();
inv.Add(new OrderLine("Livro C#",  89.90m, 2));
inv.Add(new OrderLine("Mouse",    149.50m, 1));
Console.WriteLine(inv.Summary);  // 2 itens — R$ 329,30
// A classe com a informação é quem processa — sem vazar dados para fora`,
  },
  {
    abbr: "Cr",
    name: "Creator",
    subtitle: "Deixe o agregador criar seus componentes",
    color: "text-violet-400 bg-violet-500/10 border-violet-500/30",
    abbrBg: "bg-violet-600",
    description: (
      <>
        A classe <strong>B deve criar instâncias de A</strong> se B agrega, contém,
        registra ou usa fortemente A — ou se B tem os dados para inicializar A.
        Centraliza a criação onde ela naturalmente faz sentido e permite que o
        agregador garanta as invariantes dos seus componentes.
      </>
    ),
    bad: "Código externo cria OrderLine e injeta em Order sem qualquer validação.",
    good: "Order agrega OrderLine → Order.AddLine() cria, valida e controla suas linhas.",
    code: `// ✗ Viola Creator — código externo cria OrderLine sem validação
var bad = new OrderLine("", -10m, 0); // sem restrições
order.Lines.Add(bad);                 // Order não tem controle

// ✓ Creator — Order agrega OrderLine; Order é responsável por criá-las
public class Order
{
    private readonly List<OrderLine> _lines = [];
    public IReadOnlyList<OrderLine> Lines => _lines;
    public decimal Total => _lines.Sum(l => l.Subtotal);

    // Order cria, valida e controla o ciclo de vida de suas linhas
    public void AddLine(string name, decimal price, int qty)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        if (price <= 0) throw new ArgumentException("Preço inválido");
        if (qty   <= 0) throw new ArgumentException("Quantidade inválida");
        _lines.Add(new OrderLine(name, price, qty));
    }
}

var order = new Order();
order.AddLine("Notebook",  2999.90m, 1);
order.AddLine("Carregador", 199.90m, 2);
Console.WriteLine(order.Total); // 3399.70 — criado e validado pela Order`,
  },
  {
    abbr: "Ct",
    name: "Controller",
    subtitle: "Use um objeto dedicado para receber eventos de sistema",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    abbrBg: "bg-emerald-600",
    description: (
      <>
        Eventos de sistema (requests, mensagens, comandos) devem ser recebidos
        por um <strong>Controller dedicado</strong> — não diretamente pela UI ou
        pelo domínio. O Controller orquestra sem implementar: recebe o evento,
        delega ao serviço de domínio e devolve a resposta.
      </>
    ),
    bad: "Lógica de negócio (criar pedido, salvar, notificar) diretamente no endpoint HTTP.",
    good: "CheckoutController recebe o evento e delega ao OrderService — endpoint é mínimo.",
    code: `// ✗ Viola Controller — lógica de domínio dentro do endpoint
app.MapPost("/checkout", async (CartDto dto, AppDbContext db, IMailer mail) =>
{
    var order = new Order(dto.Items);   // domínio
    db.Orders.Add(order);              // infraestrutura
    await db.SaveChangesAsync();
    await mail.Send(dto.Email, "Confirmado!"); // comunicação
    return Results.Ok(order.Id);
    // endpoint faz tudo — mistura de camadas
});

// ✓ Controller — recebe o evento, orquestra e delega; endpoint é fino
public class CheckoutController(IOrderService orderSvc)
{
    // Responsabilidade: receber o evento "checkout solicitado"
    public async Task<OrderResult> Checkout(CartDto dto) =>
        await orderSvc.CreateOrderAsync(dto);
}

// Endpoint só conhece o Controller
app.MapPost("/checkout", async (CartDto dto, CheckoutController ctrl) =>
    Results.Ok(await ctrl.Checkout(dto)));`,
  },
  {
    abbr: "LC",
    name: "Low Coupling",
    subtitle: "Minimize dependências entre classes",
    color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    abbrBg: "bg-orange-600",
    description: (
      <>
        Classes com <strong>baixo acoplamento</strong> têm poucas dependências,
        são mais fáceis de reutilizar e menos impactadas por mudanças externas.
        Dependa de <strong>abstrações</strong> (interfaces), não de implementações
        concretas — e injete as dependências em vez de instanciá-las internamente.
      </>
    ),
    bad: "OrderService cria new StripePayment() e new SmtpMailer() — acoplado a implementações.",
    good: "OrderService depende de IPaymentGateway e IMailSender — trocar implementações é transparente.",
    code: `// ✗ Alto Acoplamento — OrderService depende de implementações concretas
class OrderServiceBad
{
    private readonly StripePayment _stripe = new(); // concreto!
    private readonly SmtpMailer    _mailer = new(); // concreto!
    public void Place(Order o)
    {
        _stripe.Charge(o.Total);      // mudar para PayPal? edita aqui
        _mailer.Send(o.Email, "OK!"); // mudar para SendGrid? edita aqui
    }
}

// ✓ Low Coupling — depende de abstrações; implementações chegam via DI
public interface IPaymentGateway { string Charge(decimal amount); }
public interface IMailSender     { string Send(string to, string body); }

public class StripeGateway  : IPaymentGateway { public string Charge(decimal a) => $"Stripe: R$ {a:F2} ✓"; }
public class PayPalGateway  : IPaymentGateway { public string Charge(decimal a) => $"PayPal: R$ {a:F2} ✓"; }
public class SmtpSender     : IMailSender     { public string Send(string to, string b) => $"SMTP→{to}"; }
public class SendGridSender : IMailSender     { public string Send(string to, string b) => $"SG→{to}"; }

public class OrderService(IPaymentGateway payment, IMailSender mail)
{
    public void Place(Order o)
    {
        Console.WriteLine(payment.Charge(o.Total));
        Console.WriteLine(mail.Send(o.Email, "Confirmado!"));
    }
    // Trocar gateway ou mailer? Zero mudanças aqui ✓
}`,
  },
  {
    abbr: "HC",
    name: "High Cohesion",
    subtitle: "Responsabilidades de uma classe devem ser fortemente relacionadas",
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    abbrBg: "bg-cyan-600",
    description: (
      <>
        Uma classe com <strong>alta coesão</strong> tem um propósito único e bem
        definido — todas as suas responsabilidades colaboram para o mesmo objetivo.
        Baixa coesão resulta em classes difíceis de entender, manter e reutilizar.
        Geralmente anda de mãos dadas com Low Coupling.
      </>
    ),
    bad: "OrderGod: calcula total, persiste, envia email, gera PDF e valida estoque — 5 razões para mudar.",
    good: "Order (domínio), OrderRepository (persistência), OrderMailer (notificação) — 1 razão cada.",
    code: `// ✗ Baixa Coesão — OrderGod acumula responsabilidades não relacionadas
class OrderGod
{
    public decimal Calculate()      { /* regra de negócio    */ return 0; }
    public void    SaveToDatabase() { /* infraestrutura       */ }
    public void    SendEmail()      { /* comunicação          */ }
    public byte[]  GeneratePdf()    { /* geração de relatório */ return []; }
    public bool    CheckStock()     { /* domínio de estoque   */ return true; }
    // 5 razões para mudar = 5 responsabilidades = baixa coesão
}

// ✓ High Cohesion — cada classe tem um propósito único e coeso
public class Order
{
    public List<OrderLine> Lines { get; } = [];
    public decimal Total => Lines.Sum(l => l.Subtotal); // só modela o domínio
}

// Cada classe muda por apenas 1 razão ✓
public class PriceCalculator { public decimal Calculate(Order o) => o.Total; }
public class OrderRepository { public void    Save(Order o) { /* só persiste   */ } }
public class OrderMailer     { public void    Confirm(Order o) { /* só notifica */ } }
public class PdfExporter     { public byte[]  Export(Order o) => []; /* só PDF  */ }
public class StockChecker    { public bool    IsAvailable(Order o) => true; }`,
  },
  {
    abbr: "Po",
    name: "Polymorphism",
    subtitle: "Use polimorfismo em vez de condicionais para variação por tipo",
    color: "text-pink-400 bg-pink-500/10 border-pink-500/30",
    abbrBg: "bg-pink-600",
    description: (
      <>
        Quando comportamentos variam por tipo, use{" "}
        <strong>polimorfismo</strong> — não{" "}
        <code className="bg-zinc-800 px-1 rounded text-sm">if/switch</code>.
        Cada variação encapsula sua própria lógica; adicionar um novo tipo
        significa criar uma nova classe, sem alterar o código existente.
        É uma especialização do princípio OCP do SOLID.
      </>
    ),
    bad: "switch por tipo de desconto — adicionar 'Seasonal' exige editar o método.",
    good: "IDiscount — PercentageDiscount, FixedDiscount, VipDiscount cada um implementa Apply().",
    code: `// ✗ Viola Polymorphism GRASP — switch cresce a cada novo tipo de desconto
decimal Discount(string type, decimal total) => type switch
{
    "Pct10" => total * 0.90m,
    "Fixed" => total - 20m,
    "Vip"   => total * 0.75m,
    _       => total
}; // adicionar "Seasonal"? edita aqui e em todo lugar que usa isso...

// ✓ Polymorphism GRASP — cada tipo encapsula sua própria variação
public interface IDiscount
{
    string  Name          { get; }
    decimal Apply(decimal total);
}

public record PercentageDiscount(double Rate) : IDiscount
{
    public string  Name             => $"{Rate * 100:F0}% de desconto";
    public decimal Apply(decimal t) => t * (1 - (decimal)Rate);
}
public record FixedDiscount(decimal Amount) : IDiscount
{
    public string  Name             => $"R$ {Amount:F2} fixo";
    public decimal Apply(decimal t) => Math.Max(0, t - Amount);
}
public record VipDiscount() : IDiscount
{
    public string  Name             => "VIP 25%";
    public decimal Apply(decimal t) => t * 0.75m;
}

// Adicionar SeasonalDiscount? Só cria a classe — zero mudanças aqui ✓
IDiscount[] discounts = [new PercentageDiscount(0.10), new FixedDiscount(20), new VipDiscount()];
foreach (var d in discounts)
    Console.WriteLine($"{d.Name,-20} R$ 500 → R$ {d.Apply(500m):F2}");`,
  },
  {
    abbr: "PF",
    name: "Pure Fabrication",
    subtitle: "Crie classes artificiais para responsabilidades técnicas coesas",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    abbrBg: "bg-amber-600",
    description: (
      <>
        Quando nenhuma classe de domínio é uma boa candidata para uma
        responsabilidade técnica (persistência, logging, cache), crie uma{" "}
        <strong>classe artificial coesa</strong> — a{" "}
        <em>Pure Fabrication</em>. Ela não representa nada do mundo real do
        negócio, mas resolve o problema de forma focada sem contaminar as
        entidades de domínio.
      </>
    ),
    bad: "Product.Save(db) — entidade de domínio acoplada ao banco de dados.",
    good: "ProductRepository: fabricação pura que mantém Product limpo e focado no domínio.",
    code: `// ✗ Viola Pure Fabrication — domínio acoplado à infraestrutura
public class ProductBad
{
    public string  Name  { get; set; } = "";
    public decimal Price { get; set; }
    // Entidade de domínio não deveria saber de banco de dados
    public void Save(DbContext db) { db.Set<ProductBad>().Add(this); db.SaveChanges(); }
}

// ✓ Pure Fabrication — ProductRepository: classe artificial para persistência
public record Product(string Name, decimal Price); // ← domínio puro, sem infraestrutura

// ProductRepository não existe no mundo real do negócio —
// é uma fabricação que resolve a persistência de forma coesa e isolada
public class ProductRepository
{
    private readonly Dictionary<Guid, Product> _store = [];

    public Guid      Save(Product p)  { var id = Guid.NewGuid(); _store[id] = p; return id; }
    public Product?  Find(Guid id)    => _store.GetValueOrDefault(id);
    public List<Product> All()        => [.. _store.Values];
}

var repo = new ProductRepository();
var id   = repo.Save(new Product("Notebook", 2999.90m));
Console.WriteLine(repo.Find(id)); // Product { Name = Notebook, Price = 2999,9 }
// Product não sabe nada de banco; Repository cuida disso de forma coesa ✓`,
  },
  {
    abbr: "In",
    name: "Indirection",
    subtitle: "Introduza um intermediário para evitar acoplamento direto",
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    abbrBg: "bg-indigo-600",
    description: (
      <>
        Quando duas classes precisariam se conhecer diretamente, introduza um{" "}
        <strong>objeto intermediário</strong> (mediator, bus, gateway, adapter)
        que as desacopla. O Publisher publica para o intermediário; os Subscribers
        escutam o intermediário — nenhum conhece o outro. É a base de Event-Driven
        Architecture, CQRS e padrões como Mediator e Facade.
      </>
    ),
    bad: "PaymentService(StockService, MailService, AuditService) — 3 dependências diretas.",
    good: "EventBus medeia Publisher e Subscribers — PaymentService só conhece o bus.",
    code: `// ✗ Viola Indirection — PaymentService acoplado a múltiplos serviços
class PaymentServiceBad(StockService stock, MailService mail, AuditService audit)
{
    public void Process(Order o)
    {
        stock.Reserve(o); // acoplado
        mail.Confirm(o);  // acoplado
        audit.Log(o);     // acoplado — adicionar LogService? edita aqui
    }
}

// ✓ Indirection — EventBus é o intermediário; Publisher não conhece Subscribers
public class EventBus
{
    private readonly List<Action<object>> _handlers = [];
    public void Subscribe<T>(Action<T> h) => _handlers.Add(e => { if (e is T t) h(t); });
    public void Publish<T>(T @event)       => _handlers.ForEach(h => h(@event!));
}

record OrderPaidEvent(int OrderId, decimal Total, string Email);

var bus = new EventBus();
bus.Subscribe<OrderPaidEvent>(e => Console.WriteLine($"[Stock]  reserva #{e.OrderId}"));
bus.Subscribe<OrderPaidEvent>(e => Console.WriteLine($"[Mail]   confirma → {e.Email}"));
bus.Subscribe<OrderPaidEvent>(e => Console.WriteLine($"[Audit]  R$ {e.Total:F2} auditado"));

// PaymentService só conhece o bus — zero acoplamento com os handlers
class PaymentService(EventBus bus)
{
    public void Process(Order o) =>
        bus.Publish(new OrderPaidEvent(o.Id, o.Total, o.Email));
}
// Adicionar LogHandler? Só Subscribe — PaymentService não muda ✓`,
  },
  {
    abbr: "PV",
    name: "Protected Variations",
    subtitle: "Proteja o sistema de pontos de variação com interfaces estáveis",
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    abbrBg: "bg-rose-600",
    description: (
      <>
        Identifique pontos onde a variação é prevista (provedores de storage,
        gateways de pagamento, bibliotecas de logging) e envolva-os com{" "}
        <strong>interfaces estáveis</strong>. O código que usa a interface
        nunca precisa ser alterado quando a implementação muda.
        É a base do Princípio Aberto/Fechado (OCP) do SOLID.
      </>
    ),
    bad: "ReportService usa File.WriteAllBytes diretamente — migrar para S3 exige editar em todo lugar.",
    good: "IStorageProvider: ponto estável de variação — ReportService nunca muda ao trocar provedor.",
    code: `// ✗ Viola PV — acoplado diretamente ao sistema de arquivos
class ReportServiceBad
{
    public void Export(string name, byte[] data)
        => File.WriteAllBytes(name, data); // migrar para S3? edita em todo lugar
}

// ✓ Protected Variations — IStorageProvider é o ponto estável de variação
public interface IStorageProvider
{
    void Save(string name, byte[] data);
}

public class LocalStorage : IStorageProvider
{
    public void Save(string name, byte[] data)
        => Console.WriteLine($"[Local] {name} ({data.Length:N0}B) → C:\\Storage\\");
}

public class S3Storage(string bucket) : IStorageProvider
{
    public void Save(string name, byte[] data)
        => Console.WriteLine($"[S3]    {name} ({data.Length:N0}B) → s3://{bucket}/");
}

// ReportService nunca muda ao trocar de provedor
public class ReportService(IStorageProvider storage)
{
    public void Export(string name) => storage.Save(name, new byte[2_400]);
}

new ReportService(new LocalStorage()).Export("relatorio.pdf");
new ReportService(new S3Storage("meu-bucket")).Export("relatorio.pdf");
// Trocar provedor = trocar injeção, zero mudanças no ReportService ✓`,
  },
];

const sources = [
  {
    label: "Craig Larman — Applying UML and Patterns",
    url: "https://www.craiglarman.com/wiki/index.php?title=Book_Applying_UML_and_Patterns",
    icon: "📖",
  },
  {
    label: "Wikipedia — GRASP",
    url: "https://en.wikipedia.org/wiki/GRASP_(object-oriented_design)",
    icon: "🌐",
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default async function GraspPage() {
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
        <span className="text-zinc-300">Princípios GRASP</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Icon name="Target" size={40} strokeWidth={1.5} className="text-zinc-300 shrink-0" />
          <div>
            <h1 className="text-3xl font-bold text-white">Princípios GRASP</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getCategoryColor("Clean Code")}`}>
              Clean Code
            </span>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="font-semibold text-white text-lg">O que é?</h2>
          <p className="text-zinc-400 leading-relaxed mt-2">
            <strong className="text-zinc-200">GRASP</strong> (General Responsibility Assignment
            Software Patterns) é um conjunto de 9 princípios definidos por{" "}
            <strong className="text-zinc-200">Craig Larman</strong> no livro{" "}
            <em>Applying UML and Patterns</em>. Diferente de padrões de implementação
            (GoF), GRASP foca em{" "}
            <strong className="text-zinc-200">como atribuir responsabilidades</strong>{" "}
            às classes — a decisão mais fundamental do design orientado a objetos.
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            {principles.map((p) => (
              <span key={p.abbr} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm ${p.color}`}>
                <span className={`w-6 h-5 rounded text-white text-xs font-bold flex items-center justify-center ${p.abbrBg}`}>
                  {p.abbr}
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
        <div key={p.abbr} className="flex flex-col gap-4">
          <div className={`flex items-start gap-4 p-5 rounded-xl border ${p.color}`}>
            <span className={`flex-shrink-0 w-12 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${p.abbrBg}`}>
              {p.abbr}
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
              <span className="text-xs text-zinc-600">{p.abbr} — {p.name}</span>
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
          Executa todos os 9 princípios GRASP no backend .NET — instancia as classes de exemplo
          e demonstra o comportamento correto de cada princípio com saída em tempo real.
        </p>
        <LogRunSection
          apiUrl={`${API_URL}/api/principles/grasp/run`}
          buttonLabel="▶ Executar todos os princípios"
          accentColor="violet"
        />
      </div>
    </div>
  );
}
