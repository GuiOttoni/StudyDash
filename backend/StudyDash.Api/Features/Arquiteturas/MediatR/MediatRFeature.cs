using System.Diagnostics;

namespace StudyDash.Api.Features.Arquiteturas.MediatR;

/// <summary>
/// Vertical slice: MediatR vs Hexagonal Direto
/// Route: GET /api/arquiteturas/mediatr/run
/// </summary>
public static class MediatRFeature
{
    public static void MapMediatRFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/arquiteturas/mediatr/run", RunAsync)
           .WithTags("Arquiteturas")
           .WithSummary("Demo MediatR vs Hexagonal Direto")
           .WithDescription("Compara Hexagonal direto (port + use case injetado) com MediatR (IMediator.Send + pipeline behaviors). Mostra Logging, Validation e Notification behaviors com implementação in-memory do padrão Mediator.")
           .Produces<string>(200, "text/event-stream");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DOMÍNIO (compartilhado pelas duas abordagens)
    // ═══════════════════════════════════════════════════════════════════════════

    private record Order(Guid Id, string Product, decimal Amount, string Status);

    // Outbound ports — usados tanto no Hexagonal direto quanto no handler MediatR
    private interface IOrderRepository
    {
        Task SaveAsync(Order order);
    }

    private interface IPaymentPort
    {
        Task<bool> ChargeAsync(Guid orderId, decimal amount);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ABORDAGEM 1 — HEXAGONAL DIRETO (Port + Use Case injetado)
    // ═══════════════════════════════════════════════════════════════════════════

    // Port de entrada: contrato explícito, visível via DI
    private interface IPlaceOrderPort
    {
        Task<Order> ExecuteAsync(string product, decimal amount, string email);
    }

