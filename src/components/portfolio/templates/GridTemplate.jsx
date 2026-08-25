import { ArrowUpRight, Code2 } from "lucide-react";
import { formatRange, formatMonthDate, normalizeUrl } from "../shared";

export default function GridTemplate({
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
    <div className="min-h-screen bg-bg px-4 py-10 text-text sm:px-8 sm:py-14">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-4">
        {/* Hero card */}
        <div
          className="col-span-1 rounded-3xl p-6 text-white shadow-lg sm:col-span-2 sm:p-8"
          style={{ background: accent }}
        >
          <div className="flex items-center gap-4">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.full_name || "Profile photo"} className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 font-header text-xl font-extrabold">
                {profile.full_name?.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "?"}
              </div>
            )}
            <div>
              <h1 className="font-header text-2xl font-extrabold tracking-tight sm:text-3xl">{profile.full_name || "Portfolio"}</h1>
              {profile.headline && <p className="mt-1 text-sm text-white/85">{profile.headline}</p>}
            </div>
          </div>
          {profile.summary && <p className="mt-4 text-sm leading-relaxed text-white/90">{profile.summary}</p>}
        </div>

        {/* Contact card */}
        <div className="col-span-1 flex flex-col gap-2 rounded-3xl border border-border bg-surface p-6 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Get in touch</p>
          <div className="mt-1 flex flex-col gap-2">
            {contactLinks.map(({ icon: Icon, label, href }, i) =>
              href ? (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-text hover:underline">
                  <Icon size={14} style={{ color: accent }} /> {label}
                </a>
              ) : (
                <span key={i} className="flex items-center gap-2 text-sm text-muted">
                  <Icon size={14} /> {label}
                </span>
              )
            )}
          </div>
        </div>

        {/* Projects — the star of the grid */}
        {projects.map((item, i) => {
          const projectUrl = normalizeUrl(item.url);
          const githubUrl = normalizeUrl(item.github_url);
          return (
            <div key={i} className="col-span-1 flex flex-col rounded-3xl border border-border bg-surface p-5 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-header text-lg font-bold text-text">{item.name}</p>
                <div className="flex shrink-0 gap-2">
                  {projectUrl && (
                    <a href={projectUrl} target="_blank" rel="noopener noreferrer" style={{ color: accent }} aria-label="Live link">
                      <ArrowUpRight size={15} />
                    </a>
                  )}
                  {githubUrl && (
                    <a href={githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: accent }} aria-label="Source code">
                      <Code2 size={15} />
                    </a>
                  )}
                </div>
              </div>
              {item.impact && (
                <span className="mt-1 text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>
                  {item.impact}
                </span>
              )}
              {item.description && <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>}
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

        {/* Experience */}
        {experience.length > 0 && (
          <div className="col-span-1 rounded-3xl border border-border bg-surface p-6 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Experience</p>
            <div className="mt-3 flex flex-col gap-4">
              {experience.map((item, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-text">
                    {item.role} <span className="font-normal text-muted">· {item.company}</span>
                  </p>
                  <p className="text-xs text-muted">{formatRange(item.start_date, item.end_date)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="col-span-1 rounded-3xl border border-border bg-surface p-6 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Education</p>
            <div className="mt-3 flex flex-col gap-3">
              {education.map((item, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-text">{item.institution}</p>
                  <p className="text-xs text-muted">
                    {item.degree}
                    {item.field ? `, ${item.field}` : ""} · {formatRange(item.start_date, item.end_date)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {Object.keys(skillsByCategory).length > 0 && (
          <div className="col-span-1 rounded-3xl border border-border bg-surface p-6 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Skills</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.values(skillsByCategory).flat().map((s, i) => (
                <span key={i} className="rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: `${accent}40`, color: accent }}>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="col-span-1 rounded-3xl border border-border bg-surface p-6 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Certifications</p>
            <div className="mt-3 flex flex-col gap-2">
              {certifications.map((item, i) => (
                <p key={i} className="text-sm text-text">
                  {item.name} <span className="text-muted">· {item.issuer}{item.date_issued ? ` · ${formatMonthDate(item.date_issued)}` : ""}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="col-span-1 flex items-center justify-center rounded-3xl border border-dashed border-border p-6 text-center sm:col-span-4">
          <p className="text-xs text-muted">
            Built with <a href="/" className="font-semibold hover:underline" style={{ color: accent }}>Pitchd</a>
          </p>
        </div>
      </div>
    </div>
  );
}
