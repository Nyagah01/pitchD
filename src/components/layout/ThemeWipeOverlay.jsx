import { useEffect, useState } from "react";
import { useTheme } from "../../lib/ThemeContext";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches
  );

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

const WIPE_DURATION_MS = 1100;

export default function ThemeWipeOverlay() {
  const { wipe, clearWipe } = useTheme();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!wipe) return;
    // Backstop for onAnimationEnd: if the tab gets backgrounded mid-wipe (animations
    // pause on hidden tabs), the event may never fire — this guarantees the overlay
    // still clears instead of getting stuck covering the screen.
    const timer = window.setTimeout(clearWipe, WIPE_DURATION_MS + 200);
    return () => window.clearTimeout(timer);
  }, [wipe, clearWipe]);

  if (!wipe) return null;

  return (
    <div
      key={wipe.key}
      className={`pointer-events-none fixed inset-0 z-[999] ${isMobile ? "theme-wipe-y" : "theme-wipe-x"}`}
      style={{ backgroundColor: wipe.color }}
      onAnimationEnd={clearWipe}
    />
  );
}
