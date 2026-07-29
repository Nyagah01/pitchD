import { supabase } from "./supabaseClient";

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

export async function getProfile() {
  const userId = await currentUserId();
  const { data, error } = await supabase.from("profile").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(fields) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("profile")
    .upsert({ ...fields, user_id: userId }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

const tables = ["experience", "education", "skills", "certifications", "projects"];
const ORDERED_TABLES = ["experience"]; // only tables with an order_index column

export function makeCrud(table) {
  if (!tables.includes(table)) throw new Error(`Unknown profile table: ${table}`);

  return {
    list: async () => {
      const userId = await currentUserId();
      let query = supabase.from(table).select("*").eq("user_id", userId);
      if (ORDERED_TABLES.includes(table)) {
        query = query.order("order_index", { ascending: true, nullsFirst: true });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    create: async (fields) => {
      const userId = await currentUserId();
      const { data, error } = await supabase
        .from(table)
        .insert({ ...fields, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id, fields) => {
      const { data, error } = await supabase.from(table).update(fields).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    remove: async (id) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
  };
}

export const experienceApi = makeCrud("experience");
export const educationApi = makeCrud("education");
export const skillsApi = makeCrud("skills");
export const certificationsApi = makeCrud("certifications");
export const projectsApi = makeCrud("projects");

// Wipes existing rows in the child profile tables before onboarding (re)writes
// them, so a retry after a partial save failure re-inserts cleanly instead of
// duplicating whatever succeeded the first time.
export async function clearProfileTables() {
  const userId = await currentUserId();
  await Promise.all(tables.map((table) => supabase.from(table).delete().eq("user_id", userId)));
}

export async function getFullProfile() {
  const [profile, experience, education, skills, certifications, projects] = await Promise.all([
    getProfile(),
    experienceApi.list(),
    educationApi.list(),
    skillsApi.list(),
    certificationsApi.list(),
    projectsApi.list(),
  ]);
  return { profile, experience, education, skills, certifications, projects };
}

// Projects and certifications don't count toward this score — they instead
// earn a bronze/silver/gold tier via computeCredentialTier below.
const WEIGHTS = {
  basicInfo: 15,
  headline: 5,
  summary: 15,
  experience: 25,
  education: 15,
  skills: 15,
  photo: 10,
};

export function computeProfileStrength({ profile, experience, education, skills }) {
  let score = 0;
  const gaps = [];

  const hasBasicInfo = !!(profile?.full_name && profile?.email && profile?.phone && profile?.location);
  if (hasBasicInfo) score += WEIGHTS.basicInfo;
  else gaps.push("basic info");

  if (profile?.headline) score += WEIGHTS.headline;
  else gaps.push("a headline");

  if (profile?.summary) score += WEIGHTS.summary;
  else gaps.push("a career summary");

  if (experience?.length >= 1) score += WEIGHTS.experience;
  else gaps.push("an experience entry");

  if (education?.length >= 1) score += WEIGHTS.education;
  else gaps.push("education");

  if (skills?.length >= 5) score += WEIGHTS.skills;
  else gaps.push("5+ skills");

  if (profile?.photo_url) score += WEIGHTS.photo;
  else gaps.push("a profile photo");

  return { score, gaps };
}

const TIER_THRESHOLDS = [
  { tier: "gold", min: 6 },
  { tier: "silver", min: 3 },
  { tier: "bronze", min: 1 },
];

// Projects + certifications combined count toward a credential tier instead
// of the completeness score — recognizes depth without gating the core score
// on things not every applicant has yet.
export function computeCredentialTier({ projects, certifications }) {
  const count = (projects?.length ?? 0) + (certifications?.length ?? 0);
  const match = TIER_THRESHOLDS.find((t) => count >= t.min);
  return { tier: match?.tier ?? null, count };
}
