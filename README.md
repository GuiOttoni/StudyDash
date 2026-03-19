# StudyDash

Dashboard educacional interativo para estudo de conceitos de engenharia de software em .NET e C#.
Cada tópico tem explicação, exemplos de código com syntax highlighting (Shiki) e uma demonstração
ao vivo via **Server-Sent Events** que executa o código real no backend.

---

## Stack

| Camada      | Tecnologia                                                  |
|-------------|-------------------------------------------------------------|
| Frontend    | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 |
| Highlight   | Shiki (server-side, zero JS no cliente)                     |
| Ícones      | Lucide React (registry curado, tree-shaking seguro)         |
| Backend API | .NET 10, ASP.NET Core Minimal APIs, EF Core 9               |
| Worker      | .NET 10, BackgroundService (RabbitMQ + Kafka consumers)     |
| Banco       | PostgreSQL 16 (via Docker Compose)                          |
| Mensageria  | RabbitMQ 3 (AMQP real) + Apache Kafka 3.8 (KRaft)          |
| Streaming   | Server-Sent Events (SSE)                                    |

---

## Como rodar

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)

### Com Docker Compose (recomendado)

```bash
docker compose up --build
```

| Serviço               | URL                                        |
|-----------------------|--------------------------------------------|
| Frontend              | <http://localhost:3055>                    |
| Backend API           | <http://localhost:5055>                    |
| API Docs (Scalar)     | <http://localhost:5055/scalar>             |
| RabbitMQ Management   | <http://localhost:15672> (studydash/studydash) |
| Kafka (externo)       | `localhost:9094`                           |

> Para parar: `docker compose down`

### Em desenvolvimento local

```bash
# 1. Infraestrutura (banco + brokers)
docker compose up -d db rabbitmq kafka

# 2. Backend API
cd backend/StudyDash.Api
dotnet run
# Disponível em http://localhost:5055

# 3. Worker (em outro terminal)
cd backend/StudyDash.WorkerApi
dotnet run

# 4. Frontend
cd frontend
npm install
npm run dev
# Disponível em http://localhost:3000
```

---

## Conteúdo disponível

### Princípios

| Slug            | Título               | Demo SSE |
|-----------------|----------------------|:--------:|
| `solid`         | Princípios SOLID     | ✓        |
| `oop-pillars`   | 4 Pilares da POO     | ✓        |
| `grasp`         | Princípios GRASP     | ✓        |
| `di-lifetimes`  | DI Lifetimes         | ✓        |

### Padrões GoF

| Slug        | Título    | Demo SSE |
|-------------|-----------|:--------:|
| `builder`   | Builder   | ✓        |
| `singleton` | Singleton | ✓        |

### Algoritmos

| Slug          | Título      | Demo SSE |
|---------------|-------------|:--------:|
| `bubble-sort` | Bubble Sort | ✓        |
| `merge-sort`  | Merge Sort  | ✓        |

### Memória

| Slug                   | Título                    | Demo SSE |
|------------------------|---------------------------|:--------:|
| `heap-stack`           | Heap vs Stack             | ✓        |
| `garbage-collection`   | Garbage Collection        | ✓        |
| `record-class-struct`  | Record vs Class vs Struct | ✓        |

### Concorrência

| Slug             | Título          | Demo SSE |
|------------------|-----------------|:--------:|
| `thread-task`    | Thread vs Task  | ✓        |
| `parallel-tasks` | Parallel Tasks  | ✓        |

### Performance

| Slug         | Título            | Demo SSE |
|--------------|-------------------|:--------:|
| `value-task` | ValueTask vs Task | ✓        |

### Arquiteturas

| Slug           | Título                    | Demo SSE |
|----------------|---------------------------|:--------:|
| `event-driven` | Event-Driven Architecture | ✓        |

### Mensageria

| Slug                | Título                        | Demo SSE | Infra real |
|---------------------|-------------------------------|:--------:|:----------:|
| `exchange-patterns` | Exchange Patterns (simulado)  | ✓        |            |
| `dlq`               | Dead Letter Queue             | ✓        | ✓ RabbitMQ |

---

## Arquitetura do Backend — Vertical Slices + Módulo de Mensageria

