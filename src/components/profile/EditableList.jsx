import { useRef, useState } from "react";
import { Plus, Trash2, Pencil, Check, UploadCloud } from "lucide-react";
import TagInput from "../common/TagInput";
import { uploadCertificationFile } from "../../lib/uploads";
import { friendlyError } from "../../lib/friendlyError";

function isValidDateInput(v) {
  return !v || /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function Field({ label, value, onChange, textarea, type, allowPresent, presentLabel = "Currently ongoing (no end date)" }) {
  const Comp = textarea ? "textarea" : "input";
  const safeValue = type === "date" && !isValidDateInput(value) ? "" : (value ?? "");
  const [present, setPresent] = useState(allowPresent ? !safeValue : false);

  function togglePresent(checked) {
    setPresent(checked);
    if (checked) onChange(null);
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
      <Comp
        type={type}
        value={present ? "" : safeValue}
        disabled={present}
        onChange={(e) => onChange(e.target.value)}
        rows={textarea ? 2 : undefined}
        className="w-full min-w-0 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
      {allowPresent && (
        <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            checked={present}
            onChange={(e) => togglePresent(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border accent-primary"
          />
          {presentLabel}
        </span>
      )}
    </label>
  );
}

function ListField({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
      <TagInput value={value} onChange={onChange} placeholder="Type and press Enter" />
    </label>
  );
}

function FileField({ label, value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadCertificationFile(file);
      onChange(url);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-bg px-2.5 py-1.5 text-sm text-muted transition-colors hover:border-primary/50 hover:text-text disabled:opacity-60"
      >
        <UploadCloud size={14} />
        {uploading ? "Uploading…" : value ? "Replace file" : "Upload PDF or photo"}
      </button>
      {value && !uploading && (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
          View current file
        </a>
      )}
      <input ref={inputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFile} />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export default function EditableList({ title, items, fields, emptyItem, api, onChanged, renderSummary }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function startEdit(item) {
    setEditingId(item.id);
    setDraft(item);
    setError("");
  }

  function updateDraft(key, value) {
    setDraft({ ...draft, [key]: value });
  }

  // A date field that displays blank (invalid/unparseable AI-extracted value the
  // user never touched) must also SAVE as blank — otherwise the stale raw string
  // sails through untouched and only fails at the database, with no clue which
  // field it was.
  function sanitizedDraft() {
    const clean = { ...draft };
    for (const f of fields) {
      if (f.type === "date" && !isValidDateInput(clean[f.key])) {
        clean[f.key] = null;
      }
    }
    return clean;
  }

  async function saveDraft() {
    setBusy(true);
    setError("");
    try {
      const clean = sanitizedDraft();
      if (adding) await api.create(clean);
      else await api.update(editingId, clean);
      setEditingId(null);
      setAdding(false);
      setDraft({});
      onChanged();
    } catch (err) {
      setError(friendlyError(err));
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
    setError("");
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
              {fields.map(({ key, label, textarea, span, isList, type, allowPresent, presentLabel }) => (
                <div key={key} className={span ? "col-span-2" : ""}>
                  {isList ? (
                    <ListField label={label} value={draft[key]} onChange={(v) => updateDraft(key, v)} />
                  ) : type === "file" ? (
                    <FileField label={label} value={draft[key]} onChange={(v) => updateDraft(key, v)} />
                  ) : (
                    <Field
                      label={label}
                      textarea={textarea}
                      type={type}
                      allowPresent={allowPresent}
                      presentLabel={presentLabel}
                      value={draft[key]}
                      onChange={(v) => updateDraft(key, v)}
                    />
                  )}
                </div>
              ))}
            </div>
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  setAdding(false);
                  setEditingId(null);
                  setError("");
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
                {fields.map(({ key, label, textarea, span, isList, type, allowPresent, presentLabel }) => (
                  <div key={key} className={span ? "col-span-2" : ""}>
                    {isList ? (
                      <ListField label={label} value={draft[key]} onChange={(v) => updateDraft(key, v)} />
                    ) : type === "file" ? (
                      <FileField label={label} value={draft[key]} onChange={(v) => updateDraft(key, v)} />
                    ) : (
                      <Field
                        label={label}
                        textarea={textarea}
                        type={type}
                        allowPresent={allowPresent}
                        presentLabel={presentLabel}
                        value={draft[key]}
                        onChange={(v) => updateDraft(key, v)}
                      />
                    )}
                  </div>
                ))}
              </div>
              {error && <p className="mt-2 text-xs text-danger">{error}</p>}
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingId(null);
                    setError("");
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
