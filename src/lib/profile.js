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

const WEIGHTS = {
  basicInfo: 10,
  headline: 5,
  summary: 10,
  experience: 20,
  education: 10,
  skills: 10,
  projects: 15,
  certifications: 10,
  photo: 10,
};

export function computeProfileStrength({ profile, experience, education, skills, projects, certifications }) {
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

  if (projects?.length >= 1) score += WEIGHTS.projects;
  else gaps.push("a project");

  if (certifications?.length >= 1) score += WEIGHTS.certifications;
  else gaps.push("a certification");

  if (profile?.photo_url) score += WEIGHTS.photo;
  else gaps.push("a profile photo");

  return { score, gaps };
}
