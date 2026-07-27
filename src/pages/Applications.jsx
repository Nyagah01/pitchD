import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import KanbanBoard from "../components/applications/KanbanBoard";
import ApplicationsTable from "../components/applications/ApplicationsTable";
import ViewSwitcher from "../components/applications/ViewSwitcher";
import { listApplications } from "../lib/applications";

const VIEW_STORAGE_KEY = "pitchd-applications-view";

export default function Applications() {
  const [applications, setApplications] = useState(null);
  const [view, setView] = useState(() => localStorage.getItem(VIEW_STORAGE_KEY) || "kanban");

  const reload = useCallback(() => {
    listApplications().then(setApplications);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  function handleViewChange(next) {
    setView(next);
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Applications</h1>
          <p className="mt-1 text-sm text-muted">
            {view === "kanban" ? "Drag cards across the pipeline as things move." : "Every application, at a glance."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewSwitcher view={view} onChange={handleViewChange} />
          <Link
            to="/apply"
            className="cta-glow flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={15} /> New application
          </Link>
        </div>
      </div>

      {applications === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : view === "kanban" ? (
        applications.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
            No applications yet — start one from the Apply page.
          </p>
        ) : (
          <KanbanBoard applications={applications} onChanged={reload} />
        )
      ) : (
        <ApplicationsTable applications={applications} onChanged={reload} />
      )}
    </div>
  );
}
