export default function DumpInput({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text">Brain-dump your history</label>
      <p className="text-xs text-muted">
        Old resumes, your LinkedIn "About", job descriptions you've held, side projects, certificates,
        random bullet points — paste it all, formatting doesn't matter.
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        placeholder="I worked at... I studied... I built a project that... I'm certified in..."
        className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm leading-relaxed text-text outline-none focus:border-primary"
      />
    </div>
  );
}