    // Use Case implementa o port diretamente — sem intermediário
    private sealed class PlaceOrderUseCase(
        IOrderRepository repo,
        IPaymentPort payment,
        List<string> log) : IPlaceOrderPort
    {
        public async Task<Order> ExecuteAsync(string product, decimal amount, string email)
        {
            log.Add($"  [PlaceOrderUseCase]  ExecuteAsync({product}, R${amount:F2})");
            var order = new Order(Guid.NewGuid(), product, amount, "Pending");
            await repo.SaveAsync(order);
            var approved = await payment.ChargeAsync(order.Id, amount);
            var final = order with { Status = approved ? "Confirmed" : "PaymentFailed" };
            await repo.SaveAsync(final);
            log.Add($"  [PlaceOrderUseCase]  → Status: {final.Status}");
            return final;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ABORDAGEM 2 — MEDIATR (Command + Handler + Pipeline Behaviors)
    // ═══════════════════════════════════════════════════════════════════════════

    // ── Contratos do Mediator (espelha MediatR v12) ──────────────────────────

    private interface IRequest<out TResponse> { }

    private interface IRequestHandler<in TRequest, TResponse>
        where TRequest : IRequest<TResponse>
    {
        Task<TResponse> Handle(TRequest request, CancellationToken ct);
    }

    private interface INotification { }

    private interface INotificationHandler<in TNotification>
        where TNotification : INotification
    {
        Task Handle(TNotification notification, CancellationToken ct);
    }

    private delegate Task<TResponse> RequestHandlerDelegate<TResponse>();

    private interface IPipelineBehavior<in TRequest, TResponse>
        where TRequest : IRequest<TResponse>
    {
        Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct);
    }

    // ── Implementação do Mediator ────────────────────────────────────────────
    //    Reflete o comportamento interno do MediatR: pipeline + handler resolution

    private sealed class Mediator
    {
        private readonly Dictionary<Type, Func<object, CancellationToken, Task<object>>> _handlers = new();
        private readonly List<(Type reqType, Func<object, Func<CancellationToken, Task<object>>, CancellationToken, Task<object>> wrap)> _behaviors = new();
        private readonly Dictionary<Type, List<Func<object, CancellationToken, Task>>> _notificationHandlers = new();

        // Registra handler para um tipo de request
        public void RegisterHandler<TReq, TResp>(IRequestHandler<TReq, TResp> handler)
            where TReq : IRequest<TResp>
        {
            _handlers[typeof(TReq)] = async (req, ct) =>
                (object)(await handler.Handle((TReq)req, ct))!;
        }

        // Registra behavior de pipeline para um tipo de request específico
        public void AddBehavior<TReq, TResp>(IPipelineBehavior<TReq, TResp> behavior)
            where TReq : IRequest<TResp>
        {
            _behaviors.Add((typeof(TReq), (req, next, ct) =>
            {
                RequestHandlerDelegate<TResp> del = () => next(ct).ContinueWith(t => (TResp)t.Result, TaskScheduler.Default);
                return behavior.Handle((TReq)req, del, ct)
                               .ContinueWith(t => (object)t.Result!, TaskScheduler.Default);
            }));
        }

        // Registra handler de notificação (pub/sub — múltiplos handlers)
        public void RegisterNotificationHandler<TNotif>(INotificationHandler<TNotif> handler)
            where TNotif : INotification
        {
            if (!_notificationHandlers.TryGetValue(typeof(TNotif), out var list))
                _notificationHandlers[typeof(TNotif)] = list = new();
            list.Add((notif, ct) => handler.Handle((TNotif)notif, ct));
        }

        // Envia um request pela pipeline → handler
        public async Task<TResp> Send<TResp>(IRequest<TResp> request, CancellationToken ct = default)
        {
            if (!_handlers.TryGetValue(request.GetType(), out var handler))
                throw new InvalidOperationException($"Nenhum handler registrado para {request.GetType().Name}");

            Func<CancellationToken, Task<object>> core = token => handler(request, token);

            // Envolve o handler na pipeline (behaviors em ordem inversa = LIFO)
            foreach (var (reqType, wrap) in _behaviors.AsEnumerable().Reverse())
            {
                if (!reqType.IsAssignableFrom(request.GetType())) continue;
                var next = core;
                var behavior = wrap;
                core = token => behavior(request, next, token);
            }

            return (TResp)await core(ct);
        }

        // Publica notificação para todos os handlers registrados
        public async Task Publish<TNotif>(TNotif notification, CancellationToken ct = default)
            where TNotif : INotification
        {
            if (!_notificationHandlers.TryGetValue(typeof(TNotif), out var handlers)) return;
            foreach (var h in handlers)
                await h(notification, ct);
        }
    }

    // ── Command (mensagem imutável — sem lógica) ─────────────────────────────
    private record PlaceOrderCommand(string Product, decimal Amount, string Email)
        : IRequest<Order>;

    // ── Notification (evento publicado após o pedido) ────────────────────────
    private record OrderPlacedNotification(Guid OrderId, string Product, string Email)
        : INotification;

    // ── Handler (lógica de negócio — idêntica ao Use Case) ──────────────────
    private sealed class PlaceOrderCommandHandler(
        IOrderRepository repo,
        IPaymentPort payment,
        Mediator mediator,
        List<string> log) : IRequestHandler<PlaceOrderCommand, Order>
    {
        public async Task<Order> Handle(PlaceOrderCommand cmd, CancellationToken ct)
        {
            log.Add($"  [PlaceOrderHandler]  Handle(PlaceOrderCommand: {cmd.Product}, R${cmd.Amount:F2})");
            var order = new Order(Guid.NewGuid(), cmd.Product, cmd.Amount, "Pending");
            await repo.SaveAsync(order);
            var approved = await payment.ChargeAsync(order.Id, cmd.Amount);
            var final = order with { Status = approved ? "Confirmed" : "PaymentFailed" };
            await repo.SaveAsync(final);
            log.Add($"  [PlaceOrderHandler]  → Status: {final.Status}");

            // Publica notificação após concluir — handler não sabe quem vai receber
            await mediator.Publish(new OrderPlacedNotification(final.Id, final.Product, cmd.Email), ct);
            return final;
        }
    }

    // ── Pipeline Behaviors (cross-cutting concerns) ──────────────────────────

    private sealed class LoggingBehavior<TReq, TResp>(List<string> log)
        : IPipelineBehavior<TReq, TResp>
        where TReq : IRequest<TResp>
    {
        public async Task<TResp> Handle(TReq request, RequestHandlerDelegate<TResp> next, CancellationToken ct)
        {
            var sw = Stopwatch.StartNew();
            log.Add($"  [LoggingBehavior]    → {typeof(TReq).Name} recebido");
            var result = await next();
            sw.Stop();
            log.Add($"  [LoggingBehavior]    ← concluído em {sw.ElapsedMilliseconds}ms");
            return result;
        }
    }

    private sealed class ValidationBehavior<TReq, TResp>(List<string> log)
        : IPipelineBehavior<TReq, TResp>
        where TReq : IRequest<TResp>
    {
        public async Task<TResp> Handle(TReq request, RequestHandlerDelegate<TResp> next, CancellationToken ct)
        {
            if (request is PlaceOrderCommand cmd && cmd.Amount <= 0)
            {
                log.Add($"  [ValidationBehavior] ✗ Amount inválido ({cmd.Amount}) — lançando exceção");
                throw new InvalidOperationException("Amount deve ser maior que zero.");
            }
            log.Add($"  [ValidationBehavior] ✓ {typeof(TReq).Name} válido");
            return await next();
        }
    }

    // ── Notification Handlers (múltiplos handlers independentes) ────────────

    private sealed class EmailNotificationHandler(List<string> log)
        : INotificationHandler<OrderPlacedNotification>
    {
        public Task Handle(OrderPlacedNotification n, CancellationToken ct)
        {
            log.Add($"  [EmailHandler]       ← OrderPlaced #{n.OrderId.ToString()[..8]} → enviando e-mail para {n.Email}");
            return Task.CompletedTask;
        }
    }

    private sealed class AuditNotificationHandler(List<string> log)
        : INotificationHandler<OrderPlacedNotification>
    {
        public Task Handle(OrderPlacedNotification n, CancellationToken ct)
        {
            log.Add($"  [AuditHandler]       ← OrderPlaced #{n.OrderId.ToString()[..8]} → gravando auditoria");
            return Task.CompletedTask;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADAPTERS (usados por ambas as abordagens)
    // ═══════════════════════════════════════════════════════════════════════════

    private sealed class InMemoryOrderAdapter : IOrderRepository
    {
        private readonly Dictionary<Guid, Order> _store = new();
        public Task SaveAsync(Order order) { _store[order.Id] = order; return Task.CompletedTask; }
    }

    private sealed class FakePaymentAdapter(List<string> log) : IPaymentPort
    {
        public Task<bool> ChargeAsync(Guid orderId, decimal amount)
        {
            var ok = amount < 5_000m;
            log.Add($"  [FakePaymentAdapter] ChargeAsync #{orderId.ToString()[..8]} R${amount:F2} → {(ok ? "APROVADO ✓" : "NEGADO ✗")}");
            return Task.FromResult(ok);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SSE HANDLER
    // ═══════════════════════════════════════════════════════════════════════════

    private static async Task RunAsync(HttpContext http, CancellationToken cancellationToken)
    {
        http.Response.Headers.Append("Content-Type", "text/event-stream");
        http.Response.Headers.Append("Cache-Control", "no-cache");
        http.Response.Headers.Append("X-Accel-Buffering", "no");
        http.Response.Headers.Append("Connection", "keep-alive");

        async Task Send(string msg)
        {
            await http.Response.WriteAsync($"data: {msg}\n\n", cancellationToken);
            await http.Response.Body.FlushAsync(cancellationToken);
        }

        try
        {
            await Send("── MediatR vs Hexagonal Direto ──");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("» Ponto de partida: ambas as abordagens têm o mesmo objetivo");
            await Send("  Desacoplar o ponto de entrada (HTTP, CLI, teste) da lógica de negócio.");
            await Send("  A diferença está em COMO esse desacoplamento é feito e o que cada um oferece.");
            await Task.Delay(400, cancellationToken);

            // ─────────────────────────────────────────────────────────────────
            // BLOCO 1 — Hexagonal Direto
            // ─────────────────────────────────────────────────────────────────
            await Send("");
            await Send("══════════════════════════════════════════════════════════");
            await Send("» ABORDAGEM 1 — Hexagonal Direto (Port + Use Case injetado via DI)");
            await Task.Delay(200, cancellationToken);

            await Send("");
            await Send("  Estrutura:");
            await Send("    Controller / Endpoint depende de IPlaceOrderPort (port de entrada).");
            await Send("    PlaceOrderUseCase implementa IPlaceOrderPort.");
            await Send("    DI container resolve: IPlaceOrderPort → PlaceOrderUseCase.");
            await Send("    Dependência explícita e visível no construtor do controller.");
            await Task.Delay(400, cancellationToken);

            await Send("");
            await Send("  Simulando: endpoint recebe requisição e chama use case diretamente");
            await Task.Delay(200, cancellationToken);

            var log1 = new List<string>();
            var repo1 = new InMemoryOrderAdapter();
            IPlaceOrderPort useCase = new PlaceOrderUseCase(repo1, new FakePaymentAdapter(log1), log1);

            // simula o que o endpoint faria:
            //   app.MapPost("/orders", ([FromServices] IPlaceOrderPort uc, ...) => uc.ExecuteAsync(...))
            var result1 = await useCase.ExecuteAsync("Teclado Mecânico", 1_299.90m, "dev@example.com");

            foreach (var l in log1) { await Send(l); await Task.Delay(110, cancellationToken); }
            await Send($"  → Pedido #{result1.Id.ToString()[..8]}: {result1.Status}");
            await Task.Delay(400, cancellationToken);

            await Send("");
            await Send("  ✓ Simples, explícito, zero dependências extras");
            await Send("  ✓ DI container mostra exatamente o que o endpoint usa");
            await Send("  ✗ Adicionar logging/validation exige herdar o use case ou usar decorators");
            await Send("  ✗ Múltiplos use cases = múltiplas injeções no construtor do controller");

            // ─────────────────────────────────────────────────────────────────
            // BLOCO 2 — MediatR básico (sem pipeline)
            // ─────────────────────────────────────────────────────────────────
            await Send("");
            await Send("══════════════════════════════════════════════════════════");
            await Send("» ABORDAGEM 2 — MediatR sem pipeline behaviors");
            await Task.Delay(200, cancellationToken);

            await Send("");
            await Send("  Estrutura:");
            await Send("    Controller depende apenas de IMediator — não conhece nenhum handler.");
            await Send("    Envia PlaceOrderCommand (mensagem imutável, sem lógica).");
            await Send("    Mediator resolve o handler correto e executa.");
            await Task.Delay(400, cancellationToken);

            await Send("");
            await Send("  Simulando: mediator.Send(new PlaceOrderCommand(...))");
            await Task.Delay(200, cancellationToken);

            var log2 = new List<string>();
            var mediator2 = new Mediator();
            var repo2 = new InMemoryOrderAdapter();
            mediator2.RegisterHandler(new PlaceOrderCommandHandler(repo2, new FakePaymentAdapter(log2), mediator2, log2));

            var result2 = await mediator2.Send(new PlaceOrderCommand("Monitor 4K", 2_799.90m, "designer@example.com"));

            foreach (var l in log2) { await Send(l); await Task.Delay(110, cancellationToken); }
            await Send($"  → Pedido #{result2.Id.ToString()[..8]}: {result2.Status}");
            await Task.Delay(400, cancellationToken);

            await Send("");
            await Send("  ✓ Controller só conhece IMediator — total desacoplamento");
            await Send("  ✓ Handlers são auto-descobertos (AssemblyScanner em produção)");
            await Send("  ✗ Sem pipeline, ainda não entrega vantagem real sobre Hexagonal direto");

            // ─────────────────────────────────────────────────────────────────
            // BLOCO 3 — MediatR com Pipeline Behaviors
            // ─────────────────────────────────────────────────────────────────
            await Send("");
            await Send("══════════════════════════════════════════════════════════");
            await Send("» ABORDAGEM 3 — MediatR + Pipeline Behaviors (onde ele brilha)");
            await Task.Delay(200, cancellationToken);

            await Send("");
            await Send("  Pipeline: Logging → Validation → Handler");
            await Send("  Cada behavior é um middleware: recebe o request, pode agir antes/depois/ao redor.");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("  3a) Pedido válido — pipeline completa:");
            await Task.Delay(150, cancellationToken);

            var log3a = new List<string>();
            var mediator3a = new Mediator();
            mediator3a.AddBehavior(new LoggingBehavior<PlaceOrderCommand, Order>(log3a));
            mediator3a.AddBehavior(new ValidationBehavior<PlaceOrderCommand, Order>(log3a));
            mediator3a.RegisterNotificationHandler(new EmailNotificationHandler(log3a));
            mediator3a.RegisterNotificationHandler(new AuditNotificationHandler(log3a));
            mediator3a.RegisterHandler(
                new PlaceOrderCommandHandler(new InMemoryOrderAdapter(), new FakePaymentAdapter(log3a), mediator3a, log3a));

            var result3a = await mediator3a.Send(
                new PlaceOrderCommand("Headset Pro", 899.90m, "user@example.com"));

            foreach (var l in log3a) { await Send(l); await Task.Delay(100, cancellationToken); }
            await Send($"  → Pedido #{result3a.Id.ToString()[..8]}: {result3a.Status}");
            await Task.Delay(400, cancellationToken);

            await Send("");
            await Send("  3b) Pedido inválido (Amount = 0) — ValidationBehavior intercepta:");
            await Task.Delay(150, cancellationToken);

            var log3b = new List<string>();
            var mediator3b = new Mediator();
            mediator3b.AddBehavior(new LoggingBehavior<PlaceOrderCommand, Order>(log3b));
            mediator3b.AddBehavior(new ValidationBehavior<PlaceOrderCommand, Order>(log3b));
            mediator3b.RegisterHandler(
                new PlaceOrderCommandHandler(new InMemoryOrderAdapter(), new FakePaymentAdapter(log3b), mediator3b, log3b));

            try { await mediator3b.Send(new PlaceOrderCommand("Produto Inválido", 0m, "x@x.com")); }
            catch (InvalidOperationException ex)
            {
                log3b.Add($"  [Endpoint]           ✗ Exceção capturada: \"{ex.Message}\"");
                log3b.Add("  [PlaceOrderHandler]  → não foi executado");
            }

            foreach (var l in log3b) { await Send(l); await Task.Delay(100, cancellationToken); }
            await Task.Delay(400, cancellationToken);

            await Send("");
            await Send("  ✓ LoggingBehavior e ValidationBehavior adicionados SEM tocar no handler");
            await Send("  ✓ Valem para TODOS os commands — open/closed para novos handlers");
            await Send("  ✓ Notification handlers recebem eventos sem o handler conhecê-los");
            await Send("  ✗ Indireção: o fluxo não é linear — harder para rastrear com stack trace");
            await Send("  ✗ IMediator injeta tudo — controller perde visibilidade de dependências");
            await Task.Delay(300, cancellationToken);

            // ─────────────────────────────────────────────────────────────────
            // BLOCO 4 — Comparação estrutural
            // ─────────────────────────────────────────────────────────────────
            await Send("");
            await Send("══════════════════════════════════════════════════════════");
            await Send("» Comparação estrutural: o que muda no controller?");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("  Hexagonal Direto:");
            await Send("    class OrderEndpoint(IPlaceOrderPort placeOrder, IGetOrderPort getOrder)");
            await Send("    → Construtor mostra exatamente QUAIS casos de uso são usados.");
            await Task.Delay(200, cancellationToken);

            await Send("");
            await Send("  MediatR:");
            await Send("    class OrderEndpoint(IMediator mediator)");
            await Send("    → Construtor esconde os casos de uso — só IMediator é visível.");
            await Send("    → Para saber o que o endpoint usa, você lê o corpo do método.");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("» Não são mutuamente exclusivos:");
            await Send("  Handlers MediatR podem (e devem) depender de ports Hexagonais.");
            await Send("  PlaceOrderCommandHandler injeta IOrderRepository e IPaymentPort.");
            await Send("  MediatR cuida do roteamento e pipeline — Hexagonal cuida do isolamento de infra.");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("» Resumo de quando usar cada um:");
            await Send("  Hexagonal Direto   → apps simples, dependências explícitas preferidas");
            await Send("  MediatR + Hexagonal → CQRS, muitos use cases, pipeline behaviors necessários");
            await Send("  Só MediatR          → não substitui ports — infra ainda vaza para handlers");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
