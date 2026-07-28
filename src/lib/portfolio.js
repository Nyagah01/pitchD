import { supabase } from "./supabaseClient";
import { getFullProfile } from "./profile";

function slugify(name) {
  const base = (name || "portfolio")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "portfolio"}-${suffix}`;
}

export async function getMyPortfolio() {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  const { data, error } = await supabase.from("portfolio").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function generatePortfolio() {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  const full = await getFullProfile();

  const existing = await getMyPortfolio();
  const slug = existing?.slug ?? slugify(full.profile?.full_name);

  const { data, error } = await supabase
    .from("portfolio")
    .upsert({ user_id: userId, slug, data: full }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePortfolio() {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  const { error } = await supabase.from("portfolio").delete().eq("user_id", userId);
  if (error) throw error;
}

export async function getPortfolioBySlug(slug) {
  const { data, error } = await supabase.from("portfolio").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}
