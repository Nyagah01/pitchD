import { ArrowUpRight, Code2 } from "lucide-react";
import { formatRange, formatMonthDate, normalizeUrl } from "../shared";

function Block({ title, children }) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">{title}</h2>
      <div className="mt-3 flex flex-col gap-5">{children}</div>
    </section>
  );
}

export default function SplitTemplate({
  profile,
  experience,
  education,
  certifications,
  projects,
  contactLinks,
  skillsByCategory,
  accent,
}) {
  return (
    <div className="min-h-screen bg-bg text-text sm:flex">
      <aside
        className="flex flex-col justify-between gap-8 px-6 py-10 sm:sticky sm:top-0 sm:h-screen sm:w-[38%] sm:px-10 sm:py-14"
        style={{ background: accent, color: "#fff" }}
      >
        <div>
          {profile.photo_url ? (
            <img src={profile.photo_url} alt={profile.full_name || "Profile photo"} className="h-20 w-20 rounded-2xl object-cover shadow-md" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 font-header text-2xl font-extrabold">
              {profile.full_name?.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "?"}
            </div>
          )}
          <h1 className="mt-6 font-header text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {profile.full_name || "Portfolio"}
          </h1>
          {profile.headline && <p className="mt-3 text-sm leading-relaxed text-white/85">{profile.headline}</p>}
          {profile.summary && <p className="mt-5 text-sm leading-relaxed text-white/75">{profile.summary}</p>}
        </div>

        {contactLinks.length > 0 && (
          <div className="flex flex-col gap-2">
            {contactLinks.map(({ icon: Icon, label, href }, i) =>
              href ? (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium hover:underline">
                  <Icon size={14} /> {label}
                </a>
              ) : (
                <span key={i} className="flex items-center gap-2 text-sm text-white/70">
                  <Icon size={14} /> {label}
                </span>
              )
            )}
          </div>
        )}
      </aside>

      <main className="flex-1 px-6 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto flex max-w-xl flex-col gap-10">
          {experience.length > 0 && (
            <Block title="Experience">
              {experience.map((item, i) => (
                <div key={i}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="font-semibold text-text">{item.role}</p>
                    <p className="text-xs text-muted">{formatRange(item.start_date, item.end_date)}</p>
                  </div>
                  <p className="text-sm font-medium" style={{ color: accent }}>
                    {item.company}
                  </p>
                  {item.description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.description}</p>}
                  {item.achievements?.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {item.achievements.map((a, j) => (
                        <li key={j} className="text-sm text-muted">
                          — {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </Block>
          )}

          {projects.length > 0 && (
            <Block title="Projects">
              {projects.map((item, i) => {
                const projectUrl = normalizeUrl(item.url);
                const githubUrl = normalizeUrl(item.github_url);
                return (
                  <div key={i}>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-text">{item.name}</p>
                      {projectUrl && (
                        <a href={projectUrl} target="_blank" rel="noopener noreferrer" style={{ color: accent }} aria-label="Live link">
                          <ArrowUpRight size={13} />
                        </a>
                      )}
                      {githubUrl && (
                        <a href={githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: accent }} aria-label="Source code">
                          <Code2 size={13} />
                        </a>
                      )}
                    </div>
                    {item.impact && (
                      <p className="mt-0.5 text-xs font-medium" style={{ color: accent }}>
                        {item.impact}
                      </p>
                    )}
                    {item.description && <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>}
                    {item.tech_stack?.length > 0 && <p className="mt-1.5 text-xs text-muted">{item.tech_stack.join(" · ")}</p>}
                  </div>
                );
              })}
            </Block>
          )}

          {education.length > 0 && (
            <Block title="Education">
              {education.map((item, i) => (
                <div key={i}>
                  <p className="font-semibold text-text">{item.institution}</p>
                  <p className="text-sm text-muted">
                    {item.degree}
                    {item.field ? `, ${item.field}` : ""} · {formatRange(item.start_date, item.end_date)}
                  </p>
                </div>
              ))}
            </Block>
          )}

          {Object.keys(skillsByCategory).length > 0 && (
            <Block title="Skills">
              {Object.entries(skillsByCategory).map(([category, items]) => (
                <div key={category} className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted">{category}</span>
                  {items.map((s, i) => (
                    <span key={i} className="rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: `${accent}40`, color: accent }}>
                      {s.name}
                    </span>
                  ))}
                </div>
              ))}
            </Block>
          )}

          {certifications.length > 0 && (
            <Block title="Certifications">
              {certifications.map((item, i) => (
                <p key={i} className="text-sm text-text">
                  {item.name} <span className="text-muted">· {item.issuer}{item.date_issued ? ` · ${formatMonthDate(item.date_issued)}` : ""}</span>
                </p>
              ))}
            </Block>
          )}

          <footer className="pt-4 text-xs text-muted">
            Built with <a href="/" className="font-semibold hover:underline" style={{ color: accent }}>Pitchd</a>
          </footer>
        </div>
      </main>
    </div>
  );
}
