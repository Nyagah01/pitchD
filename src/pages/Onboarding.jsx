import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DumpInput from "../components/onboarding/DumpInput";
import ResumeUpload from "../components/onboarding/ResumeUpload";
import ExtractedProfileReview from "../components/onboarding/ExtractedProfileReview";
import TaskChecklist from "../components/generate/TaskChecklist";
import CeoMessageModal from "../components/onboarding/CeoMessageModal";
import { structureProfile } from "../lib/claudeApi";
import { getProfile, upsertProfile, experienceApi, educationApi, skillsApi, certificationsApi, projectsApi } from "../lib/profile";
import { friendlyError } from "../lib/friendlyError";
import { useAuth } from "../lib/AuthContext";

const STEPS = { INTAKE: "intake", STRUCTURING: "structuring", REVIEW: "review", SAVING: "saving" };

const STRUCTURING_STEPS = [
  "Reading your dump",
  "Extracting experience, education, skills, projects",
  "Structuring profile",
];

const SAVING_STEPS = [
  "Saving your basics",
  "Adding experience & education",
  "Adding skills, certifications & projects",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(STEPS.INTAKE);
  const [dump, setDump] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [error, setError] = useState("");
  const [structured, setStructured] = useState(null);
  const [structuringDone, setStructuringDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDone, setSavingDone] = useState(false);
  const [showCeoMessage, setShowCeoMessage] = useState(false);

  const metadata = session?.user?.user_metadata ?? {};
  const firstName = (metadata.full_name || metadata.name || "").split(" ")[0] || null;

  useEffect(() => {
    getProfile()
      .then((existing) => {
        if (existing?.full_name) navigate("/dashboard", { replace: true });
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [navigate]);

  async function handleStructure() {
    const combined = [dump, resumeText].filter(Boolean).join("\n\n---\n\n");
    if (!combined.trim()) {
      setError("Paste something or upload a resume first.");
      return;
    }
    setError("");
    setStructuringDone(false);
    setStep(STEPS.STRUCTURING);
    setShowCeoMessage(true);
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
      const rawIntake = [dump, resumeText, ...(reviewed.uncategorized ?? [])].filter(Boolean).join("\n\n---\n\n");
      await upsertProfile({ ...reviewed.profile, raw_intake: rawIntake });
      await Promise.all([
        ...reviewed.experience.map((row, i) => experienceApi.create({ ...row, order_index: i })),
        ...reviewed.education.map((row) => educationApi.create(row)),
        ...reviewed.skills.map((row) => skillsApi.create(row)),
        ...reviewed.certifications.map((row) => certificationsApi.create(row)),
        ...reviewed.projects.map((row) => projectsApi.create(row)),
      ]);
      setSavingDone(true);
      await sleep(650);
      navigate("/dashboard");
    } catch (err) {
      setError(friendlyError(err));
      setSaving(false);
      setStep(STEPS.REVIEW);
    }
  }

  if (checking) {
    return <div className="flex h-screen items-center justify-center bg-bg text-sm text-muted">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-10 text-text">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <span className="font-header text-xl font-extrabold tracking-tight">
            Pitch<span className="text-primary">d</span>
          </span>
          <h1 className="mt-4 text-2xl font-extrabold">Let's build your profile</h1>
          <p className="mt-1 text-sm text-muted">
            One dump, structured once — every CV and cover letter after this reorders and rewrites it, never invents.
          </p>
        </div>

        {step === STEPS.INTAKE && (
          <div className="flex flex-col gap-6">
            <DumpInput value={dump} onChange={setDump} />
            <ResumeUpload onExtracted={setResumeText} />
            {resumeText && <p className="text-xs text-accent">Resume text extracted — it'll be combined with your dump.</p>}
            {error && <p className="text-xs text-danger">{error}</p>}
            <button
              onClick={handleStructure}
              className="cta-glow self-start rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
            >
              Structure my profile
            </button>
          </div>
        )}

        {step === STEPS.STRUCTURING && (
          <div className="window-chrome">
            <div className="window-chrome-bar">
              <span className="window-dot window-dot--red" />
              <span className="window-dot window-dot--yellow" />
              <span className="window-dot window-dot--green" />
              <span className="window-chrome-title">guest@pitchd:~/onboarding</span>
            </div>
            <div className="px-6 py-6">
              <TaskChecklist steps={STRUCTURING_STEPS} done={structuringDone} />
            </div>
          </div>
        )}

        {step === STEPS.REVIEW && structured && (
          <div className="flex flex-col gap-4">
            {error && <p className="text-xs text-danger">{error}</p>}
            <ExtractedProfileReview
              data={structured}
              onBack={() => setStep(STEPS.INTAKE)}
              onSave={handleSave}
              saving={saving}
            />
          </div>
        )}

        {step === STEPS.SAVING && (
          <div className="window-chrome">
            <div className="window-chrome-bar">
              <span className="window-dot window-dot--red" />
              <span className="window-dot window-dot--yellow" />
              <span className="window-dot window-dot--green" />
              <span className="window-chrome-title">guest@pitchd:~/onboarding</span>
            </div>
            <div className="px-6 py-6">
              <TaskChecklist steps={SAVING_STEPS} done={savingDone} />
            </div>
          </div>
        )}
      </div>

      <CeoMessageModal open={showCeoMessage} onClose={() => setShowCeoMessage(false)} firstName={firstName} />
    </div>
  );
}
