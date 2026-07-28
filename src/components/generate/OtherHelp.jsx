import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { friendlyError } from "../../lib/friendlyError";

function parseResult(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { summary: raw, links: [] };
  }
}

export default function OtherHelp({ existing, onGenerate }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(parseResult(existing));

  async function generate() {
    if (!query.trim()) {
      setError("What do you need help with?");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const raw = await onGenerate(query);
      setResult(parseResult(raw));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted">What do you need help with?</span>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={2}
          placeholder="e.g. What's this company's remote work policy? What should I wear to the interview?"
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
        />
      </label>

      {error && <p className="text-xs text-danger">{error}</p>}

      <button
        onClick={generate}
        disabled={loading}
        className="cta-glow self-start rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Searching…" : result ? "Search again" : "Search for help"}
      </button>

      {result && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
          {result.summary && <p className="text-sm leading-relaxed text-text">{result.summary}</p>}
          {result.links?.length > 0 && (
            <div className="flex flex-col gap-2">
              {result.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-primary hover:border-primary/40"
                >
                  <span className="truncate">{link.title || link.url}</span>
                  <ArrowUpRight size={14} className="shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
