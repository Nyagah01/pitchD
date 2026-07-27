import { useState } from "react";
import { X } from "lucide-react";
import { submitRejectionFeedback, updateApplicationStatus, listRejectionFeedback } from "../../lib/applications";
import { upsertProfile } from "../../lib/profile";
import { synthesizeLessons } from "../../lib/claudeApi";
import { friendlyError } from "../../lib/friendlyError";

export default function RejectionFeedbackModal({ applicationId, onClose, onDone }) {
  const [employerFeedback, setEmployerFeedback] = useState("");
  const [improvementNotes, setImprovementNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function resyncLessons() {
    const rows = await listRejectionFeedback();
    const entries = rows.flatMap((r) =>
      [r.rejection_employer_feedback, r.rejection_improvement_notes].filter(Boolean)
    );
    if (entries.length === 0) return;
    const { lessons } = await synthesizeLessons(entries);
    await upsertProfile({ lessons_learned: lessons });
  }

  async function handleSave() {
    setBusy(true);
    setError("");
    try {
      await submitRejectionFeedback(applicationId, { employerFeedback, improvementNotes });
      if (employerFeedback.trim() || improvementNotes.trim()) {
        await resyncLessons();
      }
      onDone();
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  async function handleSkip() {
    setBusy(true);
    try {
      await updateApplicationStatus(applicationId, "denied");
      onDone();
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="glass-card w-full max-w-md rounded-3xl p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-text">Sorry it didn't work out</h3>
            <p className="mt-1 text-sm text-muted">A minute of reflection here sharpens every application after this one.</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Did they tell you why? Paste it here if so.</span>
            <textarea
              value={employerFeedback}
              onChange={(e) => setEmployerFeedback(e.target.value)}
              rows={3}
              placeholder="e.g. 'Went with a candidate with more cloud experience'"
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">What do you think you could improve for next time?</span>
            <textarea
              value={improvementNotes}
              onChange={(e) => setImprovementNotes(e.target.value)}
              rows={3}
              placeholder="Your own honest take, even a guess"
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-primary"
            />
          </label>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="flex justify-between pt-2">
            <button onClick={handleSkip} disabled={busy} className="text-sm font-medium text-muted hover:text-text">
              Skip
            </button>
            <button
              onClick={handleSave}
              disabled={busy}
              className="cta-glow rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save feedback"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
