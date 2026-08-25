import { supabase } from "./supabaseClient";

const WORKER_URL = import.meta.env.VITE_WORKER_URL;
if (!WORKER_URL) {
  console.warn(
    "VITE_WORKER_URL is not set — AI generation calls will hit http://localhost:8787, which won't exist in a deployed build."
  );
}

// Generous enough for two sequential Claude calls server-side (draft+critique,
// or revise+critique for an optimize pass) — generation used to chain up to 6
// calls and could legitimately take minutes; it's now capped at 2 per request.
const REQUEST_TIMEOUT_MS = 75000;

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

    // 422 is the worker's PublicError status — those messages are deliberately
    // written to be shown to the user as-is (truncated responses, low
    // Anthropic credit, etc.), unlike everything else in this branch which is
    // raw/internal detail we don't want to leak.
    if (res.status === 422 && detail) {
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

// One extra revise+critique pass, optionally steered by the user's own
// feedback text — a separate, opt-in call rather than something generation
// does automatically. Counts against the same daily "generation" cap.
export const optimizeApplication = (fullProfile, jobDescription, draft, critique, userFeedback) =>
  post("/optimize-application", {
    profile: fullProfile,
    jobDescription,
    draft,
    critique,
    userFeedback,
  });

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
