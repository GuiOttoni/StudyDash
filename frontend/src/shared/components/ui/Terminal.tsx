import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export interface TerminalLine {
  text: string;
  kind?: "default" | "error" | "success";
}

interface Props {
  lines: TerminalLine[];
  /** Muda quando uma nova sessão começa (ex: novo jobId) — limpa o terminal. */
  sessionKey?: string | number;
  className?: string;
}

const THEME = {
  background: "#09090b",
  foreground: "#e4e4e7",
  cursor:     "#a1a1aa",
  selectionBackground: "#3f3f46",
};

function ansi({ text, kind }: TerminalLine): string {
  if (kind === "error")   return `\x1b[31m${text}\x1b[0m`;
  if (kind === "success") return `\x1b[32m${text}\x1b[0m`;
  return text;
}

/** Terminal ao vivo (xterm.js), reutilizado em qualquer stream de texto do app
 *  — geração de estudo (qualquer provider de IA) e execução do código gerado. */
export function TerminalView({ lines, sessionKey, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef     = useRef<XTerm | null>(null);
  const writtenRef   = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      convertEol:   true,
      fontSize:     13,
      fontFamily:   '"Geist Mono", ui-monospace, "Cascadia Code", monospace',
      theme:        THEME,
      disableStdin: true,
      cursorBlink:  true,
      cursorStyle:  "bar",
      scrollback:   2000,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    xtermRef.current = term;

    const resizeObserver = new ResizeObserver(() => fit.fit());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      xtermRef.current = null;
    };
  }, []);

  // Nova sessão (ex: jobId diferente) → limpa o buffer.
  useEffect(() => {
    xtermRef.current?.clear();
    writtenRef.current = 0;
  }, [sessionKey]);

  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;
    for (let i = writtenRef.current; i < lines.length; i++) {
      term.writeln(ansi(lines[i]));
    }
    writtenRef.current = lines.length;
  }, [lines]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-72 rounded-md overflow-hidden border border-[var(--border-default)] p-2 bg-[#09090b]"}
    />
  );
}
