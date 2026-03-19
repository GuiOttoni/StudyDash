# StudyDash — Changelog

---

## [Unreleased] — 2026-03-19 (Mensageria real)

### Infraestrutura — RabbitMQ + Kafka no Docker Compose

#### `docker-compose.yml`

- Novo serviço `rabbitmq` (`rabbitmq:3-management-alpine`) com healthcheck via `rabbitmq-diagnostics ping`
  - Porta `5672` (AMQP) e `15672` (Management UI — `studydash/studydash`)
- Novo serviço `kafka` (`apache/kafka:3.8.0`) em modo KRaft (sem Zookeeper)
  - Listener interno `PLAINTEXT://kafka:9092` para containers
  - Listener externo `EXTERNAL://localhost:9094` para acesso do host
  - Auto-criação de tópicos habilitada
- Novo serviço `worker` (StudyDash.WorkerApi) com `depends_on` em `rabbitmq` e `kafka`
- Serviço `backend` atualizado: `depends_on` agora inclui `rabbitmq` e `kafka` (ambos `service_healthy`)
- Variáveis `Messaging__RabbitMq__*` e `Messaging__Kafka__BootstrapServers` injetadas via env em `backend` e `worker`

---

### Backend — `StudyDash.Messaging` (class library compartilhada)

Nova class library `StudyDash.Messaging` referenciada por `StudyDash.Api` e `StudyDash.WorkerApi`.
Registrada com `builder.Services.AddMessaging(builder.Configuration)`.

#### `StudyDash.Messaging/MessagingOptions.cs`

- POCO raiz com `SectionName = "Messaging"`; agrega `RabbitMqOptions` e `KafkaOptions`

#### `StudyDash.Messaging/RabbitMq/RabbitMqConnectionManager.cs`

- Singleton com async double-checked lock via `SemaphoreSlim`
- `GetConnectionAsync()` — lazy-init; reutiliza conexão aberta
- `CreateChannelAsync()` — cria `IChannel` por-request (canais não são thread-safe no v7)
- Implementa `IAsyncDisposable` — fecha `IConnection` no shutdown do host

#### `StudyDash.Messaging/Kafka/KafkaProducerService.cs`

- Singleton `IProducer<string, string>` com `ProducerConfig` (Acks=Leader, timeout=10s)
- `ProduceAsync(topic, key, value)` — thread-safe, retorna `DeliveryResult` com offset
- `Dispose()` chama `Flush(5s)` antes de descartar o producer

#### `StudyDash.Messaging/MessagingExtensions.cs`

- `AddMessaging(IServiceCollection, IConfiguration)` — registra `Configure<MessagingOptions>`, `RabbitMqConnectionManager` e `KafkaProducerService` como singletons

---

### Backend — `StudyDash.WorkerApi` (Worker Service)

Novo projeto `.NET 10 Worker Service` que consome filas e tópicos reais em background.
Referencia `StudyDash.Messaging` como `ProjectReference`.

#### `Workers/RabbitMqOrderWorker.cs`

- `BackgroundService` que declara topologia AMQP na inicialização:
  - Exchange `studydash.orders.exchange` (direct) → fila `studydash.orders`
  - `x-dead-letter-exchange = studydash.dlq.exchange` na fila principal
  - Exchange `studydash.dlq.exchange` (fanout) → fila `studydash.orders.dead`
- Publica 10 pedidos de exemplo ao iniciar
- Consome via `AsyncEventingBasicConsumer` com `prefetchCount=1`
- Lógica de falha simulada: `orderId % 3 == 0` → `BasicNack(requeue:false)` → DLQ
- Logs estruturados por ACK/NACK visíveis com `docker logs studydash-worker -f`

#### `Workers/KafkaStudyEventWorker.cs`

- `BackgroundService` com consumer group `studydash-workers`, `AutoOffsetReset=Earliest`, commit manual
- Publica 5 eventos de exemplo ao iniciar (`study.started`, `study.completed`, `study.paused`)
- Loop de consume com `Task.Run(() => consumer.Consume(timeout))` respeitando `stoppingToken`
- `consumer.Close()` garantido no `finally`

#### `StudyDash.WorkerApi/Dockerfile`

- Build multi-estágio: copia e restaura `StudyDash.Messaging` antes de `StudyDash.WorkerApi`
- Runtime: `mcr.microsoft.com/dotnet/runtime:10.0` (sem ASP.NET — worker puro)

