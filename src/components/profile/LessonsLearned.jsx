import { useState } from "react";
import { Plus, X, GraduationCap } from "lucide-react";

export default function LessonsLearned({ lessons, onChange }) {
  const [draft, setDraft] = useState("");

  function add(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    onChange([...lessons, draft.trim()]);
    setDraft("");
  }

  function remove(index) {
    onChange(lessons.filter((_, i) => i !== index));
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <GraduationCap size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-text">
          Lessons learned <span className="text-muted">({lessons.length})</span>
        </h3>
      </div>
      <p className="text-xs text-muted">
        Synthesized from past rejection feedback — every generated CV and cover letter factors these in. Add or
        remove entries any time.
      </p>

      <form onSubmit={add} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a lesson manually"
          className="flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text outline-none focus:border-primary"
        />
        <button className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white">
          <Plus size={13} /> Add
        </button>
      </form>

      {lessons.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
          Nothing yet — this fills in automatically the first time an application is marked denied with feedback.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lessons.map((lesson, i) => (
            <li
              key={i}
              className="flex items-start justify-between gap-2 rounded-xl border border-border bg-surface p-3 text-sm text-text"
            >
              <span>{lesson}</span>
              <button onClick={() => remove(i)} className="shrink-0 text-muted hover:text-danger">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
