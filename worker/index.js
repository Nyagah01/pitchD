const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

class AuthError extends Error {}
class QuotaError extends Error {}
// Errors safe to show to the client verbatim — everything else gets a generic
// message so raw internal detail (Supabase/PostgREST bodies, stack traces,
// upstream API error text) never leaks to the browser.
class PublicError extends Error {}

const FETCH_TIMEOUT_MS = 45000;
const AUTH_TIMEOUT_MS = 10000;

async function requireUser(req, env) {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) throw new AuthError("Missing Authorization header");

  let res;
  try {
    res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    });
  } catch (err) {
    console.error("Auth check failed:", err.message || err);
    throw new AuthError("Could not verify your session — try again.");
  }
  if (!res.ok) throw new AuthError("Invalid or expired session");
  return res.json();
}

const DAILY_LIMITS = {
  generation: 5,
  prep: 5,
  structure_profile: 5,
  essay: 5,
  other_help: 5,
  jobo: 30,
};
const QUOTA_MESSAGES = {
  generation: "You've reached today's limit of 5 job application generations. Come back tomorrow for 5 more.",
  prep: "You've reached today's limit of 5 interview/codility prep requests. Come back tomorrow for 5 more.",
  structure_profile: "You've reached today's limit of 5 profile restructures. Come back tomorrow for 5 more.",
  essay: "You've reached today's limit of 5 essay generations. Come back tomorrow for 5 more.",
  other_help: "You've reached today's limit of 5 quick-research requests. Come back tomorrow for 5 more.",
  jobo: "You've reached today's limit of 30 Jobo messages. Come back tomorrow for 30 more.",
};

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

// kind: "generation" (CV + cover letter), "prep" (interview + codility prep,
// shared cap), "structure_profile", "essay", "other_help", or "jobo".
//
// Records the usage event FIRST, then counts — a plain count-then-insert has
// a TOCTOU race where concurrent requests can all read the same pre-insert
// count and all pass the check. Inserting first and verifying after means the
// worst case is a request landing right at the cap gets rolled back even
// though there was technically room for it — never that the cap gets
// exceeded.
async function checkAndRecordUsage(env, userId, kind) {
  const limit = DAILY_LIMITS[kind];
  const since = startOfTodayUTC();
  const [inserted] = await supabaseRequest(env, `/rest/v1/usage_events`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, kind }),
  });
  const rows = await supabaseRequest(
    env,
    `/rest/v1/usage_events?select=id&user_id=eq.${userId}&kind=eq.${kind}&created_at=gte.${since}`
  );
  if (rows.length > limit) {
    await supabaseRequest(env, `/rest/v1/usage_events?id=eq.${inserted.id}`, { method: "DELETE" }).catch((err) =>
      console.error("Failed to roll back over-limit usage event:", err.message || err)
    );
    throw new QuotaError(QUOTA_MESSAGES[kind]);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function extractText(message) {
  return (message.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function assertNotTruncated(message) {
  if (message.stop_reason === "max_tokens") {
    throw new PublicError(
      "The AI's response was too long and got cut off before finishing — try again with a shorter dump, or split it into two passes."
    );
  }
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(candidate);
  } catch (err) {
    throw new Error(`Could not parse the AI's response as JSON: ${err.message}`);
  }
}

async function callClaude(env, { system, messages, tools, maxTokens = 4096 }, attempt = 1) {
  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages,
        ...(tools ? { tools } : {}),
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    // Transient network-level failure reaching Anthropic (not an API error response) — worth one retry.
    if (attempt < 2) {
      console.error("callClaude fetch failed, retrying:", err.message || err);
      return callClaude(env, { system, messages, tools, maxTokens }, attempt + 1);
    }
    throw new Error(`Could not reach the AI service: ${err.message || err}`);
  }

  // 5xx from Anthropic is often transient (overload, brief outage) — one retry before giving up.
  if (!res.ok && res.status >= 500 && attempt < 2) {
    console.error(`Anthropic API ${res.status}, retrying...`);
    return callClaude(env, { system, messages, tools, maxTokens }, attempt + 1);
  }

  if (!res.ok) {
    const text = await res.text();
    if (/credit balance/i.test(text)) {
      // Not something retrying fixes — someone needs to add funds. Alert the
      // founder (rate-limited so a burst of failed requests doesn't spam
      // their inbox) and give the end user an honest, non-technical message
      // rather than a generic "something went wrong."
      await notifyFounderOfLowCredit(env).catch((err) =>
        console.error("Failed to send low-credit alert:", err.message || err)
      );
      throw new PublicError(
        "We're temporarily unable to generate right now — our team's already been notified and is on it. Please try again in a little while."
      );
    }
    throw new Error(`Anthropic API error (${res.status}): ${text}`);
  }
  return res.json();
}

const LOW_CREDIT_ALERT_COOLDOWN_MS = 60 * 60 * 1000; // don't re-alert more than once an hour

async function notifyFounderOfLowCredit(env) {
  if (!env.ADMIN_ALERT_EMAIL) return;
  const key = "anthropic_low_credit";

  let existing;
  try {
    [existing] = await supabaseRequest(env, `/rest/v1/system_alerts?select=last_sent_at&key=eq.${key}`);
  } catch (err) {
    console.error("Low-credit alert: failed to check cooldown, skipping to be safe:", err.message || err);
    return;
  }
  const lastSent = existing?.last_sent_at ? new Date(existing.last_sent_at).getTime() : 0;
  if (Date.now() - lastSent < LOW_CREDIT_ALERT_COOLDOWN_MS) return;

  const sent = await sendReminderEmail(env, {
    to: env.ADMIN_ALERT_EMAIL,
    subject: "Pitchd: Anthropic API credit balance is too low",
    body: "Claude API calls are failing because the Anthropic account's credit balance is too low. Add funds or enable auto-reload at https://console.anthropic.com/settings/billing — CV generation, Jobo, and every other AI feature on Pitchd is down until this is fixed.",
  });
  if (!sent) return;

  await supabaseRequest(env, `/rest/v1/system_alerts?on_conflict=key`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ key, last_sent_at: new Date().toISOString() }),
  }).catch((err) => console.error("Low-credit alert: failed to record cooldown:", err.message || err));
}

