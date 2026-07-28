import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gamepad2 } from "lucide-react";
import JDInput from "../components/generate/JDInput";
import GenerationLog from "../components/generate/GenerationLog";
import ATSScore from "../components/generate/ATSScore";
import HireabilityScore from "../components/generate/HireabilityScore";
import CVPreview from "../components/generate/CVPreview";
import CoverLetterPreview from "../components/generate/CoverLetterPreview";
import WaitGameModal from "../components/generate/WaitGameModal";
import { getFullProfile } from "../lib/profile";
import { generateApplication } from "../lib/claudeApi";
import { createApplication, saveGeneratedDoc } from "../lib/applications";
import { friendlyError } from "../lib/friendlyError";
import { getTodayUsage, DAILY_USAGE_LIMIT } from "../lib/usage";

const SCRIPT = [
  "Reading profile...",
  "Matching against job description...",
  "Scoring ATS fit...",
  "Drafting tailored CV...",
  "Drafting cover letter...",
  "Reviewing draft for hireability...",
];

const GAME_PROMPT_DELAY_MS = 15000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Apply() {
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showGamePrompt, setShowGamePrompt] = useState(false);
  const [showGameModal, setShowGameModal] = useState(false);
  const [generationsRemaining, setGenerationsRemaining] = useState(null);

  const promptTimerRef = useRef(null);

  useEffect(() => {
    getTodayUsage()
      .then((usage) => setGenerationsRemaining(usage.generationRemaining))
      .catch(() => {});
  }, []);

  async function handleGenerate() {
    if (!jd.trim() || !company.trim() || !role.trim()) {
      setError("Company, role, and job description are all required.");
      return;
    }
    setError("");
    setResult(null);
    setRunning(true);
    setLines([]);
    setShowGamePrompt(false);

    if (promptTimerRef.current) clearTimeout(promptTimerRef.current);
    promptTimerRef.current = setTimeout(() => setShowGamePrompt(true), GAME_PROMPT_DELAY_MS);

    const logPromise = (async () => {
      for (const line of SCRIPT.slice(0, 2)) {
        setLines((prev) => [...prev, line]);
        await sleep(500);
      }
    })();

    try {
      const profile = await getFullProfile();
      const response = await generateApplication(profile, jd, profile.profile?.lessons_learned);
      await logPromise;
      setLines((prev) => [
        ...prev,
        `Scoring ATS fit: ${response.atsScore}%`,
        "Drafting cover letter...",
        "Reviewing draft for hireability...",
        response.revisions > 0
          ? `Revised ${response.revisions}x — final hireability: ${response.hireabilityScore}%`
          : `Hireability score: ${response.hireabilityScore}%`,
      ]);
      await sleep(300);
      setResult({ ...response, profile });
      setGenerationsRemaining((n) => (n == null ? n : Math.max(0, n - 1)));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setRunning(false);
      clearTimeout(promptTimerRef.current);
      setShowGamePrompt(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const app = await createApplication({
        company,
        role,
        job_description: jd,
        ats_score: result.atsScore,
        hireability_score: result.hireabilityScore,
        hireability_notes: result.hireabilityNotes,
      });
      await Promise.all([
        saveGeneratedDoc(app.id, "cv", result.cv),
        saveGeneratedDoc(app.id, "cover_letter", result.coverLetter),
        result.interviewPrep && saveGeneratedDoc(app.id, "interview_prep", result.interviewPrep),
      ]);
      navigate(`/applications/${app.id}`);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-16">
      <div>
        <h1 className="text-2xl font-extrabold text-text">Apply for a role</h1>
        <p className="mt-1 text-sm text-muted">
          Paste the job description — your profile does the rest, reordered and reworded, never invented.
        </p>
      </div>

      <JDInput
        value={jd}
        onChange={setJd}
        company={company}
        onCompanyChange={setCompany}
        role={role}
        onRoleChange={setRole}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={running || generationsRemaining === 0}
          className="cta-glow self-start rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {running ? "Generating…" : "Generate application"}
        </button>
        {generationsRemaining != null && (
          <span className="text-xs text-muted">
            {generationsRemaining > 0
              ? `${generationsRemaining} of ${DAILY_USAGE_LIMIT} generations left today`
              : "Daily limit reached — resets at midnight UTC"}
          </span>
        )}
      </div>

      {(running || lines.length > 0) && <GenerationLog lines={lines} active={running} />}

      {running && showGamePrompt && !showGameModal && (
        <button
          onClick={() => setShowGameModal(true)}
          className="cta-glow flex items-center gap-2 self-start rounded-full border border-primary/30 bg-primary-soft px-4 py-2 text-sm font-medium text-primary"
        >
          <Gamepad2 size={16} /> Still generating — play a game while you wait?
        </button>
      )}

      {result && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ATSScore score={result.atsScore} gaps={result.atsGaps} />
            <HireabilityScore
              score={result.hireabilityScore}
              notes={result.hireabilityNotes}
              revisions={result.revisions}
            />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text">Tailored CV</h3>
            <CVPreview
              content={result.cv}
              onChange={(newCv) => setResult((r) => ({ ...r, cv: newCv }))}
              company={company}
              role={role}
            />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text">Cover letter</h3>
            <CoverLetterPreview
              content={result.coverLetter}
              onChange={(newLetter) => setResult((r) => ({ ...r, coverLetter: newLetter }))}
              company={company}
              role={role}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="cta-glow self-start rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save application"}
          </button>
        </div>
      )}

      <WaitGameModal
        open={showGameModal}
        onClose={() => setShowGameModal(false)}
        ready={!!result}
        onViewResults={() => setShowGameModal(false)}
      />
    </div>
  );
}
