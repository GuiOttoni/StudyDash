# StudyDash — Changelog

## [Unreleased] — 2026-03-18

### Arquitetura: Server-Driven UI

Removido o arquivo `frontend/lib/patterns-data.ts` que era a fonte de verdade estática
da navegação e dos cards. O backend agora controla quais seções e patterns existem.

**Motivação:** Adicionar uma nova seção anteriormente exigia alterar union types TypeScript,
arrays hardcoded e o mapeamento de cores no frontend. Com SDUI, só o backend muda.

**Decisão BFF:** Não foi criado um serviço BFF separado. O `StudyDash.Api` já serve como
BFF natural via Next.js RSC (Server Components fazem fetch server-side). A extração de um
BFF só fará sentido se houver múltiplos clients (mobile, third-party) com necessidades
divergentes.

---

### Backend — Novos arquivos

#### `Features/Nav/NavFeature.cs`
- `GET /api/nav/sections` → `SectionDto[]` com slug, title, icon, description, categories
- `GET /api/nav/patterns?section={slug}` → `PatternDto[]` com filtro opcional por seção
- Substitui completamente `frontend/lib/patterns-data.ts`
- Dados centralizados no backend: adicionar seção/pattern = só mudar este arquivo

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

---

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
- `+using` para Nav, EventDriven, Exchanges
- `app.MapNavFeature()`
- `app.MapEventDrivenFeature()`
- `app.MapExchangePatternsFeature()`

---

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

---

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

#### `app/padroes/page.tsx` · `app/algoritmos/page.tsx` · `app/principios/page.tsx`
#### `app/memoria/page.tsx` · `app/concorrencia/page.tsx` · `app/performance/page.tsx`
Todos convertidos para `async` RSC com `getSections()` + `getPatterns(slug)`.

#### `app/roadmap/page.tsx`
- Removido `SectionKey` union type hardcoded
- Removido array `SECTIONS` hardcoded
- Busca seções via `GET /api/nav/sections` no mesmo `fetchAll()` inicial junto com as tasks

---

### Frontend — Arquivos removidos

#### `lib/patterns-data.ts` ❌
Completamente removido. Responsabilidades migradas:
- `PatternCategory` union → campo `string` em `PatternDto`
- `sections[]` → `GET /api/nav/sections`
- `patterns[]` → `GET /api/nav/patterns`
- `categoryColors` Record → `lib/category-colors.ts`

---

### Impacto na evolução futura

Para adicionar uma nova seção (ex: "Segurança"):
1. Acrescentar entrada em `NavFeature.cs` (Sections e Patterns)
2. Adicionar tasks em `RoadmapSeedData.cs`
3. Criar `app/seguranca/page.tsx` (copiar padrão existente)
4. Criar `app/patterns/{slug}/page.tsx` para exemplos disponíveis
5. **Zero mudança** em `patterns-data.ts`, union types ou navegação — não existe mais
