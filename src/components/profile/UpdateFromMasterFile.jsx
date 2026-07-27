import { useState } from "react";
import { UploadCloud } from "lucide-react";
import DumpInput from "../onboarding/DumpInput";
import ResumeUpload from "../onboarding/ResumeUpload";
import ExtractedProfileReview from "../onboarding/ExtractedProfileReview";
import TaskChecklist from "../generate/TaskChecklist";
import { structureProfile } from "../../lib/claudeApi";
import { friendlyError } from "../../lib/friendlyError";
import {
  upsertProfile,
  experienceApi,
  educationApi,
  skillsApi,
  certificationsApi,
  projectsApi,
} from "../../lib/profile";

const STEPS = { CLOSED: "closed", INTAKE: "intake", STRUCTURING: "structuring", REVIEW: "review", SAVING: "saving" };

const STRUCTURING_STEPS = ["Reading file", "Comparing against your existing profile", "Structuring updates"];
const SAVING_STEPS = ["Merging basics", "Adding new experience & education", "Adding new skills, certifications & projects"];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function UpdateFromMasterFile({ currentProfile, onMerged }) {
  const [step, setStep] = useState(STEPS.CLOSED);
  const [dump, setDump] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [structured, setStructured] = useState(null);
  const [structuringDone, setStructuringDone] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingDone, setSavingDone] = useState(false);

  function reset() {
    setStep(STEPS.CLOSED);
    setDump("");
    setResumeText("");
    setStructured(null);
    setError("");
  }

  async function handleStructure() {
    const combined = [dump, resumeText].filter(Boolean).join("\n\n---\n\n");
    if (!combined.trim()) {
      setError("Paste something or upload a file first.");
      return;
    }
    setError("");
    setStructuringDone(false);
    setStep(STEPS.STRUCTURING);
    try {
      const result = await structureProfile(combined);
      setStructuringDone(true);
      await sleep(650);
      setStructured(result);
      setStep(STEPS.REVIEW);
    } catch (err) {
      setError(friendlyError(err));
      setStep(STEPS.INTAKE);
    }
  }

  async function handleSave(reviewed) {
    setSaving(true);
    setSavingDone(false);
    setError("");
    setStep(STEPS.SAVING);
    try {
      // Merge basics: prefer newly extracted values, fall back to what's already there — never blank out good data.
      const mergedBasics = Object.fromEntries(
        Object.entries(reviewed.profile).map(([key, value]) => [key, value || currentProfile?.[key]])
      );
      const rawIntake = [currentProfile?.raw_intake, dump, resumeText, ...(reviewed.uncategorized ?? [])]
        .filter(Boolean)
        .join("\n\n---\n\n");

      await upsertProfile({ ...mergedBasics, raw_intake: rawIntake });
      await Promise.all([
        ...reviewed.experience.map((row) => experienceApi.create(row)),
        ...reviewed.education.map((row) => educationApi.create(row)),
        ...reviewed.skills.map((row) => skillsApi.create(row)),
        ...reviewed.certifications.map((row) => certificationsApi.create(row)),
        ...reviewed.projects.map((row) => projectsApi.create(row)),
      ]);
      setSavingDone(true);
      await sleep(650);
      reset();
      onMerged();
    } catch (err) {
      setError(friendlyError(err));
      setSaving(false);
      setStep(STEPS.REVIEW);
    }
  }

  if (step === STEPS.CLOSED) {
    return (
      <button
        onClick={() => setStep(STEPS.INTAKE)}
        className="flex items-center gap-2 self-start rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:border-primary/40"
      >
        <UploadCloud size={15} /> Update from master file
      </button>
    );
  }

  return (
    <section className="glass-card flex flex-col gap-5 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Update from master file</h3>
        <button onClick={reset} className="text-xs font-medium text-muted hover:text-text">
          Cancel
        </button>
      </div>

      {step === STEPS.INTAKE && (
        <div className="flex flex-col gap-5">
          <p className="text-xs text-muted">
            New content gets added alongside what's already in your profile — nothing existing is deleted, and
            basics only update where the new file actually has something to say.
          </p>
          <DumpInput value={dump} onChange={setDump} />
          <ResumeUpload onExtracted={setResumeText} />
          {resumeText && <p className="text-xs text-accent">File text extracted — it'll be combined with anything pasted above.</p>}
          {error && <p className="text-xs text-danger">{error}</p>}
          <button
            onClick={handleStructure}
            className="cta-glow self-start rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
          >
            Structure it
          </button>
        </div>
      )}

      {step === STEPS.STRUCTURING && (
        <div className="window-chrome">
          <div className="window-chrome-bar">
            <span className="window-dot window-dot--red" />
            <span className="window-dot window-dot--yellow" />
            <span className="window-dot window-dot--green" />
            <span className="window-chrome-title">guest@pitchd:~/profile-update</span>
          </div>
          <div className="px-6 py-6">
            <TaskChecklist steps={STRUCTURING_STEPS} done={structuringDone} />
          </div>
        </div>
      )}

      {step === STEPS.REVIEW && structured && (
        <ExtractedProfileReview data={structured} onBack={() => setStep(STEPS.INTAKE)} onSave={handleSave} saving={saving} />
      )}

      {step === STEPS.SAVING && (
        <div className="window-chrome">
          <div className="window-chrome-bar">
            <span className="window-dot window-dot--red" />
            <span className="window-dot window-dot--yellow" />
            <span className="window-dot window-dot--green" />
            <span className="window-chrome-title">guest@pitchd:~/profile-update</span>
          </div>
          <div className="px-6 py-6">
            <TaskChecklist steps={SAVING_STEPS} done={savingDone} />
          </div>
        </div>
      )}

      {error && step !== STEPS.INTAKE && <p className="text-xs text-danger">{error}</p>}
    </section>
  );
}
