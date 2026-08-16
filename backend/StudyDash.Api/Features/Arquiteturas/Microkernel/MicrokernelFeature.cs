using System.Diagnostics;

namespace StudyDash.Api.Features.Arquiteturas.Microkernel;

/// <summary>
/// Vertical slice: Microkernel Architecture (Plugin Architecture) demo
/// Route: GET /api/arquiteturas/microkernel/run
/// </summary>
public static class MicrokernelFeature
{
    public static void MapMicrokernelFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/arquiteturas/microkernel/run", RunAsync)
           .WithTags("Arquiteturas")
           .WithSummary("Demo Microkernel Architecture")
           .WithDescription("Demonstra Microkernel (Plugin Architecture): kernel estável + plugins intercambiáveis com ciclo de vida (Initialize/Process/Dispose), hot-swap em runtime e isolamento de falha por plugin.")
           .Produces<string>(200, "text/event-stream");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DOMAIN TYPES
    // ═══════════════════════════════════════════════════════════════════════════

    private record PaymentRequest(
        string Method,
        decimal Amount,
        string? PixKey = null,
        string? CardNumber = null,
        int Installments = 1,
        string? Description = null);

    private record PaymentResult(
        string TransactionId,
        string Status,
        decimal Amount,
        long ElapsedMs,
        string? Details = null);

    // ═══════════════════════════════════════════════════════════════════════════
    // PLUGIN CONTRACT — a única coisa que Core e Plugins compartilham
    // ═══════════════════════════════════════════════════════════════════════════

    private interface IPaymentPlugin : IDisposable
    {
        string Name    { get; }
        string Method  { get; }   // chave de roteamento: "pix", "credit-card", "boleto"…
        string Version { get; }

        void Initialize(List<string> log);
        Task<PaymentResult> ProcessAsync(PaymentRequest request, CancellationToken ct);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CORE / KERNEL — estável, nunca muda quando plugins mudam
    // ═══════════════════════════════════════════════════════════════════════════

    private sealed class PaymentKernel(List<string> log)
    {
        private readonly Dictionary<string, IPaymentPlugin> _registry = new();

        // ── Ciclo de vida ─────────────────────────────────────────────────────

        public void LoadPlugin(IPaymentPlugin plugin)
        {
            plugin.Initialize(log);
            _registry[plugin.Method] = plugin;
            log.Add($"  [Kernel] ✓ plugin carregado  : {plugin.Name} v{plugin.Version} → método \"{plugin.Method}\"");
        }

        public void UnloadPlugin(string method)
        {
            if (_registry.Remove(method, out var plugin))
            {
                plugin.Dispose();
                log.Add($"  [Kernel] ✗ plugin descarregado: {plugin.Name} v{plugin.Version}");
            }
        }

        // ── Despacho — Kernel não sabe o que o plugin faz, só chama ──────────

        public async Task<PaymentResult> ProcessAsync(PaymentRequest request, CancellationToken ct)
        {
            if (!_registry.TryGetValue(request.Method, out var plugin))
                throw new KeyNotFoundException($"Nenhum plugin registrado para o método \"{request.Method}\".");

            return await plugin.ProcessAsync(request, ct);
        }

        public IReadOnlyCollection<string> AvailableMethods => _registry.Keys;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PLUGINS — cada um é autossuficiente, substituível, sem dependência entre si
    // ═══════════════════════════════════════════════════════════════════════════

    // ── PIX ───────────────────────────────────────────────────────────────────

    private sealed class PixPlugin : IPaymentPlugin
    {
        public string Name    => "PIX Plugin";
        public string Method  => "pix";
        public string Version => "1.0.0";

        public void Initialize(List<string> log) =>
            log.Add($"  [{Name}]   Initialize → conectando ao SPI (Banco Central)");

        public async Task<PaymentResult> ProcessAsync(PaymentRequest req, CancellationToken ct)
        {
            var sw = Stopwatch.StartNew();
            await Task.Delay(110, ct);   // latência SPI real é ~1s; simulamos curto para demo
            sw.Stop();

            var txId = $"E{Guid.NewGuid().ToString("N")[..22].ToUpper()}";
            return new PaymentResult(txId, "Approved", req.Amount, sw.ElapsedMilliseconds,
                $"chave: {req.PixKey ?? "desconhecida"}  |  E2E: {txId[..16]}…");
        }

        public void Dispose() { /* fecha conexão com SPI */ }
    }

    // ── Cartão de Crédito v2 (sem anti-fraude) ────────────────────────────────

    private sealed class CreditCardPluginV2 : IPaymentPlugin
    {
        public string Name    => "CreditCard Plugin";
        public string Method  => "credit-card";
        public string Version => "2.1.0";

