import { ArrowUpRight, Code2 } from "lucide-react";
import { formatRange, formatMonthDate, normalizeUrl } from "../shared";

function Prompt({ children }) {
  return (
    <span>
      <span className="text-white/30">{"> "}</span>
      {children}
    </span>
  );
}

export default function TerminalTemplate({
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
    <div className="min-h-screen bg-[#0d0d0d] px-4 py-10 text-white/90 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="window-chrome">
          <div className="window-chrome-bar">
            <span className="window-dot window-dot--red" />
            <span className="window-dot window-dot--yellow" />
            <span className="window-dot window-dot--green" />
            <span className="window-chrome-title">{(profile.full_name || "portfolio").toLowerCase().replace(/\s+/g, "-")}@pitchd:~</span>
          </div>

          <div className="terminal-log px-6 py-6 sm:px-10 sm:py-10">
            <div className="flex items-center gap-4">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt={profile.full_name || "Profile photo"} className="h-14 w-14 rounded-lg border border-white/10 object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg border" style={{ borderColor: `${accent}55`, color: accent }}>
                  {profile.full_name?.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "?"}
                </div>
              )}
              <div>
                <p className="text-lg font-bold" style={{ color: accent }}>
                  {profile.full_name || "Portfolio"}
                </p>
                {profile.headline && <p className="text-sm text-white/50">{profile.headline}</p>}
              </div>
            </div>

            {profile.summary && (
              <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                <Prompt>cat about.txt</Prompt>
                {"\n"}
                {profile.summary}
              </p>
            )}

            {contactLinks.length > 0 && (
              <p className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="text-white/30">$ contact --list</span>
                {contactLinks.map(({ label, href }, i) =>
                  href ? (
                    <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-white/20 hover:decoration-current" style={{ color: accent }}>
                      {label}
                    </a>
                  ) : (
                    <span key={i} className="text-white/50">
                      {label}
                    </span>
                  )
                )}
              </p>
            )}

            {experience.length > 0 && (
              <div className="mt-8">
                <p className="text-sm font-semibold" style={{ color: accent }}>
                  <Prompt>ls experience/</Prompt>
                </p>
                <div className="mt-3 flex flex-col gap-4 border-l border-white/10 pl-4">
                  {experience.map((item, i) => (
                    <div key={i}>
                      <p className="text-sm font-semibold text-white">
                        {item.role} <span className="font-normal text-white/50">@ {item.company}</span>
                      </p>
                      <p className="text-xs text-white/35">{formatRange(item.start_date, item.end_date)}</p>
                      {item.description && <p className="mt-1 text-sm text-white/60">{item.description}</p>}
                      {item.achievements?.length > 0 && (
                        <ul className="mt-1.5 flex flex-col gap-1">
                          {item.achievements.map((a, j) => (
                            <li key={j} className="text-sm text-white/60">
                              <span style={{ color: accent }}>{"// "}</span>
                              {a}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {projects.length > 0 && (
              <div className="mt-8">
                <p className="text-sm font-semibold" style={{ color: accent }}>
                  <Prompt>ls projects/</Prompt>
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {projects.map((item, i) => {
                    const projectUrl = normalizeUrl(item.url);
                    const githubUrl = normalizeUrl(item.github_url);
                    return (
                      <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-white">{item.name}</p>
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
                        {item.description && <p className="mt-1 text-xs text-white/55">{item.description}</p>}
                        {item.tech_stack?.length > 0 && (
                          <p className="mt-2 text-xs text-white/35">{item.tech_stack.join(" · ")}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {education.length > 0 && (
              <div className="mt-8">
                <p className="text-sm font-semibold" style={{ color: accent }}>
                  <Prompt>cat education.txt</Prompt>
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {education.map((item, i) => (
                    <p key={i} className="text-sm text-white/60">
                      <span className="text-white">{item.institution}</span> — {item.degree}
                      {item.field ? `, ${item.field}` : ""}{" "}
                      <span className="text-white/35">({formatRange(item.start_date, item.end_date)})</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(skillsByCategory).length > 0 && (
              <div className="mt-8">
                <p className="text-sm font-semibold" style={{ color: accent }}>
                  <Prompt>skills --all</Prompt>
                </p>
                <div className="mt-3 flex flex-col gap-1.5">
                  {Object.entries(skillsByCategory).map(([category, items]) => (
                    <p key={category} className="text-sm text-white/60">
                      <span className="text-white/35">{category}:</span> {items.map((s) => s.name).join(", ")}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {certifications.length > 0 && (
              <div className="mt-8">
                <p className="text-sm font-semibold" style={{ color: accent }}>
                  <Prompt>cat certifications.txt</Prompt>
                </p>
                <div className="mt-3 flex flex-col gap-1">
                  {certifications.map((item, i) => (
                    <p key={i} className="text-sm text-white/60">
                      {item.name} <span className="text-white/35">— {item.issuer}{item.date_issued ? `, ${formatMonthDate(item.date_issued)}` : ""}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-10 text-xs text-white/25">
              <Prompt>built with pitchd</Prompt>
              <span className="typewriter-cursor ml-1 align-middle" aria-hidden="true" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
