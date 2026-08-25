import { useEffect, useState } from "react";
import { Globe, Copy, Check, ExternalLink } from "lucide-react";
import { getMyPortfolio, generatePortfolio, deletePortfolio } from "../../lib/portfolio";
import { friendlyError } from "../../lib/friendlyError";
import { PORTFOLIO_TEMPLATES, PORTFOLIO_ACCENTS, DEFAULT_TEMPLATE, DEFAULT_ACCENT } from "../../lib/portfolioThemes";

export default function PortfolioGenerator() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [accentId, setAccentId] = useState(DEFAULT_ACCENT);

  useEffect(() => {
    getMyPortfolio()
      .then((p) => {
        setPortfolio(p);
        if (p?.data?.meta?.template) setTemplate(p.data.meta.template);
        const existingAccent = PORTFOLIO_ACCENTS.find((a) => a.hex === p?.data?.meta?.accent);
        if (existingAccent) setAccentId(existingAccent.id);
      })
      .finally(() => setLoading(false));
  }, []);

  const url = portfolio ? `${window.location.origin}/p/${portfolio.slug}` : null;
  const accentHex = PORTFOLIO_ACCENTS.find((a) => a.id === accentId)?.hex ?? PORTFOLIO_ACCENTS[0].hex;

  async function handleGenerate() {
    setBusy(true);
    setError("");
    try {
      const result = await generatePortfolio(template, accentHex);
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
        A clean, shareable page built from your profile — pick a look, and it does the rest.
      </p>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {portfolio && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2">
          <span className="flex-1 truncate text-sm text-text">{url}</span>
          <button onClick={handleCopy} className="shrink-0 text-muted hover:text-text" aria-label="Copy link">
            {copied ? <Check size={15} className="text-accent" /> : <Copy size={15} />}
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted hover:text-text" aria-label="Open">
            <ExternalLink size={15} />
          </a>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">Template</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PORTFOLIO_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                  template === t.id ? "border-primary bg-primary-soft" : "border-border hover:border-primary/40"
                }`}
              >
                <span className={`block font-semibold ${template === t.id ? "text-primary" : "text-text"}`}>{t.name}</span>
                <span className="mt-0.5 block text-muted">{t.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">Accent color</p>
          <div className="flex flex-wrap gap-2">
            {PORTFOLIO_ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccentId(a.id)}
                aria-label={a.label}
                title={a.label}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform ${
                  accentId === a.id ? "scale-110 border-text" : "border-transparent hover:scale-105"
                }`}
              >
                <span className="block h-6 w-6 rounded-full" style={{ background: a.hex }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={busy}
          className="cta-glow rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? (portfolio ? "Updating…" : "Generating…") : portfolio ? "Update look & refresh" : "Generate portfolio site"}
        </button>
        {portfolio && (
          <button
            onClick={handleTakeDown}
            disabled={busy}
            className="text-xs font-medium text-muted hover:text-danger disabled:opacity-60"
          >
            Take down
          </button>
        )}
      </div>
    </section>
  );
}
