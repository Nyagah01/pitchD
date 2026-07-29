import { Link } from "react-router-dom";
import { AlarmClock, Clock } from "lucide-react";

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Diffs calendar dates (local midnight to local midnight), not raw elapsed
// hours — otherwise something 20 hours away can read "tomorrow" while
// something 1 hour away right after midnight still reads "today" or worse.
function relativeDay(date) {
  const days = Math.round((startOfDay(date) - startOfDay(new Date())) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

export default function UpcomingPanel({ reminders }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="mb-3 text-sm font-semibold text-text">Upcoming</h3>
      {reminders.length === 0 ? (
        <p className="text-sm text-muted">Nothing due in the next 7 days.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {reminders.map((r) => (
            <li key={r.id}>
              <Link
                to={`/applications/${r.app.id}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-surface-raised"
              >
                <span className="flex items-center gap-2 text-text">
                  {r.kind === "interview" ? (
                    <AlarmClock size={14} className="text-accent" />
                  ) : (
                    <Clock size={14} className="text-primary" />
                  )}
                  {r.kind === "interview" ? "Interview" : "Deadline"} — {r.app.company}
                </span>
                <span className="text-xs text-muted">{relativeDay(r.date)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
