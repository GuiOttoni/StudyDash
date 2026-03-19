import { AlgorithmLayout } from "@/components/patterns/AlgorithmLayout";
import { LogRunSection } from "@/components/patterns/LogRunSection";

const csharpCode = `// ── Cache-Aside (Lazy Loading) com Redis ─────────────────────
public async Task<Section?> GetSectionAsync(string slug)
{
    var cacheKey = $"section:{slug}";
    var db       = _redis.GetDatabase();

    // 1. Verificar o cache primeiro
    var cached = await db.StringGetAsync(cacheKey);
    if (cached.HasValue)
    {
        _metrics.RecordHit();
        return JsonSerializer.Deserialize<Section>(cached!);   // ← CACHE HIT
    }

    _metrics.RecordMiss();

    // 2. Cache MISS: buscar no banco de dados
    var section = await _repository.GetBySlugAsync(slug);
    if (section is null) return null;

    // 3. Armazenar no Redis com TTL
    var json = JsonSerializer.Serialize(section);
    await db.StringSetAsync(cacheKey, json, TimeSpan.FromMinutes(15));   // ← SET EX 900

    return section;   // ← retorna do banco (primeira vez)
}

// ── Invalidação após update ───────────────────────────────────
public async Task UpdateSectionAsync(Section section)
{
    await _repository.UpdateAsync(section);

    // Remove do cache — próxima leitura vai ao banco e repopula
    await _redis.GetDatabase().KeyDeleteAsync($"section:{section.Slug}");
}`;

const sources = [
  { label: "Microsoft — Cache-Aside Pattern", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside", icon: "📖" },
  { label: "Redis — Caching Strategies", url: "https://redis.io/docs/latest/develop/use/patterns/", icon: "📖" },
  { label: "Martin Fowler — Caching Patterns", url: "https://martinfowler.com/bliki/TwoHardThings.html", icon: "📝" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";

export default function CacheAsidePage() {
  return (
    <AlgorithmLayout
      title="Cache-Aside Pattern"
      icon="Database"
      category="Cache"
      description="No padrão Cache-Aside (também chamado Lazy Loading), a aplicação é responsável por gerenciar o ciclo de vida do cache. Ao ler um dado: verifica o Redis primeiro → se não existir (MISS), busca no banco e armazena no Redis com TTL → nas próximas leituras retorna direto do cache (HIT) em < 5ms. O cache só é populado quando o dado é solicitado, evitando warm-up desnecessário de dados raramente acessados."
      sources={sources}
      code={csharpCode}
      codeDescription="Cache-Aside completo: leitura com MISS/HIT, SET no Redis com TTL, e invalidação explícita após update. A aplicação controla todo o ciclo — o Redis é tratado como store opcional, não como source of truth."
    >
      <div className="flex flex-col gap-6">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {[
            {
              event: "CACHE MISS",
              timing: "~200ms",
              desc: "Redis retorna nil. App vai ao banco, lê o dado e armazena no Redis com TTL.",
              color: "red",
            },
            {
              event: "CACHE HIT",
              timing: "< 5ms",
              desc: "Redis retorna o dado diretamente. Banco não é consultado. 40× mais rápido.",
              color: "emerald",
            },
            {
              event: "TTL Expiry",
              timing: "configurable",
              desc: "Chave expira automaticamente. Próxima leitura gera MISS e repopula o cache.",
              color: "amber",
            },
          ].map(({ event, timing, desc, color }) => (
            <div key={event} className="flex flex-col gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                  color === "red"    ? "bg-red-950 text-red-400 border border-red-900"
                  : color === "emerald" ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                  : "bg-amber-950 text-amber-400 border border-amber-900"
                }`}>{event}</span>
                <span className={`text-xs font-mono font-bold ${
                  color === "red" ? "text-red-400" : color === "emerald" ? "text-emerald-400" : "text-amber-400"
                }`}>{timing}</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white">Comparação de Estratégias</h2>
            <div className="space-y-2 text-zinc-400 leading-relaxed">
              <div>
                <strong className="text-zinc-300">Cache-Aside (Lazy)</strong>
                <p>App controla; cache só populado ao ler. Ideal para dados lidos frequentemente e atualizados raramente.</p>
              </div>
              <div>
                <strong className="text-zinc-300">Write-Through</strong>
                <p>App escreve banco + cache atomicamente. Cache sempre consistente; toda escrita atinge o Redis.</p>
              </div>
              <div>
                <strong className="text-zinc-300">Write-Behind</strong>
                <p>App escreve só no cache; relay assíncrono para banco. Alta performance de escrita; risco de perda se Redis cair.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h2 className="font-semibold text-white">Armadilhas Comuns</h2>
            <ul className="space-y-2 text-zinc-400 leading-relaxed">
              <li>
                <strong className="text-red-400">Cache Stampede</strong> — múltiplas requisições simultâneas no MISS vão todas ao banco.
                <span className="block text-xs text-zinc-500 mt-0.5">Solução: mutex/lock distribuído (SETNX) ou probabilistic refresh.</span>
              </li>
              <li>
                <strong className="text-red-400">Inconsistência</strong> — update no banco sem invalidar o cache.
                <span className="block text-xs text-zinc-500 mt-0.5">Solução: sempre execute <code className="bg-zinc-800 px-1 rounded">KeyDeleteAsync</code> após writes.</span>
              </li>
              <li>
                <strong className="text-amber-400">TTL muito longo</strong> — dados stale servidos por horas.
                <span className="block text-xs text-zinc-500 mt-0.5">Solução: calibre TTL pelo ritmo de atualização do dado.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-white text-xl">Executar no Backend</h2>
          <p className="text-zinc-500 text-sm">
            Demonstração com Redis real: Fase 1 MISS (200ms de banco simulado) → Fase 2 HIT (&lt; 5ms) →
            Fase 3 countdown do TTL → Fase 4 MISS após expiração → comparação de latências.
          </p>
          <LogRunSection
            apiUrl={`${API_URL}/api/cache/cache-aside/run`}
            buttonLabel="▶ Executar Demo Cache-Aside"
            accentColor="emerald"
          />
        </div>

      </div>
    </AlgorithmLayout>
  );
}
