import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, ArrowUpRight } from "lucide-react";
import { getMyPortfolio } from "../../lib/portfolio";

export default function PortfolioBanner() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPortfolio()
      .then(setPortfolio)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const url = portfolio ? `${window.location.origin}/p/${portfolio.slug}` : null;

  return (
    <div
      className="cta-glow flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4 text-white"
      style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-deep) 100%)" }}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Globe size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold">{portfolio ? "Your portfolio site is live" : "You don't have a portfolio site yet"}</p>
          <p className="text-xs text-white/80">
            {portfolio ? url : "One click, built from your existing profile — no design work needed."}
          </p>
        </div>
      </div>
      {portfolio ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"
        >
          View site <ArrowUpRight size={15} />
        </a>
      ) : (
        <Link
          to="/profile"
          className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-white/90"
        >
          Generate portfolio site
        </Link>
      )}
    </div>
  );
}
