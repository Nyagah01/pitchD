import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { THEMES } from "../../lib/theme";
import { useTheme } from "../../lib/ThemeContext";

export default function ThemeSwitcher({ align = "left", dropUp = true }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-text"
      >
        <Palette size={17} strokeWidth={2} />
        Appearance
        <span
          className="ml-auto h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
          style={{ backgroundColor: current.swatch }}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className={`glass-card absolute z-20 w-48 rounded-2xl p-1.5 ${dropUp ? "bottom-full mb-2" : "top-full mt-2"} ${
              align === "left" ? "left-0" : "right-0"
            }`}
          >
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-text hover:bg-surface-raised"
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: t.swatch }}
                />
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