---

### Backend — `StudyDash.Api`

#### `Features/Mensageria/Dlq/DlqFeature.cs` (novo)

- `GET /api/mensageria/dlq/run` (SSE) com AMQP real via `RabbitMqConnectionManager`
- Canal criado por-request via `await using var channel = await cm.CreateChannelAsync(ct)`
- **Fase 1:** declara exchanges e filas temporárias (`dlq.demo.*`) com `x-dead-letter-*`
- **Fase 2:** publica 5 pedidos com `BasicProperties` (Transient, ContentType=json)
- **Fase 3:** consome via `BasicGetAsync` (pull mode — evita conflito de thread com SSE);
  `orderId` par → `BasicAckAsync`; ímpar → `BasicNackAsync(requeue:false)` → DLQ
- **Fase 4:** drena `dlq.demo.dead` e exibe headers `x-death` (reason, count, queue, exchange)
- **Fase 5:** deleta filas e exchanges temporários; explica o pattern e aponta para o Worker

#### `StudyDash.Api/Program.cs`

- `+using StudyDash.Messaging` e `+using StudyDash.Api.Features.Mensageria.Dlq`
- `builder.Services.AddMessaging(builder.Configuration)` após `AddDbContext`
- `app.MapDlqFeature()` na seção Mensageria

#### `StudyDash.Api.csproj`

- `<ProjectReference Include="..\StudyDash.Messaging\StudyDash.Messaging.csproj" />`
- Pacotes `RabbitMQ.Client` e `Confluent.Kafka` agora vêm transitivamente via `StudyDash.Messaging`

#### `appsettings.json`

- Seção `Messaging` adicionada com defaults localhost para desenvolvimento local

#### `Dockerfile` (backend)

- Atualizado para copiar e restaurar `StudyDash.Messaging` antes de `StudyDash.Api`

---

### Solução

#### `StudyDash.Api.slnx`

- Adicionados `StudyDash.Messaging` e `StudyDash.WorkerApi` à solução

---

## [Unreleased] — 2026-03-19

### Princípios — Página GRASP

Nova página educacional completa para os **9 Princípios GRASP** de Craig Larman.

#### `Features/Principles/Grasp/GraspFeature.cs`

- `GET /api/principles/grasp/run` (SSE)
- Demonstra os 9 princípios com classes C# reais instanciadas em memória:
  - **IE (Information Expert)**: `GraspInvoice.Total()` — quem tem os dados calcula
  - **Cr (Creator)**: `GraspOrder.AddLine()` — agregador cria e valida seus componentes
  - **Ct (Controller)**: `GraspCheckoutController` — recebe evento e delega ao domínio
  - **LC (Low Coupling)**: `GraspLCOrderService(IGraspPaymentGateway, IGraspMailSender)` — Stripe vs PayPal transparente
  - **HC (High Cohesion)**: `PriceCalculator`, `OrderRepo`, `OrderMailer` — 1 responsabilidade cada
  - **Po (Polymorphism)**: `IGraspDiscount` — Percentage, Fixed, Vip, No — zero if/switch
  - **PF (Pure Fabrication)**: `GraspProductRepository` — domínio puro + infraestrutura isolada
  - **In (Indirection)**: `GraspEventBus` com `Func<string, string>` — Publisher não conhece Subscribers
  - **PV (Protected Variations)**: `IGraspStorageProvider` — Local vs S3 transparente

#### `frontend/app/patterns/grasp/page.tsx`

- Layout custom (mesmo padrão de `solid/page.tsx`) com Shiki para highlight de código
- 9 cards coloridos com badge abreviado (IE, Cr, Ct, LC, HC, Po, PF, In, PV)
- Cada card: descrição, exemplo ✗ ruim / ✓ correto, bloco C# detalhado
- `LogRunSection` SSE conectado a `/api/principles/grasp/run`
- `Target` adicionado ao registry de ícones Lucide (`components/ui/Icon.tsx`)

#### `Features/Catalog/CatalogSeedData.cs`

- Novo Study: `{ slug: "grasp", title: "Princípios GRASP", icon: "Target", order: 13 }`

---

## [Unreleased] — 2026-03-18 (Fase 2)

### Sistema de Ícones Lucide

Migração completa de emojis para ícones vetoriais **Lucide React** em toda a interface.

#### `frontend/components/ui/Icon.tsx` (novo)

