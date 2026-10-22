import { createClient } from "@/lib/supabase/client";

export type Card = {
  id: string;
  code: string;
  label: string;
  destination_url: string;
  tap_count: number;
};

export type CardInput = { label: string; destination_url: string };

const columns = "id, code, label, destination_url, tap_count";

// The short link is built from the site URL (open-questions #9). Until it is
// set, the address the partner is using is the fallback.
export const shortLink = (code: string) => {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
  return `${base.replace(/\/$/, "")}/c/${code}`;
};

export const isValidUrl = (value: string) =>
  /^https?:\/\/\S+\.\S+/i.test(value.trim());

export async function listCards(): Promise<Card[]> {
  const { data, error } = await createClient()
    .from("cards")
    .select(columns)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function addCard(input: CardInput): Promise<Card> {
  const { data, error } = await createClient()
    .from("cards")
    .insert({
      label: input.label.trim(),
      destination_url: input.destination_url.trim(),
    })
    .select(columns)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateCard(id: string, input: CardInput): Promise<void> {
  const { error } = await createClient()
    .from("cards")
    .update({
      label: input.label.trim(),
      destination_url: input.destination_url.trim(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCard(id: string): Promise<void> {
  const { error } = await createClient().from("cards").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
