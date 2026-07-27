import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import ApplicationCard from "./ApplicationCard";
import RejectionFeedbackModal from "./RejectionFeedbackModal";
import { STATUSES, updateApplicationStatus } from "../../lib/applications";

export default function KanbanBoard({ applications, onChanged }) {
  const [pendingRejectionId, setPendingRejectionId] = useState(null);

  async function handleDrop(e, status) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const app = applications.find((a) => a.id === id);
    if (!app || app.status === status) return;
    if (status === "denied") {
      setPendingRejectionId(id);
      return;
    }
    await updateApplicationStatus(id, status);
    onChanged();
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUSES.map(({ value, label }) => {
        const items = applications.filter((a) => a.status === value);
        return (
          <div
            key={value}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, value)}
            className="flex w-64 shrink-0 flex-col gap-3 rounded-2xl border border-border bg-surface/40 p-3"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</h3>
              <span className="text-xs text-muted">{items.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {items.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", app.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}

      {pendingRejectionId && (
        <RejectionFeedbackModal
          applicationId={pendingRejectionId}
          onClose={() => setPendingRejectionId(null)}
          onDone={() => {
            setPendingRejectionId(null);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