- Registry curado `Record<string, LucideIcon>` com ~36 ícones importados explicitamente (tree-shaking seguro)
- Componente `<Icon name="Hammer" size={24} />` com fallback para `HelpCircle` em nomes desconhecidos
- Export `ICON_NAMES: string[]` — lista ordenada de nomes para dropdowns no Admin

#### Arquivos migrados

Todos os `<span className="text-4xl">{emoji}</span>` substituídos por `<Icon name={lucideName} />`:

- `SiteHeader.tsx` — ícones de seção na navegação lateral
- `app/page.tsx` — ícones nos cards da home
- `app/padroes`, `algoritmos`, `principios`, `memoria`, `concorrencia`, `performance`, `arquiteturas`, `mensageria` — headers de seção
- `components/patterns/AlgorithmLayout.tsx` — header de cada pattern page
- `app/roadmap/page.tsx` — ícones de seção na timeline
- 15 pattern pages — prop `icon=` migrada de emoji para nome Lucide:
  - `di-lifetimes` → `FlaskConical`, `parallel-tasks` → `Zap`, `record-class-struct` → `Boxes`
  - `value-task` → `TrendingUp`, `exchange-patterns` → `Send`, `thread-task` → `Terminal`
  - `bubble-sort` → `ArrowUpDown`, `merge-sort` → `GitMerge`, `singleton` → `Lock`
  - `template` → `Star`, `builder` → `Hammer`, `event-driven` → `Radio`
  - `heap-stack` → `Server`, `garbage-collection` → `RefreshCw`, `solid` → `GraduationCap`

---

### Catalog — Persistência PostgreSQL

Substituiu o `NavFeature.cs` estático por entidades persistidas em banco de dados.

#### `Features/Catalog/Section.cs` e `Study.cs`

- Entidades EF Core com `Slug` (unique), `Title`, `Icon`, `Description`, `Order`, `Available`
- `Section` tem array `Categories string[]` (JSON column no Postgres)
- `Study` pertence a uma seção pelo campo `Category`

#### `Features/Catalog/SectionsFeature.cs`

- `GET /api/sections` → lista todas as seções ordenadas por `Order`
- `POST /api/sections` → cria nova seção
- `PUT /api/sections/{slug}` → atualiza seção existente
- `DELETE /api/sections/{slug}` → remove seção

#### `Features/Catalog/StudiesFeature.cs`

- `GET /api/studies?section={slug}` → lista studies filtrados por categoria, ordenados por `Order`
- `POST /api/studies` → cria novo study
- `PUT /api/studies/{slug}` → atualiza study (toggle `Available`, editar metadados)
- `DELETE /api/studies/{slug}` → remove study

#### `Features/Catalog/CatalogSeedData.cs` — seed inicial

- Upsert idempotente na inicialização: `SeedAsync(db)` preserva `Id`, `Order` e `Available` customizados pelo usuário
- 8 seções e 23 studies pré-configurados com ícones Lucide e descrições

#### `Features/Roadmap/AppDbContext.cs`

- `DbSet<Section>`, `DbSet<Study>`, `DbSet<RoadmapTask>`
- Migrations automáticas com `EnsureCreatedAsync` na inicialização
- Configuração do Postgres via `appsettings.json`

---

### Admin — Painel de Gerenciamento

#### `frontend/app/admin/page.tsx` (novo)

- Página `"use client"` com CRUD completo para Seções e Studies
- Tabela de seções: ícone Lucide, slug, título, categorias, ordem — botões editar/excluir
- Tabela de studies: ícone, slug, título, categoria, ordem, badge Disponível/Bloqueado
- `SectionFormModal`: campos Slug, Título, Descrição, Categorias, Ícone (select Lucide + preview ao vivo)
- `StudyFormModal`: campos Slug, Título, Descrição, Categoria (select), Ordem, Disponível (toggle), Ícone (select + preview)
- Feedback otimista: listas atualizadas imediatamente após cada operação

---

### Novas Páginas de Conteúdo

#### `Features/Principles/OopPillars/OopPillarsFeature.cs`

- `GET /api/principles/oop-pillars/run` (SSE)
- Demonstra os 4 pilares da POO com classes C# reais:
  - **Encapsulamento**: `BankAccount` com saldo privado e validação de saque
  - **Abstração**: `IShape` / `Circle` / `Rectangle` — interface oculta implementação
  - **Herança**: `Animal` → `Dog` / `Cat` com `override`
  - **Polimorfismo**: mesmo loop, comportamento diferente por tipo

