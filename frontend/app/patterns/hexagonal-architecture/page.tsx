import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";
import { LogRunSection } from "@/components/patterns/LogRunSection";

const csharpCode = `// ── Ports (interfaces declaradas DENTRO do domínio) ──────────────
interface IOrderRepository       // outbound port
{
    Task SaveAsync(Order order);
    Task<Order?> FindByIdAsync(Guid id);
}

interface IPaymentPort           // outbound port
{
    Task<bool> ChargeAsync(Guid orderId, decimal amount);
}

interface INotificationPort      // outbound port
{
    Task SendAsync(string recipient, string message);
}

// ── Use Case — depende só de ports, nunca de adapters concretos ───
sealed class PlaceOrderUseCase(
    IOrderRepository repository,
    IPaymentPort payment,
    INotificationPort notification)
{
    public async Task<Order> ExecuteAsync(string product, decimal amount, string email)
    {
        var order = new Order(Guid.NewGuid(), product, amount, "Pending");
        await repository.SaveAsync(order);

        var approved = await payment.ChargeAsync(order.Id, amount);
        var final = order with { Status = approved ? "Confirmed" : "PaymentFailed" };

        await repository.SaveAsync(final);
        await notification.SendAsync(email, approved ? "Pedido confirmado!" : "Pagamento recusado.");
        return final;
    }
}

// ── Adapters (implementam ports — substituíveis sem mudar o domínio) ─
sealed class SqlOrderAdapter(AppDbContext db) : IOrderRepository
{
    public Task SaveAsync(Order o) => db.Orders.Upsert(o).RunAsync();
    public Task<Order?> FindByIdAsync(Guid id) => db.Orders.FindAsync(id).AsTask();
}

sealed class InMemoryOrderAdapter : IOrderRepository  // usado em testes
{
    private readonly Dictionary<Guid, Order> _store = new();
    public Task SaveAsync(Order o) { _store[o.Id] = o; return Task.CompletedTask; }
    public Task<Order?> FindByIdAsync(Guid id) => Task.FromResult(_store.GetValueOrDefault(id));
}

sealed class StripePaymentAdapter(StripeClient client) : IPaymentPort
{
    public async Task<bool> ChargeAsync(Guid orderId, decimal amount)
        => (await client.PaymentIntents.CreateAsync(...)).Status == "succeeded";
}

// ── Composition Root (Program.cs / DI container) ──────────────────
// Produção: wiring com adapters reais
services.AddScoped<IOrderRepository, SqlOrderAdapter>();
services.AddScoped<IPaymentPort, StripePaymentAdapter>();
services.AddScoped<INotificationPort, SmtpNotificationAdapter>();

// Teste: wiring com adapters fake — zero infra real necessária
var useCase = new PlaceOrderUseCase(
    new InMemoryOrderAdapter(),
    new FakePaymentAdapter(),
    new FakeNotificationAdapter());`;

