import { useState } from "react";
import { STATUSES, updateApplicationStatus } from "../../lib/applications";
import RejectionFeedbackModal from "./RejectionFeedbackModal";

// The linear funnel this pipeline visualizes — denied/withdrawn are terminal
// outcomes, not funnel stages, and deliberately excluded: there's no stored
// history of which funnel stages an application actually reached before
// being rejected/withdrawn, so treating their position in STATUSES as
// "further along" would fabricate progress (e.g. rendering Interview/Offer
// as passed for an app rejected right after applying).
const FUNNEL = ["not_applied", "applied", "in_progress", "interview", "offer"];

export default function StatusPipeline({ application, onChanged }) {
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const currentFunnelIdx = FUNNEL.indexOf(application.status);

  async function setStatus(value) {
    if (value === application.status) return;
    if (value === "denied") {
      setShowRejectionModal(true);
      return;
    }
    await updateApplicationStatus(application.id, value);
    onChanged();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((s) => {
        const active = s.value === application.status;
        const funnelIdx = FUNNEL.indexOf(s.value);
        const passed = currentFunnelIdx !== -1 && funnelIdx !== -1 && funnelIdx <= currentFunnelIdx;
        return (
          <button
            key={s.value}
            onClick={() => setStatus(s.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border-primary bg-primary-soft text-primary"
                : passed
                ? "border-border bg-surface-raised text-text"
                : "border-border text-muted hover:text-text"
            }`}
          >
            {s.label}
          </button>
        );
      })}

      {showRejectionModal && (
        <RejectionFeedbackModal
          applicationId={application.id}
          onClose={() => setShowRejectionModal(false)}
          onDone={() => {
            setShowRejectionModal(false);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