function profileToText(profile) {
  const { profile: basics, experience, education, skills, certifications, projects } = profile;
  return JSON.stringify({ basics, experience, education, skills, certifications, projects }, null, 2);
}

// --- Endpoint handlers -----------------------------------------------------

async function handleStructureProfile(req, env) {
  const { rawText } = await req.json();

  const system = `You structure a person's messy career history into clean JSON. Never invent facts, companies, dates, or achievements that aren't in the source text — only reorganize and lightly clean up wording. If a field is unknown, omit it or leave it empty. If something in the source text is clearly real but doesn't confidently fit any field below (ambiguous dates, unclear context, a fragment you're not sure how to categorize), do not force it into a field — put a short plain-English note about it in "uncategorized" instead. Respond with ONLY valid JSON matching this exact shape, no prose, no markdown fences:
{
  "profile": { "full_name": "", "email": "", "phone": "", "location": "", "headline": "", "summary": "", "linkedin_url": "", "github_url": "", "portfolio_url": "" },
  "experience": [{ "company": "", "role": "", "start_date": "", "end_date": "", "description": "", "achievements": [], "skills_used": [] }],
  "education": [{ "institution": "", "degree": "", "field": "", "start_date": "", "end_date": "", "grade": "" }],
  "skills": [{ "name": "", "category": "Technical|Soft Skills|Tools", "proficiency": "Beginner|Intermediate|Expert" }],
  "certifications": [{ "name": "", "issuer": "", "date_issued": "", "credential_url": "" }],
  "projects": [{ "name": "", "description": "", "tech_stack": [], "url": "", "github_url": "", "impact": "" }],
  "uncategorized": ["short note about something that didn't confidently fit elsewhere", ...]
}
The app only tracks month + year precision for these dates, never a specific day — respond with "YYYY-MM" where at least the month is known, or just "YYYY" if only a year is given. Never include a day.`;

  const message = await callClaude(env, {
    system,
    messages: [{ role: "user", content: rawText }],
    maxTokens: 8192,
  });

  assertNotTruncated(message);
  const structured = extractJson(extractText(message));
  return json(structured);
}