#### `frontend/app/patterns/oop-pillars/page.tsx` (novo)

- 4 cards coloridos (Azul/Emeralda/Violeta/Rosa) com Shiki + `LogRunSection`

#### `Features/Performance/ValueTask/ValueTaskFeature.cs`

- `GET /api/performance/value-task/run` (SSE)
- Benchmark real de alocações: `Task<T>` vs `ValueTask<T>` no caminho síncrono (cache hit)
- Demonstra armadilhas: `await` múltiplo, conversão para `Task`, boxing com `IValueTaskSource`

#### `frontend/app/patterns/value-task/page.tsx` (novo)

- `AlgorithmLayout` com tabela comparativa Task vs ValueTask, quando usar, e `LogRunSection`

#### `frontend/app/performance/page.tsx` (novo)

- Section page para Performance — mesmo padrão das demais seções

---

### Componentes UI — StudyCard e StudyGrid

#### `frontend/components/dashboard/StudyCard.tsx` (novo)

Substitui `PatternCard.tsx` com tipagem `StudyDto`:

- Badge de categoria com `getCategoryColor()`
- Ícone Lucide via `<Icon name={study.icon} />`
- Estado visual Disponível / Em breve (overlay + lock)
- Link para `/patterns/{study.slug}` somente se disponível

#### `frontend/components/dashboard/StudyGrid.tsx` (novo)

Substitui `PatternGrid.tsx`:

- Agrupa studies por categoria, renderiza seção por seção
- Recebe `studies: StudyDto[]` em vez de tipagem estática

---

## [Unreleased] — 2026-03-18 (Fase 1)

### Arquitetura: Server-Driven UI

Removido o arquivo `frontend/lib/patterns-data.ts` que era a fonte de verdade estática
da navegação e dos cards. O backend agora controla quais seções e estudos existem.

**Motivação:** Adicionar uma nova seção anteriormente exigia alterar union types TypeScript,
arrays hardcoded e o mapeamento de cores no frontend. Com SDUI, só o backend muda.

**Decisão BFF:** Não foi criado um serviço BFF separado. O `StudyDash.Api` já serve como
BFF natural via Next.js RSC (Server Components fazem fetch server-side). A extração de um
BFF só fará sentido se houver múltiplos clients (mobile, third-party) com necessidades
divergentes.

### Backend — Novos arquivos

#### `Features/Arquiteturas/EventDriven/EventDrivenFeature.cs`

- `GET /api/arquiteturas/event-driven/run` (SSE)
- Simula event bus em memória com `Dictionary<Type, List<Func<object, Task>>>`
- Fluxo: `OrderPlaced` → PaymentHandler → `PaymentProcessedEvent` → EmailHandler
- Demonstra: desacoplamento, falha isolada de handler, cascata de eventos
- Domain events como C# records: `OrderPlacedEvent`, `PaymentProcessedEvent`, `InventoryReservedEvent`

#### `Features/Mensageria/Exchanges/ExchangePatternsFeature.cs`

- `GET /api/mensageria/exchanges/run` (SSE)
- Simula os 3 tipos de exchange do RabbitMQ sem infra real:
  - **Direct**: routing key exata
  - **Fanout**: broadcast para todas as filas
  - **Topic**: wildcards `*` (1 palavra) e `#` (N palavras) com algoritmo de matching AMQP
- Comparação final RabbitMQ vs Kafka (throughput, retenção, replay, ordering)

### Backend — Arquivos modificados

#### `Features/Roadmap/RoadmapSeedData.cs`

Adicionadas **22 novas tarefas** ao seed:

**Arquiteturas (12 tasks):**
Microserviços, Event-Driven Architecture, CQRS, Event Sourcing, Saga Pattern,
API Gateway, BFF, SOA, Microkernel Architecture, Sidecar Pattern, Strangler Fig, Service Mesh

**Mensageria (10 tasks):**
RabbitMQ, Apache Kafka, RabbitMQ vs Kafka, Exchange Types, Dead Letter Queue (DLQ),
Outbox Pattern, Idempotência em Consumidores, Consumer Groups e Particionamento,
Schema Registry, Competing Consumers

#### `Program.cs`

