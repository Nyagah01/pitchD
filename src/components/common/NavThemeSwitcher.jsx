import { useState } from "react";
import { Palette, Check } from "lucide-react";
import { useTheme } from "../../lib/ThemeContext";
import { THEMES } from "../../lib/theme";

export default function NavThemeSwitcher({ variant = "default" }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  const light = variant === "light";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={
          light
            ? "flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-white/25"
            : "flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-2 text-sm font-medium text-text hover:border-primary/40 sm:px-3"
        }
        aria-label="Change appearance"
      >
        <Palette size={light ? 13 : 15} />
        {light && "Appearance"}
        <span
          className={light ? "h-3 w-3 rounded-full border border-white/30" : "hidden h-3 w-3 rounded-full border border-black/10 sm:inline-block"}
          style={{ backgroundColor: current.swatch }}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="glass-card absolute left-0 z-20 mt-2 w-44 rounded-2xl p-1.5 sm:left-auto sm:right-0">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-text hover:bg-surface-raised"
              >
                <span className="h-4 w-4 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: t.swatch }} />
                <span className="flex-1 text-left">{t.label}</span>
                {t.id === theme && <Check size={14} className="text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
