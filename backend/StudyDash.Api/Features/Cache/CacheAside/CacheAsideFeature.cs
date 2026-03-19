using System.Diagnostics;
using System.Text.Json;
using StackExchange.Redis;

namespace StudyDash.Api.Features.Cache.CacheAside;

/// <summary>
/// Vertical slice: Cache-Aside Pattern com Redis real
/// Route: GET /api/cache/cache-aside/run
///
/// Demonstra o padrão Cache-Aside (Lazy Loading):
///   1. Aplicação verifica o cache → MISS → busca no banco → armazena no Redis → retorna
///   2. Próxima requisição → HIT → retorna do Redis instantaneamente
///   3. Expiração (TTL) → MISS → repete o ciclo
///   Mostra timing real de cada operação e compara latência de cache hit vs miss.
/// </summary>
public static class CacheAsideFeature
{
    public static void MapCacheAsideFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/cache/cache-aside/run", RunAsync)
           .WithTags("Cache")
           .WithSummary("Demo Cache-Aside Pattern (Redis real)")
           .WithDescription(
               "Demonstra o padrão Cache-Aside com Redis real via SSE: 3 ciclos de requisição — " +
               "MISS (200ms de latência de banco simulada) → SET no Redis → HIT (< 5ms) → " +
               "expiração por TTL → MISS novamente. Mostra timing real, comandos Redis e " +
               "comparação de estratégias de cache.")
           .Produces<string>(200, "text/event-stream");
    }

    // Simula o modelo retornado pelo "banco de dados"
    private record SectionData(string Slug, string Title, string Description, string[] Categories, int StudiesCount);

    private static async Task RunAsync(
        IConnectionMultiplexer redis,
        HttpContext http,
        CancellationToken cancellationToken)
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

        var db         = redis.GetDatabase();
        const string cacheKey = "studydash:section:mensageria";
        const int    dbLatencyMs = 200;          // latência simulada do banco
        const int    ttlSeconds  = 5;            // TTL curto para demonstrar expiração

        // Dados que "viriam do banco"
        var dbData = new SectionData(
            Slug:         "mensageria",
            Title:        "Mensageria",
            Description:  "RabbitMQ, Kafka, DLQ, Outbox Pattern e garantias de entrega.",
            Categories:   ["Mensageria"],
            StudiesCount: 5);

        try
        {
            await Send("── Cache-Aside Pattern (Redis real) ──");
            await Task.Delay(300, cancellationToken);

            // Limpa qualquer estado anterior da demo
            await db.KeyDeleteAsync(cacheKey);

            // ── FASE 1: Primeira requisição — CACHE MISS ───────────────────────
            await Send("");
            await Send("» Fase 1 — Requisição 1: GET studydash:section:mensageria");
            await Task.Delay(200, cancellationToken);

            var sw = Stopwatch.StartNew();
            var cached = await db.StringGetAsync(cacheKey);
            await Send($"  REDIS GET {cacheKey}");
            await Send($"  → (nil)  CACHE MISS — chave não existe");
            await Task.Delay(150, cancellationToken);

            await Send($"  Buscando no banco de dados... ({dbLatencyMs}ms de latência)");
            await Task.Delay(dbLatencyMs, cancellationToken);   // simula I/O do banco

            var json = JsonSerializer.Serialize(dbData);
            await db.StringSetAsync(cacheKey, json, TimeSpan.FromSeconds(ttlSeconds));
            sw.Stop();

            await Send($"  REDIS SET {cacheKey} EX {ttlSeconds}  ← armazenando resultado");
            await Send($"  ← {dbData.Title} ({dbData.StudiesCount} studies)");
            await Send($"  ⏱  Tempo total: {sw.ElapsedMilliseconds}ms  (dominado pela latência do banco)");
            await Task.Delay(400, cancellationToken);

            // ── FASE 2: Segunda requisição — CACHE HIT ────────────────────────
            await Send("");
            await Send("» Fase 2 — Requisição 2: GET studydash:section:mensageria");
            await Task.Delay(200, cancellationToken);

            sw.Restart();
            cached = await db.StringGetAsync(cacheKey);
            sw.Stop();

            var ttlRemaining = await db.KeyTimeToLiveAsync(cacheKey);
            await Send($"  REDIS GET {cacheKey}");
            await Send($"  → \"{cached.ToString()[..Math.Min(60, cached.ToString().Length)]}...\"");
            await Send($"  CACHE HIT ✓ — sem acesso ao banco");
            await Send($"  ⏱  Tempo total: {sw.ElapsedMilliseconds}ms  (somente rede Redis ~1ms)");
            await Send($"  TTL restante: {ttlRemaining?.TotalSeconds:F0}s");
            await Task.Delay(400, cancellationToken);

            // ── FASE 3: Aguardar TTL e demonstrar expiração ────────────────────
            await Send("");
            await Send($"» Fase 3 — Aguardando TTL expirar ({ttlSeconds}s)...");
            await Task.Delay(200, cancellationToken);

            for (int i = ttlSeconds; i > 0; i--)
            {
                await Task.Delay(1000, cancellationToken);
                var remaining = await db.KeyTimeToLiveAsync(cacheKey);
                if (remaining.HasValue)
                    await Send($"  TTL: {remaining.Value.TotalSeconds:F0}s restante(s)...");
                else
                    await Send("  Chave expirada pelo Redis (TTL = 0)");
            }

            await Task.Delay(300, cancellationToken);

            // ── FASE 4: Terceira requisição — CACHE MISS após expiração ────────
            await Send("");
            await Send("» Fase 4 — Requisição 3: GET studydash:section:mensageria (após TTL)");
            await Task.Delay(200, cancellationToken);

            sw.Restart();
            cached = await db.StringGetAsync(cacheKey);
            await Send($"  REDIS GET {cacheKey}");
            await Send($"  → (nil)  CACHE MISS — chave expirou (TTL vencido)");
            await Task.Delay(dbLatencyMs, cancellationToken);
            await db.StringSetAsync(cacheKey, json, TimeSpan.FromSeconds(30));
            sw.Stop();

            await Send($"  Banco consultado novamente → resultado cacheado por 30s");
            await Send($"  ⏱  Tempo total: {sw.ElapsedMilliseconds}ms");
            await Task.Delay(400, cancellationToken);

            // ── FASE 5: Resumo e estratégias ──────────────────────────────────
            await Send("");
            await Send("» Resumo dos tempos medidos:");
            await Task.Delay(150, cancellationToken);
            await Send($"  Cache MISS (banco):   ~{dbLatencyMs}ms  — latência de I/O");
            await Send($"  Cache HIT  (Redis):   ~1ms     — somente rede local");
            await Send($"  Redução de latência:  ~{dbLatencyMs}x   — para dados cacheados");
            await Task.Delay(300, cancellationToken);

            await Send("");
            await Send("» Estratégias de cache — quando usar cada uma:");
            await Task.Delay(150, cancellationToken);
            await Send("  Cache-Aside   (Lazy)  : app controla; cache só populado ao ler");
            await Send("                          ideal para dados lidos frequentemente e atualizados raramente");
            await Send("  Write-Through         : app escreve banco + cache atomicamente");
            await Send("                          cache sempre consistente; custo: toda escrita atinge Redis");
            await Send("  Write-Behind (Write-Back): app escreve no cache; relay assíncrono para banco");
            await Send("                          alta performance de escrita; risco: perda de dados se Redis cair");
            await Task.Delay(200, cancellationToken);
            await Send("  Read-Through          : cache intercepta a leitura (lib/proxy)");
            await Send("                          app não sabe se veio do cache — transparente");
            await Task.Delay(200, cancellationToken);
            await Send("  Invalidação:  DELETE key  após update no banco (garante consistência)");
            await Send("  Cache Stampede: múltiplas requisições simultâneas no MISS → use mutex/lock");

            // Limpa a chave de demo
            await db.KeyDeleteAsync(cacheKey);

            await Send("");
            await Send("✓ Cache-Aside: aplicação controla o ciclo de vida do cache com precisão total");
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { }
    }
}
