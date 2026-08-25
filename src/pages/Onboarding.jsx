import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gamepad2 } from "lucide-react";
import DumpInput from "../components/onboarding/DumpInput";
import ResumeUpload from "../components/onboarding/ResumeUpload";
import ExtractedProfileReview from "../components/onboarding/ExtractedProfileReview";
import OnboardingSurvey from "../components/onboarding/OnboardingSurvey";
import TaskChecklist from "../components/generate/TaskChecklist";
import CeoMessageModal from "../components/onboarding/CeoMessageModal";
import WaitGameModal from "../components/generate/WaitGameModal";
import { structureProfile } from "../lib/claudeApi";
import {
  getProfile,
  upsertProfile,
  clearProfileTables,
  sanitizeDates,
  experienceApi,
  educationApi,
  skillsApi,
  certificationsApi,
  projectsApi,
} from "../lib/profile";
import { friendlyError } from "../lib/friendlyError";
import { useAuth } from "../lib/AuthContext";

const STEPS = { SURVEY: "survey", INTAKE: "intake", STRUCTURING: "structuring", REVIEW: "review", SAVING: "saving" };

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

const GAME_PROMPT_DELAY_MS = 15000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(STEPS.SURVEY);
  const [surveyData, setSurveyData] = useState(null);
  const [dump, setDump] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [error, setError] = useState("");
  const [structured, setStructured] = useState(null);
  const [structuringDone, setStructuringDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDone, setSavingDone] = useState(false);
  const [showCeoMessage, setShowCeoMessage] = useState(false);
  const [showGamePrompt, setShowGamePrompt] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const promptTimerRef = useRef(null);
  const errorRef = useRef(null);

  const metadata = session?.user?.user_metadata ?? {};
  const firstName =
    (surveyData?.fullName || metadata.full_name || metadata.name || "").split(" ")[0] || null;

  useEffect(() => {
    getProfile()
      .then((existing) => {
        if (existing?.full_name) navigate("/dashboard", { replace: true });
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [navigate]);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  function handleSurveyComplete(data) {
    setSurveyData(data);
    setStep(STEPS.INTAKE);
  }

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
    setShowGamePrompt(false);
    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    promptTimerRef.current = setTimeout(() => setShowGamePrompt(true), GAME_PROMPT_DELAY_MS);
    try {
      const result = await structureProfile(combined);
      if (surveyData?.fullName) {
        result.profile = { ...result.profile, full_name: surveyData.fullName };
      }
      setStructuringDone(true);
      await sleep(650);
      setStructured(result);
      setStep(STEPS.REVIEW);
    } catch (err) {
      setError(friendlyError(err));
      setStep(STEPS.INTAKE);
    } finally {
      clearTimeout(promptTimerRef.current);
      setShowGamePrompt(false);
    }
  }

  async function handleSave(reviewed) {
    // ExtractedProfileReview unmounts while STEPS.SAVING is shown, so if the
    // save fails and we drop back to REVIEW it remounts fresh from
    // `structured` — capture the user's edits here first so a retry starts
    // from what they actually entered, not the original AI extraction.
    setStructured(reviewed);
    setSaving(true);
    setSavingDone(false);
    setError("");
    setStep(STEPS.SAVING);
    try {
      const rawIntake = [dump, resumeText, ...(reviewed.uncategorized ?? [])].filter(Boolean).join("\n\n---\n\n");
      // Clear first so a retry after a previous partial failure doesn't
      // duplicate whatever rows already made it in.
      await clearProfileTables();
      await Promise.all([
        ...reviewed.experience.map((row, i) =>
          experienceApi.create({ ...sanitizeDates(row, ["start_date", "end_date"]), order_index: i })
        ),
        ...reviewed.education.map((row) => educationApi.create(sanitizeDates(row, ["start_date", "end_date"]))),
        ...reviewed.skills.map((row) => skillsApi.create(row)),
        ...reviewed.certifications.map((row) => certificationsApi.create(sanitizeDates(row, ["date_issued"]))),
        ...reviewed.projects.map((row) => projectsApi.create(row)),
      ]);
      // full_name is what marks a profile "complete" elsewhere (RequireProfile,
      // the onboarding redirect check) — write it last so a failure above
      // leaves the user retryable instead of permanently "done" with missing data.
      await upsertProfile({
        ...reviewed.profile,
        raw_intake: rawIntake,
        experience_level: surveyData?.experienceLevel || null,
        referral_source: surveyData?.referralSource || null,
        goals: surveyData?.goals ?? [],
      });
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

        {step === STEPS.SURVEY && <OnboardingSurvey onComplete={handleSurveyComplete} />}

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

        {step === STEPS.STRUCTURING && showGamePrompt && !showGameModal && (
          <button
            onClick={() => setShowGameModal(true)}
            className="cta-glow mt-4 flex items-center gap-2 self-start rounded-full border border-primary/30 bg-primary-soft px-4 py-2 text-sm font-medium text-primary"
          >
            <Gamepad2 size={16} /> Taking a bit — play a game while you wait?
          </button>
        )}

        {step === STEPS.REVIEW && structured && (
          <div className="flex flex-col gap-4">
            {error && (
              <p ref={errorRef} className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
                {error}
              </p>
            )}
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
      <WaitGameModal
        open={showGameModal}
        onClose={() => setShowGameModal(false)}
        ready={structuringDone}
        onViewResults={() => setShowGameModal(false)}
      />
    </div>
  );
}
