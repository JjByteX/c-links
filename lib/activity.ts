import { createClient } from "@/lib/supabase/client";

export type Activity = {
  id: number;
  actor_email: string;
  action: string;
  summary: string;
  created_at: string;
};

// The newest 200 entries, newest first.
export async function listActivity(): Promise<Activity[]> {
  const { data, error } = await createClient()
    .from("activity")
    .select("id, actor_email, action, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data;
}