async function generateDraft(env, profile, jobDescription, lessonsLearned) {
  const lessonsBlock =
    lessonsLearned && lessonsLearned.length
      ? `\n\nLESSONS FROM PAST REJECTIONS (address these where genuinely relevant, without inventing anything new):\n${lessonsLearned.map((l) => `- ${l}`).join("\n")}`
      : "";

  const system = `You help a job seeker tailor application materials from their real profile — never invent experience, skills, or achievements that aren't in the profile provided. Reorder and reword for relevance to the job description only. Respond with ONLY valid JSON, no prose, no markdown fences:
{
  "atsScore": <integer 0-100>,
  "atsGaps": ["short phrase describing a gap", ...up to 5],
  "cv": "<full tailored one-page CV as plain text. First line is the candidate's name, second line is contact info, then ALL-CAPS section headers (e.g. PROFESSIONAL EXPERIENCE) each on their own line, with '-' for bullet points. Never use decorative dividers, box-drawing characters, or any symbol beyond plain ASCII — the renderer draws its own section rules.>",
  "coverLetter": "<full personalized cover letter as plain text>",
  "interviewPrep": "<top 5 likely interview questions, each followed by a suggested talking point, as plain text>"
}${lessonsBlock}`;

  const message = await callClaude(env, {
    system,
    messages: [
      {
        role: "user",
        content: `PROFILE:\n${profileToText(profile)}\n\nJOB DESCRIPTION:\n${jobDescription}`,
      },
    ],
    maxTokens: 8192,
  });

  assertNotTruncated(message);
  return extractJson(extractText(message));
}

async function critiqueDraft(env, draft, jobDescription) {
  const system = `You are a strict, experienced hiring manager. Score how likely this CV and cover letter are to get the candidate shortlisted for this specific job — competitiveness, clarity, and impact, not just keyword overlap. Be honest and critical. Respond with ONLY valid JSON, no prose, no markdown fences:
{
  "hireabilityScore": <integer 0-100>,
  "notes": ["specific, actionable weakness", ...up to 5]
}`;

  const message = await callClaude(env, {
    system,
    messages: [
      {
        role: "user",
        content: `JOB DESCRIPTION:\n${jobDescription}\n\nCV:\n${draft.cv}\n\nCOVER LETTER:\n${draft.coverLetter}`,
      },
    ],
    maxTokens: 1024,
  });

  assertNotTruncated(message);
  return extractJson(extractText(message));
}

async function reviseDraft(env, draft, critique, jobDescription, profile, userFeedback) {
  const feedbackBlock = userFeedback?.trim()
    ? `\n\nTHE CANDIDATE ALSO SPECIFICALLY ASKED FOR:\n${userFeedback.trim()}`
    : "";

  const system = `You revise a CV and cover letter to address a hiring manager's critique — you may only reorder, reword, or re-emphasize what's actually in the candidate's real profile, never invent new experience or achievements. Respond with ONLY valid JSON, no prose, no markdown fences:
{
  "cv": "<revised full CV as plain text, same format as before: name, contact line, ALL-CAPS section headers, '-' bullets, plain ASCII only, no decorative dividers>",
  "coverLetter": "<revised full cover letter as plain text>"
}`;

  const message = await callClaude(env, {
    system,
    messages: [
      {
        role: "user",
        content: `PROFILE:\n${profileToText(profile)}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nCURRENT CV:\n${draft.cv}\n\nCURRENT COVER LETTER:\n${draft.coverLetter}\n\nCRITIQUE TO ADDRESS:\n${critique.notes.map((n) => `- ${n}`).join("\n")}${feedbackBlock}`,
      },
    ],
    maxTokens: 8192,
  });

  assertNotTruncated(message);
  return extractJson(extractText(message));
}

// One draft + one critique pass — that's it. This used to also auto-loop up
// to 2 revise+critique rounds chasing a hireability threshold, which meant up
// to 6 sequential Claude calls (worst case several minutes) before the client
// ever saw a result, and any single call failing anywhere in that chain
// failed the whole request. A single pass is fast and reliable; further
// refinement is now a separate, user-initiated /optimize-application call
// (see handleOptimizeApplication) so the person decides whether to spend
// another one of their daily generations on it, instead of it happening
// invisibly and unreliably every time.
async function handleGenerateApplication(req, env) {
  const { profile, jobDescription, lessonsLearned } = await req.json();

  const draft = await generateDraft(env, profile, jobDescription, lessonsLearned);
  const critique = await critiqueDraft(env, draft, jobDescription);

  return json({
    ...draft,
    hireabilityScore: critique.hireabilityScore,
    hireabilityNotes: critique.notes,
    revisions: 0,
  });
}

// User-initiated follow-up: exactly one revise+critique pass, optionally
// steered by free-text feedback from the person, layered on top of the
// hiring-manager critique. Bounded the same way generation is (shares the
// "generation" daily cap in the router) rather than looping internally.
async function handleOptimizeApplication(req, env) {
  const { profile, jobDescription, draft, critique, userFeedback } = await req.json();

  const revised = await reviseDraft(env, draft, critique, jobDescription, profile, userFeedback);
  const nextDraft = { ...draft, cv: revised.cv, coverLetter: revised.coverLetter };
  const nextCritique = await critiqueDraft(env, nextDraft, jobDescription);

  return json({
    ...nextDraft,
    hireabilityScore: nextCritique.hireabilityScore,
    hireabilityNotes: nextCritique.notes,
  });
}

