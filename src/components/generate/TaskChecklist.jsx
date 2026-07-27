import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { THEMES } from "../../lib/theme";
import { useTheme } from "../../lib/ThemeContext";

export default function TaskChecklist({ steps, done }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { theme } = useTheme();
  const glow = THEMES.find((t) => t.id === theme)?.swatch ?? "#159847";

  useEffect(() => {
    if (done || activeIndex >= steps.length - 1) return;
    const timer = setTimeout(() => setActiveIndex((i) => i + 1), 900 + Math.random() * 500);
    return () => clearTimeout(timer);
  }, [activeIndex, done, steps.length]);

  return (
    <ul className="flex flex-col gap-3">
      {steps.map((step, i) => {
        const isDone = done || i < activeIndex;
        const isActive = !done && i === activeIndex;
        return (
          <li key={step} className="flex items-center gap-3 text-sm">
            <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
              {isActive && (
                <span
                  className="absolute h-4 w-4 animate-pulse rounded-full opacity-40 blur-[3px]"
                  style={{ backgroundColor: glow }}
                />
              )}
              {isDone ? (
                <Check size={14} className="relative text-[#8ee6a8]" />
              ) : isActive ? (
                <Loader2 size={13} className="relative animate-spin text-white/70" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
              )}
            </span>
            <span className={isDone ? "text-white/35 line-through decoration-white/15" : isActive ? "text-white/90" : "text-white/30"}>
              {step}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
