import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Mail, Phone, MapPin, Link2, Globe, ArrowUpRight } from "lucide-react";
import { getPortfolioBySlug } from "../lib/portfolio";

function Section({ title, children }) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="font-header text-lg font-extrabold text-text">{title}</h2>
      <div className="mt-4 flex flex-col gap-5">{children}</div>
    </section>
  );
}

export default function PortfolioView() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, portfolio: null, error: false });

  useEffect(() => {
    getPortfolioBySlug(slug)
      .then((portfolio) => setState({ loading: false, portfolio, error: !portfolio }))
      .catch(() => setState({ loading: false, portfolio: null, error: true }));
  }, [slug]);

  if (state.loading) {
    return <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">Loading…</div>;
  }

  if (state.error || !state.portfolio) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-4 text-center">
        <p className="text-lg font-bold text-text">This portfolio isn't available.</p>
        <p className="text-sm text-muted">It may have been taken down, or the link is wrong.</p>
        <Link to="/" className="mt-2 text-sm font-medium text-primary hover:underline">
          Go to Pitchd →
        </Link>
      </div>
    );
  }

  const { profile = {}, experience = [], education = [], skills = [], certifications = [], projects = [] } =
    state.portfolio.data ?? {};

  const contactLinks = [
    profile.email && { icon: Mail, label: profile.email, href: `mailto:${profile.email}` },
    profile.phone && { icon: Phone, label: profile.phone, href: `tel:${profile.phone}` },
    profile.location && { icon: MapPin, label: profile.location },
    profile.linkedin_url && { icon: Link2, label: "LinkedIn", href: profile.linkedin_url },
    profile.github_url && { icon: Link2, label: "GitHub", href: profile.github_url },
    profile.portfolio_url && { icon: Globe, label: "Website", href: profile.portfolio_url },
  ].filter(Boolean);

  const skillsByCategory = skills.reduce((acc, s) => {
    const key = s.category || "Skills";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <header>
          <h1 className="font-header text-4xl font-extrabold tracking-tight">{profile.full_name || "Portfolio"}</h1>
          {profile.headline && <p className="mt-2 text-lg text-muted">{profile.headline}</p>}

          {contactLinks.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
              {contactLinks.map(({ icon: Icon, label, href }, i) =>
                href ? (
                  <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary">
                    <Icon size={14} /> {label}
                  </a>
                ) : (
                  <span key={i} className="flex items-center gap-1.5">
                    <Icon size={14} /> {label}
                  </span>
                )
              )}
            </div>
          )}

          {profile.summary && <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted">{profile.summary}</p>}
        </header>

        <div className="mt-10 flex flex-col gap-8">
          {experience.length > 0 && (
            <Section title="Experience">
              {experience.map((item, i) => (
                <div key={i}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="font-semibold text-text">{item.role}</p>
                    <p className="text-xs text-muted">
                      {item.start_date ?? "?"} — {item.end_date ?? "Present"}
                    </p>
                  </div>
                  <p className="text-sm text-primary">{item.company}</p>
                  {item.description && <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>}
                  {item.achievements?.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {item.achievements.map((a, j) => (
                        <li key={j} className="flex gap-2 text-sm text-muted">
                          <span className="text-primary">–</span> {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </Section>
          )}

          {projects.length > 0 && (
            <Section title="Projects">
              {projects.map((item, i) => (
                <div key={i}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-text">{item.name}</p>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        <ArrowUpRight size={14} />
                      </a>
                    )}
                  </div>
                  {item.description && <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>}
                  {item.tech_stack?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.tech_stack.map((t, j) => (
                        <span key={j} className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Section>
          )}

          {education.length > 0 && (
            <Section title="Education">
              {education.map((item, i) => (
                <div key={i}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="font-semibold text-text">{item.institution}</p>
                    <p className="text-xs text-muted">
                      {item.start_date ?? "?"} — {item.end_date ?? "Present"}
                    </p>
                  </div>
                  <p className="text-sm text-muted">
                    {item.degree}
                    {item.field ? `, ${item.field}` : ""}
                    {item.grade ? ` · ${item.grade}` : ""}
                  </p>
                </div>
              ))}
            </Section>
          )}

          {Object.keys(skillsByCategory).length > 0 && (
            <Section title="Skills">
              {Object.entries(skillsByCategory).map(([category, items]) => (
                <div key={category} className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">{category}</span>
                  {items.map((s, i) => (
                    <span key={i} className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-text">
                      {s.name}
                    </span>
                  ))}
                </div>
              ))}
            </Section>
          )}

          {certifications.length > 0 && (
            <Section title="Certifications">
              {certifications.map((item, i) => (
                <div key={i} className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-text">
                    {item.name} <span className="text-muted">· {item.issuer}</span>
                  </p>
                  {item.date_issued && <p className="text-xs text-muted">{item.date_issued}</p>}
                </div>
              ))}
            </Section>
          )}
        </div>

        <footer className="mt-16 border-t border-border pt-6 text-center">
          <a href="/" className="text-xs text-muted hover:text-primary">
            Built with <span className="font-semibold">Pitch<span className="text-primary">d</span></span>
          </a>
        </footer>
      </div>
    </div>
  );
}