async function handleResearchedPrep(req, env, { kind }) {
  const { profile, jobDescription, company, role } = await req.json();

  const prompts = {
    interview_prep: `Search for current, real information about ${company} (culture, recent news, interview process, values) and combine it with the job description and this candidate's real profile to produce grounded interview questions with suggested talking points tailored to them. Never invent experience the candidate doesn't have.`,
    codility_prep: `Search for what kind of coding assessment or technical test ${company} is known to use for a "${role}" role (Codility, HackerRank, LeetCode-style, take-home, etc.), then produce a focused prep plan: likely topics, example problem types, and a short practice plan. Ground it in real information where you can find it, and be explicit when you're using general knowledge instead.`,
  };

  const system = `You are a career coach with live web search. ${prompts[kind]} Write the final answer as clear, well-formatted plain text (not JSON) — headings and bullet points are fine as plain text, no markdown code fences.`;

  const message = await callClaude(env, {
    system,
    messages: [
      {
        role: "user",
        content: `COMPANY: ${company}\nROLE: ${role}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE PROFILE:\n${profileToText(profile)}`,
      },
    ],
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
    maxTokens: 4096,
  });

  assertNotTruncated(message);
  return json({ content: extractText(message) });
}

async function handleSynthesizeLessons(req, env) {
  const { feedbackEntries } = await req.json();

  if (!feedbackEntries || feedbackEntries.length === 0) {
    return json({ lessons: [] });
  }

  const system = `You condense a job seeker's rejection feedback and self-reflections into a short, deduplicated list of concrete lessons they can apply to future applications. Each lesson should be one specific, actionable sentence. Merge duplicates and near-duplicates into one. Respond with ONLY valid JSON, no prose, no markdown fences:
{ "lessons": ["short actionable lesson", ...up to 8] }`;

  const message = await callClaude(env, {
    system,
    messages: [
      {
        role: "user",
        content: feedbackEntries.map((e, i) => `${i + 1}. ${e}`).join("\n"),
      },
    ],
    maxTokens: 1024,
  });

  assertNotTruncated(message);
  return json(extractJson(extractText(message)));
}

