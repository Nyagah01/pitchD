import { supabase } from "./supabaseClient";

export function signUpWithPassword(email, password) {
  return supabase.auth.signUp({ email, password });
}

export function signInWithPassword(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function signInWithMagicLink(email) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
}

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

export function signInWithLinkedIn() {
  return supabase.auth.signInWithOAuth({
    provider: "linkedin_oidc",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

export function resetPasswordForEmail(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
}

export function updatePassword(newPassword) {
  return supabase.auth.updateUser({ password: newPassword });
}

export function signOut() {
  return supabase.auth.signOut();
}

export function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return data.subscription;
}
