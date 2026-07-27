import { useState } from "react";
import { friendlyError } from "../../lib/friendlyError";

export default function EssayGenerator({ existing, onGenerate }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [content, setContent] = useState(existing);

  async function generate() {
    if (!prompt.trim()) {
      setError("Paste the essay prompt or question first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await onGenerate(prompt);
      setContent(result);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Essay prompt</span>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. Why do you want to work here? (500 words)"
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
        />
      </label>

      {error && <p className="text-xs text-danger">{error}</p>}

      <button
        onClick={generate}
        disabled={loading}
        className="cta-glow self-start rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Writing…" : content ? "Regenerate essay" : "Generate essay"}
      </button>

      {content && (
        <div className="whitespace-pre-wrap rounded-xl border border-border bg-surface p-5 text-sm leading-relaxed text-text">
          {content}
        </div>
      )}
    </div>
  );
}
