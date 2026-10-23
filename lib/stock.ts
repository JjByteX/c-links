import { createClient } from "@/lib/supabase/client";

export type Purchase = {
  id: string;
  customer_name: string;
  quantity: number;
  created_at: string;
};

export type StockData = { stock: number; purchases: Purchase[] };

// Whole numbers only, up to six digits.
export const isValidQuantity = (value: string) => /^\d{1,6}$/.test(value.trim());

export async function loadStock(): Promise<StockData> {
  const supabase = createClient();
  const [stock, purchases] = await Promise.all([
    supabase.from("stock").select("quantity").single(),
    supabase
      .from("purchases")
      .select("id, customer_name, quantity, created_at")
      .order("created_at", { ascending: false }),
  ]);
  if (stock.error) throw new Error(stock.error.message);
  if (purchases.error) throw new Error(purchases.error.message);
  return { stock: stock.data.quantity, purchases: purchases.data };
}

export async function setStock(quantity: number): Promise<void> {
  const { error } = await createClient()
    .from("stock")
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw new Error(error.message);
}

// Lowers the stock and logs the customer in one database call.
export async function recordPurchase(
  customer: string,
  quantity: number,
): Promise<void> {
  const { error } = await createClient().rpc("record_purchase", {
    customer: customer.trim(),
    qty: quantity,
  });
  if (error) throw new Error(error.message);
}
