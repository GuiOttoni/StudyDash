import { AlgorithmLayout } from "@/features/patterns/components/AlgorithmLayout";
import { LogRunSection } from "@/features/patterns/components/LogRunSection";

const csharpCode = `// ══════════════════════════════════════════════════
// HEXAGONAL DIRETO — Port + Use Case injetado via DI
// ══════════════════════════════════════════════════

// Port de entrada (interface declarada no domínio)
interface IPlaceOrderPort
{
    Task<Order> ExecuteAsync(string product, decimal amount, string email);
}

// Use Case implementa o port
sealed class PlaceOrderUseCase(IOrderRepository repo, IPaymentPort payment)
    : IPlaceOrderPort
{
    public async Task<Order> ExecuteAsync(string product, decimal amount, string email)
    {
        var order = new Order(Guid.NewGuid(), product, amount, "Pending");
        var approved = await payment.ChargeAsync(order.Id, amount);
        return order with { Status = approved ? "Confirmed" : "PaymentFailed" };
    }
}

// Endpoint conhece o port explicitamente
app.MapPost("/orders", async (IPlaceOrderPort placeOrder, CreateOrderDto dto) =>
    Results.Ok(await placeOrder.ExecuteAsync(dto.Product, dto.Amount, dto.Email)));


// ══════════════════════════════════════════════════
// MEDIATR — Command + Handler + Pipeline Behaviors
// ══════════════════════════════════════════════════

// Command: mensagem imutável, sem lógica
record PlaceOrderCommand(string Product, decimal Amount, string Email)
    : IRequest<Order>;

// Handler: mesma lógica do Use Case, recebe IRequest
sealed class PlaceOrderCommandHandler(IOrderRepository repo, IPaymentPort payment,
                                       IMediator mediator)
    : IRequestHandler<PlaceOrderCommand, Order>
{
    public async Task<Order> Handle(PlaceOrderCommand cmd, CancellationToken ct)
    {
        var order = new Order(Guid.NewGuid(), cmd.Product, cmd.Amount, "Pending");
        var approved = await payment.ChargeAsync(order.Id, cmd.Amount);
        var final = order with { Status = approved ? "Confirmed" : "PaymentFailed" };

        // Notificação: handler não sabe quem vai receber
        await mediator.Publish(new OrderPlacedNotification(final.Id, cmd.Email), ct);
        return final;
    }
}

// Endpoint só conhece IMediator — handlers são invisíveis
app.MapPost("/orders", async (IMediator mediator, CreateOrderDto dto) =>
    Results.Ok(await mediator.Send(new PlaceOrderCommand(dto.Product, dto.Amount, dto.Email))));


// ══════════════════════════════════════════════════
// PIPELINE BEHAVIORS (cross-cutting concerns)
// ══════════════════════════════════════════════════

// Logging: envolve qualquer handler sem modificá-lo
sealed class LoggingBehavior<TReq, TResp>(ILogger<LoggingBehavior<TReq, TResp>> log)
    : IPipelineBehavior<TReq, TResp>
{
    public async Task<TResp> Handle(TReq req, RequestHandlerDelegate<TResp> next, CancellationToken ct)
    {
        log.LogInformation("→ {Name}", typeof(TReq).Name);
        var result = await next();          // chama o próximo behavior ou o handler
        log.LogInformation("← {Name}", typeof(TReq).Name);
        return result;
    }
}

// Validation: aborta a pipeline antes de chegar ao handler
sealed class ValidationBehavior<TReq, TResp>(IValidator<TReq> validator)
    : IPipelineBehavior<TReq, TResp>
{
    public async Task<TResp> Handle(TReq req, RequestHandlerDelegate<TResp> next, CancellationToken ct)
    {
        var result = await validator.ValidateAsync(req, ct);
        if (!result.IsValid) throw new ValidationException(result.Errors);
        return await next();
    }
}

// Wiring (Program.cs) — behaviors valem para TODOS os handlers
builder.Services.AddMediatR(cfg => {
    cfg.RegisterServicesFromAssemblyContaining<Program>();
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
});`;

