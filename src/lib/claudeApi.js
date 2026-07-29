import { supabase } from "./supabaseClient";

const WORKER_URL = import.meta.env.VITE_WORKER_URL;
if (!WORKER_URL) {
  console.warn(
    "VITE_WORKER_URL is not set — AI generation calls will hit http://localhost:8787, which won't exist in a deployed build."
  );
}

// Generous — a full application generation can chain several sequential
// Claude calls (draft, critique, up to 2 revise+critique passes) server-side.
const REQUEST_TIMEOUT_MS = 120000;

async function post(path, body) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let res;
  try {
    res = await fetch(`${WORKER_URL ?? "http://localhost:8787"}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    console.error(`Worker ${path} unreachable:`, err);
    throw new Error("Shoot — we can't reach the server right now. Check your connection and try again.");
  }

  if (!res.ok) {
    let detail = "";
    let code = "";
    try {
      const body = await res.json();
      detail = body.error ?? "";
      code = body.code ?? "";
    } catch {
      detail = await res.text().catch(() => "");
    }
    console.error(`Worker ${path} failed (${res.status}):`, detail);

    // A handful of our own worker errors are genuinely actionable — surface those as-is.
    if (/too long and got cut off/i.test(detail)) {
      throw new Error(detail);
    }
    if (code === "DAILY_LIMIT_REACHED") {
      throw new Error(detail);
    }
    if (res.status === 401) {
      throw new Error("Your session's expired — sign in again and retry.");
    }
    if (res.status === 429) {
      throw new Error("We're getting a lot of requests right now — give it a few seconds and try again.");
    }
    if (res.status >= 500) {
      throw new Error("Shoot — system's down on our end. We're working on restoring it, try again shortly.");
    }
    throw new Error("Something went wrong processing that. Try again, and let us know if it keeps happening.");
  }

  return res.json();
}

export const structureProfile = (rawText) => post("/structure-profile", { rawText });

export const generateApplication = (fullProfile, jobDescription, lessonsLearned) =>
  post("/generate-application", { profile: fullProfile, jobDescription, lessonsLearned });

export const generateInterviewPrep = (fullProfile, jobDescription, company, role) =>
  post("/interview-prep", { profile: fullProfile, jobDescription, company, role });

export const generateCodilityPrep = (fullProfile, jobDescription, company, role) =>
  post("/codility-prep", { profile: fullProfile, jobDescription, company, role });

export const generateEssay = (fullProfile, prompt, jobDescription) =>
  post("/essay", { profile: fullProfile, prompt, jobDescription });

export const generateOtherHelp = (query, company, role) =>
  post("/other-help", { query, company, role });

export const synthesizeLessons = (feedbackEntries) =>
  post("/synthesize-lessons", { feedbackEntries });
