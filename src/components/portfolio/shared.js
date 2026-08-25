export function normalizeUrl(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function initials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function buildSkillsByCategory(skills) {
  return (skills ?? []).reduce((acc, s) => {
    const key = s.category || "Skills";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});
}

function formatMonthDate(v) {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})/.exec(v);
  if (!m) return v;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

// Applies to experience/education start_date/end_date and certification
// date_issued — all stored as full dates but only ever meaningful to month
// precision (see the onboarding date-granularity change), so every template
// should display "Jun 2022", never "2022-06-01".
export function formatRange(start, end) {
  const s = formatMonthDate(start) ?? "?";
  const e = end ? formatMonthDate(end) : "Present";
  return `${s} — ${e}`;
}

export { formatMonthDate };
