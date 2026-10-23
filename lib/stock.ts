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
  voided_by: string | null;
  created_at: string;
};

export type StockEntry = {
  id: string;
  kind: "opening" | "restock" | "correction";
  quantity: number;
  actor_email: string;
  note: string | null;
  created_at: string;
};

// One line of the stock history: a stock entry, or cards coming back from a
// voided purchase. after is the stock right after it.
export type StockMovement = {
  id: string;
  kind: StockEntry["kind"] | "void";
  quantity: number;
  actor_email: string;
  note: string | null;
  created_at: string;
  after: number;
};

// stock is cards received minus cards bought. received is the sum of the
// stock log, so it counts corrections too.
export type StockData = {
  stock: number;
  received: number;
  purchases: Purchase[];
  entries: StockEntry[];
  movements: StockMovement[];
  packages: Package[];
};

// Whole numbers only, up to six digits.
export const isValidQuantity = (value: string) => /^\d{1,6}$/.test(value.trim());

// A whole number other than 0, with an optional minus sign for a correction.
export const isValidChange = (value: string) =>
  /^-?\d{1,6}$/.test(value.trim()) && Number(value.trim()) !== 0;

export const entryLabel = (kind: StockMovement["kind"]) =>
  kind === "opening"
    ? "Opening count"
    : kind === "restock"
      ? "Restock"
      : kind === "void"
        ? "Returned by void"
        : "Correction";

// Builds the stock history, newest first, with the stock after each line.
// Purchases move the stock too, so they count in the running figure even
// though they have no line here.
export function stockMovements(
  entries: StockEntry[],
  purchases: Purchase[],
): StockMovement[] {
  type Event = {
    time: number;
    order: number;
    delta: number;
    move?: Omit<StockMovement, "after">;
  };
  const events: Event[] = [];
  for (const e of entries) {
    events.push({
      time: new Date(e.created_at).getTime(),
      order: 0,
      delta: e.quantity,
      move: e,
    });
  }
  for (const p of purchases) {
    events.push({
      time: new Date(p.created_at).getTime(),
      order: 1,
      delta: -p.quantity,
    });
    if (p.voided_at) {
      events.push({
        time: new Date(p.voided_at).getTime(),
        order: 2,
        delta: p.quantity,
        move: {
          id: `void-${p.id}`,
          kind: "void",
          quantity: p.quantity,
          actor_email: p.voided_by ?? "",
          note: `Voided purchase by ${p.customer_name}: ${p.voided_reason ?? ""}`,
          created_at: p.voided_at,
        },
      });
    }
  }
  events.sort((a, b) => a.time - b.time || a.order - b.order);

  let balance = 0;
  const moves: StockMovement[] = [];
  for (const event of events) {
    balance += event.delta;
    if (event.move) moves.push({ ...event.move, after: balance });
  }
  return moves.reverse();
}

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

type Page<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

// The database returns at most 1000 rows per request, so a long history is
// read in pages. Reports must not silently stop at 1000.
async function fetchAll<T>(
  page: (from: number, to: number) => Page<T>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) return rows;
  }
}

export async function loadStock(): Promise<StockData> {
  const supabase = createClient();
  const [log, purchases, packages] = await Promise.all([
    fetchAll<StockEntry>((from, to) =>
      supabase
        .from("stock_log")
        .select("id, kind, quantity, actor_email, note, created_at")
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, to),
    ),
    fetchAll<Purchase>((from, to) =>
      supabase
        .from("purchases")
        .select(
          "id, customer_name, quantity, package_key, amount, voided_at, voided_reason, voided_by, created_at",
        )
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, to),
    ),
    supabase
      .from("packages")
      .select("key, name, price, bundle_size, min_quantity")
      .order("sort_order"),
  ]);
  if (packages.error) throw new Error(packages.error.message);
  const received = log.reduce((sum, e) => sum + e.quantity, 0);
  // Voided purchases no longer count: their cards are back in stock.
  const bought = purchases
    .filter((p) => !p.voided_at)
    .reduce((sum, p) => sum + p.quantity, 0);
  const entries = log;
  return {
    stock: received - bought,
    received,
    purchases,
    entries,
    movements: stockMovements(entries, purchases),
    packages: packages.data,
  };
}

// Logs cards received (positive) or a correction (negative, which needs a
// reason) with today's date and the signed-in partner.
export async function addStock(quantity: number, note: string): Promise<void> {
  const { error } = await createClient().rpc("record_stock_change", {
    qty: quantity,
    note: note.trim() === "" ? null : note.trim(),
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
