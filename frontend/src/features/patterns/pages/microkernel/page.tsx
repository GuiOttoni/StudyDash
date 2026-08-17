import { AlgorithmLayout } from "@/features/patterns/components/AlgorithmLayout";
import { LogRunSection } from "@/features/patterns/components/LogRunSection";

const csharpCode = `// ── Plugin contract — único ponto de contato entre Core e Plugins ──
interface IPaymentPlugin : IDisposable
{
    string Name    { get; }
    string Method  { get; }   // chave de roteamento: "pix" | "credit-card" | "boleto"
    string Version { get; }

    void Initialize();
    Task<PaymentResult> ProcessAsync(PaymentRequest req, CancellationToken ct);
}

// ── Core / Kernel — NUNCA muda quando plugins mudam ────────────────
sealed class PaymentKernel
{
    private readonly Dictionary<string, IPaymentPlugin> _registry = new();

    public void LoadPlugin(IPaymentPlugin plugin)
    {
        plugin.Initialize();                    // ciclo de vida gerenciado pelo kernel
        _registry[plugin.Method] = plugin;
    }

    public void UnloadPlugin(string method)
    {
        if (_registry.Remove(method, out var p))
            p.Dispose();                        // libera recursos do plugin removido
    }

    public async Task<PaymentResult> ProcessAsync(PaymentRequest req, CancellationToken ct)
    {
        if (!_registry.TryGetValue(req.Method, out var plugin))
            throw new KeyNotFoundException($"Nenhum plugin para \"{req.Method}\"");

        return await plugin.ProcessAsync(req, ct);   // kernel só despacha
    }

    public IReadOnlyCollection<string> AvailableMethods => _registry.Keys;
}

// ── Plugin: PIX — autossuficiente, zero dependência de outros plugins
sealed class PixPlugin : IPaymentPlugin
{
    public string Name    => "PIX Plugin";
    public string Method  => "pix";
    public string Version => "1.0.0";

    public void Initialize() { /* conecta SPI do Banco Central */ }
    public void Dispose()    { /* fecha conexão */ }

    public async Task<PaymentResult> ProcessAsync(PaymentRequest req, CancellationToken ct)
    {
        await Task.Delay(110, ct);
        return new PaymentResult(Guid.NewGuid().ToString("N")[..22], "Approved", req.Amount);
    }
}

// ── Plugin v3: hot-swap transparente para o caller ────────────────
sealed class CreditCardPluginV3 : IPaymentPlugin
{
    public string Method  => "credit-card";
    public string Version => "3.0.0";           // v2 não tinha antifraude

    public void Initialize() { /* gateway Cielo v3 + ClearSale antifraude */ }
    public void Dispose() { }

    public async Task<PaymentResult> ProcessAsync(PaymentRequest req, CancellationToken ct)
    {
        var score = new Random().Next(70, 99);   // motor antifraude — ausente na v2
        await Task.Delay(480, ct);
        return new PaymentResult(Guid.NewGuid().ToString("N")[..12], "Approved",
            req.Amount, Details: $"score antifraude: {score}/100");
    }
}

// ── Wiring — qualquer plugin que implemente IPaymentPlugin é aceito ─
var kernel = new PaymentKernel();
kernel.LoadPlugin(new PixPlugin());
kernel.LoadPlugin(new CreditCardPluginV2());   // v2 em produção
kernel.LoadPlugin(new BoletoPlugin());

// hot-swap: trocar plugin sem reiniciar o sistema
kernel.UnloadPlugin("credit-card");            // descarta v2
kernel.LoadPlugin(new CreditCardPluginV3());   // carrega v3 com antifraude

// caller usa exatamente da mesma forma — não sabe que o plugin trocou
var result = await kernel.ProcessAsync(
    new PaymentRequest("credit-card", 2_999.90m, Installments: 12), ct);`;