```
backend/
├── StudyDash.Messaging/           ← class library compartilhada
│   ├── MessagingExtensions.cs     ← AddMessaging() — entry point DI
│   ├── MessagingOptions.cs
│   ├── RabbitMq/
│   │   ├── RabbitMqOptions.cs
│   │   └── RabbitMqConnectionManager.cs   ← singleton, async lazy-init
│   └── Kafka/
│       ├── KafkaOptions.cs
│       └── KafkaProducerService.cs        ← singleton IProducer<string,string>
│
├── StudyDash.Api/                 ← ASP.NET Core Minimal APIs
│   ├── Features/
│   │   ├── Catalog/               ← CRUD Seções e Studies (PostgreSQL + EF Core)
│   │   ├── Roadmap/               ← Tasks do roadmap + AppDbContext
│   │   ├── Principles/
│   │   ├── Patterns/
│   │   ├── Algorithms/
│   │   ├── Memory/
│   │   ├── Concurrency/
│   │   ├── Performance/
│   │   ├── Arquiteturas/
│   │   └── Mensageria/
│   │       ├── Exchanges/         ← GET /api/mensageria/exchanges/run (simulado)
│   │       └── Dlq/               ← GET /api/mensageria/dlq/run (AMQP real)
│   └── Program.cs                 ← registra todos os slices via MapXxxFeature()
│
└── StudyDash.WorkerApi/           ← .NET Worker Service (consumers em background)
    ├── Workers/
    │   ├── RabbitMqOrderWorker.cs ← consome studydash.orders; 30% falha → DLQ
    │   └── KafkaStudyEventWorker.cs ← consumer group studydash-workers
    └── Program.cs
```

### Módulo de mensageria (`StudyDash.Messaging`)

Registrado em ambos os projetos com uma única chamada:

```csharp
builder.Services.AddMessaging(builder.Configuration);
```

Provê:

- `RabbitMqConnectionManager` — singleton com async lazy-init via `SemaphoreSlim`; canais criados por-request com `CreateChannelAsync()`
- `KafkaProducerService` — singleton thread-safe com `Flush(5s)` no dispose

### Cada slice expõe um extension method sobre `IEndpointRouteBuilder`

```csharp
// Program.cs
app.MapBuilderFeature();
app.MapDlqFeature();
// ...

// Features/Mensageria/Dlq/DlqFeature.cs
public static class DlqFeature
{
    public static void MapDlqFeature(this IEndpointRouteBuilder app)
        => app.MapGet("/api/mensageria/dlq/run", RunAsync)
              .WithTags("Mensageria");
}
```

---

## Arquitetura do Frontend — RSC + Client Islands

```
page.tsx (RSC — Server Component)
├── AlgorithmLayout / custom layout   ← RSC: título, badge, explicação
├── blocos <code> via Shiki           ← RSC: highlight zero JS no cliente
├── SourceLinks                       ← RSC: links externos
└── LogRunSection                     ← Client Component: SSE, estado, EventSource
```

---

## Arquitetura de Streaming (SSE)

```
Browser              Next.js :3055          .NET API :5055
  │                       │                      │
  │── GET /patterns/dlq ──▶│                      │
  │◀── HTML estático ──────│                      │
  │                       │                      │
  │── new EventSource() ───────────────────────▶ │
  │◀──────────── data: » Fase 1 — Declarando... ─ │  (AMQP real com RabbitMQ)
  │◀──────────── data:   ✓ Exchange declarado... ─ │
  │◀──────────── data: [DONE] ─────────────────── │
  │── es.close() ──────────│                      │
```

---

## Server-Driven UI

A navegação e os metadados dos cards são controlados pelo backend:

```
GET /api/sections           → lista de seções ordenadas
GET /api/studies?section=   → studies filtrados por seção
```

O frontend (Next.js RSC) faz fetch server-side — sem BFF separado.
Para adicionar um novo conteúdo:

1. Inserir o Study via `/admin` ou `CatalogSeedData.cs`
2. Criar `app/patterns/{slug}/page.tsx`
3. Criar `Features/{categoria}/{nome}Feature.cs` com a rota SSE

Zero mudanças em union types, navegação ou componentes existentes.

---

## Admin

Acesse `/admin` para gerenciar Seções e Studies via interface visual:

- Criar, editar e remover seções e studies
- Select de ícones Lucide com preview ao vivo
- Toggle Disponível/Bloqueado por study

---

## Variáveis de ambiente

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5055
```

### Backend (`backend/StudyDash.Api/appsettings.json`)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=studydash;Username=studydash;Password=studydash"
  },
  "Messaging": {
    "RabbitMq": { "Host": "localhost", "Port": 5672, "Username": "studydash", "Password": "studydash" },
    "Kafka": { "BootstrapServers": "localhost:9094" }
  }
}
```

> Em Docker, as variáveis `Messaging__RabbitMq__Host=rabbitmq` e `Messaging__Kafka__BootstrapServers=kafka:9092` sobrescrevem os defaults via env vars do `docker-compose.yml`.

---

## Observar o Worker em tempo real

```bash
docker logs studydash-worker -f
```

Exemplo de saída:

```text
[RabbitMqOrderWorker] 10 pedidos publicados em 'studydash.orders.exchange'.
[RabbitMqOrderWorker] ACK  → orderId=1 processado com sucesso
[RabbitMqOrderWorker] NACK → orderId=3 falhou processamento → DLQ
[KafkaStudyEventWorker] EVENT recebido → key=user-1 offset=0 | {"tipo":"study.started",...}
```

---

Veja [CHANGES.md](CHANGES.md) para o histórico detalhado de alterações.
