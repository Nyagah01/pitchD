import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import StatusPipeline from "../components/applications/StatusPipeline";
import CVPreview from "../components/generate/CVPreview";
import CoverLetterPreview from "../components/generate/CoverLetterPreview";
import CodilityPrep from "../components/generate/CodilityPrep";
import EssayGenerator from "../components/generate/EssayGenerator";
import { getFullProfile } from "../lib/profile";
import {
  generateInterviewPrep,
  generateCodilityPrep,
  generateEssay,
} from "../lib/claudeApi";
import {
  getApplication,
  updateApplication,
  deleteApplication,
  listContacts,
  createContact,
  deleteContact,
  listGeneratedDocs,
  saveGeneratedDoc,
} from "../lib/applications";

const TABS = ["CV", "Cover Letter", "Interview Prep", "Codility Prep", "Essay"];

function latestByType(docs, type) {
  return docs.find((d) => d.type === type)?.content ?? "";
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [docs, setDocs] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [tab, setTab] = useState("CV");
  const [notes, setNotes] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const reload = useCallback(() => {
    getApplication(id).then((app) => {
      setApplication(app);
      setNotes(app.notes ?? "");
      setInterviewDate(app.interview_date ? app.interview_date.slice(0, 16) : "");
    });
    listContacts(id).then(setContacts);
    listGeneratedDocs(id).then(setDocs);
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!application) return <p className="text-sm text-muted">Loading…</p>;

  async function saveNotes() {
    await updateApplication(id, { notes });
  }

  async function saveInterviewDate() {
    await updateApplication(id, { interview_date: interviewDate ? new Date(interviewDate).toISOString() : null });
  }

  async function addContact(e) {
    e.preventDefault();
    if (!contactName.trim()) return;
    await createContact(id, { name: contactName, email: contactEmail });
    setContactName("");
    setContactEmail("");
    reload();
  }

  async function removeApplication() {
    if (!confirm(`Delete the application for ${application.role} at ${application.company}?`)) return;
    await deleteApplication(id);
    navigate("/applications");
  }

  async function withProfile(fn) {
    const profile = await getFullProfile();
    const result = await fn(profile);
    return result;
  }

  return (
    <div className="flex flex-col gap-8 pb-16">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text">{application.role}</h1>
          <p className="mt-1 text-sm text-muted">{application.company}</p>
        </div>
        <button onClick={removeApplication} className="text-muted hover:text-danger">
          <Trash2 size={16} />
        </button>
      </div>

      <StatusPipeline application={application} onChanged={reload} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold text-text">Interview date</h3>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
            />
            <button onClick={saveInterviewDate} className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white">
              Save
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold text-text">Contacts</h3>
          <form onSubmit={addContact} className="mb-2 flex gap-2">
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Name"
              className="flex-1 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
            />
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Email"
              className="flex-1 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
            />
            <button className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white">Add</button>
          </form>
          <ul className="flex flex-col gap-1">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm text-text">
                <span>
                  {c.name} <span className="text-muted">{c.email}</span>
                </span>
                <button
                  onClick={() => deleteContact(c.id).then(reload)}
                  className="text-muted hover:text-danger"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-2 text-sm font-semibold text-text">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          rows={3}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
        />
      </section>

      <div>
        <div className="flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tab === t ? "border-b-2 border-primary text-primary" : "text-muted hover:text-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="pt-5">
          {tab === "CV" && (
            <CVPreview
              content={latestByType(docs, "cv") || "No CV generated yet."}
              onChange={
                latestByType(docs, "cv")
                  ? (newCv) => saveGeneratedDoc(id, "cv", newCv).then(reload)
                  : undefined
              }
              company={application.company}
              role={application.role}
            />
          )}
          {tab === "Cover Letter" && (
            <CoverLetterPreview
              content={latestByType(docs, "cover_letter") || "No cover letter generated yet."}
              onChange={
                latestByType(docs, "cover_letter")
                  ? (newLetter) => saveGeneratedDoc(id, "cover_letter", newLetter).then(reload)
                  : undefined
              }
              company={application.company}
              role={application.role}
            />
          )}
          {tab === "Interview Prep" && (
            <CodilityPrep
              existing={latestByType(docs, "interview_prep")}
              description="Research this company and role live, then generate grounded interview questions and talking points."
              generateLabel="Research + generate interview prep"
              loadingLabel="Researching the company…"
              onGenerate={() =>
                withProfile(async (profile) => {
                  const { content } = await generateInterviewPrep(
                    profile,
                    application.job_description,
                    application.company,
                    application.role
                  );
                  await saveGeneratedDoc(id, "interview_prep", content);
                  return content;
                })
              }
            />
          )}
          {tab === "Codility Prep" && (
            <CodilityPrep
              existing={latestByType(docs, "codility_prep")}
              onGenerate={() =>
                withProfile(async (profile) => {
                  const { content } = await generateCodilityPrep(
                    profile,
                    application.job_description,
                    application.company,
                    application.role
                  );
                  await saveGeneratedDoc(id, "codility_prep", content);
                  return content;
                })
              }
            />
          )}
          {tab === "Essay" && (
            <EssayGenerator
              existing={latestByType(docs, "essay")}
              onGenerate={(prompt) =>
                withProfile(async (profile) => {
                  const { content } = await generateEssay(profile, prompt, application.job_description);
                  await saveGeneratedDoc(id, "essay", content);
                  return content;
                })
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
