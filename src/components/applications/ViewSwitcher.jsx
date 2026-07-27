import { KanbanSquare, Table } from "lucide-react";

// Extensible on purpose — adding a future view (e.g. a calendar or list view) is
// just another entry here plus a component, no structural rewrite of this file.
export const VIEWS = [
  { id: "kanban", label: "Kanban", icon: KanbanSquare },
  { id: "table", label: "Table", icon: Table },
];

export default function ViewSwitcher({ view, onChange }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1">
      {VIEWS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          aria-label={label}
          title={label}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            view === id ? "bg-primary-soft text-primary" : "text-muted hover:text-text"
          }`}
        >
          <Icon size={14} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
