import { useState } from "react";
import { Plus, X, GraduationCap, Pencil, Check } from "lucide-react";

export default function LessonsLearned({ lessons, onChange }) {
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editDraft, setEditDraft] = useState("");

  function add(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    onChange([...lessons, draft.trim()]);
    setDraft("");
  }

  function remove(index) {
    onChange(lessons.filter((_, i) => i !== index));
  }

  function startEdit(index) {
    setEditingIndex(index);
    setEditDraft(lessons[index]);
  }

  function saveEdit() {
    if (!editDraft.trim()) return;
    onChange(lessons.map((l, i) => (i === editingIndex ? editDraft.trim() : l)));
    setEditingIndex(null);
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
          {lessons.map((lesson, i) =>
            editingIndex === i ? (
              <li key={i} className="flex items-center gap-2 rounded-xl border border-primary/40 bg-surface p-3">
                <input
                  autoFocus
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
                />
                <button
                  onClick={saveEdit}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-primary hover:text-primary-deep"
                  aria-label="Save"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setEditingIndex(null)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-muted hover:text-text"
                  aria-label="Cancel"
                >
                  <X size={16} />
                </button>
              </li>
            ) : (
              <li
                key={i}
                className="flex items-start justify-between rounded-xl border border-border bg-surface py-1 pl-3 pr-1 text-sm text-text"
              >
                <span className="py-2">{lesson}</span>
                <span className="flex shrink-0">
                  <button
                    onClick={() => startEdit(i)}
                    className="flex h-11 w-11 items-center justify-center text-muted hover:text-primary"
                    aria-label="Edit"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => remove(i)}
                    className="flex h-11 w-11 items-center justify-center text-muted hover:text-danger"
                    aria-label="Delete"
                  >
                    <X size={16} />
                  </button>
                </span>
              </li>
            )
          )}
        </ul>
      )}
    </section>
  );
}
