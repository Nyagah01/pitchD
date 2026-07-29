import { supabase } from "./supabaseClient";

const WORKER_URL = import.meta.env.VITE_WORKER_URL;
if (!WORKER_URL) {
  console.warn(
    "VITE_WORKER_URL is not set — Jobo chat will hit http://localhost:8787, which won't exist in a deployed build."
  );
}

const REQUEST_TIMEOUT_MS = 60000;

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

export async function listJoboMessages() {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("jobo_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function saveJoboMessage(role, content) {
  const userId = await currentUserId();
  const { error } = await supabase.from("jobo_messages").insert({ user_id: userId, role, content });
  if (error) throw error;
}

export async function clearJoboMessages() {
  const userId = await currentUserId();
  const { error } = await supabase.from("jobo_messages").delete().eq("user_id", userId);
  if (error) throw error;
}

export async function sendJoboMessage(history, context) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let res;
  try {
    res = await fetch(`${WORKER_URL ?? "http://localhost:8787"}/jobo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        messages: history.map(({ role, content }) => ({ role, content })),
        context,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    console.error("Jobo worker unreachable:", err);
    throw new Error("Shoot — I can't reach the server right now. Check your connection and try again.");
  }
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json()).error ?? "";
    } catch {
      // ignore — fall through to the generic message
    }
    if (res.status === 429 && detail) {
      throw new Error(detail);
    }
    if (res.status === 401) {
      throw new Error("Your session's expired — sign in again and retry.");
    }
    throw new Error("Something went wrong on my end — try again in a moment.");
  }
  return res.json();
}
