# Guia de Contribuição — StudyDash

Bem-vindo ao StudyDash! Este guia explica como adicionar novos exemplos ao projeto.

## Índice

- [Visão geral da arquitetura](#visão-geral-da-arquitetura)
- [Contribuindo no Frontend](#contribuindo-no-frontend)
- [Contribuindo no Backend](#contribuindo-no-backend)
- [Fluxo completo — exemplo passo a passo](#fluxo-completo--exemplo-passo-a-passo)
- [Convenções](#convenções)

---

## Visão geral da arquitetura

```
Browser ──→ Next.js (RSC + Client islands)
               │
               └──→ .NET API (Vertical Slices via SSE)
```

O frontend usa **React Server Components** para o conteúdo estático (explicação, código highlight) e **Client Components** apenas para a parte interativa (SSE + logs). O backend usa **Vertical Slices** — cada exemplo vive em sua própria pasta com tudo que precisa.

---

## Contribuindo no Frontend

### 1. Registrar o novo exemplo em `patterns-data.ts`

Abra [`frontend/lib/patterns-data.ts`](frontend/lib/patterns-data.ts) e adicione uma entrada ao array `patterns`:

```typescript
{
  slug: "observer",          // usado na URL: /patterns/observer
  title: "Observer",
  category: "Comportamental",
  description: "Define uma dependência um-para-muitos entre objetos...",
  available: true,           // false = card "Em breve", sem link
  icon: "👁️",
}
```

**Categorias disponíveis:** `"Criacional"` · `"Estrutural"` · `"Comportamental"` · `"Algoritmo"` · `"Clean Code"`

---

### 2. Criar a página do exemplo

Crie o arquivo em `frontend/app/patterns/<slug>/page.tsx`.

A página é um **React Server Component** (sem `"use client"`). Estrutura típica:

```tsx
// frontend/app/patterns/observer/page.tsx
import { CodeSnippet } from "@/components/patterns/CodeSnippet";
import { SourceLinks } from "@/components/patterns/SourceLinks";
import { LogRunSection } from "@/components/patterns/LogRunSection";
import Link from "next/link";
import { categoryColors } from "@/lib/patterns-data";

const csharpCode = `// seu código C# aqui`;

const sources = [
  { label: "Refactoring.Guru", url: "https://refactoring.guru/...", icon: "📖" },
  { label: "Wikipedia", url: "https://en.wikipedia.org/...", icon: "🌐" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function ObserverPage() {
  return (
    <div className="flex flex-col gap-10 max-w-4xl">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300 transition-colors">Padrões</Link>
        <span>/</span>
        <span className="text-zinc-300">Observer</span>
      </nav>

      {/* Cabeçalho com ícone, título e badge */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">👁️</span>
          <div>
            <h1 className="text-3xl font-bold text-white">Observer</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryColors["Comportamental"]}`}>
              Comportamental
            </span>
          </div>
        </div>

        {/* Bloco de explicação */}
        <div className="flex flex-col gap-4 bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="font-semibold text-white text-lg">O que é?</h2>
          <p className="text-zinc-400 leading-relaxed">...</p>
        </div>

        <SourceLinks sources={sources} />
      </div>

      {/* Código de exemplo (highlight server-side) */}
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-white text-xl">Código de Exemplo</h2>
        <CodeSnippet code={csharpCode} lang="csharp" />
      </div>

      {/* Seção de execução com SSE */}
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-white text-xl">Executar no Backend</h2>
        <LogRunSection
          apiUrl={`${API_URL}/api/patterns/observer/run`}
          buttonLabel="▶ Executar Código"
          accentColor="emerald"   // "emerald" | "violet" | "blue"
        />
      </div>

    </div>
  );
}
```

---

### 3. Componentes disponíveis

| Componente | Tipo | Uso |
|---|---|---|
| `<CodeSnippet code lang />` | RSC (async) | Syntax highlight via Shiki — zero JS no cliente |
| `<SourceLinks sources />` | RSC | Links externos com ícone |
| `<LogRunSection apiUrl buttonLabel accentColor />` | Client | SSE log stream genérico |
| `<BubbleSortRunSection apiUrl />` | Client | SSE + gráfico de barras (algoritmos de sort) |
| `<ArrayChart array comparing sorted />` | Client | Gráfico de barras standalone |

> **Regra de ouro:** mantenha a fronteira `"use client"` o mais próxima das folhas da árvore de componentes. Tudo que é estático (explicação, código) deve ser RSC.

---

## Contribuindo no Backend

O backend usa **Vertical Slices** com Minimal API. Cada exemplo é uma pasta autônoma em `backend/StudyDash.Api/Features/`.

### 1. Criar a pasta do slice

```
backend/StudyDash.Api/Features/
└── Patterns/
    └── Observer/           ← nova pasta
        ├── ObserverFeature.cs   ← endpoint + registro de rota
        ├── EventBus.cs          ← domain objects do slice
        └── ...
```

### 2. Criar o arquivo de feature

O arquivo `*Feature.cs` contém:
- Uma classe `static` com o método de extensão `Map*Feature()`
- O handler do endpoint como método `private static`

```csharp
// Features/Patterns/Observer/ObserverFeature.cs
namespace StudyDash.Api.Features.Patterns.Observer;

public static class ObserverFeature
{
    public static void MapObserverFeature(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/patterns/observer/run", RunAsync)
           .WithTags("Patterns");
    }

    private static async Task RunAsync(HttpContext http, CancellationToken cancellationToken)
    {
        // 1. Configurar SSE
        http.Response.Headers.Append("Content-Type", "text/event-stream");
        http.Response.Headers.Append("Cache-Control", "no-cache");
        http.Response.Headers.Append("X-Accel-Buffering", "no");
        http.Response.Headers.Append("Connection", "keep-alive");

        // 2. Helper de envio
        async Task Send(string message)
        {
            await http.Response.WriteAsync($"data: {message}\n\n", cancellationToken);
            await http.Response.Body.FlushAsync(cancellationToken);
        }

        // 3. Lógica da demo
        try
        {
            await Send("Iniciando demonstração do Observer...");
            // ... sua lógica aqui
            await Send("[DONE]");
        }
        catch (OperationCanceledException) { } // cliente desconectou
    }
}
```

> **Protocolo SSE:** sempre termine com `data: [DONE]\n\n`. O `EventSource` no frontend fecha a conexão ao receber essa mensagem.
>
> **JSON no payload:** se precisar enviar dados estruturados (como o BubbleSort faz para o gráfico), use `JsonSerializer.Serialize(payload)` na string de dados e leia com `JSON.parse(event.data)` no cliente.

### 3. Registrar em `Program.cs`

Abra [`backend/StudyDash.Api/Program.cs`](backend/StudyDash.Api/Program.cs) e adicione:

```csharp
using StudyDash.Api.Features.Patterns.Observer;  // ← novo using

// ... (código existente) ...

app.MapObserverFeature();  // ← nova linha
```

---

## Fluxo completo — exemplo passo a passo

Adicionando o padrão **Observer**:

```
1. patterns-data.ts    → adicionar entrada com available: true
2. frontend/app/patterns/observer/page.tsx  → criar página
3. Features/Patterns/Observer/ObserverFeature.cs  → criar slice
4. Program.cs          → app.MapObserverFeature()
5. docker compose up --build  → subir
6. Testar: curl -N http://localhost:5055/api/patterns/observer/run
```

---

## Convenções

### Nomenclatura

| O quê | Convenção | Exemplo |
|---|---|---|
| Pasta de feature (backend) | PascalCase | `Features/Patterns/Observer/` |
| Arquivo de feature | `<Nome>Feature.cs` | `ObserverFeature.cs` |
| Método de registro | `Map<Nome>Feature()` | `MapObserverFeature()` |
| Rota | `api/<categoria>/<slug>/run` | `/api/patterns/observer/run` |
| Slug frontend | kebab-case | `observer`, `bubble-sort` |
| Página frontend | `app/patterns/<slug>/page.tsx` | `app/patterns/observer/page.tsx` |

### SSE

- Use `Task.Delay()` entre steps para tornar a execução visível em tempo real
- Sempre faça `FlushAsync()` após cada `WriteAsync()`
- Sempre termine com `[DONE]` para sinalizar fim da stream
- Capture `OperationCanceledException` para lidar com desconexão do cliente

### Git

- Branch: `feat/<slug>` (ex: `feat/observer`)
- Commit: `feat: add Observer pattern example`
- PR: abrir contra `main`, descrever o que o exemplo demonstra
