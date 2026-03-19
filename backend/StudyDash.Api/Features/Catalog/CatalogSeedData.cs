using Microsoft.EntityFrameworkCore;
using StudyDash.Api.Features.Roadmap;

namespace StudyDash.Api.Features.Catalog;

public static class CatalogSeedData
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await SeedSectionsAsync(db);
        await SeedStudiesAsync(db);
    }

    private static async Task SeedSectionsAsync(AppDbContext db)
    {
        var allSections = BuildSections();
        var existingMap = await db.Sections.ToDictionaryAsync(s => s.Slug);

        foreach (var seed in allSections)
        {
            if (existingMap.TryGetValue(seed.Slug, out var existing))
            {
                // Upsert: mantém Id/Order personalizados, atualiza campos gerenciados pelo seed
                existing.Title       = seed.Title;
                existing.Icon        = seed.Icon;
                existing.Description = seed.Description;
                existing.Categories  = seed.Categories;
            }
            else
            {
                db.Sections.Add(seed);
            }
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedStudiesAsync(AppDbContext db)
    {
        var allStudies = BuildStudies();
        var existingMap = await db.Studies.ToDictionaryAsync(s => s.Slug);

        foreach (var seed in allStudies)
        {
            if (existingMap.TryGetValue(seed.Slug, out var existing))
            {
                // Upsert: mantém Id/Available personalizado pelo usuário, atualiza metadados do seed
                existing.Title       = seed.Title;
                existing.Icon        = seed.Icon;
                existing.Category    = seed.Category;
                existing.Description = seed.Description;
            }
            else
            {
                db.Studies.Add(seed);
            }
        }

        await db.SaveChangesAsync();
    }

    private static List<Section> BuildSections() =>
    [
        new() { Slug = "padroes",      Title = "Padrões",       Icon = "Layers",      Order = 1,
            Description  = "Padrões de design criacionais, estruturais e comportamentais — soluções reutilizáveis para problemas recorrentes de software.",
            Categories   = ["Criacional", "Estrutural", "Comportamental"] },

        new() { Slug = "algoritmos",   Title = "Algoritmos",    Icon = "BarChart2",   Order = 2,
            Description  = "Algoritmos clássicos de ordenação e busca com visualização em tempo real.",
            Categories   = ["Algoritmo"] },

        new() { Slug = "principios",   Title = "Princípios",    Icon = "Lightbulb",   Order = 3,
            Description  = "Princípios de design de software e boas práticas de Clean Code para código manutenível.",
            Categories   = ["Clean Code"] },

        new() { Slug = "memoria",      Title = "Memória",       Icon = "Cpu",         Order = 4,
            Description  = "Gerenciamento de memória no .NET — heap, stack, Garbage Collector e tipos de dados.",
            Categories   = ["Memória"] },

        new() { Slug = "concorrencia", Title = "Concorrência",  Icon = "GitBranch",   Order = 5,
            Description  = "Programação concorrente e paralela — Threads, Tasks e paralelismo no .NET.",
            Categories   = ["Concorrência"] },

        new() { Slug = "performance",  Title = "Performance",   Icon = "Gauge",       Order = 6,
            Description  = "Técnicas de alta performance no .NET — alocações, benchmarking, ORM tuning e processamento de requisições.",
            Categories   = ["Performance"] },

        new() { Slug = "arquiteturas", Title = "Arquiteturas",  Icon = "Building2",   Order = 7,
            Description  = "Estilos arquiteturais modernos — Microserviços, Event-Driven, CQRS, Saga, API Gateway e mais.",
            Categories   = ["Arquitetura"] },

        new() { Slug = "mensageria",   Title = "Mensageria",    Icon = "Mail",        Order = 8,
            Description  = "Sistemas de mensageria — RabbitMQ, Kafka, Exchange Types, DLQ, Outbox Pattern e garantias de entrega.",
            Categories   = ["Mensageria"] },

        new() { Slug = "cache",        Title = "Cache",         Icon = "Database",    Order = 9,
            Description  = "Estratégias de cache distribuído — Cache-Aside, Write-Through, Write-Behind, Redis e invalidação.",
            Categories   = ["Cache"] },
    ];

    private static List<Study> BuildStudies() =>
    [
        // ── Criacional ──────────────────────────────────────────────────────────
        new() { Slug = "builder",            Title = "Builder",                   Category = "Criacional",     Order = 1,  Available = true,
            Icon        = "Hammer",
            Description = "Separa a construção de um objeto complexo de sua representação, permitindo criar diferentes representações com o mesmo processo." },

        new() { Slug = "singleton",          Title = "Singleton",                 Category = "Criacional",     Order = 2,  Available = true,
            Icon        = "Lock",
            Description = "Garante que uma classe tenha apenas uma instância e fornece um ponto de acesso global a ela." },

        new() { Slug = "factory-method",     Title = "Factory Method",            Category = "Criacional",     Order = 3,  Available = false,
            Icon        = "Factory",
            Description = "Define uma interface para criar objetos, mas deixa as subclasses decidirem qual classe instanciar." },

        // ── Comportamental ──────────────────────────────────────────────────────
        new() { Slug = "observer",           Title = "Observer",                  Category = "Comportamental", Order = 4,  Available = false,
            Icon        = "Eye",
            Description = "Define uma dependência um-para-muitos entre objetos, notificando automaticamente os dependentes quando um objeto muda de estado." },

        new() { Slug = "strategy",           Title = "Strategy",                  Category = "Comportamental", Order = 5,  Available = false,
            Icon        = "Shuffle",
            Description = "Define uma família de algoritmos, encapsula cada um deles e os torna intercambiáveis." },

        // ── Estrutural ──────────────────────────────────────────────────────────
        new() { Slug = "decorator",          Title = "Decorator",                 Category = "Estrutural",     Order = 6,  Available = false,
            Icon        = "Paintbrush",
            Description = "Anexa responsabilidades adicionais a um objeto dinamicamente, fornecendo uma alternativa flexível à herança." },

        // ── Algoritmos ──────────────────────────────────────────────────────────
        new() { Slug = "bubble-sort",        Title = "Bubble Sort",               Category = "Algoritmo",      Order = 7,  Available = true,
            Icon        = "ArrowUpDown",
            Description = "Algoritmo de ordenação que compara pares adjacentes e troca os que estão fora de ordem — visualização em tempo real com gráfico de barras." },

        new() { Slug = "merge-sort",         Title = "Merge Sort",                Category = "Algoritmo",      Order = 8,  Available = true,
            Icon        = "GitMerge",
            Description = "Algoritmo de ordenação por divisão e conquista que divide a lista em metades, ordena cada uma e as mescla recorrentemente." },

        new() { Slug = "binary-search",      Title = "Binary Search",             Category = "Algoritmo",      Order = 9,  Available = false,
            Icon        = "Search",
            Description = "Algoritmo eficiente de busca que divide o espaço de busca pela metade a cada iteração — O(log n)." },

        // ── Clean Code ──────────────────────────────────────────────────────────
        new() { Slug = "solid",              Title = "Princípios SOLID",          Category = "Clean Code",     Order = 10, Available = true,
            Icon        = "GraduationCap",
            Description = "Os cinco princípios fundamentais do design orientado a objetos para código limpo e manutenível." },

        new() { Slug = "di-lifetimes",       Title = "DI Lifetimes",              Category = "Clean Code",     Order = 11, Available = true,
            Icon        = "FlaskConical",
            Description = "Entenda as diferenças cruciais entre os ciclos de vida Transient, Scoped e Singleton no .NET." },

        new() { Slug = "oop-pillars",        Title = "4 Pilares da POO",          Category = "Clean Code",     Order = 12, Available = true,
            Icon        = "BookOpen",
            Description = "Os quatro pilares fundamentais da Programação Orientada a Objetos: Encapsulamento, Abstração, Herança e Polimorfismo — com exemplos práticos em C#." },

        new() { Slug = "grasp",              Title = "Princípios GRASP",          Category = "Clean Code",     Order = 13, Available = true,
            Icon        = "Target",
            Description = "Os 9 padrões de atribuição de responsabilidade de Craig Larman: IE, Creator, Controller, Low Coupling, High Cohesion, Polymorphism, Pure Fabrication, Indirection e Protected Variations." },

        // ── Memória ─────────────────────────────────────────────────────────────
        new() { Slug = "heap-stack",         Title = "Heap vs Stack",             Category = "Memória",        Order = 12, Available = true,
            Icon        = "Server",
            Description = "Entenda onde o .NET aloca tipos de valor (stack) e tipos de referência (heap), o custo de boxing/unboxing e como medir tamanhos reais." },

        new() { Slug = "garbage-collection", Title = "Garbage Collection",        Category = "Memória",        Order = 13, Available = true,
            Icon        = "RefreshCw",
            Description = "Veja o GC em ação: gerações Gen0/Gen1/Gen2, GC.Collect() forçado, contadores de coleta e comportamento de WeakReference." },

        new() { Slug = "record-class-struct",Title = "Record vs Class vs Struct", Category = "Memória",        Order = 14, Available = true,
            Icon        = "Boxes",
            Description = "Compare semântica de igualdade, cópia e alocação de memória entre os três tipos principais do C# — com medição real via GC.GetTotalMemory()." },

        // ── Concorrência ────────────────────────────────────────────────────────
        new() { Slug = "thread-task",        Title = "Thread vs Task",            Category = "Concorrência",   Order = 15, Available = true,
            Icon        = "Terminal",
            Description = "Compare Thread manual e Task.Run — veja ManagedThreadId, timing e por que Task é a escolha preferida em código .NET moderno." },

        new() { Slug = "parallel-tasks",     Title = "Parallel Tasks",            Category = "Concorrência",   Order = 16, Available = true,
            Icon        = "Zap",
            Description = "Parallel.For, Parallel.ForEach e Task.WhenAll em ação — com baseline sequencial, speedup calculado e IDs de thread do pool." },

        // ── Performance ─────────────────────────────────────────────────────────
        new() { Slug = "value-task",         Title = "ValueTask vs Task",         Category = "Performance",    Order = 17, Available = true,
            Icon        = "TrendingUp",
            Description = "ValueTask<T> é uma struct que evita alocações heap no caminho síncrono — ideal para hot paths com resultado frequentemente em cache. Benchmark real de alocações e armadilhas que você precisa conhecer." },

        // ── Arquitetura ─────────────────────────────────────────────────────────
        new() { Slug = "event-driven",       Title = "Event-Driven Architecture", Category = "Arquitetura",    Order = 18, Available = true,
            Icon        = "Radio",
            Description = "Eventos como fatos imutáveis: pub/sub desacoplado, múltiplos handlers independentes, consistência eventual — simulação de order flow com event bus em memória." },

        new() { Slug = "microservices",      Title = "Microserviços",             Category = "Arquitetura",    Order = 19, Available = false,
            Icon        = "LayoutGrid",
            Description = "Decomposição por domínio, comunicação síncrona (REST/gRPC) vs assíncrona (eventos) — trade-offs de escala e operação." },

        new() { Slug = "cqrs",               Title = "CQRS",                      Category = "Arquitetura",    Order = 20, Available = false,
            Icon        = "ArrowLeftRight",
            Description = "Separação de modelos de leitura e escrita — Command/Query segregation, projeções independentes e consistência eventual." },

        // ── Mensageria ──────────────────────────────────────────────────────────
        new() { Slug = "exchange-patterns",     Title = "Exchange Patterns",          Category = "Mensageria", Order = 21, Available = true,
            Icon        = "Send",
            Description = "Direct, Fanout e Topic exchanges do RabbitMQ simulados em memória — roteamento de mensagens em ação com comparação RabbitMQ vs Kafka." },

        new() { Slug = "dlq",                   Title = "Dead Letter Queue",          Category = "Mensageria", Order = 22, Available = true,
            Icon        = "Inbox",
            Description = "DLQ com RabbitMQ real via AMQP: declara topologia, publica mensagens, simula falhas com BasicNack(requeue:false) e drena a dead-letter queue com headers x-death." },

        new() { Slug = "competing-consumers",   Title = "Competing Consumers",        Category = "Mensageria", Order = 23, Available = true,
            Icon        = "Users",
            Description = "3 workers competindo pela mesma fila RabbitMQ — round-robin com prefetchCount=1, speedup paralelo vs sequencial e escalonamento horizontal sem mudar o producer." },

        new() { Slug = "consumer-groups",       Title = "Consumer Groups",            Category = "Mensageria", Order = 24, Available = true,
            Icon        = "Network",
            Description = "Consumer Groups do Kafka com replay: dois grupos independentes lendo o mesmo log a partir do offset 0 — demonstra a diferença fundamental entre Kafka e RabbitMQ." },

        new() { Slug = "kafka-vs-rabbitmq",     Title = "Kafka vs RabbitMQ",          Category = "Mensageria", Order = 25, Available = false,
            Icon        = "Scale",
            Description = "Comparação de throughput, garantias de entrega, replay de mensagens e casos de uso ideais de cada tecnologia." },

        new() { Slug = "outbox-pattern",        Title = "Outbox Pattern",             Category = "Mensageria", Order = 26, Available = false,
            Icon        = "ArrowUpFromLine",
            Description = "Garantia transacional de publicação sem XA/2PC — escrita atômica em banco + relay para broker." },

        // ── Cache ────────────────────────────────────────────────────────────────
        new() { Slug = "cache-aside",           Title = "Cache-Aside Pattern",        Category = "Cache",      Order = 27, Available = true,
            Icon        = "Database",
            Description = "Cache-Aside com Redis real: MISS (200ms de banco) → SET no Redis → HIT (< 5ms) → expiração por TTL → ciclo. Compara Cache-Aside, Write-Through, Write-Behind e Read-Through." },
    ];
}