        public void Initialize(List<string> log) =>
            log.Add($"  [{Name}]   Initialize → configurando gateway Cielo (v2)");

        public async Task<PaymentResult> ProcessAsync(PaymentRequest req, CancellationToken ct)
        {
            var sw = Stopwatch.StartNew();
            await Task.Delay(420, ct);
            sw.Stop();

            var masked = req.CardNumber is { Length: >= 4 }
                ? $"{req.CardNumber[..4]}****{req.CardNumber[^4..]}"
                : "****";
            var parcel = req.Installments > 1
                ? $"{req.Installments}x de R${(req.Amount / req.Installments):F2}"
                : "à vista";

            return new PaymentResult(
                Guid.NewGuid().ToString("N")[..12].ToUpper(), "Approved", req.Amount, sw.ElapsedMilliseconds,
                $"cartão: {masked}  |  {parcel}  |  (v2 — sem antifraude)");
        }

        public void Dispose() { /* fecha client HTTP do gateway */ }
    }

    // ── Cartão de Crédito v3 (com anti-fraude — hot-swap) ────────────────────

    private sealed class CreditCardPluginV3 : IPaymentPlugin
    {
        public string Name    => "CreditCard Plugin";
        public string Method  => "credit-card";
        public string Version => "3.0.0";

        public void Initialize(List<string> log) =>
            log.Add($"  [{Name}]   Initialize → gateway Cielo v3 + motor antifraude ClearSale");

        public async Task<PaymentResult> ProcessAsync(PaymentRequest req, CancellationToken ct)
        {
            var sw = Stopwatch.StartNew();

            // passo extra: score de fraude (inexistente na v2)
            await Task.Delay(60, ct);
            var score = new Random().Next(70, 99);

            await Task.Delay(420, ct);
            sw.Stop();

            var masked = req.CardNumber is { Length: >= 4 }
                ? $"{req.CardNumber[..4]}****{req.CardNumber[^4..]}"
                : "****";
            var parcel = req.Installments > 1
                ? $"{req.Installments}x de R${(req.Amount / req.Installments):F2}"
                : "à vista";

            return new PaymentResult(
                Guid.NewGuid().ToString("N")[..12].ToUpper(), "Approved", req.Amount, sw.ElapsedMilliseconds,
                $"cartão: {masked}  |  {parcel}  |  score antifraude: {score}/100 ✓  (v3)");
        }

        public void Dispose() { /* fecha connections */ }
    }

    // ── Boleto ────────────────────────────────────────────────────────────────

    private sealed class BoletoPlugin : IPaymentPlugin
    {
        public string Name    => "Boleto Plugin";
        public string Method  => "boleto";
        public string Version => "1.3.0";

        public void Initialize(List<string> log) =>
            log.Add($"  [{Name}]    Initialize → conectando ao banco emissor (Bradesco)");

        public async Task<PaymentResult> ProcessAsync(PaymentRequest req, CancellationToken ct)
        {
            var sw = Stopwatch.StartNew();
            await Task.Delay(75, ct);
            sw.Stop();

            var nossoNumero = new Random().Next(10_000_000, 99_999_999);
            var barcode     = $"34191.{nossoNumero % 100000:D5} {nossoNumero:D8}.{(int)(req.Amount * 100):D7} 0 {DateOnly.FromDateTime(DateTime.Today.AddDays(3)):yyyyMMdd}";

            return new PaymentResult(
                $"BLTO{nossoNumero}", "Generated", req.Amount, sw.ElapsedMilliseconds,
                $"vence: {DateOnly.FromDateTime(DateTime.Today.AddDays(3)):dd/MM/yyyy}  |  {barcode}");
        }

        public void Dispose() { /* fecha conexão com banco emissor */ }
    }

    // ── CryptoPlugin (instável — para demo de isolamento de falha) ────────────

    private sealed class CryptoPlugin : IPaymentPlugin
    {
        public string Name    => "Crypto Plugin";
        public string Method  => "crypto";
        public string Version => "0.1.0-beta";

        public void Initialize(List<string> log) =>
            log.Add($"  [{Name}]   Initialize → conectando à carteira (instável — beta)");

        public async Task<PaymentResult> ProcessAsync(PaymentRequest req, CancellationToken ct)
        {
            await Task.Delay(200, ct);
            throw new InvalidOperationException("Timeout: nó blockchain não respondeu (simulado).");
        }

        public void Dispose() { /* fecha WebSocket */ }
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

        async Task ShowResult(PaymentResult r, List<string> log)
        {
            foreach (var l in log) { await Send(l); await Task.Delay(90, cancellationToken); }
            log.Clear();
            await Send($"  → {r.Status} em {r.ElapsedMs}ms  |  txn: {r.TransactionId}");
            if (r.Details is not null) await Send($"     {r.Details}");
        }

