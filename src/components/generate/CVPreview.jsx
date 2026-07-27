import { useState } from "react";
import { Download, Pencil, Check, X } from "lucide-react";
import { exportCvPdf } from "../../lib/pdfExport";

export default function CVPreview({ content, onChange, company, role }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [downloadError, setDownloadError] = useState("");

  function startEdit() {
    setDraft(content);
    setEditing(true);
  }

  function saveEdit() {
    onChange?.(draft);
    setEditing(false);
  }

  function handleDownload() {
    setDownloadError("");
    try {
      exportCvPdf(editing ? draft : content, { company, role });
    } catch (err) {
      console.error("CV PDF export failed:", err);
      setDownloadError("Couldn't generate the PDF. Try again, and let us know if it keeps happening.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-2">
        {onChange && !editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:border-primary/40"
          >
            <Pencil size={12} /> Edit
          </button>
        )}
        {editing && (
          <>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-text"
            >
              <X size={12} /> Cancel
            </button>
            <button
              onClick={saveEdit}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Check size={12} /> Save
            </button>
          </>
        )}
        <button
          onClick={handleDownload}
          className="cta-glow flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white"
        >
          <Download size={12} /> Download PDF
        </button>
      </div>

      {downloadError && <p className="text-right text-xs text-danger">{downloadError}</p>}

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={22}
          className="w-full rounded-xl border border-primary/40 bg-surface p-4 font-mono text-sm text-text outline-none focus:border-primary"
        />
      ) : (
        <div className="window-chrome">
          <div className="window-chrome-bar">
            <span className="window-dot window-dot--red" />
            <span className="window-dot window-dot--yellow" />
            <span className="window-dot window-dot--green" />
            <span className="window-chrome-title">cv.txt</span>
          </div>
          <div className="terminal-log max-h-[32rem] overflow-y-auto whitespace-pre-wrap px-6 py-5 text-white/90">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
