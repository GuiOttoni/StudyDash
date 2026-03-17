# StudyDash

Dashboard interativo para aprender **Design Patterns**, **Algoritmos**, **Clean Code** e boas práticas de engenharia de software — com código real executado em tempo real via streaming (SSE).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, Shiki |
| Backend | .NET 10, ASP.NET Core Web API, C# |
| Infra | Docker, Docker Compose |
| Streaming | Server-Sent Events (SSE) |

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Portas `3055` e `5055` disponíveis (ajuste o `docker-compose.yml` se necessário)

## Como rodar

```bash
# Clone o repositório
git clone https://github.com/<seu-usuario>/StudyDash.git
cd StudyDash

# Suba os serviços
docker compose up --build
```

- **Frontend:** http://localhost:3055
- **Backend API:** http://localhost:5055

> Para parar: `docker compose down`

## Exemplos disponíveis

### Design Patterns

| Pattern | Categoria | Descrição |
|---|---|---|
| [Builder](http://localhost:3055/patterns/builder) | Criacional | Constrói um objeto complexo passo a passo com Director + ConcreteBuilder |
| [Singleton](http://localhost:3055/patterns/singleton) | Criacional | Garante uma única instância com thread-safety (double-check locking) |

### Algoritmos

| Algoritmo | Descrição |
|---|---|
| [Bubble Sort](http://localhost:3055/patterns/bubble-sort) | Ordenação com visualização em gráfico de barras em tempo real, array randômico, early exit |

### Clean Code

| Tópico | Descrição |
|---|---|
| [Princípios SOLID](http://localhost:3055/patterns/solid) | Os 5 princípios com exemplos de violação e solução em C# |

## Estrutura do projeto

```
StudyDash/
├── docker-compose.yml
│
├── backend/                          # .NET 10 Web API
│   ├── Dockerfile
│   └── StudyDash.Api/
│       ├── Patterns/
│       │   ├── Builder/              # GET /api/patterns/builder/run
│       │   └── Singleton/            # GET /api/patterns/singleton/run
│       ├── Algorithms/
│       │   └── BubbleSort/           # GET /api/algorithms/bubblesort/run?size=N
│       ├── Principles/
│       │   └── SOLID/                # GET /api/principles/solid/run
│       └── Program.cs
│
└── frontend/                         # Next.js 16
    ├── Dockerfile
    └── src/
        ├── app/
        │   ├── page.tsx              # Dashboard (grid de padrões)
        │   └── patterns/
        │       ├── builder/
        │       ├── singleton/
        │       ├── bubble-sort/
        │       └── solid/
        ├── components/
        │   ├── layout/
        │   ├── dashboard/
        │   ├── patterns/             # CodeSnippet (RSC), LogRunSection (client)
        │   └── algorithms/           # ArrayChart, BubbleSortRunSection
        └── lib/
            └── patterns-data.ts      # Metadados de todos os exemplos
```

## Arquitetura de streaming

Cada exemplo executa código real no backend .NET e transmite logs em tempo real para o browser via **Server-Sent Events (SSE)**:

```
Browser                      Next.js (3055)          .NET API (5055)
   │                               │                        │
   │── GET /patterns/builder ──────▶│                        │
   │◀─── HTML (SSG) ───────────────│                        │
   │                               │                        │
   │── EventSource ────────────────────────────────────────▶│
   │◀─────────────── data: log 1 \n\n ─────────────────────│
   │◀─────────────── data: log 2 \n\n ─────────────────────│
   │◀─────────────── data: [DONE] \n\n ────────────────────│
```

## Como adicionar um novo exemplo

1. **Backend:** crie um controller em `Patterns/` ou `Algorithms/` com endpoint `GET .../run` retornando `text/event-stream`
2. **Frontend:** adicione a entrada em `lib/patterns-data.ts` com `available: true`
3. **Página:** crie `app/patterns/<slug>/page.tsx` com `<LogRunSection>` ou `<BubbleSortRunSection>`
4. Rebuild: `docker compose up --build`

## Variáveis de ambiente

| Variável | Onde | Descrição |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `docker-compose.yml` (build arg + env) | URL pública do backend acessível pelo browser |
| `ASPNETCORE_URLS` | `docker-compose.yml` | Porta interna do Kestrel |