        try
        {
            await Send("── Microkernel Architecture (Plugin Architecture) ──");
            await Task.Delay(300, cancellationToken);

            // ── Contexto ──────────────────────────────────────────────────────
            await Send("");
            await Send("» O problema que Microkernel resolve:");
            await Send("  Sistema monolítico de pagamentos — toda lógica em PaymentService:");
            await Send("    if (method == \"pix\")   { ...código PIX... }");
            await Send("    if (method == \"card\")  { ...código cartão... }");
            await Send("    if (method == \"boleto\"){ ...código boleto... }");
            await Send("  Adicionar PIX instantâneo exige modificar PaymentService → recompilar →");
            await Send("  retestar tudo, inclusive boleto e cartão que não mudaram nada.");
            await Task.Delay(450, cancellationToken);

            await Send("");
            await Send("» Solução: Microkernel (Core estável + Plugins intercambiáveis)");
            await Send("  Core/Kernel : carrega plugins, mantém registry, despacha requests.");
            await Send("  Plugin      : unidade autossuficiente que implementa IPaymentPlugin.");
            await Send("  Interface   : único contrato compartilhado entre Core e Plugins.");
            await Send("  Core NUNCA muda quando um novo método de pagamento é adicionado.");
            await Task.Delay(400, cancellationToken);

            await Send("");
            await Send("» Ciclo de vida de um plugin:");
            await Send("  LoadPlugin  → Initialize() → ProcessAsync() (N vezes) → Dispose()  ← UnloadPlugin");
            await Task.Delay(300, cancellationToken);

            // ─────────────────────────────────────────────────────────────────
            // DEMO 1 — Carregamento e processamento
            // ─────────────────────────────────────────────────────────────────
            await Send("");
            await Send("══════════════════════════════════════════════════════════");
            await Send("» DEMO 1 — Carregar 3 plugins e processar pagamentos");
            await Task.Delay(200, cancellationToken);

            var log = new List<string>();
            var kernel = new PaymentKernel(log);

            await Send("");
            await Send("  Carregando plugins:");
            kernel.LoadPlugin(new PixPlugin());
            kernel.LoadPlugin(new CreditCardPluginV2());
            kernel.LoadPlugin(new BoletoPlugin());
            foreach (var l in log) { await Send(l); await Task.Delay(80, cancellationToken); }
            log.Clear();

            await Send("");
            await Send($"  Métodos disponíveis: {string.Join(", ", kernel.AvailableMethods.Select(m => $"\"{m}\""))}");
            await Task.Delay(300, cancellationToken);

            // PIX
            await Send("");
            await Send("  → Processando PIX R$350,00:");
            var r1 = await kernel.ProcessAsync(
                new PaymentRequest("pix", 350m, PixKey: "dev@studydash.io"), cancellationToken);
            await ShowResult(r1, log);
            await Task.Delay(200, cancellationToken);

            // Cartão
            await Send("");
            await Send("  → Processando Cartão de Crédito R$2.999,90 em 12x:");
            var r2 = await kernel.ProcessAsync(
                new PaymentRequest("credit-card", 2_999.90m, CardNumber: "4111111111111111", Installments: 12), cancellationToken);
            await ShowResult(r2, log);
            await Task.Delay(200, cancellationToken);

            // Boleto
            await Send("");
            await Send("  → Processando Boleto R$890,00:");
            var r3 = await kernel.ProcessAsync(
                new PaymentRequest("boleto", 890m, Description: "Serviço de consultoria"), cancellationToken);
            await ShowResult(r3, log);
            await Task.Delay(300, cancellationToken);

            // ─────────────────────────────────────────────────────────────────
            // DEMO 2 — Hot-swap em runtime
            // ─────────────────────────────────────────────────────────────────
            await Send("");
            await Send("══════════════════════════════════════════════════════════");
            await Send("» DEMO 2 — Hot-swap: substituir plugin SEM parar o sistema");
            await Task.Delay(200, cancellationToken);

            await Send("");
            await Send("  CreditCardPlugin v2.1.0 não tem antifraude.");
            await Send("  Vamos descarregar v2 e carregar v3 com ClearSale — nenhuma outra parte do");
            await Send("  sistema sabe ou se importa que o plugin trocou.");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("  Descarregando v2.1.0:");
            kernel.UnloadPlugin("credit-card");
            foreach (var l in log) { await Send(l); await Task.Delay(80, cancellationToken); }
            log.Clear();

            await Send("  Carregando v3.0.0:");
            kernel.LoadPlugin(new CreditCardPluginV3());
            foreach (var l in log) { await Send(l); await Task.Delay(80, cancellationToken); }
            log.Clear();

