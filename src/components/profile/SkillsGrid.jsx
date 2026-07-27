import { useState } from "react";
import { Plus, X } from "lucide-react";

export default function SkillsGrid({ skills, api, onChanged }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Technical");
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.create({ name: name.trim(), category, proficiency: "Intermediate" });
      setName("");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    await api.remove(id);
    onChanged();
  }

  const grouped = skills.reduce((acc, s) => {
    const key = s.category || "Other";
    acc[key] = acc[key] || [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-text">
        Skills <span className="text-muted">({skills.length})</span>
      </h3>

      <form onSubmit={add} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a skill"
          className="flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-primary"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-text outline-none focus:border-primary"
        >
          <option>Technical</option>
          <option>Soft Skills</option>
          <option>Tools</option>
        </select>
        <button
          disabled={busy}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white"
        >
          <Plus size={13} /> Add
        </button>
      </form>

      {Object.keys(grouped).length === 0 && (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
          No skills yet — add at least 5 to strengthen your profile.
        </p>
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">{cat}</p>
          <div className="flex flex-wrap gap-2">
            {items.map((s) => (
              <span
                key={s.id}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text"
              >
                {s.name}
                <button onClick={() => remove(s.id)} className="text-muted hover:text-danger">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
