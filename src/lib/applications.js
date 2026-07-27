import { supabase } from "./supabaseClient";

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

export async function listApplications() {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getApplication(id) {
  const { data, error } = await supabase.from("applications").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createApplication(fields) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("applications")
    .insert({ ...fields, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateApplication(id, fields) {
  const { data, error } = await supabase.from("applications").update(fields).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function updateApplicationStatus(id, status) {
  return updateApplication(id, { status });
}

export async function submitRejectionFeedback(id, { employerFeedback, improvementNotes }) {
  return updateApplication(id, {
    status: "denied",
    rejection_employer_feedback: employerFeedback || null,
    rejection_improvement_notes: improvementNotes || null,
  });
}

export async function listRejectionFeedback() {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("applications")
    .select("company, role, rejection_employer_feedback, rejection_improvement_notes")
    .eq("user_id", userId)
    .eq("status", "denied")
    .or("rejection_employer_feedback.not.is.null,rejection_improvement_notes.not.is.null");
  if (error) throw error;
  return data;
}

export async function deleteApplication(id) {
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) throw error;
}

export async function listContacts(applicationId) {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("application_id", applicationId)
    .order("id");
  if (error) throw error;
  return data;
}

export async function createContact(applicationId, fields) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("contacts")
    .insert({ ...fields, application_id: applicationId, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteContact(id) {
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw error;
}

export async function listGeneratedDocs(applicationId) {
  const { data, error } = await supabase
    .from("generated_docs")
    .select("*")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveGeneratedDoc(applicationId, type, content) {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from("generated_docs")
    .insert({ application_id: applicationId, type, content, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export const STATUSES = [
  { value: "not_applied", label: "Not applied" },
  { value: "applied", label: "Applied" },
  { value: "in_progress", label: "In progress" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "denied", label: "Denied" },
  { value: "withdrawn", label: "Withdrawn" },
];

// Single source of truth for status color-coding — used by the kanban card's dot
// indicator and the table view's colored status pill/dropdown.
export const STATUS_COLORS = {
  not_applied: { dot: "bg-muted", pill: "border-border text-muted" },
  applied: { dot: "bg-primary", pill: "border-primary/30 bg-primary-soft text-primary" },
  in_progress: { dot: "bg-primary", pill: "border-primary/30 bg-primary-soft text-primary" },
  interview: { dot: "bg-accent", pill: "border-accent/30 bg-accent-soft text-accent" },
  offer: { dot: "bg-accent", pill: "border-accent/30 bg-accent-soft text-accent" },
  denied: { dot: "bg-danger", pill: "border-danger/30 bg-danger/10 text-danger" },
  withdrawn: { dot: "bg-muted", pill: "border-border text-muted" },
};

export function upcomingReminders(applications, withinDays = 7) {
  const now = new Date();
  const horizon = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  return applications
    .flatMap((app) => {
      const items = [];
      if (app.interview_date) {
        const d = new Date(app.interview_date);
        if (d >= now && d <= horizon) {
          items.push({ id: `${app.id}-interview`, app, kind: "interview", date: d });
        }
      }
      if (app.deadline && !["applied", "withdrawn", "denied"].includes(app.status)) {
        const d = new Date(app.deadline);
        if (d >= now && d <= horizon) {
          items.push({ id: `${app.id}-deadline`, app, kind: "deadline", date: d });
        }
      }
      return items;
    })
    .sort((a, b) => a.date - b.date);
}
