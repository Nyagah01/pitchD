import { ArrowUpRight, Code2 } from "lucide-react";
import { formatRange, formatMonthDate, normalizeUrl } from "../shared";
import { shade, readableTextOn } from "../../../lib/color";

function Section({ number, title, children }) {
  return (
    <section>
      <div className="flex items-center gap-3">
        <span className="font-header text-sm font-extrabold" style={{ color: "var(--pf-accent-soft-text)" }}>
          {number}
        </span>
        <h2 className="font-header text-xl font-extrabold text-text">{title}</h2>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

export default function AuroraTemplate({
  profile,
  experience,
  education,
  certifications,
  projects,
  contactLinks,
  skillsByCategory,
  accent,
}) {
  const deep = shade(accent, -0.35);
  const onAccent = readableTextOn(accent);
  let sectionCount = 0;
  const nextNumber = () => String(++sectionCount).padStart(2, "0");

  return (
    <div className="min-h-screen bg-bg text-text" style={{ "--pf-accent-soft-text": `${accent}99` }}>
      <header
        className="relative overflow-hidden px-6 pb-20 pt-16 sm:pb-28 sm:pt-24"
        style={{ background: `linear-gradient(135deg, ${accent} 0%, ${deep} 100%)`, color: onAccent }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0%, transparent 40%), radial-gradient(circle at 85% 60%, white 0%, transparent 35%)",
          }}
        />
        <div className="relative mx-auto max-w-2xl">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt={profile.full_name || "Profile photo"} className="h-16 w-16 rounded-2xl object-cover shadow-md" />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl font-header text-xl font-extrabold backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              {profile.full_name?.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "?"}
            </div>
          )}
          <h1 className="mt-6 font-header text-4xl font-extrabold tracking-tight sm:text-5xl">{profile.full_name || "Portfolio"}</h1>
          {profile.headline && <p className="mt-3 text-lg opacity-85 sm:text-xl">{profile.headline}</p>}

          {contactLinks.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {contactLinks.map(({ icon: Icon, label, href }, i) =>
                href ? (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors hover:opacity-80"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                  >
                    <Icon size={13} /> {label}
                  </a>
                ) : (
                  <span key={i} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <Icon size={13} /> {label}
                  </span>
                )
              )}
            </div>
          )}
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-2xl px-6">
        <div className="glass-card mt-6 rounded-3xl p-6 shadow-xl sm:mt-8 sm:p-8">
          {profile.summary && <p className="text-sm leading-relaxed text-text sm:text-base">{profile.summary}</p>}

          <div className="mt-8 flex flex-col gap-10">
            {experience.length > 0 && (
              <Section number={nextNumber()} title="Experience">
                {experience.map((item, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-semibold text-text">{item.role}</p>
                      <p className="text-xs text-muted">{formatRange(item.start_date, item.end_date)}</p>
                    </div>
                    <p className="text-sm font-medium" style={{ color: accent }}>
                      {item.company}
                    </p>
                    {item.description && <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>}
                    {item.achievements?.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-1.5">
                        {item.achievements.map((a, j) => (
                          <li key={j} className="flex gap-2 text-sm text-muted">
                            <span className="mt-0.5" style={{ color: accent }}>
                              ▸
                            </span>{" "}
                            {a}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {projects.length > 0 && (
              <Section number={nextNumber()} title="Projects">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {projects.map((item, i) => {
                    const projectUrl = normalizeUrl(item.url);
                    const githubUrl = normalizeUrl(item.github_url);
                    return (
                      <div key={i} className="rounded-2xl border border-border bg-surface p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-text">{item.name}</p>
                          {projectUrl && (
                            <a href={projectUrl} target="_blank" rel="noopener noreferrer" style={{ color: accent }} aria-label="Live link">
                              <ArrowUpRight size={14} />
                            </a>
                          )}
                          {githubUrl && (
                            <a href={githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: accent }} aria-label="Source code">
                              <Code2 size={14} />
                            </a>
                          )}
                        </div>
                        {item.impact && <p className="mt-1 text-xs font-medium text-accent">{item.impact}</p>}
                        {item.description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.description}</p>}
                        {item.tech_stack?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {item.tech_stack.map((t, j) => (
                              <span key={j} className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${accent}1a`, color: accent }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {education.length > 0 && (
              <Section number={nextNumber()} title="Education">
                {education.map((item, i) => (
                  <div key={i}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-semibold text-text">{item.institution}</p>
                      <p className="text-xs text-muted">{formatRange(item.start_date, item.end_date)}</p>
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
              <Section number={nextNumber()} title="Skills">
                {Object.entries(skillsByCategory).map(([category, items]) => (
                  <div key={category} className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">{category}</span>
                    {items.map((s, i) => (
                      <span key={i} className="rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: `${accent}40`, background: `${accent}1a`, color: accent }}>
                        {s.name}
                      </span>
                    ))}
                  </div>
                ))}
              </Section>
            )}

            {certifications.length > 0 && (
              <Section number={nextNumber()} title="Certifications">
                {certifications.map((item, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                    <p className="text-sm text-text">
                      {item.name} <span className="text-muted">· {item.issuer}</span>
                    </p>
                    {item.date_issued && <p className="shrink-0 text-xs text-muted">{formatMonthDate(item.date_issued)}</p>}
                  </div>
                ))}
              </Section>
            )}
          </div>
        </div>

        <footer className="py-10 text-center">
          <a href="/" className="text-xs text-muted hover:text-primary">
            Built with <span className="font-semibold">Pitch<span style={{ color: accent }}>d</span></span>
          </a>
        </footer>
      </div>
    </div>
  );
}

