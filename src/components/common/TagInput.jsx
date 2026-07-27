import { useState } from "react";
import { X } from "lucide-react";

export default function TagInput({ value, onChange, placeholder }) {
  const tags = value ?? [];
  const [draft, setDraft] = useState("");

  function commit() {
    const cleaned = draft.trim();
    if (cleaned && !tags.includes(cleaned)) onChange([...tags, cleaned]);
    setDraft("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeAt(idx) {
    onChange(tags.filter((_, i) => i !== idx));
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-bg px-2.5 py-1.5 focus-within:border-primary"
      onClick={(e) => e.currentTarget.querySelector("input")?.focus()}
    >
      {tags.map((tag, idx) => (
        <span
          key={`${tag}-${idx}`}
          className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeAt(idx);
            }}
            className="text-primary/70 hover:text-primary"
            aria-label={`Remove ${tag}`}
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="min-w-[80px] flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted"
      />
    </div>
  );
}
