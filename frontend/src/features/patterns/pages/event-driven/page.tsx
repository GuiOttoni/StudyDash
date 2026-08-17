import { AlgorithmLayout } from "@/features/patterns/components/AlgorithmLayout";
import { LogRunSection } from "@/features/patterns/components/LogRunSection";

const csharpCode = `// ── In-Memory Event Bus ──────────────────────────────────────
sealed class EventBus
{
    private readonly Dictionary<Type, List<Func<object, Task>>> _handlers = new();

    public void Subscribe<T>(Func<T, Task> handler)
    {
        if (!_handlers.ContainsKey(typeof(T)))
            _handlers[typeof(T)] = [];
        _handlers[typeof(T)].Add(e => handler((T)e));
    }

    public async Task PublishAsync<T>(T @event)
    {
        if (_handlers.TryGetValue(typeof(T), out var handlers))
            foreach (var h in handlers)
                await h(@event!);
    }
}

// ── Domain Events ─────────────────────────────────────────────
record OrderPlacedEvent(Guid OrderId, string Product, decimal Amount);
record PaymentProcessedEvent(Guid OrderId, string TransactionId, bool Success);

// ── Wiring — sem dependência entre publisher e subscribers ────
var bus = new EventBus();

bus.Subscribe<OrderPlacedEvent>(async e => {
    Console.WriteLine($"[PaymentHandler] cobrando R$ {e.Amount}");
    await bus.PublishAsync(new PaymentProcessedEvent(e.OrderId, Guid.NewGuid().ToString(), true));
});

bus.Subscribe<OrderPlacedEvent>(e => {
    Console.WriteLine($"[InventoryHandler] reservando '{e.Product}'");
    return Task.CompletedTask;
});

bus.Subscribe<PaymentProcessedEvent>(e => {
    Console.WriteLine($"[EmailHandler] confirmação enviada #{e.TransactionId}");
    return Task.CompletedTask;
});

// ── Publisher não conhece nenhum handler ──────────────────────
await bus.PublishAsync(new OrderPlacedEvent(Guid.NewGuid(), "Notebook Pro X", 4_599.90m));`;

const sources = [
  { label: "Martin Fowler — Event-Driven Architecture", url: "https://martinfowler.com/articles/201701-event-driven.html", icon: "📖" },
  { label: "Microsoft — Event-driven architecture style", url: "https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven", icon: "📖" },
  { label: "Microsoft — Choreography vs Orchestration", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/choreography", icon: "📝" },
];

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5055";

export default function EventDrivenPage() {
  return (
    <AlgorithmLayout
      title="Event-Driven Architecture"
      icon="Radio"
      category="Arquitetura"
      description="Em EDA, componentes comunicam-se publicando e consumindo eventos — fatos imutáveis que representam algo que aconteceu. O publisher não conhece os subscribers: qualquer número de handlers pode reagir independentemente, com falha isolada e extensibilidade zero-custo para o emissor. A consistência é eventual, não transacional."
      sources={sources}
      code={csharpCode}
      codeDescription="Event Bus em memória com Dictionary<Type, List<Handler>>, eventos como records imutáveis e encadeamento automático de handlers via PublishAsync."
    >
      <div className="flex flex-col gap-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md p-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Tight Coupling (sem EDA)</h2>
            <ul className="space-y-1.5 text-[var(--text-tertiary)] text-sm leading-relaxed">
              <li>OrderService chama PaymentService diretamente.</li>
              <li>Falha no EmailService quebra toda a transação.</li>
              <li>Adicionar SMS exige <strong className="text-[var(--text-secondary)]">modificar OrderService</strong>.</li>
              <li>Testes exigem mocks de todos os dependentes.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md p-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Event-Driven (loose coupling)</h2>
            <ul className="space-y-1.5 text-[var(--text-tertiary)] text-sm leading-relaxed">
              <li>OrderService publica <code className="text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] px-1 rounded text-xs">OrderPlaced</code> e para por aí.</li>
              <li><strong className="text-emerald-400">Falha isolada</strong> — um handler não afeta os demais.</li>
              <li>Novo handler = <strong className="text-emerald-400">zero mudança</strong> no publisher.</li>
              <li>Consistência <strong className="text-amber-400">eventual</strong> — não há 2PC.</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {[
            { label: "Desacoplamento", value: "Publisher ignora subscribers — contrato é o evento", color: "emerald" },
            { label: "Extensibilidade", value: "Novo handler sem tocar em código existente", color: "emerald" },
            { label: "Consistência", value: "Eventual — não há transação global ACID", color: "amber" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md p-3 flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--text-tertiary)]">{label}</span>
              <span className={`text-xs ${color === "emerald" ? "text-emerald-300" : "text-amber-300"}`}>{value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-[var(--text-primary)] text-xl">Executar no Backend</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Simula um fluxo de pedido com event bus em memória: OrderPlaced dispara PaymentHandler,
            InventoryHandler e AuditHandler em paralelo. Um handler com falha não bloqueia os demais.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/arquiteturas/event-driven/run`}
            buttonLabel="▶ Executar Demo"
            accentColor="blue"
          />
        </div>
      </div>
    </AlgorithmLayout>
  );
}