const sources = [
  { label: "Richards & Ford — Software Architecture Patterns (O'Reilly)", url: "https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/", icon: "📖" },
  { label: "Microsoft — Plugin architecture (.NET)", url: "https://learn.microsoft.com/en-us/dotnet/core/tutorials/creating-app-with-plugin-support", icon: "📖" },
  { label: "Eclipse — Plugin model (referência histórica)", url: "https://www.eclipse.org/articles/Article-Plug-in-architecture/plugin_architecture.html", icon: "📝" },
];

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5055";

const demos = [
  {
    title: "DEMO 1 — Carregar plugins e processar",
    desc: "Kernel recebe 3 plugins (PIX, Cartão v2, Boleto) via LoadPlugin. Cada um passa por Initialize() e fica no registry. Três pagamentos processados, cada um despachado para o plugin correto.",
    color: "emerald",
  },
  {
    title: "DEMO 2 — Hot-swap em runtime",
    desc: "CreditCardPlugin v2.1.0 (sem antifraude) é descarregado via UnloadPlugin(). v3.0.0 (com ClearSale) é carregado. O caller usa exatamente a mesma API — não sabe que o plugin trocou.",
    color: "blue",
  },
  {
    title: "DEMO 3 — Isolamento de falha",
    desc: "CryptoPlugin v0.1.0-beta lança exceção durante ProcessAsync. Kernel captura a falha de forma isolada. PIX e Boleto continuam operacionais — zero propagação de erro.",
    color: "red",
  },
  {
    title: "DEMO 4 — Plugin ausente",
    desc: "Tentativa de processar método \"débito\" sem plugin registrado. Kernel lança KeyNotFoundException de forma explícita — falha rápida e rastreável.",
    color: "amber",
  },
];

const realWorldExamples = [
  { system: "VS Code / Eclipse", kernel: "Editor core", plugins: "Extensões de linguagem, debuggers, temas" },
  { system: "Jenkins / GitHub Actions", kernel: "Pipeline engine", plugins: "Steps, actions, runners" },
  { system: "Webpack / Vite", kernel: "Bundler core", plugins: "Loaders, transformers, output formatters" },
  { system: "ASP.NET Core", kernel: "Request pipeline", plugins: "Middlewares (auth, CORS, caching…)" },
  { system: "Impostos tributários", kernel: "Motor de cálculo", plugins: "Regras por UF, país, regime fiscal" },
  { system: "Antivírus", kernel: "Scanner engine", plugins: "Assinaturas de vírus atualizáveis" },
];

const colorMap: Record<string, string> = {
  emerald: "border-emerald-800 text-emerald-300",
  blue:    "border-blue-800 text-blue-300",
  red:     "border-red-800 text-red-300",
  amber:   "border-amber-800 text-amber-300",
};

