import { CodeSnippet } from "@/components/patterns/CodeSnippet";
import { SourceLinks } from "@/components/patterns/SourceLinks";
import { LogRunSection } from "@/components/patterns/LogRunSection";
import Link from "next/link";
import { categoryColors } from "@/lib/patterns-data";

const csharpCode = `public sealed class AppLogger
{
    private static AppLogger? _instance;
    private static readonly object _lock = new();

    private readonly string _instanceId = Guid.NewGuid().ToString()[..8];
    private int _logCount = 0;

    // Construtor privado — impede new AppLogger() externo
    private AppLogger() { }

    public static AppLogger GetInstance()
    {
        if (_instance is null)
        {
            lock (_lock) // Thread-safe com double-check locking
            {
                _instance ??= new AppLogger();
            }
        }
        return _instance;
    }

    public void Write(string message)
    {
        _logCount++;
        Console.WriteLine($"[Logger#{_instanceId}] #{_logCount}: {message}");
    }
}

// Uso em diferentes partes do sistema
var log1 = AppLogger.GetInstance(); // cria a instância
var log2 = AppLogger.GetInstance(); // retorna a mesma
var log3 = AppLogger.GetInstance(); // retorna a mesma

Console.WriteLine(ReferenceEquals(log1, log2)); // True
Console.WriteLine(ReferenceEquals(log1, log3)); // True`;

const sources = [
  {
    label: "Refactoring.Guru",
    url: "https://refactoring.guru/design-patterns/singleton",
    icon: "📖",
  },
  {
    label: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Singleton_pattern",
    icon: "🌐",
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function SingletonPage() {
  return (
    <div className="flex flex-col gap-10 max-w-4xl">
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300 transition-colors">Padrões</Link>
        <span>/</span>
        <span className="text-zinc-300">Singleton</span>
      </nav>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🔒</span>
          <div>
            <h1 className="text-3xl font-bold text-white">Singleton</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryColors["Criacional"]}`}>
              Criacional
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="font-semibold text-white text-lg">O que é?</h2>
          <p className="text-zinc-400 leading-relaxed">
            O <strong className="text-zinc-200">Singleton</strong> garante que uma classe tenha
            apenas <strong className="text-zinc-200">uma única instância</strong> em toda a aplicação,
            fornecendo um ponto de acesso global a ela. Toda chamada a <code className="text-zinc-300 bg-zinc-800 px-1 rounded">GetInstance()</code> retorna
            exatamente o mesmo objeto na memória.
          </p>

          <h2 className="font-semibold text-white text-lg">Quando usar?</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
            <li>Quando um recurso precisa ser compartilhado globalmente (logger, cache, config).</li>
            <li>Quando criar múltiplas instâncias seria custoso ou incorreto.</li>
            <li>Quando você precisa de um ponto de acesso centralizado a um serviço.</li>
          </ul>

          <h2 className="font-semibold text-white text-lg">Cuidados</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
            <li><strong className="text-yellow-400">Thread safety:</strong> use <code className="text-zinc-300 bg-zinc-800 px-1 rounded">lock</code> + double-check locking em ambientes multi-thread.</li>
            <li><strong className="text-yellow-400">Testes:</strong> estado global dificulta isolamento em testes unitários.</li>
            <li><strong className="text-yellow-400">Injeção de dependência:</strong> prefira registrar como <em>scoped/singleton</em> no DI container do .NET.</li>
          </ul>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              { role: "Singleton Class", desc: "Armazena a instância estática e expõe GetInstance()." },
              { role: "Construtor privado", desc: "Impede new() externo à classe." },
              { role: "Lock (double-check)", desc: "Garante thread-safety na criação." },
            ].map(({ role, desc }) => (
              <div key={role} className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                <span className="font-medium text-zinc-200 text-xs">{role}</span>
                <p className="text-zinc-500 mt-1 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <SourceLinks sources={sources} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-white text-xl">Código de Exemplo</h2>
        <p className="text-zinc-500 text-sm">
          Implementação thread-safe em C# com <em>double-check locking</em>.
        </p>
        <CodeSnippet code={csharpCode} lang="csharp" />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-white text-xl">Executar no Backend</h2>
        <p className="text-zinc-500 text-sm">
          Demonstra 3 chamadas a <code className="text-zinc-400 bg-zinc-800 px-1 rounded text-xs">GetInstance()</code> em
          &quot;serviços&quot; diferentes — todas retornam a mesma referência e compartilham o mesmo estado.
        </p>
        <LogRunSection
          apiUrl={`${API_URL}/api/patterns/singleton/run`}
          buttonLabel="▶ Executar Código"
          accentColor="emerald"
        />
      </div>
    </div>
  );
}
