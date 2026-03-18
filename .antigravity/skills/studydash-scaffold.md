---
name: studydash-scaffold
description: Scaffold new algorithm pages, pattern pages, default pages, and full features for the StudyDash project
version: 1.0.0
triggers:
  - "create algorithm page"
  - "create pattern page"
  - "create default page"
  - "create full feature"
  - "nova página algoritmo"
  - "nova página pattern"
  - "nova feature"
---

# StudyDash Scaffold Skill

Você é um assistente especializado no projeto **StudyDash** — um dashboard interativo para aprendizado de Design Patterns, Algoritmos e Clean Code em C# com execução ao vivo via SSE.

Quando o usuário pedir para criar uma página ou feature, siga **exatamente** os templates e convenções deste arquivo.

---

## 1. Contexto do Projeto

**Stack:**
- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- Backend: .NET 10, ASP.NET Core Web API, C#
- Syntax highlighting: Shiki (server-side)

**Estrutura de pastas relevante:**
```
frontend/
├── app/
│   └── patterns/
│       └── [slug]/page.tsx          ← páginas (RSC)
├── components/
│   ├── patterns/
│   │   ├── AlgorithmLayout.tsx      ← layout wrapper (RSC)
│   │   ├── LogRunSection.tsx        ← SSE runner genérico (Client Component)
│   │   ├── CodeStream.tsx           ← visualizador de logs (Client Component)
│   │   └── SourceLinks.tsx
│   └── algorithms/
│       └── [Name]RunSection.tsx     ← RunSections customizadas (Client Components)
└── lib/
    └── patterns-data.ts             ← registro central de todos os patterns/algoritmos
```

**Regra arquitetural crítica:**
- `AlgorithmLayout` é um **Server Component (RSC)** — nunca adicione `"use client"` a ele
- `RunSection` components são **Client Components** (`"use client"`)
- Client Components são passados como `children` para `AlgorithmLayout`, nunca importados dentro dele
- Pages (`page.tsx`) são RSCs que orquestram tudo

---

## 2. Operação: Criar Página de Algoritmo

**Quando usar:** usuário pede "create algorithm page for X" / "nova página algoritmo X"

**Arquivos a criar/modificar:**
1. `frontend/app/patterns/[slug]/page.tsx`
2. `frontend/components/algorithms/[Name]RunSection.tsx`
3. `frontend/lib/patterns-data.ts` — adicionar entrada

**Convenção de nomes:**
- `slug`: kebab-case (ex: `binary-search`, `merge-sort`)
- Componente: PascalCase + RunSection (ex: `BinarySearchRunSection`)
- API route: `/api/algorithms/[slug-sem-hifens]/run`

### Template: Page (Algoritmo)

```tsx
// frontend/app/patterns/[slug]/page.tsx
import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";
import { XxxRunSection } from "@/components/algorithms/XxxRunSection";

const csharpCode = `// TODO: implementação C# do algoritmo
public class Xxx
{
    public void Run()
    {
        // ...
    }
}`;

const sources = [
  { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/TODO", icon: "🌐" },
  { label: "Refactoring.Guru", url: "https://refactoring.guru/TODO", icon: "📖" },
];

const complexities = [
  { label: "Melhor caso",  value: "O(?)", note: "TODO: condição",  color: "text-emerald-400" },
  { label: "Caso médio",   value: "O(?)", note: "TODO: condição",  color: "text-orange-400"  },
  { label: "Pior caso",    value: "O(?)", note: "TODO: condição",  color: "text-red-400"     },
  { label: "Espaço",       value: "O(?)", note: "TODO: condição",  color: "text-blue-400"    },
];

const steps = [
  "TODO: passo 1 do algoritmo.",
  "TODO: passo 2 do algoritmo.",
  "TODO: passo 3 do algoritmo.",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function XxxPage() {
  return (
    <AlgorithmLayout
      title="TODO: Nome do Algoritmo"
      icon="TODO: emoji"
      category="Algoritmo"
      description="TODO: descrição clara e concisa do que é este algoritmo."
      complexities={complexities}
      steps={steps}
      sources={sources}
      code={csharpCode}
      codeDescription="TODO: nota sobre esta implementação específica."
    >
      <div className="flex flex-col gap-3">
        <p className="text-zinc-500 text-sm">
          TODO: instrução breve sobre como usar a visualização abaixo.
        </p>
        <XxxRunSection apiUrl={`${API_URL}/api/algorithms/xxx/run`} />
      </div>
    </AlgorithmLayout>
  );
}
```

### Template: RunSection Customizada (Algoritmo — JSON SSE)