const sources = [
  { label: "MediatR — GitHub (Jimmy Bogard)", url: "https://github.com/jbogard/MediatR", icon: "📖" },
  { label: "MediatR — Pipeline Behaviors", url: "https://github.com/jbogard/MediatR/wiki/Behaviors", icon: "📖" },
  { label: "Microsoft — Mediator pattern", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/mediator", icon: "📝" },
  { label: "Alistair Cockburn — Hexagonal Architecture", url: "https://alistair.cockburn.us/hexagonal-architecture/", icon: "📝" },
];

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5055";

const pipelineSteps = [
  { label: "Request entra", desc: "mediator.Send(new PlaceOrderCommand(...))", color: "zinc" },
  { label: "LoggingBehavior", desc: "Registra início, mede tempo, repassa para próximo", color: "amber" },
  { label: "ValidationBehavior", desc: "Valida dados — lança exceção se inválido, bloqueia pipeline", color: "orange" },
  { label: "PlaceOrderHandler", desc: "Executa lógica de negócio — persiste, cobra, notifica", color: "violet" },
  { label: "LoggingBehavior", desc: "Registra conclusão com tempo decorrido", color: "amber" },
  { label: "Response retorna", desc: "Order com Status: Confirmed ou PaymentFailed", color: "zinc" },
];

const comparison = [
  {
    aspect: "Dependência do controller",
    hexagonal: "IPlaceOrderPort, IGetOrderPort, … (explícitas)",
    mediatr: "IMediator apenas (oculta os handlers)",
  },
  {
    aspect: "Descoberta de handlers",
    hexagonal: "Via construtor — visível no DI container",
    mediatr: "Por Assembly scanning — descoberta em runtime",
  },
  {
    aspect: "Cross-cutting concerns",
    hexagonal: "Decorator pattern por use case (ou AspectJ-style)",
    mediatr: "Pipeline Behavior — uma impl cobre todos os handlers",
  },
  {
    aspect: "CQRS natural",
    hexagonal: "Manual — você cria ports separados para Query/Command",
    mediatr: "IRequest<T> separa Commands de Queries por convenção",
  },
  {
    aspect: "Notificações (1→N)",
    hexagonal: "Event Bus separado ou Event-Driven pattern",
    mediatr: "INotification + INotificationHandler built-in",
  },
  {
    aspect: "Testabilidade",
    hexagonal: "Mock do port (1 interface por use case)",
    mediatr: "Mock de IMediator ou teste direto do handler",
  },
  {
    aspect: "Rastreabilidade",
    hexagonal: "Linear — stack trace direto até o use case",
    mediatr: "Indireta — pipeline pode dificultar stack trace",
  },
  {
    aspect: "Overhead",
    hexagonal: "Zero — apenas DI padrão",
    mediatr: "Pacote NuGet + registro de behaviors + reflection",
  },
];

export default function MediatRPage() {
  return (
    <AlgorithmLayout
      title="MediatR vs Hexagonal Direto"
      icon="Waypoints"
      category="Arquitetura"
      description="MediatR implementa o padrão Mediator: em vez de o controller chamar diretamente um Use Case (IPlaceOrderPort), ele envia uma mensagem (PlaceOrderCommand) para IMediator, que roteia para o handler correto. O ganho real não está no roteamento, mas nos Pipeline Behaviors — middlewares que envolvem qualquer handler com logging, validação, cache ou transação sem tocar no handler. MediatR não substitui Hexagonal: handlers bem escritos continuam dependendo de ports (IOrderRepository, IPaymentPort). As duas abordagens se complementam."
      sources={sources}
      code={csharpCode}
      codeDescription="Hexagonal direto com IPlaceOrderPort, e MediatR com PlaceOrderCommand, handler, LoggingBehavior e ValidationBehavior. Pipeline behaviors registrados globalmente em Program.cs."
    >
      <div className="flex flex-col gap-8">

        {/* Pipeline visual */}
        <div>
          <h2 className="font-semibold text-[var(--text-primary)] text-lg mb-4">Pipeline MediatR — fluxo de um request</h2>
          <div className="flex flex-col gap-1.5">
            {pipelineSteps.map((step, i) => {
              const isHandler = step.color === "violet";
              const isBehavior = step.color === "amber" || step.color === "orange";
              return (
                <div key={i} className="flex items-start gap-3">
                  {/* conector vertical */}
                  <div className="flex flex-col items-center shrink-0 w-5 mt-1">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isHandler ? "bg-violet-500" : isBehavior ? "bg-amber-500" : "bg-[var(--bg-control-hover)]"
                    }`} />
                    {i < pipelineSteps.length - 1 && (
                      <div className="w-px flex-1 bg-[var(--bg-control)] min-h-[20px]" />
                    )}
                  </div>
                  <div className={`flex flex-col gap-0.5 pb-2 ${
                    isHandler ? "bg-violet-950/40 border border-violet-800 rounded-lg px-3 py-2 w-full"
                    : isBehavior ? "bg-amber-950/30 border border-amber-900/50 rounded-lg px-3 py-2 w-full"
                    : "py-1"
                  }`}>
                    <span className={`text-sm font-semibold ${
                      isHandler ? "text-violet-300" : isBehavior ? "text-amber-300" : "text-[var(--text-tertiary)]"
                    }`}>{step.label}</span>
                    <span className="text-xs text-[var(--text-muted)]">{step.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[var(--text-faint)] text-xs mt-3">
            Behaviors são adicionados em <code className="bg-[var(--bg-surface-hover)] px-1 rounded">Program.cs</code> uma vez
            e valem para todos os handlers — sem modificar nenhum deles.
          </p>
        </div>

        {/* Tabela de comparação */}
        <div>
          <h2 className="font-semibold text-[var(--text-primary)] text-lg mb-4">Comparação direta</h2>
          <div className="rounded-md border border-[var(--border-default)] overflow-hidden text-sm">
            <div className="grid grid-cols-3 bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] font-medium text-xs">
              <div className="px-4 py-2.5">Aspecto</div>
              <div className="px-4 py-2.5 border-l border-[var(--border-strong)]">Hexagonal Direto</div>
              <div className="px-4 py-2.5 border-l border-[var(--border-strong)]">MediatR</div>
            </div>
            {comparison.map((row, i) => (
              <div
                key={row.aspect}
                className={`grid grid-cols-3 text-xs ${i % 2 === 0 ? "bg-[var(--bg-surface)]" : "bg-[var(--bg-app)]"}`}
              >
                <div className="px-4 py-3 text-[var(--text-secondary)] font-medium">{row.aspect}</div>
                <div className="px-4 py-3 text-[var(--text-tertiary)] border-l border-[var(--border-default)]">{row.hexagonal}</div>
                <div className="px-4 py-3 text-[var(--text-tertiary)] border-l border-[var(--border-default)]">{row.mediatr}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Como se complementam */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md p-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Quando usar Hexagonal Direto</h2>
            <ul className="space-y-2 text-[var(--text-tertiary)] leading-relaxed">
              <li><strong className="text-[var(--text-primary)]">Apps simples</strong> — poucas use cases, dependências explícitas preferidas</li>
              <li><strong className="text-[var(--text-primary)]">Rastreabilidade máxima</strong> — stack trace linear, DI transparente</li>
              <li><strong className="text-[var(--text-primary)]">Sem pipeline</strong> — cross-cutting via Decorator ou sem nenhum</li>
              <li><strong className="text-[var(--text-primary)]">Zero overhead</strong> — sem pacotes externos</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md p-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Quando adicionar MediatR</h2>
            <ul className="space-y-2 text-[var(--text-tertiary)] leading-relaxed">
              <li><strong className="text-violet-300">CQRS</strong> — Commands vs Queries separados naturalmente</li>
              <li><strong className="text-violet-300">Muitos handlers</strong> — um IMediator no controller em vez de N ports</li>
              <li><strong className="text-violet-300">Pipeline behaviors</strong> — logging, validação, cache, transação globais</li>
              <li><strong className="text-violet-300">Notificações</strong> — INotification para pub/sub in-process</li>
            </ul>
          </div>
        </div>

        {/* Composição */}
        <div className="flex flex-col gap-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md p-5 text-sm">
          <h2 className="font-semibold text-[var(--text-primary)]">Como usar os dois juntos</h2>
          <p className="text-[var(--text-tertiary)] leading-relaxed">
            MediatR e Hexagonal não competem — MediatR opera na camada de <strong className="text-[var(--text-primary)]">roteamento e pipeline</strong>,
            enquanto Hexagonal opera na camada de <strong className="text-[var(--text-primary)]">isolamento de infraestrutura</strong>.
          </p>
          <div className="flex flex-col gap-2 mt-1">
            {[
              { layer: "HTTP / gRPC / CLI", desc: "Driving adapter (envia commands via IMediator)", color: "zinc" },
              { layer: "MediatR Pipeline", desc: "Logging → Validation → Authorization → (handler)", color: "amber" },
              { layer: "PlaceOrderCommandHandler", desc: "Lógica de negócio — depende de IOrderRepository e IPaymentPort", color: "violet" },
              { layer: "Driven Adapters", desc: "SqlOrderAdapter, StripePaymentAdapter — implementam os ports", color: "zinc" },
            ].map(({ layer, desc, color }) => (
              <div key={layer} className={`flex flex-col gap-0.5 px-3 py-2 rounded-lg ${
                color === "violet" ? "bg-violet-950/40 border border-violet-800"
                : color === "amber" ? "bg-amber-950/30 border border-amber-900/50"
                : "bg-[var(--bg-surface-hover)]"
              }`}>
                <span className={`text-xs font-semibold ${
                  color === "violet" ? "text-violet-300" : color === "amber" ? "text-amber-300" : "text-[var(--text-secondary)]"
                }`}>{layer}</span>
                <span className="text-xs text-[var(--text-muted)]">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Demo */}
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-[var(--text-primary)] text-xl">Executar no Backend</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Executa as três abordagens em sequência: Hexagonal direto, MediatR sem pipeline,
            e MediatR com <code className="text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] px-1 rounded text-xs">LoggingBehavior</code> +{" "}
            <code className="text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] px-1 rounded text-xs">ValidationBehavior</code> +
            notificações. Inclui cenário de validação falhando antes do handler.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/arquiteturas/mediatr/run`}
            buttonLabel="▶ Executar Demo MediatR"
            accentColor="violet"
          />
        </div>

      </div>
    </AlgorithmLayout>
  );
}
