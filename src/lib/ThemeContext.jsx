import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getStoredTheme, applyTheme, setStoredTheme, THEMES } from "./theme";

const ThemeContext = createContext({ theme: "meadow", setTheme: () => {}, wipe: null, clearWipe: () => {} });

// How far into the wipe animation the screen is fully covered — the real theme swap
// happens at this moment so what's revealed on the way out is already the new theme.
export const WIPE_COVER_MS = 480;

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [wipe, setWipe] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // A theme picked from an email link (?theme=meadow) takes priority on first load —
    // applied immediately (no wipe animation, this isn't a live in-app switch) and
    // persisted so it's already in place once the user actually signs in.
    const fromUrl = new URLSearchParams(window.location.search).get("theme");
    if (fromUrl && THEMES.some((t) => t.id === fromUrl)) {
      setStoredTheme(fromUrl);
      setThemeState(fromUrl);
      const url = new URL(window.location.href);
      url.searchParams.delete("theme");
      window.history.replaceState({}, "", url);
    } else {
      applyTheme(theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setTheme(id) {
    if (id === theme) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const swatch = THEMES.find((t) => t.id === id)?.swatch ?? "#159847";
    setWipe({ color: swatch, key: Date.now() });

    timeoutRef.current = window.setTimeout(() => {
      setStoredTheme(id);
      setThemeState(id);
    }, WIPE_COVER_MS);
  }

  function clearWipe() {
    setWipe(null);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, wipe, clearWipe }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
