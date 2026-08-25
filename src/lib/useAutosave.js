import { useEffect, useRef, useState } from "react";

// Debounced autosave: calls `save(value)` `delay`ms after `value` stops
// changing. Skips the mount-time call and any change that's just `value`
// being reset from outside (e.g. a fresh reload()), by comparing against the
// last value this hook itself saved rather than saving on every render.
// Returns "idle" | "saving" | "saved" | "error" for a status indicator.
export function useAutosave(value, save, { delay = 900, enabled = true } = {}) {
  const [status, setStatus] = useState("idle");
  const timerRef = useRef(null);
  const savedValueRef = useRef(value);
  const isFirstRef = useRef(true);

  useEffect(() => {
    if (!enabled) return undefined;
    if (isFirstRef.current) {
      isFirstRef.current = false;
      savedValueRef.current = value;
      return undefined;
    }
    if (value === savedValueRef.current) return undefined;

    setStatus("saving");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      Promise.resolve(save(value))
        .then(() => {
          savedValueRef.current = value;
          setStatus("saved");
          setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 2000);
        })
        .catch((err) => {
          console.error("Autosave failed:", err);
          setStatus("error");
        });
    }, delay);

    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay, enabled]);

  return status;
}
