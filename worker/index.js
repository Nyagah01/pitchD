const MODEL = "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
    throw new Error(
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
    throw new Error(`Anthropic API error (${res.status}): ${text}`);
  }
  return res.json();
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
Dates should be ISO "YYYY-MM-DD" where a specific date is known, or just "YYYY" if only a year is given.`;

  const message = await callClaude(env, {
    system,
    messages: [{ role: "user", content: rawText }],
    maxTokens: 8192,
  });

  assertNotTruncated(message);
  const structured = extractJson(extractText(message));
  return json(structured);
}

const HIREABILITY_THRESHOLD = 75;
const MAX_REVISIONS = 2;

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

async function reviseDraft(env, draft, critique, jobDescription, profile) {
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
        content: `PROFILE:\n${profileToText(profile)}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nCURRENT CV:\n${draft.cv}\n\nCURRENT COVER LETTER:\n${draft.coverLetter}\n\nCRITIQUE TO ADDRESS:\n${critique.notes.map((n) => `- ${n}`).join("\n")}`,
      },
    ],
    maxTokens: 8192,
  });

  assertNotTruncated(message);
  return extractJson(extractText(message));
}

async function handleGenerateApplication(req, env) {
  const { profile, jobDescription, lessonsLearned } = await req.json();

  let draft = await generateDraft(env, profile, jobDescription, lessonsLearned);
  let critique = await critiqueDraft(env, draft, jobDescription);
  let revisions = 0;

  while (critique.hireabilityScore < HIREABILITY_THRESHOLD && revisions < MAX_REVISIONS) {
    const revised = await reviseDraft(env, draft, critique, jobDescription, profile);
    draft = { ...draft, cv: revised.cv, coverLetter: revised.coverLetter };
    critique = await critiqueDraft(env, draft, jobDescription);
    revisions++;
  }

  return json({
    ...draft,
    hireabilityScore: critique.hireabilityScore,
    hireabilityNotes: critique.notes,
    revisions,
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

  return json({ content: extractText(message) });
}

// --- Reminder cron -----------------------------------------------------

async function sendReminderEmail(env, { to, subject, body }) {
  await fetch("https://api.resend.com/emails", {
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
  });
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
  });
  if (!res.ok) throw new Error(`Supabase request failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function runReminderSweep(env) {
  const now = new Date();
  const horizon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const dueInterviews = await supabaseRequest(
    env,
    `/rest/v1/applications?select=id,user_id,company,role,interview_date&interview_reminder_sent=eq.false&interview_date=not.is.null&interview_date=lte.${horizon}`
  );
  const dueDeadlines = await supabaseRequest(
    env,
    `/rest/v1/applications?select=id,user_id,company,role,deadline&deadline_reminder_sent=eq.false&deadline=not.is.null&deadline=lte.${horizon}&status=not.in.(applied,withdrawn,denied)`
  );

  for (const app of dueInterviews) {
    const [user] = await supabaseRequest(env, `/rest/v1/profile?select=email&user_id=eq.${app.user_id}`);
    if (user?.email) {
      await sendReminderEmail(env, {
        to: user.email,
        subject: `Interview coming up — ${app.company}`,
        body: `Your interview for ${app.role} at ${app.company} is on ${new Date(app.interview_date).toLocaleString()}.`,
      });
    }
    await supabaseRequest(env, `/rest/v1/applications?id=eq.${app.id}`, {
      method: "PATCH",
      body: JSON.stringify({ interview_reminder_sent: true }),
    });
  }

  for (const app of dueDeadlines) {
    const [user] = await supabaseRequest(env, `/rest/v1/profile?select=email&user_id=eq.${app.user_id}`);
    if (user?.email) {
      await sendReminderEmail(env, {
        to: user.email,
        subject: `Deadline approaching — ${app.company}`,
        body: `The application deadline for ${app.role} at ${app.company} is ${new Date(app.deadline).toLocaleDateString()}.`,
      });
    }
    await supabaseRequest(env, `/rest/v1/applications?id=eq.${app.id}`, {
      method: "PATCH",
      body: JSON.stringify({ deadline_reminder_sent: true }),
    });
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
      switch (pathname) {
        case "/structure-profile":
          return await handleStructureProfile(request, env);
        case "/generate-application":
          return await handleGenerateApplication(request, env);
        case "/interview-prep":
          return await handleResearchedPrep(request, env, { kind: "interview_prep" });
        case "/codility-prep":
          return await handleResearchedPrep(request, env, { kind: "codility_prep" });
        case "/essay":
          return await handleEssay(request, env);
        case "/synthesize-lessons":
          return await handleSynthesizeLessons(request, env);
        default:
          return json({ error: "Not found" }, 404);
      }
    } catch (err) {
      console.error(`[${pathname}]`, err.stack || err.message || err);
      return json({ error: err.message || String(err) }, 500);
    }
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runReminderSweep(env));
  },
};
