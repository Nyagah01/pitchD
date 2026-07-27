import { useState } from "react";
import { friendlyError } from "../../lib/friendlyError";

export default function CodilityPrep({
  existing,
  onGenerate,
  description = "Generate likely coding-assessment topics and practice questions for this role, grounded in current info about the company where possible.",
  generateLabel = "Generate codility prep",
  loadingLabel = "Researching…",
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [content, setContent] = useState(existing);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const result = await onGenerate();
      setContent(result);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  if (!content) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted">{description}</p>
        {error && <p className="text-xs text-danger">{error}</p>}
        <button
          onClick={generate}
          disabled={loading}
          className="cta-glow rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? loadingLabel : generateLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="whitespace-pre-wrap rounded-xl border border-border bg-surface p-5 text-sm leading-relaxed text-text">
        {content}
      </div>
      <button onClick={generate} disabled={loading} className="self-start text-xs text-muted hover:text-text">
        {loading ? "Regenerating…" : "Regenerate"}
      </button>
    </div>
  );
}
