import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";
import { LogRunSection } from "@/components/patterns/LogRunSection";

const csharpCode = `// Configuração no Program.cs
var builder = WebApplication.CreateBuilder(args);

// 1. Transient: Criado toda vez que é solicitado.
builder.Services.AddTransient<IMyTransientService, MyTransientService>();

// 2. Scoped: Criado uma vez por requisição HTTP.
builder.Services.AddScoped<IMyScopedService, MyScopedService>();

// 3. Singleton: Criado uma única vez para toda a vida da aplicação.
builder.Services.AddSingleton<IMySingletonService, MySingletonService>();

var app = builder.Build();`;

const sources = [
  { 
    label: "Microsoft Learn", 
    url: "https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection#service-lifetimes", 
    icon: "🌐" 
  },
  { 
    label: "Nick Chapsas (YouTube)", 
    url: "https://www.youtube.com/results?search_query=dotnet+dependency+injection+lifetimes", 
    icon: "🎥" 
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function DiLifetimesPage() {
  return (
    <AlgorithmLayout
      title="Lifetimes de Injeção de Dependência"
      icon="💉"
      category="Clean Code"
      description="Gerenciar o ciclo de vida dos serviços é fundamental para a performance, consistência de dados e prevenção de memory leaks em aplicações .NET."
      sources={sources}
      code={csharpCode}
      codeDescription="Exemplo de registro de serviços no container nativo de DI do .NET 10."
    >
      <div className="flex flex-col gap-8">
        {/* Test Section */}
        <div className="flex flex-col gap-4">
          <h2 className="text-white font-bold text-xl flex items-center gap-2">
            🚀 Teste Interativo de IDs
          </h2>
          <p className="text-zinc-500 text-sm">
            Clique no botão abaixo para disparar uma requisição ao backend. 
            O servidor injetará duas instâncias de cada tipo e retornará seus IDs únicos. 
            Compare os resultados para ver a mágica do Singleton, Scoped e Transient.
          </p>
          <LogRunSection 
            apiUrl={`${API_URL}/api/algorithms/dilifetimes/run`}
            buttonLabel="▶ Iniciar Teste de Injeção"
            accentColor="violet"
          />
        </div>

        {/* Comparison Table */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400" />
              <h3 className="font-bold text-white text-lg">Transient</h3>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Serviços com tempo de vida <strong>transiente</strong> são criados cada vez que são solicitados do container de serviços.
            </p>
            <ul className="text-xs text-zinc-500 space-y-1 mt-auto">
              <li>• Melhor para serviços leves e sem estado.</li>
              <li>• Nunca compartilhado entre componentes.</li>
            </ul>
          </div>

          <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <h3 className="font-bold text-white text-lg">Scoped</h3>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Serviços com tempo de vida <strong>escopado</strong> são criados uma vez por requisição do cliente (conexão).
            </p>
            <ul className="text-xs text-zinc-500 space-y-1 mt-auto">
              <li>• Compartilhado dentro da mesma request HTTP.</li>
              <li>• Ideal para contextos de Banco de Dados (DbContext).</li>
            </ul>
          </div>

          <div className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-400" />
              <h3 className="font-bold text-white text-lg">Singleton</h3>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Serviços com tempo de vida <strong>singleton</strong> são criados na primeira vez que são solicitados.
            </p>
            <ul className="text-xs text-zinc-500 space-y-1 mt-auto">
              <li>• Uma única instância para toda a aplicação.</li>
              <li>• Cuidado com estado compartilhado (thread-safety).</li>
            </ul>
          </div>
        </div>

        {/* Visual Analogy */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
             💡 Analogia do Restaurante
          </h3>
          <div className="space-y-4 text-sm text-zinc-400">
            <div className="flex gap-4">
              <span className="text-blue-400 font-mono font-bold w-20">Transient:</span>
              <p>O <strong>guardanapo</strong>. Cada cliente pega um novo a cada uso, e ele é descartado imediatamente.</p>
            </div>
            <div className="flex gap-4 border-t border-zinc-900 pt-4">
              <span className="text-emerald-400 font-mono font-bold w-20">Scoped:</span>
              <p>O <strong>garçom</strong>. Ele atende você durante toda a sua refeição (uma request), mas quando você vai embora, ele passa a atender outro cliente.</p>
            </div>
            <div className="flex gap-4 border-t border-zinc-900 pt-4">
              <span className="text-purple-400 font-mono font-bold w-20">Singleton:</span>
              <p>O <strong>chef de cozinha</strong>. Só existe um para o restaurante inteiro, atendendo todos os pedidos de todos os clientes ao longo de todo o dia.</p>
            </div>
          </div>
        </div>

        {/* Real World Note */}
        <div className="border-l-4 border-amber-500/50 bg-amber-500/5 p-4 rounded-r-xl">
          <h4 className="text-amber-400 font-bold text-sm mb-1">Atenção Crítica!</h4>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Nunca injete um serviço <strong>Scoped</strong> dentro de um serviço <strong>Singleton</strong>. 
            Como o Singleton vive mais que o Scoped, ele manteria uma instância do Scoped "viva" por muito mais tempo do que deveria, 
            podendo causar bugs de concorrência ou manter conexões de banco abertas indevidamente.
          </p>
        </div>
      </div>
    </AlgorithmLayout>
  );
}
