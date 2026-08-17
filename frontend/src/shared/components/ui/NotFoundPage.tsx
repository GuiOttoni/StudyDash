import { Link } from "react-router";

interface Props {
  message?: string;
}

export function NotFoundPage({ message = "Página não encontrada." }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold text-[var(--text-primary)]">404</h1>
      <p className="text-[var(--text-tertiary)]">{message}</p>
      <Link to="/" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
        ← Voltar pro início
      </Link>
    </div>
  );
}
