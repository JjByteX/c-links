import { createClient } from "@/lib/supabase/client";

export type Activity = {
  id: number;
  actor_email: string;
  action: string;
  summary: string;
  created_at: string;
};

// What the Type filter offers, and the actions each choice covers.
export const activityGroups = [
  {
    value: "cards",
    label: "Cards",
    actions: ["card_added", "card_edited", "card_deleted", "chip_written"],
  },
  {
    value: "purchases",
    label: "Purchases",
    actions: [
      "purchase_recorded",
      "purchase_edited",
      "purchase_voided",
      "purchase_deleted",
    ],
  },
  { value: "stock", label: "Stock", actions: ["stock_added", "stock_corrected"] },
  { value: "partners", label: "Partners", actions: ["partner_added"] },
  { value: "sign-ins", label: "Sign-ins", actions: ["sign_in", "sign_out"] },
];

export type ActivityFilters = {
  actorId: string | null; // null = every partner
  group: string | null; // null = every type
  since: Date | null; // null = all time
};

// The newest 200 entries that match the filters, newest first.
export async function listActivity(
  filters: ActivityFilters,
): Promise<Activity[]> {
  let query = createClient()
    .from("activity")
    .select("id, actor_email, action, summary, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filters.actorId) query = query.eq("actor_id", filters.actorId);
  const group = activityGroups.find((g) => g.value === filters.group);
  if (group) query = query.in("action", group.actions);
  if (filters.since) query = query.gte("created_at", filters.since.toISOString());
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// Reports an event only the app can see (sign in, sign out, written chip).
// A failure here must never get in the way of what the partner was doing.
export async function logEvent(
  event: "sign_in" | "sign_out" | "chip_written",
  cardId?: string,
): Promise<void> {
  try {
    await createClient().rpc("log_event", { evt: event, card: cardId });
  } catch {
    // Ignored on purpose.
  }
}
