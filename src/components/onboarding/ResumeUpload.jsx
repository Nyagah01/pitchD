import { useRef, useState } from "react";
import { UploadCloud, FileCheck2 } from "lucide-react";
import { extractResumeText } from "../../lib/resumeParse";
import { friendlyError } from "../../lib/friendlyError";

export default function ResumeUpload({ onExtracted }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const text = await extractResumeText(file);
      setFileName(file.name);
      onExtracted(text);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text">Or upload an existing resume</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg px-4 py-6 text-sm text-muted transition-colors hover:border-primary/50 hover:text-text"
      >
        {fileName ? <FileCheck2 size={18} className="text-accent" /> : <UploadCloud size={18} />}
        {busy ? "Reading file…" : fileName || "PDF or DOCX — click to choose"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        onChange={handleFile}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
