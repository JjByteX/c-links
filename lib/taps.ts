import { createClient } from "@/lib/supabase/client";

// Taps per card since a date, from the tap log. Cards with no taps in the
// range are missing from the result.
export async function tapsByCard(since: Date): Promise<Record<string, number>> {
  const { data, error } = await createClient().rpc("taps_by_card", {
    since: since.toISOString(),
  });
  if (error) throw new Error(error.message);
  return Object.fromEntries(
    (data as { card_id: string; taps: number }[]).map((row) => [
      row.card_id,
      Number(row.taps),
    ]),
  );
}
