"use client";

interface Props {
  array: number[];
  comparing: number[];
  sorted: number[];
}

export function ArrayChart({ array, comparing, sorted }: Props) {
  if (array.length === 0) return null;

  const max = Math.max(...array, 1);

  return (
    <div className="flex items-end justify-center gap-1.5 h-56 px-4 pt-4 pb-2 bg-zinc-950 rounded-xl border border-zinc-800">
      {array.map((value, i) => {
        const isComparing = comparing.includes(i);
        const isSorted = sorted.includes(i);

        const barColor = isSorted
          ? "bg-emerald-500 shadow-[0_0_8px_0px_rgba(16,185,129,0.5)]"
          : isComparing
          ? "bg-orange-400 shadow-[0_0_8px_0px_rgba(251,146,60,0.5)]"
          : "bg-blue-500";

        const heightPx = Math.max(Math.round((value / max) * 160), 8);

        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span className={`text-xs font-mono font-semibold transition-colors ${isComparing ? "text-orange-300" : isSorted ? "text-emerald-400" : "text-zinc-400"}`}>
              {value}
            </span>
            <div
              className={`w-full rounded-t transition-all duration-150 ease-out ${barColor}`}
              style={{ height: `${heightPx}px` }}
            />
            <span className="text-[10px] text-zinc-600 font-mono">{i}</span>
          </div>
        );
      })}
    </div>
  );
}
