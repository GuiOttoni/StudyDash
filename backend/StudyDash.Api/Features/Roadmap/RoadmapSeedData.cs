using Microsoft.EntityFrameworkCore;

namespace StudyDash.Api.Features.Roadmap;

public static class RoadmapSeedData
{
    public static async Task SeedAsync(AppDbContext db)
    {
        var all = BuildTasks();

        var existingList = await db.RoadmapTasks
            .Select(t => new { t.Title, t.Section })
            .ToListAsync();
        var existing = existingList.Select(t => $"{t.Section}|{t.Title}").ToHashSet();

        var toInsert = all.Where(t => !existing.Contains($"{t.Section}|{t.Title}")).ToList();
        if (toInsert.Count == 0) return;

        db.RoadmapTasks.AddRange(toInsert);
        await db.SaveChangesAsync();
    }

    private static List<RoadmapTask> BuildTasks() =>
    [
            // ── Padrões ───────────────────────────────────────────────────────
            new RoadmapTask { Title = "Factory Method",          Section = "padroes",      Description = "INotification com Email/SMS/Push — factory centraliza criação" },
            new RoadmapTask { Title = "Abstract Factory",        Section = "padroes",      Description = "Famílias WindowsFactory/MacFactory com Button e Checkbox" },
            new RoadmapTask { Title = "Prototype",               Section = "padroes",      Description = "Document.Clone() — demonstra deep vs shallow copy" },
            new RoadmapTask { Title = "Object Pool",             Section = "padroes",      Description = "Pool de conexões reutilizáveis — evita custo de criação repetida" },
            new RoadmapTask { Title = "Decorator",               Section = "padroes",      Description = "Coffee com Milk/Sugar/WhippedCream — composição dinâmica" },
            new RoadmapTask { Title = "Adapter",                 Section = "padroes",      Description = "LegacyPaymentService adaptado para IPaymentGateway moderna" },
            new RoadmapTask { Title = "Facade",                  Section = "padroes",      Description = "HomeTheater com WatchMovie()/EndMovie() — interface simplificada" },
            new RoadmapTask { Title = "Composite",               Section = "padroes",      Description = "Estrutura de árvore onde folhas e galhos têm a mesma interface" },
            new RoadmapTask { Title = "Proxy",                   Section = "padroes",      Description = "Controle de acesso — lazy loading, cache, logging transparente" },
            new RoadmapTask { Title = "Flyweight",               Section = "padroes",      Description = "Compartilhamento de estado intrínseco — redução de alocações em massa" },
            new RoadmapTask { Title = "Observer",                Section = "padroes",      Description = "EventBus com EmailAlert, SmsAlert, DashboardLogger" },
            new RoadmapTask { Title = "Strategy",                Section = "padroes",      Description = "ShippingCalculator com Standard/Express/Free — troca em runtime" },
            new RoadmapTask { Title = "Command",                 Section = "padroes",      Description = "Editor com TypeCommand/DeleteCommand + histórico Undo/Redo" },
            new RoadmapTask { Title = "Chain of Responsibility", Section = "padroes",      Description = "AuthHandler → AuthorizationHandler → RateLimitHandler" },
            new RoadmapTask { Title = "Iterator",                Section = "padroes",      Description = "TreeNode com InOrder, PreOrder, PostOrder iterators" },
            new RoadmapTask { Title = "State",                   Section = "padroes",      Description = "Máquina de estados — substitui switch/if com classes de estado" },
            new RoadmapTask { Title = "Mediator",                Section = "padroes",      Description = "Componentes comunicam via mediador — desacoplamento total" },
            new RoadmapTask { Title = "Template Method",         Section = "padroes",      Description = "Esqueleto fixo do algoritmo, passos customizáveis nas subclasses" },
            new RoadmapTask { Title = "Modelo Anêmico em Microserviços de Trading", Section = "padroes", Description = "HFT adota modelos anêmicos de altíssima coesão — structs imutáveis como DTOs de mensagem, lógica centralizada em handlers stateless, priorizando latência sub-microssegundo sobre pureza DDD" },

            // ── Algoritmos ────────────────────────────────────────────────────
            new RoadmapTask { Title = "Selection Sort",          Section = "algoritmos",   Description = "O(n²) sempre — mínimo de trocas, visualização de barras" },
            new RoadmapTask { Title = "Insertion Sort",          Section = "algoritmos",   Description = "O(n) melhor caso — eficiente para arrays quase ordenados" },
            new RoadmapTask { Title = "Quick Sort",              Section = "algoritmos",   Description = "O(n log n) médio — pivot destacado, partições coloridas" },
            new RoadmapTask { Title = "Heap Sort",               Section = "algoritmos",   Description = "O(n log n) garantido — baseado em estrutura max-heap" },
            new RoadmapTask { Title = "Binary Search",           Section = "algoritmos",   Description = "O(log n) — divide o espaço de busca pela metade a cada passo" },
            new RoadmapTask { Title = "Linear Search",           Section = "algoritmos",   Description = "O(n) — varredura sequencial, contraste com Binary Search" },
            new RoadmapTask { Title = "Stack",                   Section = "algoritmos",   Description = "Push/Pop/Peek — simula call stack de função recursiva (ex: fatorial)" },
            new RoadmapTask { Title = "Queue",                   Section = "algoritmos",   Description = "FIFO — simula fila de impressão de documentos" },
            new RoadmapTask { Title = "Linked List",             Section = "algoritmos",   Description = "SinglyLinkedList com Add, Remove, Find e travessia de ponteiros" },
            new RoadmapTask { Title = "Binary Search Tree",      Section = "algoritmos",   Description = "Insert, Search, InOrder/PreOrder — visualização de nós" },
            new RoadmapTask { Title = "Graph (DFS/BFS)",         Section = "algoritmos",   Description = "Grafos de cidades — busca em profundidade e em largura" },
            new RoadmapTask { Title = "Hash Table",              Section = "algoritmos",   Description = "Colisões, load factor, open addressing vs chaining" },

            // ── Princípios ────────────────────────────────────────────────────
            new RoadmapTask { Title = "DRY",                     Section = "principios",   Description = "Antes: lógica duplicada em 3 lugares. Depois: extração para método reutilizável" },
            new RoadmapTask { Title = "KISS",                    Section = "principios",   Description = "Antes: over-engineered. Depois: solução direta e legível" },
            new RoadmapTask { Title = "YAGNI",                   Section = "principios",   Description = "Features prematuras geram débito técnico desnecessário" },
            new RoadmapTask { Title = "Code Smells",             Section = "principios",   Description = "Long Method, God Class, Feature Envy, Primitive Obsession — antes/depois" },
            new RoadmapTask { Title = "Tell Don't Ask",          Section = "principios",   Description = "Objetos devem agir, não expor estado para decisões externas" },
            new RoadmapTask { Title = "Lei de Demeter",          Section = "principios",   Description = "\"Fale apenas com seus amigos diretos\" — reduz acoplamento" },
            new RoadmapTask { Title = "Nomes Significativos",    Section = "principios",   Description = "Variáveis, métodos e classes que se auto-documentam" },
            new RoadmapTask { Title = "Refactoring Patterns",    Section = "principios",   Description = "Extract Method, Rename, Move, Replace Conditional with Polymorphism" },

            // ── Memória ───────────────────────────────────────────────────────
            new RoadmapTask { Title = "GC Stop-The-World e Struct vs Class", Section = "memoria", Description = "O GC pode pausar todas as threads (STW) durante coleta. Substituir classes por structs em dados transitórios reduz pressão no heap e diminui frequência e duração das pausas" },
            new RoadmapTask { Title = "Span<T> e Memory<T>",        Section = "memoria",      Description = "Acesso a fatias de memória sem alocação — alternativa a substrings e arrays" },
            new RoadmapTask { Title = "ArrayPool<T>",               Section = "memoria",      Description = "Pool de arrays reutilizáveis — reduz pressão de GC em hot paths" },
            new RoadmapTask { Title = "IDisposable e using",        Section = "memoria",      Description = "Padrão de liberação de recursos não gerenciados — Dispose() correto" },
            new RoadmapTask { Title = "Large Object Heap (LOH)",    Section = "memoria",      Description = "Objetos >85 KB vão para LOH — fragmentação e impacto em GC Gen2" },
            new RoadmapTask { Title = "Pinned Objects / GCHandle",  Section = "memoria",      Description = "Objetos fixados na memória para interop com código não gerenciado" },

            // ── Concorrência ──────────────────────────────────────────────────
            new RoadmapTask { Title = "LMAX Disruptor Pattern (Lock-Free)", Section = "concorrencia", Description = "Ring Buffer com sequências atômicas para mensageria inter-threads sem locks pesados — elimina filas bloqueantes e contention; base dos sistemas de trading de alta frequência" },
            new RoadmapTask { Title = "Producer-Consumer com Channel<T>", Section = "concorrencia", Description = "System.Threading.Channels — back-pressure e async pipelines de alta performance" },
            new RoadmapTask { Title = "SemaphoreSlim",           Section = "concorrencia", Description = "10 tasks competindo por 3 slots — controle de acesso a recurso limitado" },
            new RoadmapTask { Title = "async/await — Deadlocks", Section = "concorrencia", Description = "ConfigureAwait(false), .Result/.Wait() — armadilhas comuns e como evitá-las" },
            new RoadmapTask { Title = "CancellationToken",       Section = "concorrencia", Description = "Propagação correta de cancelamento em cadeia de operações async" },
            new RoadmapTask { Title = "IAsyncEnumerable",        Section = "concorrencia", Description = "Streams assíncronos com await foreach — lazy evaluation" },
            new RoadmapTask { Title = "ReaderWriterLockSlim",    Section = "concorrencia", Description = "Leituras concorrentes + escrita exclusiva — melhora throughput" },
            new RoadmapTask { Title = "Interlocked",             Section = "concorrencia", Description = "Operações atômicas sem lock — Increment, CompareExchange" },
            new RoadmapTask { Title = "TPL Dataflow",            Section = "concorrencia", Description = "Pipeline de transformação de dados — ActionBlock, TransformBlock" },

            // ── Performance — Código ──────────────────────────────────────────
            new RoadmapTask { Title = "BenchmarkDotNet",           Section = "performance", Description = "Micro-benchmarking com [Benchmark] e [MemoryDiagnoser] — throughput, alocações e latência entre implementações" },
            new RoadmapTask { Title = "String vs StringBuilder",   Section = "performance", Description = "Custo de concatenação em loop: alocação O(n²) vs O(n), GC pressure medida com BenchmarkDotNet" },
            new RoadmapTask { Title = "Span<T> em Hot Paths",      Section = "performance", Description = "Parsing sem alocação usando ReadOnlySpan<char> — comparação com string.Substring() via benchmarks" },
            new RoadmapTask { Title = "ValueTask vs Task",         Section = "performance", Description = "Evitar alocações de heap em operações frequentemente síncronas — quando cada um deve ser usado" },

            // ── Performance — Banco de Dados ──────────────────────────────────
            new RoadmapTask { Title = "Problema N+1 com EF Core",  Section = "performance", Description = "Como Include() e AsSplitQuery() eliminam queries redundantes; detecção com MiniProfiler e EXPLAIN ANALYZE" },
            new RoadmapTask { Title = "AsNoTracking()",            Section = "performance", Description = "Queries de leitura sem change tracker: redução de overhead de memória e CPU em listas grandes" },
            new RoadmapTask { Title = "Projeções com Select()",    Section = "performance", Description = "Retornar DTOs em vez de entidades completas — menos colunas, menos dados transferidos e mapeados" },
            new RoadmapTask { Title = "EF.CompileQuery()",         Section = "performance", Description = "Compiled queries para eliminar overhead de tradução LINQ em queries executadas com alta frequência" },
            new RoadmapTask { Title = "Connection Pooling Npgsql", Section = "performance", Description = "Configuração de Minimum/Maximum Pool Size, Connection Idle Lifetime e impacto em throughput sob carga" },

            // ── Performance — Processamento de Requisições ────────────────────
            new RoadmapTask { Title = "OutputCache e MemoryCache", Section = "performance", Description = "[OutputCache] no .NET 7+, IMemoryCache e IDistributedCache com Redis — política por rota e TTL" },
            new RoadmapTask { Title = "Compressão Brotli/Gzip",    Section = "performance", Description = "ResponseCompression middleware: benchmark de payloads JSON antes/depois com tamanhos e latências reais" },
            new RoadmapTask { Title = "Minimal APIs vs Controllers", Section = "performance", Description = "Diferença de overhead em throughput e latência: benchmark com Bombardier — quando cada abordagem escala melhor" },

            // ── Performance — ORMs ────────────────────────────────────────────
            new RoadmapTask { Title = "Lazy vs Eager Loading",                  Section = "performance", Description = "Armadilhas de lazy loading com proxies: N+1 silencioso, overhead de TrackChanges e uso correto de Include()" },
            new RoadmapTask { Title = "ExecuteUpdateAsync / ExecuteDeleteAsync", Section = "performance", Description = "Bulk operations no EF Core 7+ sem carregar entidades — comparação de tempo com SaveChanges em loop" },
            new RoadmapTask { Title = "Raw SQL com FromSqlRaw()",               Section = "performance", Description = "Quando sair do LINQ para queries complexas: CTEs, window functions e casos onde SQL direto supera LINQ" },

            // ── Arquiteturas ──────────────────────────────────────────────────
            new RoadmapTask { Title = "Microserviços",              Section = "arquiteturas", Description = "Decomposição por domínio (DDD bounded contexts), comunicação síncrona REST/gRPC vs assíncrona via eventos — trade-offs de escala, operação e consistência" },
            new RoadmapTask { Title = "Event-Driven Architecture",  Section = "arquiteturas", Description = "Eventos como fatos imutáveis, pub/sub desacoplado, consistência eventual — base de Microserviços, CQRS e Event Sourcing" },
            new RoadmapTask { Title = "CQRS",                       Section = "arquiteturas", Description = "Separação de modelos de leitura (Query) e escrita (Command): projeções independentes, escala assimétrica e consistência eventual" },
            new RoadmapTask { Title = "Event Sourcing",             Section = "arquiteturas", Description = "Estado derivado de log de eventos imutáveis — replay, snapshots, auditoria completa e reconstrução de projeções" },
            new RoadmapTask { Title = "Saga Pattern",               Section = "arquiteturas", Description = "Transações distribuídas sem 2PC: Choreography (eventos encadeados) vs Orchestration (orquestrador central com compensação)" },
            new RoadmapTask { Title = "API Gateway",                Section = "arquiteturas", Description = "Ponto de entrada único: roteamento, auth centralizada, rate limiting, transformação de payload e aggregation de microserviços" },
            new RoadmapTask { Title = "BFF — Backend for Frontend", Section = "arquiteturas", Description = "API especializada por tipo de cliente (web, mobile, third-party) — evita over-fetching e acoplamento entre frontend e domínio" },
            new RoadmapTask { Title = "SOA",                        Section = "arquiteturas", Description = "Service-Oriented Architecture: ESB, contratos WSDL/SOAP, orquestração centralizada — diferenças arquiteturais para microserviços" },
            new RoadmapTask { Title = "Microkernel Architecture",   Section = "arquiteturas", Description = "Core mínimo + sistema de plugins: extensibilidade sem modificar o núcleo — usado em IDEs, browsers e sistemas embarcados" },
            new RoadmapTask { Title = "Sidecar Pattern",            Section = "arquiteturas", Description = "Container auxiliar colocalizado: logs, mTLS, health check, tracing — cross-cutting concerns sem modificar o serviço principal" },
            new RoadmapTask { Title = "Strangler Fig",              Section = "arquiteturas", Description = "Migração incremental de monólito para microserviços: novas features no novo sistema, funcionalidades antigas migradas aos poucos" },
            new RoadmapTask { Title = "Service Mesh",               Section = "arquiteturas", Description = "Istio/Linkerd: observabilidade (tracing, métricas), segurança (mTLS automático) e resiliência (retry, circuit breaker) na camada de rede" },

            // ── Mensageria ────────────────────────────────────────────────────
            new RoadmapTask { Title = "RabbitMQ",                         Section = "mensageria", Description = "AMQP: exchanges, bindings, queues, consumers, prefetch count — modelo push com ACK por mensagem e roteamento rico" },
            new RoadmapTask { Title = "Apache Kafka",                     Section = "mensageria", Description = "Log distribuído imutável: partições, consumer groups, retenção configurável por tópico, offsets e exatamente uma vez" },
            new RoadmapTask { Title = "RabbitMQ vs Kafka",                Section = "mensageria", Description = "Throughput (~50k vs ~1M msg/s), garantias de entrega, replay, latência e casos de uso ideais de cada tecnologia" },
            new RoadmapTask { Title = "Exchange Types",                   Section = "mensageria", Description = "Direct (routing key exata), Fanout (broadcast), Topic (wildcards * e #), Headers — quando usar cada tipo de roteamento" },
            new RoadmapTask { Title = "Dead Letter Queue (DLQ)",          Section = "mensageria", Description = "Tratamento de mensagens rejeitadas, expiradas ou com TTL vencido — estratégias de retry, parking lot e alertas" },
            new RoadmapTask { Title = "Outbox Pattern",                   Section = "mensageria", Description = "Garantia transacional de publicação sem XA/2PC: escrita atômica em banco + relay assíncrono para o broker" },
            new RoadmapTask { Title = "Idempotência em Consumidores",     Section = "mensageria", Description = "At-least-once delivery no Kafka/RabbitMQ: deduplicação por MessageId, idempotency keys e operações naturalmente idempotentes" },
            new RoadmapTask { Title = "Consumer Groups e Particionamento", Section = "mensageria", Description = "Escalabilidade horizontal com Kafka: cada partição atendida por exatamente um consumer no grupo — paralelismo e ordering" },
            new RoadmapTask { Title = "Schema Registry",                  Section = "mensageria", Description = "Contratos Avro/Protobuf versionados: compatibilidade backward/forward, evolução de schema sem quebrar consumers" },
            new RoadmapTask { Title = "Competing Consumers",              Section = "mensageria", Description = "Múltiplos workers na mesma fila para escalar processamento — load balancing automático e prefetch para throughput ótimo" }
    ];
}
