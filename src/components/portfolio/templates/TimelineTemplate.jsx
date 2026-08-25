import { ArrowUpRight, Code2 } from "lucide-react";
import { formatRange, formatMonthDate, normalizeUrl } from "../shared";

export default function TimelineTemplate({
  profile,
  experience,
  education,
  certifications,
  projects,
  contactLinks,
  skillsByCategory,
  accent,
}) {
  const rail = [
    ...experience.map((item) => ({ kind: "work", ...item })),
    ...education.map((item) => ({ kind: "study", ...item })),
  ].sort((a, b) => (b.start_date || "").localeCompare(a.start_date || ""));

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="mx-auto max-w-3xl px-6 pb-10 pt-16 sm:px-8 sm:pt-24">
        <div className="flex items-start justify-between gap-4">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt={profile.full_name || "Profile photo"} className="h-20 w-20 shrink-0 rounded-full object-cover" />
          ) : (
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full font-header text-2xl font-extrabold"
              style={{ background: `${accent}1a`, color: accent }}
            >
              {profile.full_name?.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "?"}
            </div>
          )}
        </div>
        <h1 className="mt-6 font-header text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
          {profile.full_name || "Portfolio"}
        </h1>
        {profile.headline && (
          <p className="mt-4 max-w-xl text-xl leading-snug text-muted sm:text-2xl">{profile.headline}</p>
        )}
        {profile.summary && <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted">{profile.summary}</p>}

        {contactLinks.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {contactLinks.map(({ icon: Icon, label, href }, i) =>
              href ? (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: accent }}>
                  <Icon size={14} /> {label}
                </a>
              ) : (
                <span key={i} className="flex items-center gap-1.5 text-sm text-muted">
                  <Icon size={14} /> {label}
                </span>
              )
            )}
          </div>
        )}
      </header>

      <div className="mx-auto max-w-3xl px-6 pb-16 sm:px-8">
        {rail.length > 0 && (
          <section>
            <h2 className="font-header text-3xl font-extrabold tracking-tight">History</h2>
            <div className="relative mt-8 flex flex-col gap-10 border-l-2 pl-8" style={{ borderColor: `${accent}40` }}>
              {rail.map((item, i) => (
                <div key={i} className="relative">
                  <span
                    className="absolute -left-[calc(2rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full"
                    style={{ background: accent }}
                  />
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {formatRange(item.start_date, item.end_date)}
                  </p>
                  {item.kind === "work" ? (
                    <>
                      <p className="mt-1 font-header text-2xl font-bold text-text">{item.role}</p>
                      <p className="text-sm font-medium" style={{ color: accent }}>
                        {item.company}
                      </p>
                      {item.description && <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>}
                      {item.achievements?.length > 0 && (
                        <ul className="mt-2 flex flex-col gap-1">
                          {item.achievements.map((a, j) => (
                            <li key={j} className="text-sm text-muted">
                              — {a}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="mt-1 font-header text-2xl font-bold text-text">{item.institution}</p>
                      <p className="text-sm text-muted">
                        {item.degree}
                        {item.field ? `, ${item.field}` : ""}
                        {item.grade ? ` · ${item.grade}` : ""}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <section className="mt-16">
            <h2 className="font-header text-3xl font-extrabold tracking-tight">Projects</h2>
            <div className="mt-8 flex flex-col gap-6">
              {projects.map((item, i) => {
                const projectUrl = normalizeUrl(item.url);
                const githubUrl = normalizeUrl(item.github_url);
                return (
                  <div key={i} className="border-b border-border pb-6 last:border-b-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="font-header text-xl font-bold text-text">{item.name}</p>
                      {item.impact && (
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>
                          {item.impact}
                        </span>
                      )}
                    </div>
                    {item.description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {item.tech_stack?.length > 0 && <p className="text-xs text-muted">{item.tech_stack.join(" · ")}</p>}
                      {projectUrl && (
                        <a href={projectUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: accent }}>
                          Live <ArrowUpRight size={12} />
                        </a>
                      )}
                      {githubUrl && (
                        <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: accent }}>
                          Source <Code2 size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {Object.keys(skillsByCategory).length > 0 && (
          <section className="mt-16">
            <h2 className="font-header text-3xl font-extrabold tracking-tight">Skills</h2>
            <div className="mt-6 flex flex-col gap-3">
              {Object.entries(skillsByCategory).map(([category, items]) => (
                <div key={category} className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted">{category}</span>
                  <p className="text-sm text-text">{items.map((s) => s.name).join(" · ")}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {certifications.length > 0 && (
          <section className="mt-16">
            <h2 className="font-header text-3xl font-extrabold tracking-tight">Certifications</h2>
            <div className="mt-6 flex flex-col gap-2">
              {certifications.map((item, i) => (
                <p key={i} className="text-sm text-text">
                  {item.name} <span className="text-muted">· {item.issuer}{item.date_issued ? ` · ${formatMonthDate(item.date_issued)}` : ""}</span>
                </p>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-16 text-sm text-muted">
          Built with <a href="/" className="font-semibold hover:underline" style={{ color: accent }}>Pitchd</a>
        </footer>
      </div>
    </div>
  );
}
