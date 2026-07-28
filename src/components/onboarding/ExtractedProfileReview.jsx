import { useState } from "react";
import { X, Plus } from "lucide-react";
import TagInput from "../common/TagInput";

function isValidDateInput(v) {
  return !v || /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function Field({ label, value, onChange, textarea, type }) {
  const Comp = textarea ? "textarea" : "input";
  // AI-extracted dates ("2021", "Jun 2020") rarely match the yyyy-mm-dd a date
  // input requires — showing them in a text box would silently fail to save
  // (Postgres date column) with no clue which field was wrong. Blank + a real
  // calendar picker beats that.
  const safeValue = type === "date" && !isValidDateInput(value) ? "" : (value ?? "");
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
      <Comp
        type={type}
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        rows={textarea ? 2 : undefined}
        className="w-full min-w-0 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
      />
    </label>
  );
}

function ListField({ label, value, onChange, placeholder }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</span>
      <TagInput value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  );
}

function ArraySection({ title, items, setItems, fields, emptyItem }) {
  function updateItem(idx, key, value) {
    const next = items.slice();
    next[idx] = { ...next[idx], [key]: value };
    setItems(next);
  }
  function removeItem(idx) {
    setItems(items.filter((_, i) => i !== idx));
  }
  function addItem() {
    setItems([...items, { ...emptyItem }]);
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">
          {title} <span className="text-muted">({items.length})</span>
        </h3>
        <button
          onClick={addItem}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {items.length === 0 && (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
          Nothing extracted here — add one manually if it applies.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="relative rounded-xl border border-border bg-surface p-4">
            <button
              onClick={() => removeItem(idx)}
              className="absolute right-3 top-3 text-muted hover:text-danger"
              aria-label="Remove"
            >
              <X size={15} />
            </button>
            <div className="grid grid-cols-1 gap-3 pr-6 sm:grid-cols-2">
              {fields.map(({ key, label, textarea, span, isList, type }) => (
                <div key={key} className={span ? "col-span-2" : ""}>
                  {isList ? (
                    <ListField
                      label={label}
                      value={item[key]}
                      placeholder="Type and press Enter"
                      onChange={(v) => updateItem(idx, key, v)}
                    />
                  ) : (
                    <Field
                      label={label}
                      value={item[key]}
                      textarea={textarea}
                      type={type}
                      onChange={(v) => updateItem(idx, key, v)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ExtractedProfileReview({ data, onSave, onBack, saving }) {
  const [profile, setProfile] = useState(data.profile ?? {});
  const [firstName, setFirstName] = useState(() => (data.profile?.full_name ?? "").split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(() => (data.profile?.full_name ?? "").split(" ").slice(1).join(" "));
  const [experience, setExperience] = useState(data.experience ?? []);
  const [education, setEducation] = useState(data.education ?? []);
  const [skills, setSkills] = useState(data.skills ?? []);
  const [certifications, setCertifications] = useState(data.certifications ?? []);
  const [projects, setProjects] = useState(data.projects ?? []);
  const [uncategorized, setUncategorized] = useState(data.uncategorized ?? []);

  function updateName(first, last) {
    setFirstName(first);
    setLastName(last);
    setProfile((p) => ({ ...p, full_name: `${first} ${last}`.trim() }));
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-text">Basics</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="First name" value={firstName} onChange={(v) => updateName(v, lastName)} />
          <Field label="Last name" value={lastName} onChange={(v) => updateName(firstName, v)} />
          <Field label="Headline" value={profile.headline} onChange={(v) => setProfile({ ...profile, headline: v })} />
          <Field label="Email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} />
          <Field label="Phone" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} />
          <Field label="Location" value={profile.location} onChange={(v) => setProfile({ ...profile, location: v })} />
          <Field label="LinkedIn" value={profile.linkedin_url} onChange={(v) => setProfile({ ...profile, linkedin_url: v })} />
          <div className="col-span-2">
            <Field label="Summary" textarea value={profile.summary} onChange={(v) => setProfile({ ...profile, summary: v })} />
          </div>
        </div>
      </section>

      <ArraySection
        title="Experience"
        items={experience}
        setItems={setExperience}
        emptyItem={{ company: "", role: "", start_date: "", end_date: "", description: "", achievements: [], skills_used: [] }}
        fields={[
          { key: "company", label: "Company" },
          { key: "role", label: "Role" },
          { key: "start_date", label: "Start date", type: "date" },
          { key: "end_date", label: "End date", type: "date" },
          { key: "description", label: "Description", textarea: true, span: true },
          { key: "achievements", label: "Achievements", span: true, isList: true },
          { key: "skills_used", label: "Skills used", span: true, isList: true },
        ]}
      />

      <ArraySection
        title="Education"
        items={education}
        setItems={setEducation}
        emptyItem={{ institution: "", degree: "", field: "", start_date: "", end_date: "", grade: "" }}
        fields={[
          { key: "institution", label: "Institution" },
          { key: "degree", label: "Degree" },
          { key: "field", label: "Field" },
          { key: "grade", label: "Grade" },
          { key: "start_date", label: "Start date", type: "date" },
          { key: "end_date", label: "End date", type: "date" },
        ]}
      />

      <ArraySection
        title="Skills"
        items={skills}
        setItems={setSkills}
        emptyItem={{ name: "", category: "", proficiency: "" }}
        fields={[
          { key: "name", label: "Skill" },
          { key: "category", label: "Category" },
          { key: "proficiency", label: "Proficiency" },
        ]}
      />

      <ArraySection
        title="Projects"
        items={projects}
        setItems={setProjects}
        emptyItem={{ name: "", description: "", tech_stack: [], url: "", github_url: "", impact: "" }}
        fields={[
          { key: "name", label: "Name" },
          { key: "url", label: "URL" },
          { key: "description", label: "Description", textarea: true, span: true },
          { key: "tech_stack", label: "Tech stack", isList: true },
          { key: "impact", label: "Impact" },
        ]}
      />

      <ArraySection
        title="Certifications"
        items={certifications}
        setItems={setCertifications}
        emptyItem={{ name: "", issuer: "", date_issued: "", credential_url: "" }}
        fields={[
          { key: "name", label: "Name" },
          { key: "issuer", label: "Issuer" },
          { key: "date_issued", label: "Date issued", type: "date" },
          { key: "credential_url", label: "Credential URL (optional)" },
        ]}
      />

      {uncategorized.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-text">
            Uncategorized notes <span className="text-muted">({uncategorized.length})</span>
          </h3>
          <p className="text-xs text-muted">
            Things the AI found but wasn't confident where to file — nothing is lost, but nothing's forced
            into a field either. Remove any that aren't useful.
          </p>
          <ul className="flex flex-col gap-2">
            {uncategorized.map((note, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-2 rounded-xl border border-border bg-surface p-3 text-sm text-text"
              >
                <span>{note}</span>
                <button
                  onClick={() => setUncategorized(uncategorized.filter((_, idx) => idx !== i))}
                  className="shrink-0 text-muted hover:text-danger"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex justify-between border-t border-border pt-6">
        <button onClick={onBack} className="text-sm font-medium text-muted hover:text-text">
          Back
        </button>
        <button
          disabled={saving}
          onClick={() => onSave({ profile, experience, education, skills, certifications, projects, uncategorized })}
          className="cta-glow rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save to profile"}
        </button>
      </div>
    </div>
  );
}
