import { useCallback, useEffect, useState } from "react";
import ProfileStrength from "../components/profile/ProfileStrength";
import EditableList from "../components/profile/EditableList";
import SkillsGrid from "../components/profile/SkillsGrid";
import LessonsLearned from "../components/profile/LessonsLearned";
import UpdateFromMasterFile from "../components/profile/UpdateFromMasterFile";
import {
  getFullProfile,
  upsertProfile,
  computeProfileStrength,
  experienceApi,
  educationApi,
  skillsApi,
  certificationsApi,
  projectsApi,
} from "../lib/profile";

export default function Profile() {
  const [data, setData] = useState(null);
  const [basics, setBasics] = useState(null);
  const [savingBasics, setSavingBasics] = useState(false);

  const reload = useCallback(() => {
    getFullProfile().then((full) => {
      setData(full);
      setBasics(full.profile ?? {});
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!data) {
    return <p className="text-sm text-muted">Loading profile…</p>;
  }

  const { score, gaps } = computeProfileStrength(data);

  async function saveBasics() {
    setSavingBasics(true);
    try {
      await upsertProfile(basics);
      reload();
    } finally {
      setSavingBasics(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Profile</h1>
          <p className="mt-1 text-sm text-muted">The living source every generated document draws from.</p>
        </div>
      </div>

      <ProfileStrength score={score} gaps={gaps} />

      <UpdateFromMasterFile currentProfile={data.profile} onMerged={reload} />

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="mb-3 text-sm font-semibold text-text">Basics</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ["full_name", "Full name"],
            ["headline", "Headline"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["location", "Location"],
            ["linkedin_url", "LinkedIn"],
            ["github_url", "GitHub"],
            ["portfolio_url", "Portfolio"],
          ].map(([key, label]) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
              <input
                value={basics[key] ?? ""}
                onChange={(e) => setBasics({ ...basics, [key]: e.target.value })}
                className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
              />
            </label>
          ))}
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Summary</span>
            <textarea
              rows={3}
              value={basics.summary ?? ""}
              onChange={(e) => setBasics({ ...basics, summary: e.target.value })}
              className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
            />
          </label>
        </div>
        <button
          onClick={saveBasics}
          disabled={savingBasics}
          className="cta-glow mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {savingBasics ? "Saving…" : "Save basics"}
        </button>
      </section>

      <EditableList
        title="Experience"
        items={data.experience}
        api={experienceApi}
        onChanged={reload}
        emptyItem={{ company: "", role: "", start_date: "", end_date: "", description: "", achievements: [], skills_used: [] }}
        fields={[
          { key: "company", label: "Company" },
          { key: "role", label: "Role" },
          { key: "start_date", label: "Start date" },
          { key: "end_date", label: "End date" },
          { key: "description", label: "Description", textarea: true, span: true },
          { key: "achievements", label: "Achievements (comma-separated)", textarea: true, span: true, isList: true },
          { key: "skills_used", label: "Skills used (comma-separated)", span: true, isList: true },
        ]}
        renderSummary={(item) => (
          <div>
            <p className="font-semibold text-text">{item.role} · {item.company}</p>
            <p className="text-xs text-muted">{item.start_date ?? "?"} — {item.end_date ?? "Present"}</p>
            {item.description && <p className="mt-2 text-sm text-muted">{item.description}</p>}
          </div>
        )}
      />

      <EditableList
        title="Education"
        items={data.education}
        api={educationApi}
        onChanged={reload}
        emptyItem={{ institution: "", degree: "", field: "", start_date: "", end_date: "", grade: "" }}
        fields={[
          { key: "institution", label: "Institution" },
          { key: "degree", label: "Degree" },
          { key: "field", label: "Field" },
          { key: "grade", label: "Grade" },
          { key: "start_date", label: "Start date" },
          { key: "end_date", label: "End date" },
        ]}
        renderSummary={(item) => (
          <div>
            <p className="font-semibold text-text">{item.degree} · {item.institution}</p>
            <p className="text-xs text-muted">{item.field} {item.grade ? `· ${item.grade}` : ""}</p>
          </div>
        )}
      />

      <SkillsGrid skills={data.skills} api={skillsApi} onChanged={reload} />

      <EditableList
        title="Projects"
        items={data.projects}
        api={projectsApi}
        onChanged={reload}
        emptyItem={{ name: "", description: "", tech_stack: [], url: "", github_url: "", impact: "" }}
        fields={[
          { key: "name", label: "Name" },
          { key: "url", label: "URL" },
          { key: "github_url", label: "GitHub URL" },
          { key: "impact", label: "Impact" },
          { key: "description", label: "Description", textarea: true, span: true },
          { key: "tech_stack", label: "Tech stack (comma-separated)", span: true, isList: true },
        ]}
        renderSummary={(item) => (
          <div>
            <p className="font-semibold text-text">{item.name}</p>
            {item.impact && <p className="text-xs text-accent">{item.impact}</p>}
            {item.description && <p className="mt-2 text-sm text-muted">{item.description}</p>}
          </div>
        )}
      />

      <EditableList
        title="Certifications"
        items={data.certifications}
        api={certificationsApi}
        onChanged={reload}
        emptyItem={{ name: "", issuer: "", date_issued: "", credential_url: "" }}
        fields={[
          { key: "name", label: "Name" },
          { key: "issuer", label: "Issuer" },
          { key: "date_issued", label: "Date issued" },
          { key: "credential_url", label: "Credential URL" },
        ]}
        renderSummary={(item) => (
          <div>
            <p className="font-semibold text-text">{item.name}</p>
            <p className="text-xs text-muted">{item.issuer}</p>
          </div>
        )}
      />

      <LessonsLearned
        lessons={data.profile?.lessons_learned ?? []}
        onChange={(lessons) => upsertProfile({ lessons_learned: lessons }).then(reload)}
      />
    </div>
  );
}
