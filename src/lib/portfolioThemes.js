// Portfolio template + accent registry — single source of truth for both the
// picker UI (PortfolioGenerator) and the renderer (PortfolioView).

export const PORTFOLIO_TEMPLATES = [
  { id: "aurora", name: "Aurora", description: "Gradient hero, glass card overlap — warm and personal." },
  { id: "terminal", name: "Terminal", description: "Dark, monospace, hacker-chic — matches Pitchd's own UI." },
  { id: "timeline", name: "Timeline", description: "Big editorial type, a vertical rail through your history." },
  { id: "grid", name: "Grid", description: "Bento-style cards — projects front and center." },
  { id: "split", name: "Split", description: "Sticky sidebar + scrolling content, two-column split-screen." },
];

export const PORTFOLIO_ACCENTS = [
  { id: "crimson", label: "Crimson", hex: "#b0223a" },
  { id: "indigo", label: "Indigo", hex: "#4f46e5" },
  { id: "emerald", label: "Emerald", hex: "#0d9488" },
  { id: "amber", label: "Amber", hex: "#d97706" },
  { id: "violet", label: "Violet", hex: "#7c3aed" },
  { id: "slate", label: "Slate", hex: "#334155" },
];

export const DEFAULT_TEMPLATE = "aurora";
export const DEFAULT_ACCENT = "crimson";
