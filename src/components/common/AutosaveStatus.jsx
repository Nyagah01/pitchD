import { Check, Loader2, AlertCircle } from "lucide-react";

export default function AutosaveStatus({ status }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1 text-xs text-muted">
        <Loader2 size={12} className="animate-spin" /> Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1 text-xs text-accent">
        <Check size={12} /> Saved
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1 text-xs text-danger">
        <AlertCircle size={12} /> Couldn't save — try again
      </span>
    );
  }
  return null;
}