```tsx
// frontend/components/algorithms/XxxRunSection.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { CodeStream } from "../patterns/CodeStream";

// Protocolo JSON SSE (backend envia):
//   data: {"type":"log","msg":"texto da linha"}
//   data: {"type":"state","array":[...],"comparing":[0,1],"sorted":[]}
//   data: {"type":"done"}
interface SSEMessage {
  type: "log" | "state" | "done";
  msg?: string;
  // TODO: adicionar campos para o estado da visualização
  // ex: array?: number[]; comparing?: number[]; sorted?: number[];
}

interface Props {
  apiUrl: string;
}

export function XxxRunSection({ apiUrl }: Props) {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  // TODO: adicionar estado para visualização
  // ex: const [chartState, setChartState] = useState({ array: [], comparing: [], sorted: [] });
  const esRef = useRef<EventSource | null>(null);

  // Cleanup ao desmontar
  useEffect(() => () => esRef.current?.close(), []);

  const handleRun = () => {
    esRef.current?.close();
    setLogs([]);
    setDone(false);
    setRunning(true);
    // TODO: resetar estado de visualização aqui

    const es = new EventSource(apiUrl);
    esRef.current = es;

    es.onmessage = (event) => {
      const msg: SSEMessage = JSON.parse(event.data);

      if (msg.type === "done") {
        es.close();
        esRef.current = null;
        setRunning(false);
        setDone(true);
        return;
      }

      if (msg.type === "state") {
        // TODO: atualizar estado de visualização
        // ex: setChartState({ array: msg.array!, comparing: msg.comparing!, sorted: msg.sorted! });
      }

      if (msg.type === "log" && msg.msg) {
        setLogs((prev) => [...prev, msg.msg!]);
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      setRunning(false);
      setLogs((prev) => [...prev, "❌ Erro na conexão com o servidor."]);
    };
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
        {/* TODO: adicionar inputs/sliders para parâmetros (ex: tamanho do array) */}
        <button
          onClick={handleRun}
          disabled={running}
          className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap
            ${running
              ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg shadow-blue-900/30"
            }`}
        >
          {running ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
              Executando...
            </span>
          ) : "▶ Executar"}
        </button>
        {done && <span className="text-sm text-emerald-400">✓ Concluído</span>}
      </div>

      {/* TODO: adicionar componente de visualização (gráfico, grid, etc.) */}

      {/* Logs */}
      <CodeStream
        logs={logs}
        running={running}
        title="Log de execução"
        onClear={() => {
          setLogs([]);
          setDone(false);
          // TODO: resetar estado de visualização
        }}
      />
    </div>
  );
}
```

---

## 3. Operação: Criar Página de Pattern

**Quando usar:** usuário pede "create pattern page for X" / "nova página pattern X"

**Arquivos a criar/modificar:**
1. `frontend/app/patterns/[slug]/page.tsx`
2. `frontend/lib/patterns-data.ts` — adicionar entrada

Nenhum RunSection customizado é necessário — usa `LogRunSection` diretamente.

**Convenção de nomes:**
- `slug`: kebab-case (ex: `factory-method`, `observer`)
- API route: `/api/patterns/[slug-sem-hifens]/run`
- `accentColor`: `"emerald"` (Criacional/Comportamental) | `"violet"` (Clean Code) | `"blue"` (Estrutural)

### Template: Page (Pattern)

```tsx
// frontend/app/patterns/[slug]/page.tsx
import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";
import { LogRunSection } from "@/components/patterns/LogRunSection";

const csharpCode = `// TODO: implementação C# do padrão
public class Xxx
{
    // ...
}`;

