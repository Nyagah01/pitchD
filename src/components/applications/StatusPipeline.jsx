import { useState } from "react";
import { STATUSES, updateApplicationStatus } from "../../lib/applications";
import RejectionFeedbackModal from "./RejectionFeedbackModal";

export default function StatusPipeline({ application, onChanged }) {
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const currentIdx = STATUSES.findIndex((s) => s.value === application.status);

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
      {STATUSES.map((s, idx) => {
        const active = s.value === application.status;
        const passed = idx <= currentIdx;
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
