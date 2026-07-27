import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Gauge } from "lucide-react";
import { STATUS_COLORS } from "../../lib/applications";

export default function ApplicationCard({ application, draggable, onDragStart }) {
  return (
    <motion.div
      layout
      layoutId={application.id}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <Link
        to={`/applications/${application.id}`}
        className="block rounded-xl border border-border bg-surface p-3.5 transition-colors hover:border-primary/40"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-text">{application.role}</p>
            <p className="text-xs text-muted">{application.company}</p>
          </div>
          <span
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[application.status]?.dot ?? "bg-muted"}`}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted">
          {application.deadline && (
            <span className="flex items-center gap-1">
              <Calendar size={11} /> {new Date(application.deadline).toLocaleDateString()}
            </span>
          )}
          {application.ats_score != null && (
            <span className="flex items-center gap-1">
              <Gauge size={11} /> {application.ats_score}% match
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
