import { supabase } from "./supabaseClient";

const DAILY_LIMIT = 5;

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

// Mirrors the worker's own count — for display only, the worker is the source of truth.
export async function getTodayUsage() {
  const userId = await currentUserId();
  const since = startOfTodayUTC();
  const { data, error } = await supabase
    .from("usage_events")
    .select("kind")
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) throw error;

  const generation = data.filter((d) => d.kind === "generation").length;
  const prep = data.filter((d) => d.kind === "prep").length;
  return {
    generation,
    prep,
    generationRemaining: Math.max(0, DAILY_LIMIT - generation),
    prepRemaining: Math.max(0, DAILY_LIMIT - prep),
  };
}

export const DAILY_USAGE_LIMIT = DAILY_LIMIT;