const sources = [
  { label: "Refactoring.Guru", url: "https://refactoring.guru/design-patterns/xxx", icon: "📖" },
  { label: "Wikipedia",        url: "https://en.wikipedia.org/wiki/Xxx_pattern",     icon: "🌐" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function XxxPage() {
  return (
    <AlgorithmLayout
      title="TODO: Nome do Padrão"
      icon="TODO: emoji"
      category="TODO: Criacional | Estrutural | Comportamental"
      description="TODO: descrição clara do que é e o problema que resolve."
      sources={sources}
      code={csharpCode}
      codeDescription="TODO: nota sobre esta implementação específica."
    >
      <div className="flex flex-col gap-6">
        {/* Quando usar */}
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-white text-lg">Quando usar?</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
            <li>TODO: caso de uso 1</li>
            <li>TODO: caso de uso 2</li>
            <li>TODO: caso de uso 3</li>
          </ul>
        </div>

        {/* Participantes */}
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-white text-lg">Participantes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { role: "TODO: Papel 1", desc: "TODO: responsabilidade" },
              { role: "TODO: Papel 2", desc: "TODO: responsabilidade" },
              { role: "TODO: Papel 3", desc: "TODO: responsabilidade" },
            ].map(({ role, desc }) => (
              <div key={role} className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                <span className="font-medium text-zinc-200">{role}</span>
                <p className="text-zinc-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Execução SSE */}
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-white text-xl">Executar no Backend</h2>
          <p className="text-zinc-500 text-sm">
            Clique para executar o código no servidor .NET via{" "}
            <span className="text-zinc-400 font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded">SSE</span>.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/patterns/xxx/run`}
            buttonLabel="▶ Executar Código"
            accentColor="emerald"
          />
        </div>
      </div>
    </AlgorithmLayout>
  );
}
```

**Protocolo SSE texto puro (usado por `LogRunSection`):**
```
data: ── Seção ──

data: ✓ sucesso
data: ✗ erro
data: » info
data:     sub-log indentado

data: [DONE]
```
A sentinela é o string literal `[DONE]` — sem JSON.

---

## 4. Operação: Criar Página Default

**Quando usar:** usuário pede "create default page for X" / "nova página default X"

**Arquivos a criar/modificar:**
1. `frontend/app/patterns/[slug]/page.tsx`
2. `frontend/lib/patterns-data.ts` — adicionar entrada

Para layouts **totalmente customizados** (múltiplos conceitos, como SOLID): não use `AlgorithmLayout`. Consulte `frontend/app/patterns/solid/page.tsx` como referência de layout manual com breadcrumb e seções coloridas.

### Template: Page (Default)

```tsx
// frontend/app/patterns/[slug]/page.tsx
import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";

const csharpCode = `// TODO: código de exemplo`;

const sources = [
  { label: "TODO", url: "https://TODO", icon: "🌐" },
];

export default function XxxPage() {
  return (
    <AlgorithmLayout
      title="TODO: Título da Página"
      icon="TODO: emoji"
      category="TODO: categoria"
      description="TODO: descrição."
      sources={sources}
      code={csharpCode}
      codeDescription="TODO: nota sobre o código."
    >
      <div className="p-12 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center text-zinc-600">
        Visualização interativa não disponível
      </div>
    </AlgorithmLayout>
  );
}
```

---

## 5. Operação: Criar Feature Completa

**Quando usar:** usuário pede "create full feature for X" / "nova feature X"

Esta operação combina criação de página + componente + registro.

**Fluxo:**
1. Pergunte: "É um algoritmo (com complexidades e visualização) ou um padrão de design (com LogRunSection)?"
2. Aplique o template correto da Seção 2 ou 3
3. Para algoritmos: crie também o RunSection em `components/algorithms/`
4. Registre em `patterns-data.ts` (Seção 6)

---

## 6. Registro em patterns-data.ts

**Arquivo:** `frontend/lib/patterns-data.ts`

Adicione ao array `patterns` **antes do fechamento `];`**:

```typescript
{
  slug: "xxx",                     // deve bater com o nome da pasta em app/patterns/
  title: "TODO: Nome para exibição",
  category: "TODO: categoria",     // deve ser EXATAMENTE uma das strings abaixo:
                                   // "Criacional" | "Estrutural" | "Comportamental"
                                   // | "Algoritmo" | "Clean Code"
  description: "TODO: uma frase exibida no card do dashboard.",
  available: true,                 // false = página stub (link desabilitado)
  icon: "TODO: emoji único",
},
```

**Categorias e cores correspondentes:**
| Categoria | Badge |
|---|---|
| `Criacional` | azul |
| `Estrutural` | roxo |
| `Comportamental` | verde |
| `Algoritmo` | laranja |
| `Clean Code` | rosa |

---

## 7. Referência de Protocolos SSE

| Protocolo | Usado por | Formato de `event.data` | Terminador |
|---|---|---|---|
| Texto puro | `LogRunSection` | String raw (ex: `✓ feito`) | String literal `[DONE]` |
| JSON | RunSection customizada | JSON stringificado | `{"type":"done"}` |

**Nunca misture os dois protocolos numa mesma rota.**

---

## 8. Convenções de Nomenclatura

| Item | Convenção | Exemplo |
|---|---|---|
| Pasta/slug | kebab-case | `binary-search` |
| Componente RunSection | PascalCase + `RunSection` | `BinarySearchRunSection` |
| Arquivo de componente | PascalCase + `RunSection.tsx` | `BinarySearchRunSection.tsx` |
| API route padrão | `/api/[tipo]/[slug]/run` | `/api/algorithms/binarysearch/run` |

---

## 9. Cores de Destaque — LogRunSection

`LogRunSection` aceita prop `accentColor`:

| Valor | Cor do botão | Indicação |
|---|---|---|
| `"emerald"` (padrão) | Verde | Padrões Criacionais/Comportamentais |
| `"violet"` | Roxo | Clean Code / Princípios |
| `"blue"` | Azul | Padrões Estruturais |

---

## 10. Checklist de Validação

Após criar qualquer página, confirme:

- [ ] `slug` na pasta bate com `slug` em `patterns-data.ts`
- [ ] `category` é uma string exata do union `PatternCategory`
- [ ] Page file NÃO tem `"use client"`
- [ ] RunSection file TEM `"use client"` (se criado)
- [ ] `AlgorithmLayout` recebe `children` (mesmo que seja só o placeholder)
- [ ] `API_URL` está presente apenas se há uma chamada SSE
- [ ] Para algoritmos: protocolo JSON SSE com `{ type: "done" }` como terminador
- [ ] Para patterns: protocolo texto puro com `[DONE]` como terminador
