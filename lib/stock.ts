import { createClient } from "@/lib/supabase/client";

export type Package = {
  key: string;
  name: string;
  price: number;
  bundle_size: number;
  min_quantity: number;
};

export type Purchase = {
  id: string;
  customer_name: string;
  quantity: number;
  package_key: string;
  amount: number;
  voided_at: string | null;
  voided_reason: string | null;
  created_at: string;
};

export type StockEntry = {
  id: string;
  kind: "opening" | "restock" | "correction";
  quantity: number;
  created_at: string;
};

// stock is cards received minus cards bought. received is the sum of the
// stock log, so it counts corrections too.
export type StockData = {
  stock: number;
  received: number;
  purchases: Purchase[];
  entries: StockEntry[];
  packages: Package[];
};

// Whole numbers only, up to six digits.
export const isValidQuantity = (value: string) => /^\d{1,6}$/.test(value.trim());

// A whole number other than 0, with an optional minus sign for a correction.
export const isValidChange = (value: string) =>
  /^-?\d{1,6}$/.test(value.trim()) && Number(value.trim()) !== 0;

export const entryLabel = (kind: StockEntry["kind"]) =>
  kind === "opening"
    ? "Opening count"
    : kind === "restock"
      ? "Restock"
      : "Correction";

export const formatPeso = (amount: number) =>
  `₱${amount.toLocaleString("en-PH")}`;

// What a package costs for a number of cards.
export const packageAmount = (pkg: Package, quantity: number) =>
  (pkg.price * quantity) / pkg.bundle_size;

// "₱99 per card" or "₱650 per 5 cards".
export const packagePrice = (pkg: Package) =>
  pkg.bundle_size === 1
    ? `${formatPeso(pkg.price)} per card`
    : `${formatPeso(pkg.price)} per ${pkg.bundle_size} cards`;

// Why a number of cards does not fit a package, or null when it does.
export function packageQuantityError(pkg: Package, quantity: number) {
  if (quantity < pkg.min_quantity)
    return `At least ${pkg.min_quantity} ${pkg.min_quantity === 1 ? "card" : "cards"}`;
  if (quantity % pkg.bundle_size !== 0)
    return `Cards come in groups of ${pkg.bundle_size}`;
  return null;
}

export const formatChange = (quantity: number) =>
  quantity > 0 ? `+${quantity}` : String(quantity);

export async function loadStock(): Promise<StockData> {
  const supabase = createClient();
  const [log, purchases, packages] = await Promise.all([
    supabase
      .from("stock_log")
      .select("id, kind, quantity, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("purchases")
      .select(
        "id, customer_name, quantity, package_key, amount, voided_at, voided_reason, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("packages")
      .select("key, name, price, bundle_size, min_quantity")
      .order("sort_order"),
  ]);
  if (log.error) throw new Error(log.error.message);
  if (purchases.error) throw new Error(purchases.error.message);
  if (packages.error) throw new Error(packages.error.message);
  const received = log.data.reduce((sum, e) => sum + e.quantity, 0);
  // Voided purchases no longer count: their cards are back in stock.
  const bought = purchases.data
    .filter((p) => !p.voided_at)
    .reduce((sum, p) => sum + p.quantity, 0);
  return {
    stock: received - bought,
    received,
    purchases: purchases.data,
    entries: log.data as StockEntry[],
    packages: packages.data,
  };
}

// Logs cards received (positive) or a correction (negative) with today's date.
export async function addStock(quantity: number): Promise<void> {
  const { error } = await createClient().rpc("record_stock_change", {
    qty: quantity,
  });
  if (error) throw new Error(error.message);
}

// Voids a purchase: the cards return to stock and the sale stops counting.
export async function voidPurchase(id: string, reason: string): Promise<void> {
  const { error } = await createClient().rpc("void_purchase", {
    purchase: id,
    reason: reason.trim(),
  });
  if (error) throw new Error(error.message);
}

// Fixes a mistyped customer name.
export async function editPurchaseCustomer(
  id: string,
  customer: string,
): Promise<void> {
  const { error } = await createClient().rpc("edit_purchase_customer", {
    purchase: id,
    customer: customer.trim(),
  });
  if (error) throw new Error(error.message);
}

// Logs the customer at the package price; the stock goes down because the
// purchase is counted.
export async function recordPurchase(
  customer: string,
  packageKey: string,
  quantity: number,
): Promise<void> {
  const { error } = await createClient().rpc("record_purchase", {
    customer: customer.trim(),
    pkg: packageKey,
    qty: quantity,
  });
  if (error) throw new Error(error.message);
}
