// Central place to turn raw/technical errors (Postgres codes, network failures,
// stack-trace-y messages) into something safe to show a user. Errors that are
// already plain-English (our own validation messages, Supabase's own
// human-readable auth errors, or messages claudeApi.js has already classified)
// pass through unchanged — this only intercepts the genuinely ugly ones.
const TECHNICAL_PATTERNS = [
  { test: /column .* does not exist/i, message: "Something's misconfigured on our end. We're on it — try again shortly." },
  { test: /violates .*constraint|duplicate key/i, message: "That didn't save cleanly on our end — try again, and let us know if it keeps happening." },
  { test: /row-level security|permission denied for/i, message: "You don't have access to do that — try signing out and back in." },
  { test: /failed to fetch|networkerror|load failed|err_/i, message: "Shoot — we can't reach the server right now. Check your connection and try again." },
  { test: /unexpected token|is not valid json|syntaxerror/i, message: "Something unexpected happened on our end. We're on it — try again in a moment." },
];

export function friendlyError(err) {
  const raw = (err?.message || String(err ?? "")).trim();
  if (!raw) return "Something went wrong. Please try again.";

  for (const { test, message } of TECHNICAL_PATTERNS) {
    if (test.test(raw)) return message;
  }
  return raw;
}