- `+using` para EventDriven, Exchanges, Catalog, OopPillars, Grasp
- `app.MapEventDrivenFeature()`
- `app.MapExchangePatternsFeature()`
- `app.MapSectionsFeature()` + `app.MapStudiesFeature()`
- `app.MapOopPillarsFeature()` + `app.MapGraspFeature()`

### Frontend — Novos arquivos

#### `lib/types.ts`

Interfaces `SectionDto` e `PatternDto` sem union types — campos são `string` puros.
Substituem `PatternCategory`, `SectionMeta` e `PatternMeta` do arquivo removido.

#### `lib/category-colors.ts`

`Record<string, string>` com fallback para categorias desconhecidas.
Exporta `getCategoryColor(category: string): string`.
Tailwind classes completas garantem que o purging inclua todas as cores no bundle.

#### `lib/api.ts`

- `getSections(): Promise<SectionDto[]>` — fetch com `revalidate: 3600`, fallback `[]`
- `getPatterns(section?: string): Promise<PatternDto[]>` — suporte a filtro por seção

#### `app/arquiteturas/page.tsx`

Section page para a nova seção Arquiteturas — mesmo padrão das demais.

#### `app/mensageria/page.tsx`

Section page para a nova seção Mensageria.

#### `app/patterns/event-driven/page.tsx`

Pattern page: `AlgorithmLayout` com comparação Tight Coupling vs Event-Driven,
3 cards de trade-offs e `LogRunSection` apontando para o SSE demo.

#### `app/patterns/exchange-patterns/page.tsx`

Pattern page: `AlgorithmLayout` com cards dos 3 tipos de exchange (Direct/Fanout/Topic),
comparação RabbitMQ vs Kafka e `LogRunSection` para o SSE demo.

### Frontend — Arquivos modificados

#### `components/layout/SiteHeader.tsx`

- Removido import de `patterns-data.ts`
- Adicionada prop `sections: SectionDto[]` — recebida do RSC parent (`layout.tsx`)
- A navegação agora é totalmente dinâmica: novas seções aparecem sem rebuild do frontend

#### `app/layout.tsx`

- Convertido para `async` RSC
- Chama `getSections()` e passa `sections` ao `SiteHeader`

#### `components/dashboard/PatternGrid.tsx`

- Prop mudou de `categories?: PatternCategory[]` para `patterns: PatternDto[]`
- Filtro removido — chamador filtra por seção via `getPatterns(section)`

#### `components/dashboard/PatternCard.tsx`

- Tipo mudou de `PatternMeta` para `PatternDto`
- `categoryColors[pattern.category]` substituído por `getCategoryColor(pattern.category)`

#### `components/patterns/AlgorithmLayout.tsx`

- Convertido para `async` RSC
- Faz `getSections()` internamente para resolver breadcrumb
- Prop `category` mudou de `PatternCategory` (union type) para `string`

#### `app/page.tsx`

- Convertido para `async` RSC
- Chama `getSections()` + `getPatterns()` em `Promise.all`
- Passa `patterns` filtrados por seção ao `PatternGrid`

#### Section pages convertidas para `async` RSC

`app/padroes/page.tsx`, `app/algoritmos/page.tsx`, `app/principios/page.tsx`,
`app/memoria/page.tsx`, `app/concorrencia/page.tsx`, `app/performance/page.tsx`
— todas com `getSections()` + `getPatterns(slug)`.

#### `app/roadmap/page.tsx`

- Removido `SectionKey` union type hardcoded
- Removido array `SECTIONS` hardcoded
- Busca seções via `GET /api/nav/sections` no mesmo `fetchAll()` inicial junto com as tasks

### Frontend — Arquivos removidos

#### `lib/patterns-data.ts`

Completamente removido. Responsabilidades migradas:

- `PatternCategory` union → campo `string` em `PatternDto`
- `sections[]` → `GET /api/sections`
- `patterns[]` → `GET /api/studies`
- `categoryColors` Record → `lib/category-colors.ts`

---

### Impacto na evolução futura

Para adicionar uma nova seção (ex: "Segurança"):

1. Acrescentar entrada via Admin ou diretamente em `CatalogSeedData.cs`
2. Adicionar tasks em `RoadmapSeedData.cs`
3. Criar `app/seguranca/page.tsx` (copiar padrão existente)
4. Criar `app/patterns/{slug}/page.tsx` para cada conteúdo disponível
5. **Zero mudança** em union types ou navegação — não existem mais
