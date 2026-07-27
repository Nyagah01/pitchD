export const THEMES = [
  { id: "meadow", label: "Meadow", swatch: "#159847" },
  { id: "merlot", label: "Merlot", swatch: "#7b1e3a" },
  { id: "sunset", label: "Sunset", swatch: "#d1481f" },
  { id: "icy", label: "Icy", swatch: "#0d9488" },
  { id: "dark", label: "Dark", swatch: "#16a34a" },
];

const STORAGE_KEY = "pitchd-theme";
const VALID_IDS = THEMES.map((t) => t.id);

export function getStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return VALID_IDS.includes(stored) ? stored : "meadow";
}

export function applyTheme(id) {
  document.documentElement.setAttribute("data-theme", VALID_IDS.includes(id) ? id : "meadow");
}

export function setStoredTheme(id) {
  localStorage.setItem(STORAGE_KEY, id);
  applyTheme(id);
}