            await Send("");
            await Send($"  Métodos disponíveis (inalterados): {string.Join(", ", kernel.AvailableMethods.Select(m => $"\"{m}\""))}");
            await Task.Delay(200, cancellationToken);

            await Send("");
            await Send("  → Reprocessando Cartão R$2.999,90 com v3.0.0:");
            var r4 = await kernel.ProcessAsync(
                new PaymentRequest("credit-card", 2_999.90m, CardNumber: "4111111111111111", Installments: 12), cancellationToken);
            await ShowResult(r4, log);
            await Send("  ✓ Mesmo endpoint, mesma chamada ao kernel — plugin trocado de forma transparente.");
            await Task.Delay(400, cancellationToken);

            // ─────────────────────────────────────────────────────────────────
            // DEMO 3 — Isolamento de falha
            // ─────────────────────────────────────────────────────────────────
            await Send("");
            await Send("══════════════════════════════════════════════════════════");
            await Send("» DEMO 3 — Isolamento de falha: plugin instável não derruba o kernel");
            await Task.Delay(200, cancellationToken);

            await Send("");
            await Send("  Carregando CryptoPlugin v0.1.0-beta (propositalmente instável):");
            kernel.LoadPlugin(new CryptoPlugin());
            foreach (var l in log) { await Send(l); await Task.Delay(80, cancellationToken); }
            log.Clear();

            await Send("");
            await Send("  → Tentando pagamento com Crypto:");
            try
            {
                await kernel.ProcessAsync(
                    new PaymentRequest("crypto", 500m, Description: "BTC — 0.0051"), cancellationToken);
            }
            catch (InvalidOperationException ex)
            {
                await Send($"  [CryptoPlugin]    ✗ FALHA: {ex.Message}");
            }

            await Task.Delay(200, cancellationToken);
            await Send("");
            await Send("  Kernel continua operacional — processando PIX normalmente após a falha:");
            var r5 = await kernel.ProcessAsync(
                new PaymentRequest("pix", 50m, PixKey: "resiliencia@test.io"), cancellationToken);
            await ShowResult(r5, log);
            await Send("  ✓ Falha em um plugin não propaga para os demais.");
            await Task.Delay(400, cancellationToken);

            // ─────────────────────────────────────────────────────────────────
            // DEMO 4 — Plugin desconhecido
            // ─────────────────────────────────────────────────────────────────
            await Send("");
            await Send("══════════════════════════════════════════════════════════");
            await Send("» DEMO 4 — Método sem plugin registrado");
            await Task.Delay(200, cancellationToken);

            await Send("");
            await Send("  → Tentando processar método \"débito\" (nenhum plugin carregado):");
            try
            {
                await kernel.ProcessAsync(new PaymentRequest("débito", 100m), cancellationToken);
            }
            catch (KeyNotFoundException ex)
            {
                await Send($"  [Kernel] KeyNotFoundException: {ex.Message}");
                await Send("  → Kernel sabe que não tem handler, falha de forma explícita e segura.");
            }
            await Task.Delay(300, cancellationToken);

            // ─────────────────────────────────────────────────────────────────
            // Trade-offs
            // ─────────────────────────────────────────────────────────────────
            await Send("");
            await Send("══════════════════════════════════════════════════════════");
            await Send("» Trade-offs do Microkernel:");
            await Task.Delay(200, cancellationToken);

            await Send("");
            await Send("  ✓ Open/Closed Principle: Core não muda para novos métodos de pagamento");
            await Send("  ✓ Hot-swap: substituir plugin sem downtime (ex: CI/CD blue-green de plugins)");
            await Send("  ✓ Isolamento: falha em um plugin não contamina os demais");
            await Send("  ✓ Testabilidade: cada plugin testado de forma totalmente independente");
            await Send("  ✓ Descoberta dinâmica: listar métodos = listar plugins registrados");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("  ✗ Contrato da interface é rígido: mudar IPaymentPlugin impacta todos os plugins");
            await Send("  ✗ Plugin registry é ponto central de falha se não for thread-safe");
            await Send("  ✗ Versioning de plugins exige convenção clara (semver + compatibilidade)");
            await Send("  ✗ Debug mais difícil: rastrear qual plugin processou um request");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("» Onde Microkernel é usado na prática:");
            await Send("  · VS Code / Eclipse — core editor + extensões");
            await Send("  · Jenkins / GitHub Actions — core CI + steps/plugins");
            await Send("  · Webpack / Vite — core bundler + loaders e plugins");
            await Send("  · ASP.NET Core — core pipeline + middlewares como plugins");
            await Send("  · Sistemas de regras tributárias — core + plugin por UF/país");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("✓ A chave é manter a interface de plugin ESTÁVEL e o Core PEQUENO");
            await Send("  Quanto menor o Core, mais fácil de raciocinar — plugins fazem o trabalho pesado.");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
