import { useState } from "react";
import { Plus, X, Check } from "lucide-react";

const PROFICIENCIES = ["Beginner", "Intermediate", "Expert"];

function SkillPill({ skill, api, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(skill);
  const [busy, setBusy] = useState(false);

  function startEdit() {
    setDraft(skill);
    setEditing(true);
  }

  async function save() {
    if (!draft.name.trim()) return;
    setBusy(true);
    try {
      await api.update(skill.id, {
        name: draft.name.trim(),
        category: draft.category,
        proficiency: draft.proficiency,
      });
      setEditing(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    await api.remove(skill.id);
    onChanged();
  }

  if (editing) {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-surface py-1 pl-2.5 pr-1.5 text-xs">
        <input
          autoFocus
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="w-24 min-w-0 rounded border border-border bg-bg px-1.5 py-0.5 text-xs text-text outline-none focus:border-primary"
        />
        <select
          value={draft.proficiency || "Intermediate"}
          onChange={(e) => setDraft({ ...draft, proficiency: e.target.value })}
          className="rounded border border-border bg-bg px-1 py-0.5 text-xs text-text outline-none"
        >
          {PROFICIENCIES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <button
          disabled={busy}
          onClick={save}
          className="flex h-8 w-8 items-center justify-center text-primary hover:text-primary-deep"
          aria-label="Save"
        >
          <Check size={14} />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="flex h-8 w-8 items-center justify-center text-muted hover:text-text"
          aria-label="Cancel"
        >
          <X size={13} />
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center rounded-full border border-border bg-surface pl-3 pr-1 text-xs text-text">
      <button
        type="button"
        onClick={startEdit}
        className="py-2.5 pr-1"
        aria-label={`Edit ${skill.name}`}
      >
        {skill.name}
      </button>
      <button
        onClick={remove}
        className="flex h-8 w-8 items-center justify-center text-muted hover:text-danger"
        aria-label={`Remove ${skill.name}`}
      >
        <X size={12} />
      </button>
    </span>
  );
}

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
              <SkillPill key={s.id} skill={s} api={api} onChanged={onChanged} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
