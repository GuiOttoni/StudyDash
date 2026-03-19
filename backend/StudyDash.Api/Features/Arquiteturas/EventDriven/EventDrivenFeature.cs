namespace StudyDash.Api.Features.Arquiteturas.EventDriven;

/// <summary>
/// Vertical slice: Event-Driven Architecture demo
/// Route: GET /api/arquiteturas/event-driven/run
/// </summary>
public static class EventDrivenFeature
{
    public static void MapEventDrivenFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/arquiteturas/event-driven/run", RunAsync)
           .WithTags("Arquiteturas")
           .WithSummary("Demo Event-Driven Architecture")
           .WithDescription("Simula um fluxo de pedido com event bus em memória via SSE: `OrderPlaced` dispara PaymentHandler, InventoryHandler e EmailHandler de forma desacoplada. Demonstra handlers independentes, cascata de eventos e falha isolada.")
           .Produces<string>(200, "text/event-stream");
    }

    // ── Domain Events ─────────────────────────────────────────────────────────
    private record OrderPlacedEvent(Guid OrderId, string Product, decimal Amount);
    private record PaymentProcessedEvent(Guid OrderId, string TransactionId, bool Success);
    private record InventoryReservedEvent(Guid OrderId, string Product);

    // ── In-Memory Event Bus ───────────────────────────────────────────────────
    private sealed class EventBus
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

    private static async Task RunAsync(HttpContext http, CancellationToken cancellationToken)
    {
        http.Response.Headers.Append("Content-Type", "text/event-stream");
        http.Response.Headers.Append("Cache-Control", "no-cache");
        http.Response.Headers.Append("X-Accel-Buffering", "no");
        http.Response.Headers.Append("Connection", "keep-alive");

        async Task Send(string message)
        {
            await http.Response.WriteAsync($"data: {message}\n\n", cancellationToken);
            await http.Response.Body.FlushAsync(cancellationToken);
        }

        try
        {
            await Send("── Event-Driven Architecture ──");
            await Task.Delay(300, cancellationToken);

            // ── Conceito ──────────────────────────────────────────────────────
            await Send("");
            await Send("» O problema do acoplamento direto (tight coupling)");
            await Send("  OrderService chama PaymentService.Process(), InventoryService.Reserve(),");
            await Send("  EmailService.Send() diretamente em sequência.");
            await Send("  → Falha no e-mail quebra o pedido inteiro.");
            await Send("  → Adicionar notificação por SMS exige mudar OrderService.");
            await Task.Delay(500, cancellationToken);

            await Send("");
            await Send("» Com Event-Driven (loose coupling):");
            await Send("  OrderService publica OrderPlaced e não conhece nenhum subscriber.");
            await Send("  Cada handler reage de forma independente — falha isolada, extensível sem mudança.");
            await Task.Delay(500, cancellationToken);

            // ── Registrar handlers ────────────────────────────────────────────
            await Send("");
            await Send("» Registrando handlers no EventBus em memória...");
            await Task.Delay(200, cancellationToken);

            var bus = new EventBus();
            var executionLog = new List<string>();

            bus.Subscribe<OrderPlacedEvent>(async e =>
            {
                executionLog.Add($"  [PaymentHandler]   ← OrderPlaced #{e.OrderId.ToString()[..8]} — cobrando R$ {e.Amount:F2}");
                await Task.Delay(10);
                await bus.PublishAsync(new PaymentProcessedEvent(e.OrderId, Guid.NewGuid().ToString()[..8], true));
            });

            bus.Subscribe<OrderPlacedEvent>(async e =>
            {
                executionLog.Add($"  [InventoryHandler] ← OrderPlaced #{e.OrderId.ToString()[..8]} — reservando '{e.Product}'");
                await Task.Delay(10);
                await bus.PublishAsync(new InventoryReservedEvent(e.OrderId, e.Product));
            });

            bus.Subscribe<OrderPlacedEvent>(e =>
            {
                executionLog.Add($"  [AuditHandler]     ← OrderPlaced #{e.OrderId.ToString()[..8]} — gravando auditoria");
                return Task.CompletedTask;
            });

            bus.Subscribe<PaymentProcessedEvent>(e =>
            {
                executionLog.Add($"  [EmailHandler]     ← PaymentProcessed #{e.TransactionId} — enviando confirmação");
                return Task.CompletedTask;
            });

            bus.Subscribe<InventoryReservedEvent>(e =>
            {
                executionLog.Add($"  [WarehouseHandler] ← InventoryReserved '{e.Product}' — emitindo NF");
                return Task.CompletedTask;
            });

            await Send("  ✓ PaymentHandler    → subscrito em OrderPlaced");
            await Send("  ✓ InventoryHandler  → subscrito em OrderPlaced");
            await Send("  ✓ AuditHandler      → subscrito em OrderPlaced");
            await Send("  ✓ EmailHandler      → subscrito em PaymentProcessed");
            await Send("  ✓ WarehouseHandler  → subscrito em InventoryReserved");
            await Task.Delay(400, cancellationToken);

            // ── Publicar evento ────────────────────────────────────────────────
            await Send("");
            var order = new OrderPlacedEvent(Guid.NewGuid(), "Notebook Pro X", 4_599.90m);
            await Send($"» [OrderService] → bus.PublishAsync(OrderPlaced)");
            await Send($"  produto: {order.Product}  |  valor: R$ {order.Amount:F2}  |  id: #{order.OrderId.ToString()[..8]}");
            await Send("  (OrderService não conhece nenhum dos handlers abaixo)");
            await Task.Delay(300, cancellationToken);

            await bus.PublishAsync(order);

            await Send("");
            await Send("» Cascata de execução — cada handler processou e emitiu eventos filhos:");
            await Task.Delay(200, cancellationToken);

            foreach (var entry in executionLog)
            {
                await Send(entry);
                await Task.Delay(120, cancellationToken);
            }
            await Task.Delay(300, cancellationToken);

            // ── Isolamento de falha ───────────────────────────────────────────
            await Send("");
            await Send("» Isolamento de falha: SmsHandler lança exceção durante processamento");
            await Task.Delay(200, cancellationToken);

            var failLog = new List<string>();
            var busFail = new EventBus();

            busFail.Subscribe<OrderPlacedEvent>(e =>
            {
                failLog.Add($"  [PaymentHandler]  → OK (R$ {e.Amount:F2} cobrado)");
                return Task.CompletedTask;
            });

            busFail.Subscribe<OrderPlacedEvent>(_ =>
            {
                failLog.Add("  [SmsHandler]      → FALHA simulada (serviço indisponível) — exceção capturada");
                throw new InvalidOperationException("SMS gateway timeout");
            });

            busFail.Subscribe<OrderPlacedEvent>(e =>
            {
                failLog.Add($"  [InventoryHandler]→ OK ('{e.Product}' reservado)");
                return Task.CompletedTask;
            });

            var order2 = new OrderPlacedEvent(Guid.NewGuid(), "Mouse Gamer", 249.90m);
            try { await busFail.PublishAsync(order2); } catch { /* falha isolada ao handler */ }

            foreach (var entry in failLog)
                await Send(entry);

            await Send("  → PaymentHandler e InventoryHandler completaram mesmo com SmsHandler falhando");
            await Task.Delay(400, cancellationToken);

            // ── Trade-offs ────────────────────────────────────────────────────
            await Send("");
            await Send("» Trade-offs do Event-Driven:");
            await Send("  ✓ Desacoplamento temporal — publisher e subscriber independentes");
            await Send("  ✓ Extensibilidade — novo handler sem tocar em publishers existentes");
            await Send("  ✓ Resiliência — falha isolada por handler");
            await Send("  ✗ Rastreabilidade — fluxo distribuído exige correlation IDs e distributed tracing");
            await Send("  ✗ Consistência eventual — não há transação global ACID");
            await Send("  ✗ Complexidade operacional — broker (Kafka/RabbitMQ) em produção");
            await Task.Delay(400, cancellationToken);

            await Send("");
            await Send("✓ Event-Driven é a base de Microserviços, CQRS e Event Sourcing modernos");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