export default function MicrokernelPage() {
  return (
    <AlgorithmLayout
      title="Microkernel Architecture"
      icon="Puzzle"
      category="Arquitetura"
      description="Também chamada de Plugin Architecture, o padrão Microkernel separa um sistema em duas partes: o Core (kernel mínimo e estável) e os Plug-in modules (funcionalidades independentes e intercambiáveis). O Core fornece apenas o suficiente para carregar, inicializar e despachar para plugins — ele nunca muda quando uma nova funcionalidade é adicionada. Plugins implementam um contrato (interface) e são autossuficientes: têm ciclo de vida próprio (Initialize → ProcessAsync → Dispose), podem ser carregados e descarregados em runtime (hot-swap) e falham de forma isolada sem afetar os demais."
      sources={sources}
      code={csharpCode}
      codeDescription="IPaymentPlugin como contrato, PaymentKernel gerenciando ciclo de vida e registry, e dois plugins concretos — incluindo hot-swap transparente de CreditCardPluginV2 para V3."
    >
      <div className="flex flex-col gap-8">

        {/* Diagrama conceitual */}
        <div>
          <h2 className="font-semibold text-[var(--text-primary)] text-lg mb-4">Estrutura: Core + Plugin Registry + Plugins</h2>
          <div className="flex flex-col gap-2">

            {/* Caller */}
            <div className="flex justify-center">
              <div className="bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-lg px-6 py-2 text-sm text-[var(--text-secondary)] font-medium">
                Caller (Endpoint / Controller)
              </div>
            </div>

            {/* seta */}
            <div className="flex justify-center text-[var(--text-faint)] text-lg">↓ ProcessAsync("pix", ...)</div>

            {/* Kernel */}
            <div className="bg-blue-950/40 border border-blue-800 rounded-md p-4">
              <div className="text-blue-300 font-semibold text-sm mb-3 text-center">
                PaymentKernel — Core (nunca muda)
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-center text-[var(--text-tertiary)]">
                <div className="bg-[var(--bg-surface)] rounded-lg p-2">LoadPlugin()<br /><span className="text-[var(--text-faint)]">Initialize()</span></div>
                <div className="bg-[var(--bg-surface)] rounded-lg p-2">Plugin Registry<br /><span className="text-[var(--text-faint)]">Dictionary&lt;string, IPaymentPlugin&gt;</span></div>
                <div className="bg-[var(--bg-surface)] rounded-lg p-2">UnloadPlugin()<br /><span className="text-[var(--text-faint)]">Dispose()</span></div>
              </div>
            </div>

            {/* seta */}
            <div className="flex justify-center text-[var(--text-faint)] text-lg">↓ dispatch via IPaymentPlugin</div>

            {/* Plugins */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "PixPlugin", version: "v1.0.0", color: "emerald" },
                { label: "CreditCardPlugin", version: "v3.0.0", color: "violet" },
                { label: "BoletoPlugin", version: "v1.3.0", color: "amber" },
                { label: "CryptoPlugin", version: "v0.1.0-beta", color: "red" },
              ].map(({ label, version, color }) => (
                <div
                  key={label}
                  className={`bg-[var(--bg-surface)] rounded-md border p-3 text-center ${
                    color === "emerald" ? "border-emerald-800"
                    : color === "violet" ? "border-violet-800"
                    : color === "amber" ? "border-amber-800"
                    : "border-red-800"
                  }`}
                >
                  <p className={`text-xs font-semibold ${
                    color === "emerald" ? "text-emerald-300"
                    : color === "violet" ? "text-violet-300"
                    : color === "amber" ? "text-amber-300"
                    : "text-red-400"
                  }`}>{label}</p>
                  <p className="text-[var(--text-faint)] text-xs mt-0.5">{version}</p>
                  <p className="text-[var(--text-muted)] text-xs mt-1">IPaymentPlugin</p>
                </div>
              ))}
            </div>

            <p className="text-[var(--text-faint)] text-xs text-center mt-1">
              Qualquer classe que implemente <code className="bg-[var(--bg-surface-hover)] px-1 rounded">IPaymentPlugin</code> pode ser carregada no kernel.
            </p>
          </div>
        </div>

        {/* Ciclo de vida */}
        <div>
          <h2 className="font-semibold text-[var(--text-primary)] text-lg mb-4">Ciclo de vida de um plugin</h2>
          <div className="flex items-center gap-1 flex-wrap text-sm">
            {[
              { step: "LoadPlugin()", detail: "kernel recebe a instância", color: "blue" },
              { step: "Initialize()", detail: "plugin abre conexões, configura estado", color: "blue" },
              { step: "ProcessAsync() ×N", detail: "executa quantas vezes for necessário", color: "emerald" },
              { step: "UnloadPlugin()", detail: "kernel decide remover o plugin", color: "amber" },
              { step: "Dispose()", detail: "plugin fecha conexões, libera recursos", color: "amber" },
            ].map(({ step, detail, color }, i, arr) => (
              <div key={step} className="flex items-center gap-1">
                <div className={`flex flex-col gap-0.5 px-3 py-2 rounded-lg border text-center ${
                  color === "blue"    ? "bg-blue-950/40 border-blue-800"
                  : color === "emerald" ? "bg-emerald-950/40 border-emerald-800"
                  : "bg-amber-950/30 border-amber-900/50"
                }`}>
                  <code className={`text-xs font-mono font-semibold ${
                    color === "blue" ? "text-blue-300" : color === "emerald" ? "text-emerald-300" : "text-amber-300"
                  }`}>{step}</code>
                  <span className="text-[var(--text-muted)] text-xs">{detail}</span>
                </div>
                {i < arr.length - 1 && <span className="text-[var(--text-faint)]">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Demos overview */}
        <div>
          <h2 className="font-semibold text-[var(--text-primary)] text-lg mb-4">O que a demo executa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {demos.map(({ title, desc, color }) => (
              <div key={title} className={`flex flex-col gap-2 bg-[var(--bg-surface)] border rounded-md p-4 ${colorMap[color].split(" ")[0]}`}>
                <h3 className={`text-xs font-semibold ${colorMap[color].split(" ")[1]}`}>{title}</h3>
                <p className="text-[var(--text-tertiary)] text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trade-offs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md p-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Vantagens</h2>
            <ul className="space-y-2 text-[var(--text-tertiary)] leading-relaxed">
              <li><strong className="text-[var(--text-primary)]">Open/Closed</strong> — novo plugin sem tocar no Core</li>
              <li><strong className="text-[var(--text-primary)]">Hot-swap</strong> — substituir plugin sem downtime</li>
              <li><strong className="text-[var(--text-primary)]">Isolamento</strong> — falha de um plugin não propaga</li>
              <li><strong className="text-[var(--text-primary)]">Testabilidade</strong> — cada plugin testado isoladamente</li>
              <li><strong className="text-[var(--text-primary)]">Descoberta dinâmica</strong> — registry lista o que está ativo</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-md p-4">
            <h2 className="font-semibold text-[var(--text-primary)]">Limitações</h2>
            <ul className="space-y-2 text-[var(--text-tertiary)] leading-relaxed">
              <li><strong className="text-red-400">Interface rígida</strong> — mudar IPaymentPlugin impacta todos</li>
              <li><strong className="text-red-400">Registry thread-safety</strong> — ponto central de falha</li>
              <li><strong className="text-red-400">Versioning</strong> — convenção semver necessária entre plugins</li>
              <li><strong className="text-red-400">Debug</strong> — rastrear qual plugin processou requer logging</li>
            </ul>
          </div>
        </div>

        {/* Exemplos reais */}
        <div>
          <h2 className="font-semibold text-[var(--text-primary)] text-lg mb-3">Microkernel na prática</h2>
          <div className="rounded-md border border-[var(--border-default)] overflow-hidden text-sm">
            <div className="grid grid-cols-3 bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] font-medium text-xs">
              <div className="px-4 py-2.5">Sistema</div>
              <div className="px-4 py-2.5 border-l border-[var(--border-strong)]">Core / Kernel</div>
              <div className="px-4 py-2.5 border-l border-[var(--border-strong)]">Plugins</div>
            </div>
            {realWorldExamples.map((row, i) => (
              <div key={row.system} className={`grid grid-cols-3 text-xs ${i % 2 === 0 ? "bg-[var(--bg-surface)]" : "bg-[var(--bg-app)]"}`}>
                <div className="px-4 py-3 text-[var(--text-primary)] font-medium">{row.system}</div>
                <div className="px-4 py-3 text-[var(--text-tertiary)] border-l border-[var(--border-default)]">{row.kernel}</div>
                <div className="px-4 py-3 text-[var(--text-tertiary)] border-l border-[var(--border-default)]">{row.plugins}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo */}
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-[var(--text-primary)] text-xl">Executar no Backend</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Cria um <code className="text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] px-1 rounded text-xs">PaymentKernel</code> em memória,
            carrega 4 plugins com ciclos de vida completos, processa pagamentos reais (PIX, Cartão, Boleto),
            faz hot-swap do plugin de cartão de v2 para v3, demonstra isolamento de falha do
            <code className="text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] px-1 rounded text-xs"> CryptoPlugin</code> e testa
            método sem handler registrado.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/arquiteturas/microkernel/run`}
            buttonLabel="▶ Executar Demo Microkernel"
            accentColor="emerald"
          />
        </div>

      </div>
    </AlgorithmLayout>
  );
}
