import { useState } from "react";
import { Plus, Trash2, Pencil, Check } from "lucide-react";

function Field({ label, value, onChange, textarea }) {
  const Comp = textarea ? "textarea" : "input";
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
      <Comp
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={textarea ? 2 : undefined}
        className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
      />
    </label>
  );
}

export default function EditableList({ title, items, fields, emptyItem, api, onChanged, renderSummary }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  function startEdit(item) {
    setEditingId(item.id);
    setDraft(item);
  }

  function updateDraft(key, value) {
    const field = fields.find((f) => f.key === key);
    setDraft({ ...draft, [key]: field?.isList ? value.split(",").map((s) => s.trim()).filter(Boolean) : value });
  }

  async function saveDraft() {
    setBusy(true);
    try {
      if (adding) await api.create(draft);
      else await api.update(editingId, draft);
      setEditingId(null);
      setAdding(false);
      setDraft({});
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setBusy(true);
    try {
      await api.remove(id);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  function startAdd() {
    setAdding(true);
    setEditingId("new");
    setDraft({ ...emptyItem });
  }

  const isEditingNew = adding && editingId === "new";

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">
          {title} <span className="text-muted">({items.length})</span>
        </h3>
        <button onClick={startAdd} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          <Plus size={13} /> Add
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {isEditingNew && (
          <div className="rounded-xl border border-primary/40 bg-surface p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map(({ key, label, textarea, span, isList }) => (
                <div key={key} className={span ? "col-span-2" : ""}>
                  <Field
                    label={label}
                    textarea={textarea}
                    value={isList ? (draft[key] ?? []).join(", ") : draft[key]}
                    onChange={(v) => updateDraft(key, v)}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  setAdding(false);
                  setEditingId(null);
                }}
                className="text-xs text-muted hover:text-text"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={saveDraft}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Check size={13} /> Save
              </button>
            </div>
          </div>
        )}

        {items.length === 0 && !isEditingNew && (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
            Nothing here yet.
          </p>
        )}

        {items.map((item) =>
          editingId === item.id ? (
            <div key={item.id} className="rounded-xl border border-primary/40 bg-surface p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map(({ key, label, textarea, span, isList }) => (
                  <div key={key} className={span ? "col-span-2" : ""}>
                    <Field
                      label={label}
                      textarea={textarea}
                      value={isList ? (draft[key] ?? []).join(", ") : draft[key]}
                      onChange={(v) => updateDraft(key, v)}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => setEditingId(null)} className="text-xs text-muted hover:text-text">
                  Cancel
                </button>
                <button
                  disabled={busy}
                  onClick={saveDraft}
                  className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Check size={13} /> Save
                </button>
              </div>
            </div>
          ) : (
            <div key={item.id} className="group relative rounded-xl border border-border bg-surface p-4">
              <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => startEdit(item)} className="text-muted hover:text-primary">
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(item.id)} className="text-muted hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
              {renderSummary(item)}
            </div>
          )
        )}
      </div>
    </section>
  );
}