async function handleEssay(req, env) {
  const { profile, prompt, jobDescription } = await req.json();

  const system = `You write application essays and personal statements grounded only in the candidate's real profile — never invent experience. Match tone to the prompt. Respond with plain text only, no JSON, no markdown fences.`;

  const message = await callClaude(env, {
    system,
    messages: [
      {
        role: "user",
        content: `ESSAY PROMPT:\n${prompt}\n\n${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}\n\n` : ""}CANDIDATE PROFILE:\n${profileToText(profile)}`,
      },
    ],
    maxTokens: 2048,
  });

  assertNotTruncated(message);
  return json({ content: extractText(message) });
}

const JOBO_SAVE_MARKER = "===SAVE===";

async function handleJoboChat(req, env) {
  const { messages, context } = await req.json();

  const system = `You are Jobo, a warm, down-to-earth companion for someone in the middle of a job hunt on Pitchd. You do a few things, as they come up naturally in conversation — you don't need to do all of them every message:

1. If asked to look into a company (or it's clearly relevant), do a couple of web searches for real, current information — culture, recent news, reputation, red flags, how people describe working there — and summarize it plainly. Don't just dump links; explain what you found.
2. Be a genuine chat buddy for job-hunt stress — casual, warm, real. Normalize rejection, waiting, self-doubt. Avoid generic corporate-affirmation-speak or repeating the same encouragement every message.
3. When relevant, share grounded, practical non-verbal-cue and interview-presence tips (posture, eye contact, tone, pacing, handshake, video-call framing).

You are not a therapist and don't act like one. If someone describes something that sounds like real distress, hopelessness, or crisis, take it seriously, respond with warmth, and gently encourage them to reach out to a real mental health professional or a crisis line — don't try to handle it yourself, and don't brush past it either.

Keep replies conversational and reasonably short — this is a chat, not an essay.

${context?.company ? `The user currently has an application open for ${context.role ?? "a role"} at ${context.company}.${context.jobDescription ? ` Job description:\n${context.jobDescription}` : ""}\n\n` : ""}IMPORTANT: only when you've just done an actual company background check in THIS reply, end your reply with a line containing exactly "${JOBO_SAVE_MARKER}" followed by a compact plain-text summary suitable for saving directly into that application's interview prep notes. Never include that marker for ordinary conversation, encouragement, or advice — only right after a real background check.`;

  const message = await callClaude(env, {
    system,
    messages,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
    maxTokens: 2048,
  });

  const raw = extractText(message);
  const markerIndex = raw.indexOf(JOBO_SAVE_MARKER);
  if (markerIndex === -1) return json({ content: raw, saveOffer: null });

  return json({
    content: raw.slice(0, markerIndex).trim(),
    saveOffer: raw.slice(markerIndex + JOBO_SAVE_MARKER.length).trim(),
  });
}

async function handleOtherHelp(req, env) {
  const { query, company, role } = await req.json();

  const system = `You are a quick-research assistant helping a job seeker with something specific that doesn't fit a standard prep category. Do a couple of targeted web searches to find genuinely relevant, current, real resources — not generic advice. Keep this cheap: a short direct answer plus a small handful of the most useful links, not an essay. Respond with ONLY valid JSON, no prose, no markdown fences:
{ "summary": "1-3 sentence direct answer or context", "links": [{ "title": "short label", "url": "https://..." }, ...up to 5] }`;

  const message = await callClaude(env, {
    system,
    messages: [
      {
        role: "user",
        content: `${company ? `COMPANY: ${company}\n` : ""}${role ? `ROLE: ${role}\n` : ""}\nQUESTION:\n${query}`,
      },
    ],
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
    maxTokens: 1024,
  });

  assertNotTruncated(message);
  return json(extractJson(extractText(message)));
}

// --- Reminder cron -----------------------------------------------------

// Returns whether the email actually went out — callers must not mark a
// reminder "sent" unless this is true, or a bad key / Resend outage / missing
// address permanently silences that reminder with no retry.
async function sendReminderEmail(env, { to, subject, body }) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.REMINDER_FROM_EMAIL ?? "Pitchd <reminders@pitchd.app>",
        to,
        subject,
        text: body,
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`Resend email failed (${res.status}):`, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend email fetch failed:", err.message || err);
    return false;
  }
}

async function supabaseRequest(env, path, init = {}) {
  const res = await fetch(`${env.SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init.headers,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
  return res.json();
}

const STALE_NOT_APPLIED_DAYS = 7;

async function runReminderSweep(env) {
  const now = new Date();
  const horizon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const staleCutoff = new Date(now.getTime() - STALE_NOT_APPLIED_DAYS * 24 * 60 * 60 * 1000).toISOString();

  let dueInterviews = [];
  let dueDeadlines = [];
  let staleNotApplied = [];
  try {
    dueInterviews = await supabaseRequest(
      env,
      `/rest/v1/applications?select=id,user_id,company,role,interview_date&interview_reminder_sent=eq.false&interview_date=not.is.null&interview_date=lte.${horizon}`
    );
  } catch (err) {
    console.error("Reminder sweep: failed to fetch due interviews:", err.message || err);
  }
  try {
    dueDeadlines = await supabaseRequest(
      env,
      `/rest/v1/applications?select=id,user_id,company,role,deadline&deadline_reminder_sent=eq.false&deadline=not.is.null&deadline=lte.${horizon}&status=not.in.(applied,withdrawn,denied)`
    );
  } catch (err) {
    console.error("Reminder sweep: failed to fetch due deadlines:", err.message || err);
  }
  try {
    // Applications the user started (dumped a job description in, maybe
    // generated a CV) but never actually marked "applied" — a week of
    // silence is worth a nudge before it just quietly rots in the pipeline.
    staleNotApplied = await supabaseRequest(
      env,
      `/rest/v1/applications?select=id,user_id,company,role&status=eq.not_applied&not_applied_reminder_sent=eq.false&created_at=lte.${staleCutoff}`
    );
  } catch (err) {
    console.error("Reminder sweep: failed to fetch stale not-applied applications:", err.message || err);
  }

  for (const app of dueInterviews) {
    try {
      const [user] = await supabaseRequest(env, `/rest/v1/profile?select=email&user_id=eq.${app.user_id}`);
      if (!user?.email) continue; // nothing to send to yet; leave unset so a later sweep retries once an email is on file
      const sent = await sendReminderEmail(env, {
        to: user.email,
        subject: `Interview coming up — ${app.company}`,
        body: `Your interview for ${app.role} at ${app.company} is on ${new Date(app.interview_date).toLocaleString()}.`,
      });
      if (!sent) continue; // leave the flag false so the next sweep retries
      await supabaseRequest(env, `/rest/v1/applications?id=eq.${app.id}`, {
        method: "PATCH",
        body: JSON.stringify({ interview_reminder_sent: true }),
      });
    } catch (err) {
      // One bad row shouldn't take down the rest of the sweep.
      console.error(`Reminder sweep: interview reminder failed for application ${app.id}:`, err.message || err);
    }
  }

  for (const app of dueDeadlines) {
    try {
      const [user] = await supabaseRequest(env, `/rest/v1/profile?select=email&user_id=eq.${app.user_id}`);
      if (!user?.email) continue;
      const sent = await sendReminderEmail(env, {
        to: user.email,
        subject: `Deadline approaching — ${app.company}`,
        body: `The application deadline for ${app.role} at ${app.company} is ${new Date(app.deadline).toLocaleDateString()}.`,
      });
      if (!sent) continue;
      await supabaseRequest(env, `/rest/v1/applications?id=eq.${app.id}`, {
        method: "PATCH",
        body: JSON.stringify({ deadline_reminder_sent: true }),
      });
    } catch (err) {
      console.error(`Reminder sweep: deadline reminder failed for application ${app.id}:`, err.message || err);
    }
  }

  for (const app of staleNotApplied) {
    try {
      const [user] = await supabaseRequest(env, `/rest/v1/profile?select=email&user_id=eq.${app.user_id}`);
      if (!user?.email) continue;
      const sent = await sendReminderEmail(env, {
        to: user.email,
        subject: `Still sitting in your pipeline — ${app.company}`,
        body: `You started an application for ${app.role} at ${app.company} about a week ago but haven't marked it applied yet. Worth finishing it off, or is it time to withdraw it from your pipeline?`,
      });
      if (!sent) continue;
      await supabaseRequest(env, `/rest/v1/applications?id=eq.${app.id}`, {
        method: "PATCH",
        body: JSON.stringify({ not_applied_reminder_sent: true }),
      });
    } catch (err) {
      console.error(`Reminder sweep: stale not-applied reminder failed for application ${app.id}:`, err.message || err);
    }
  }
}

// --- Router -----------------------------------------------------

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const { pathname } = new URL(request.url);

    try {
      const user = await requireUser(request, env);

      switch (pathname) {
        case "/structure-profile":
          await checkAndRecordUsage(env, user.id, "structure_profile");
          return await handleStructureProfile(request, env);
        case "/generate-application":
          await checkAndRecordUsage(env, user.id, "generation");
          return await handleGenerateApplication(request, env);
        case "/optimize-application":
          await checkAndRecordUsage(env, user.id, "generation");
          return await handleOptimizeApplication(request, env);
        case "/interview-prep":
          await checkAndRecordUsage(env, user.id, "prep");
          return await handleResearchedPrep(request, env, { kind: "interview_prep" });
        case "/codility-prep":
          await checkAndRecordUsage(env, user.id, "prep");
          return await handleResearchedPrep(request, env, { kind: "codility_prep" });
        case "/essay":
          await checkAndRecordUsage(env, user.id, "essay");
          return await handleEssay(request, env);
        case "/other-help":
          await checkAndRecordUsage(env, user.id, "other_help");
          return await handleOtherHelp(request, env);
        case "/jobo":
          await checkAndRecordUsage(env, user.id, "jobo");
          return await handleJoboChat(request, env);
        case "/synthesize-lessons":
          return await handleSynthesizeLessons(request, env);
        default:
          return json({ error: "Not found" }, 404);
      }
    } catch (err) {
      if (err instanceof AuthError) {
        return json({ error: err.message }, 401);
      }
      if (err instanceof QuotaError) {
        return json({ error: err.message, code: "DAILY_LIMIT_REACHED" }, 429);
      }
      console.error(`[${pathname}]`, err.stack || err.message || err);
      if (err instanceof PublicError) {
        return json({ error: err.message }, 422);
      }
      // Everything else (Supabase/PostgREST bodies, upstream API error text,
      // parse failures, unexpected bugs) is logged above but never shown
      // verbatim to the client.
      return json({ error: "Something went wrong on our end. Try again, and let us know if it keeps happening." }, 500);
    }
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      runReminderSweep(env).catch((err) => console.error("Reminder sweep crashed:", err.stack || err.message || err))
    );
  },
};
