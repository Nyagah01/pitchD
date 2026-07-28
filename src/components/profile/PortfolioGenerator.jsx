import { useEffect, useState } from "react";
import { Globe, Copy, Check, ExternalLink } from "lucide-react";
import { getMyPortfolio, generatePortfolio, deletePortfolio } from "../../lib/portfolio";
import { friendlyError } from "../../lib/friendlyError";

export default function PortfolioGenerator() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyPortfolio()
      .then(setPortfolio)
      .finally(() => setLoading(false));
  }, []);

  const url = portfolio ? `${window.location.origin}/p/${portfolio.slug}` : null;

  async function handleGenerate() {
    setBusy(true);
    setError("");
    try {
      const result = await generatePortfolio();
      setPortfolio(result);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleTakeDown() {
    setBusy(true);
    setError("");
    try {
      await deletePortfolio();
      setPortfolio(null);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <Globe size={16} className="text-primary" />
        <h3 className="text-sm font-semibold text-text">Portfolio site</h3>
      </div>
      <p className="mt-1 text-sm text-muted">
        A clean, shareable page built from your profile — no design work needed.
      </p>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {portfolio ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
            <span className="flex-1 truncate text-sm text-text">{url}</span>
            <button onClick={handleCopy} className="shrink-0 text-muted hover:text-text" aria-label="Copy link">
              {copied ? <Check size={15} className="text-accent" /> : <Copy size={15} />}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted hover:text-text" aria-label="Open">
              <ExternalLink size={15} />
            </a>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={busy}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-60"
            >
              {busy ? "Refreshing…" : "Refresh with latest profile"}
            </button>
            <button
              onClick={handleTakeDown}
              disabled={busy}
              className="text-xs font-medium text-muted hover:text-danger disabled:opacity-60"
            >
              Take down
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={busy}
          className="cta-glow mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Generating…" : "Generate portfolio site"}
        </button>
      )}
    </section>
  );
}