const sources = [
  { label: "Alistair Cockburn — Hexagonal Architecture (original)", url: "https://alistair.cockburn.us/hexagonal-architecture/", icon: "📖" },
  { label: "Martin Fowler — Ports and Adapters", url: "https://martinfowler.com/articles/badri-hexagonal/", icon: "📖" },
  { label: "Jeffrey Palermo — Onion Architecture", url: "https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/", icon: "📝" },
  { label: "Robert C. Martin — Clean Architecture", url: "https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html", icon: "📝" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";

const architectures = [
  {
    name: "Hexagonal",
    author: "Alistair Cockburn, 2005",
    alias: "Ports & Adapters",
    icon: "⬡",
    layers: ["Driving Adapters (HTTP, CLI, Tests)", "Driving Ports (Input interfaces)", "Application Core (Use Cases + Domain)", "Driven Ports (Output interfaces)", "Driven Adapters (DB, e-mail, SMS)"],
    pros: [
      "Adapter swap explícito — máxima testabilidade",
      "Simétrico: mesmo padrão para entrada e saída",
      "Nenhum detalhe de infra vaza para o domínio",
    ],
    cons: [
      "Não prescreve organização interna do domínio",
      "O nome não carrega significado semântico forte",
    ],
    focus: "Isolamento via adapters como mecanismo central de integração",
    color: "violet",
  },
  {
    name: "Clean",
    author: "Robert C. Martin, 2012",
    alias: "Clean Architecture",
    icon: "◎",
    layers: ["Frameworks & Drivers (DB, UI, External)", "Interface Adapters (Controllers, Gateways)", "Use Cases (Application Business Rules)", "Entities (Enterprise Business Rules)"],
    pros: [
      "Camadas muito bem definidas e prescritivas",
      "Separa Enterprise Rules de Application Rules",
      "Excelente para grandes equipes e projetos enterprise",
    ],
    cons: [
      "Overhead estrutural elevado para projetos pequenos",
      "Interface Adapters mistura controllers e gateways",
    ],
    focus: "Dependency Rule: dependências sempre apontam para dentro",
    color: "blue",
  },
  {
    name: "Onion",
    author: "Jeffrey Palermo, 2008",
    alias: "Onion Architecture",
    icon: "⊙",
    layers: ["Infrastructure & UI (borda externa)", "Application Services (orquestração)", "Domain Services (regras de negócio)", "Domain Model (centro absoluto)"],
    pros: [
      "Excelente fit com Domain-Driven Design",
      "Domain Services isolam lógica de negócio complexa",
      "Aggregates e value objects bem acomodados",
    ],
    cons: [
      "Fronteira Domain Service/App Service é subjetiva",
      "Mais camadas internas que Hexagonal",
    ],
    focus: "Domain Model no centro absoluto — Application Services orquestram Domain Services",
    color: "emerald",
  },
];

const colorMap: Record<string, { border: string; badge: string; text: string; layerBg: string; layerText: string }> = {
  violet: {
    border: "border-violet-800",
    badge: "bg-violet-950 text-violet-300 border border-violet-800",
    text: "text-violet-300",
    layerBg: "bg-violet-950/40",
    layerText: "text-violet-200",
  },
  blue: {
    border: "border-blue-800",
    badge: "bg-blue-950 text-blue-300 border border-blue-800",
    text: "text-blue-300",
    layerBg: "bg-blue-950/40",
    layerText: "text-blue-200",
  },
  emerald: {
    border: "border-emerald-800",
    badge: "bg-emerald-950 text-emerald-300 border border-emerald-800",
    text: "text-emerald-300",
    layerBg: "bg-emerald-950/40",
    layerText: "text-emerald-200",
  },
};

export default function HexagonalArchitecturePage() {
  return (
    <AlgorithmLayout
      title="Arquitetura Hexagonal"
      icon="Hexagon"
      category="Arquitetura"
      description="Proposta por Alistair Cockburn em 2005, a Arquitetura Hexagonal (Ports & Adapters) isola o núcleo da aplicação de todas as tecnologias externas. O domínio define interfaces chamadas ports — contratos puros sem dependência de frameworks. Adapters implementam esses ports, traduzindo a linguagem de uma tecnologia externa (SQL, HTTP, SMTP) para a linguagem do domínio. Trocar de banco de dados, de provedor de pagamento ou de canal de notificação significa apenas trocar o adapter — o Use Case permanece inalterado."
      sources={sources}
      code={csharpCode}
      codeDescription="Ports como interfaces definidas pelo domínio, Use Case dependendo apenas de ports, e dois adapters para IOrderRepository — SqlOrderAdapter (produção) e InMemoryOrderAdapter (testes). Composition Root decide qual adapter injetar."
    >
      <div className="flex flex-col gap-8">

        {/* Comparação das 3 arquiteturas */}
        <div>
          <h2 className="font-semibold text-white text-lg mb-4">Comparação: Hexagonal vs Clean vs Onion</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {architectures.map((arch) => {
              const c = colorMap[arch.color];
              return (
                <div key={arch.name} className={`flex flex-col gap-3 bg-zinc-900 border ${c.border} rounded-xl p-4`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{arch.icon}</span>
                    <div>
                      <h3 className={`font-bold text-base ${c.text}`}>{arch.name}</h3>
                      <p className="text-zinc-500 text-xs">{arch.author}</p>
                    </div>
                  </div>

                  <span className={`text-xs font-mono px-2 py-0.5 rounded w-fit ${c.badge}`}>
                    {arch.alias}
                  </span>

                  <p className="text-zinc-400 text-xs leading-relaxed italic">{arch.focus}</p>

                  {/* Camadas */}
                  <div className="flex flex-col gap-1">
                    {arch.layers.map((layer, i) => (
                      <div
                        key={i}
                        className={`text-xs px-2 py-1 rounded ${
                          i === Math.floor(arch.layers.length / 2)
                            ? `${c.layerBg} ${c.layerText} font-semibold`
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {layer}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pros & Cons */}
        <div>
          <h2 className="font-semibold text-white text-lg mb-4">Prós e Contras</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {architectures.map((arch) => {
              const c = colorMap[arch.color];
              return (
                <div key={arch.name} className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <h3 className={`font-semibold ${c.text}`}>{arch.name}</h3>
                  <ul className="space-y-1.5 text-zinc-400 leading-relaxed">
                    {arch.pros.map((p) => (
                      <li key={p} className="flex gap-1.5">
                        <span className="text-emerald-400 shrink-0">✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                    {arch.cons.map((c2) => (
                      <li key={c2} className="flex gap-1.5">
                        <span className="text-red-400 shrink-0">✗</span>
                        <span>{c2}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* O que são adapters */}
        <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-sm">
          <h2 className="font-semibold text-white text-base">O papel central do Adapter</h2>
          <p className="text-zinc-400 leading-relaxed">
            Um adapter é uma classe que <strong className="text-zinc-200">traduz a linguagem de uma tecnologia externa</strong> para
            a linguagem do domínio — sem vazar nenhum detalhe da tecnologia para dentro do núcleo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {[
              { port: "IOrderRepository", adapters: ["SqlOrderAdapter (EF Core + PostgreSQL)", "MongoOrderAdapter (MongoDB)", "InMemoryOrderAdapter (testes)"] },
              { port: "IPaymentPort", adapters: ["StripePaymentAdapter (Stripe API)", "PagarMePaymentAdapter (PagarMe)", "FakePaymentAdapter (demos/testes)"] },
              { port: "INotificationPort", adapters: ["SmtpNotificationAdapter (e-mail)", "TwilioSmsAdapter (SMS)", "ConsoleNotificationAdapter (dev)"] },
              { port: "IOrderRepository (inbound)", adapters: ["HttpOrderAdapter (REST controller)", "GrpcOrderAdapter (gRPC server)", "CliOrderAdapter (CLI tool)"] },
            ].map(({ port, adapters }) => (
              <div key={port} className="flex flex-col gap-2 bg-zinc-800 rounded-lg p-3">
                <code className="text-violet-300 text-xs font-mono">{port}</code>
                <ul className="space-y-1">
                  {adapters.map((a) => (
                    <li key={a} className="text-zinc-400 text-xs flex gap-1.5">
                      <span className="text-zinc-600">→</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed mt-1">
            O Use Case chama <code className="text-zinc-400 bg-zinc-800 px-1 rounded">await payment.ChargeAsync(id, amount)</code> sem saber
            se por baixo está o Stripe, PagarMe ou um fake. Essa é a força do padrão.
          </p>
        </div>

        {/* O que têm em comum */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white">O que as três têm em comum</h2>
            <ul className="space-y-2 text-zinc-400 leading-relaxed">
              <li><strong className="text-zinc-200">Dependency Inversion Principle</strong> — domínio define interfaces, infra implementa</li>
              <li><strong className="text-zinc-200">Core isolado</strong> de frameworks, banco de dados e UI</li>
              <li><strong className="text-zinc-200">Testabilidade</strong> via troca de implementações concretas por fakes</li>
              <li><strong className="text-zinc-200">Evolução independente</strong> — trocar banco não afeta regras de negócio</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white">Quando escolher cada uma</h2>
            <ul className="space-y-2 text-zinc-400 leading-relaxed">
              <li><strong className="text-violet-300">Hexagonal</strong> — múltiplos adapters externos, N canais de entrada/saída</li>
              <li><strong className="text-blue-300">Clean</strong> — grandes equipes enterprise, DDD simples, fronteiras rígidas</li>
              <li><strong className="text-emerald-300">Onion</strong> — DDD rico, muitos Domain Services e aggregates complexos</li>
            </ul>
          </div>
        </div>

        {/* Demo */}
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-white text-xl">Executar no Backend</h2>
          <p className="text-zinc-500 text-sm">
            Executa <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">PlaceOrderUseCase</code> com três configurações de adapters:
            pedido aprovado, pedido negado pelo limite, e swap para{" "}
            <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">AlwaysApproveAdapter</code> sem alterar o Use Case.
            Exibe a comparação completa Hexagonal vs Clean vs Onion.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/arquiteturas/hexagonal/run`}
            buttonLabel="▶ Executar Demo Hexagonal"
            accentColor="violet"
          />
        </div>

      </div>
    </AlgorithmLayout>
  );
}
