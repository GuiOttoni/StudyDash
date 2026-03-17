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

| Pattern | Categoria | Rota |
|---|---|---|
| Builder | Criacional | `/patterns/builder` |
| Singleton | Criacional | `/patterns/singleton` |

### Algoritmos

| Algoritmo | Rota |
|---|---|
| Bubble Sort (com gráfico) | `/patterns/bubble-sort` |

### Clean Code

| Tópico | Rota |
|---|---|
| Princípios SOLID | `/patterns/solid` |

> Veja [TODO.md](TODO.md) para o roadmap completo de implementações.

---

## Arquitetura do Backend — Vertical Slices

O backend adota a arquitetura de **Vertical Slices**: cada exemplo é uma fatia independente que contém tudo que precisa — o endpoint HTTP, a lógica de domínio e os modelos — dentro de sua própria pasta em `Features/`.

```
backend/StudyDash.Api/
├── Features/
│   ├── Patterns/
│   │   ├── Builder/
│   │   │   ├── BuilderFeature.cs       ← endpoint + registro de rota
│   │   │   ├── Computer.cs             ← domain: produto
│   │   │   ├── IComputerBuilder.cs     ← domain: interface do builder
│   │   │   ├── GamingComputerBuilder.cs ← domain: builder concreto
│   │   │   └── ComputerDirector.cs     ← domain: director
│   │   └── Singleton/
│   │       ├── SingletonFeature.cs
│   │       └── AppLogger.cs
│   ├── Algorithms/
│   │   └── BubbleSort/
│   │       └── BubbleSortFeature.cs    ← endpoint + algoritmo inline
│   └── Principles/
│       └── Solid/
│           └── SolidFeature.cs         ← endpoint + todas as classes demo
└── Program.cs                          ← registra todos os slices
```

### Por que Vertical Slices?

| Organização por camada (tradicional) | Organização por feature (vertical slice) |
|---|---|
| `Controllers/`, `Services/`, `Models/` separados | Tudo de uma feature em uma pasta |
| Adicionar feature = mexer em 3+ pastas | Adicionar feature = criar 1 pasta |
| Alto acoplamento horizontal | Alta coesão, baixo acoplamento |
| Difícil entender o que uma feature faz | Fácil: abrir a pasta e ver tudo |

### Como funciona o registro de rotas

Cada slice expõe um método de extensão sobre `IEndpointRouteBuilder`. O `Program.cs` apenas chama cada um:

```csharp
// Program.cs
app.MapBuilderFeature();
app.MapSingletonFeature();
app.MapBubbleSortFeature();
app.MapSolidFeature();
```

```csharp
// Features/Patterns/Builder/BuilderFeature.cs
public static class BuilderFeature
{
    public static void MapBuilderFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/patterns/builder/run", RunAsync)
           .WithTags("Patterns");
    }

    private static async Task RunAsync(HttpContext http, CancellationToken ct) { ... }
}
```

---

## Arquitetura do Frontend — RSC + Client Islands

O frontend segue o padrão de **React Server Components com ilhas de interatividade**:

```
page.tsx (RSC)
├── PatternLayout       ← RSC: título, badge, explicação
├── CodeSnippet         ← RSC: highlight via Shiki (zero JS no cliente)
├── SourceLinks         ← RSC: links externos
└── LogRunSection       ← Client: SSE, estado, EventSource
```

- **RSC** renderiza conteúdo estático no servidor — zero JS enviado ao browser
- **Client Components** são limitados às folhas interativas (botão de run, logs, gráfico)
- `NEXT_PUBLIC_API_URL` é embutido no bundle em tempo de build

---

## Arquitetura de Streaming (SSE)

```
Browser                    Next.js :3055             .NET API :5055
   │                            │                         │
   │─── GET /patterns/builder ──▶│                         │
   │◀── HTML estático (SSG) ─────│                         │
   │                            │                         │
   │─── new EventSource() ────────────────────────────────▶│
   │◀──────────────── data: log 1 \n\n ───────────────────│
   │◀──────────────── data: log 2 \n\n ───────────────────│
   │◀──────────────── data: [DONE] \n\n ──────────────────│
   │─── es.close() ─────────────│                         │
```

---

## Estrutura completa do projeto

```
StudyDash/
├── docker-compose.yml
├── .gitignore
├── .gitattributes
├── CONTRIBUTING.md             ← guia para contribuir
├── TODO.md                     ← checklist de próximas implementações
│
├── backend/
│   ├── Dockerfile
│   ├── StudyDash.Api.slnx
│   └── StudyDash.Api/
│       ├── Features/           ← Vertical Slices
│       │   ├── Patterns/
│       │   │   ├── Builder/
│       │   │   └── Singleton/
│       │   ├── Algorithms/
│       │   │   └── BubbleSort/
│       │   └── Principles/
│       │       └── Solid/
│       └── Program.cs
│
└── frontend/
    ├── Dockerfile
    └── app/
        ├── page.tsx            ← Dashboard
        └── patterns/
            ├── builder/
            ├── singleton/
            ├── bubble-sort/
            └── solid/
```

---

## Variáveis de ambiente

| Variável | Onde | Descrição |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `docker-compose.yml` (build arg + env) | URL pública do backend acessível pelo browser |
| `ASPNETCORE_URLS` | `docker-compose.yml` | Porta interna do Kestrel |
