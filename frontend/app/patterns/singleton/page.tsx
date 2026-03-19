import { LogRunSection } from "@/components/patterns/LogRunSection";
import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";

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
    <AlgorithmLayout
      title="Singleton"
      icon="Lock"
      category="Criacional"
      description="O Singleton garante que uma classe tenha apenas uma única instância em toda a aplicação, fornecendo um ponto de acesso global a ela. Toda chamada a GetInstance() retorna exatamente o mesmo objeto na memória."
      sources={sources}
      code={csharpCode}
      codeDescription="Implementação thread-safe em C# com double-check locking."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-white text-lg">Quando usar?</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
            <li>Quando um recurso precisa ser compartilhado globalmente (logger, cache, config).</li>
            <li>Quando criar múltiplas instâncias seria custoso ou incorreto.</li>
            <li>Quando você precisa de um ponto de acesso centralizado a um serviço.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-white text-lg">Cuidados</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 leading-relaxed">
            <li><strong className="text-yellow-400">Thread safety:</strong> use lock + double-check locking em ambientes multi-thread.</li>
            <li><strong className="text-yellow-400">Testes:</strong> estado global dificulta isolamento em testes unitários.</li>
            <li><strong className="text-yellow-400">Injeção de dependência:</strong> prefira registrar como scoped/singleton no DI container do .NET.</li>
          </ul>
        </div>

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
    </AlgorithmLayout>
  );
}
