import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Calendar, Gauge, ArrowUpRight } from "lucide-react";
import RejectionFeedbackModal from "./RejectionFeedbackModal";
import {
  STATUSES,
  STATUS_COLORS,
  updateApplicationStatus,
  updateApplication,
  toLocalDatetimeInput,
} from "../../lib/applications";

export default function ApplicationsTable({ applications, onChanged }) {
  const [expandedId, setExpandedId] = useState(null);
  const [pendingRejectionId, setPendingRejectionId] = useState(null);
  const [interviewDraft, setInterviewDraft] = useState("");
  const [draftDirty, setDraftDirty] = useState(false);

  function toggleExpand(app) {
    if (expandedId === app.id) {
      setExpandedId(null);
      return;
    }
    if (draftDirty && !confirm("Discard the unsaved interview date you were editing?")) {
      return;
    }
    setExpandedId(app.id);
    setInterviewDraft(toLocalDatetimeInput(app.interview_date));
    setDraftDirty(false);
  }

  async function handleStatusChange(app, status) {
    if (status === app.status) return;
    if (status === "denied") {
      setPendingRejectionId(app.id);
      return;
    }
    await updateApplicationStatus(app.id, status);
    onChanged();
  }

  async function saveInterviewDate(app) {
    await updateApplication(app.id, {
      interview_date: interviewDraft ? new Date(interviewDraft).toISOString() : null,
    });
    setDraftDirty(false);
    onChanged();
  }

  if (applications.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
        No applications yet — start one from the Apply page.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-raised text-left text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="w-8 px-3 py-2.5"></th>
            <th className="px-3 py-2.5">Company</th>
            <th className="px-3 py-2.5">Role</th>
            <th className="px-3 py-2.5">Status</th>
            <th className="px-3 py-2.5">Deadline</th>
            <th className="px-3 py-2.5">ATS</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => {
            const expanded = expandedId === app.id;
            const colors = STATUS_COLORS[app.status] ?? STATUS_COLORS.not_applied;
            return (
              <Fragment key={app.id}>
                <tr className="border-b border-border last:border-b-0 hover:bg-surface-raised/60">
                  <td className="px-3 py-2.5">
                    <button onClick={() => toggleExpand(app)} className="text-muted hover:text-text" aria-label="Expand">
                      <ChevronRight size={15} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
                    </button>
                  </td>
                  <td className="cursor-pointer px-3 py-2.5 font-medium text-text" onClick={() => toggleExpand(app)}>
                    {app.company}
                  </td>
                  <td className="cursor-pointer px-3 py-2.5 text-text" onClick={() => toggleExpand(app)}>
                    {app.role}
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app, e.target.value)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium outline-none ${colors.pill}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted">
                    {app.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {new Date(app.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted">
                    {app.ats_score != null && (
                      <span className="flex items-center gap-1">
                        <Gauge size={11} /> {app.ats_score}%
                      </span>
                    )}
                  </td>
                </tr>
                {expanded && (
                  <tr className="border-b border-border bg-surface-raised/40 last:border-b-0">
                    <td></td>
                    <td colSpan={5} className="px-3 py-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">Notes</p>
                          <p className="text-sm text-text">{app.notes || "No notes yet."}</p>
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                            Interview date
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="datetime-local"
                              value={interviewDraft}
                              onChange={(e) => {
                                setInterviewDraft(e.target.value);
                                setDraftDirty(true);
                              }}
                              className="flex-1 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
                            />
                            <button
                              onClick={() => saveInterviewDate(app)}
                              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                      <Link
                        to={`/applications/${app.id}`}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Open full application <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

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
