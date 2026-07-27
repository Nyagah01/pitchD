// Central place to turn raw/technical errors (Postgres codes, network failures,
// stack-trace-y messages) into something safe to show a user. Errors that are
// already plain-English (our own validation messages, Supabase's own
// human-readable auth errors, or messages claudeApi.js has already classified)
// pass through unchanged — this only intercepts the genuinely ugly ones.
const TECHNICAL_PATTERNS = [
  { test: /invalid input syntax for type date/i, message: "One of the dates you entered isn't valid — check the date fields and try again." },
  { test: /column .* does not exist/i, message: "Something's misconfigured on our end. We're on it — try again shortly." },
  { test: /violates .*constraint|duplicate key/i, message: "That didn't save cleanly on our end — try again, and let us know if it keeps happening." },
  { test: /row-level security|permission denied for/i, message: "You don't have access to do that — try signing out and back in." },
  { test: /failed to fetch|networkerror|load failed|err_/i, message: "Shoot — we can't reach the server right now. Check your connection and try again." },
  { test: /unexpected token|is not valid json|syntaxerror/i, message: "Something unexpected happened on our end. We're on it — try again in a moment." },
  // Raw JS engine internals (WebKit/V8/etc.) that slipped past every specific
  // pattern above — these are never something a user should have to read.
  { test: /is not a function|is not defined|cannot read propert|null is not an object|undefined is not an object/i, message: "Something unexpected happened. Please try again, and try a different file format if this was during an upload." },
];

export function friendlyError(err) {
  const raw = (err?.message || String(err ?? "")).trim();
  if (!raw) return "Something went wrong. Please try again.";

  for (const { test, message } of TECHNICAL_PATTERNS) {
    if (test.test(raw)) return message;
  }
  return raw;
}
