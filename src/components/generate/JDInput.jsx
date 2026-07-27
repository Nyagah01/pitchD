export default function JDInput({ value, onChange, company, onCompanyChange, role, onRoleChange }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Company</span>
          <input
            value={company}
            onChange={(e) => onCompanyChange(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
            placeholder="Acme Corp"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Role</span>
          <input
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
            placeholder="Software Engineer"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Job description</span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          placeholder="Paste the full job description here…"
          className="rounded-xl border border-border bg-bg px-4 py-3 text-sm leading-relaxed text-text outline-none focus:border-primary"
        />
      </label>
    </div>
  );
}
