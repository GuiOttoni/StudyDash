interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

export function AdminField({ label, value, onChange, placeholder, type = "text" }: Props) {
  return (
    <div>
      <label className="text-xs text-[var(--text-tertiary)] font-medium block mb-1">{label}</label>
      <input
        type={type}
        className="w-full bg-[var(--bg-surface-hover)] border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--border-emphasis)]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
