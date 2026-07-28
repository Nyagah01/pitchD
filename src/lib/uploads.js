import { supabase } from "./supabaseClient";

const MAX_FILE_SIZE_MB = 8;
const BUCKET = "uploads";

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

function safeExt(filename) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(filename || "");
  return m ? m[1].toLowerCase() : "bin";
}

function assertUploadable(file) {
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`That file's too big — keep it under ${MAX_FILE_SIZE_MB}MB.`);
  }
  const isPdf = file.type === "application/pdf";
  const isImage = file.type.startsWith("image/");
  if (!isPdf && !isImage) {
    throw new Error("Only PDF or image files are supported.");
  }
}

// Overwrites the same path each time — one photo per user, no orphaned old uploads.
export async function uploadProfilePhoto(file) {
  assertUploadable(file);
  const userId = await currentUserId();
  const path = `${userId}/photo.${safeExt(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust so the new photo shows immediately even though the path is unchanged.
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function uploadCertificationFile(file) {
  assertUploadable(file);
  const userId = await currentUserId();
  const path = `${userId}/certifications/${crypto.randomUUID()}.${safeExt(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
