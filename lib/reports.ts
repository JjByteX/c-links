import {
  entryLabel,
  type Package,
  type StockData,
} from "@/lib/stock";
import { activityTypeLabel, type Activity } from "@/lib/activity";

export type ReportRange =
  | "7d"
  | "30d"
  | "month"
  | "last-month"
  | "12m"
  | "all"
  | "custom";

export const reportRanges: { value: ReportRange; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "12m", label: "Last 12 months" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom dates" },
];

// from is included, to is not. Both null means all time.
export type Bounds = { from: Date | null; to: Date | null };

// "2026-10-23" from a date field, as midnight in the partner's local time.
function parseDay(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

// The dates a range covers, in the partner's local time. Returns null when
// custom dates are missing or the wrong way round.
export function rangeBounds(
  range: ReportRange,
  customFrom: string,
  customTo: string,
  now: Date,
): Bounds | null {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const tomorrow = new Date(y, m, d + 1);
  switch (range) {
    case "7d":
      return { from: new Date(y, m, d - 6), to: tomorrow };
    case "30d":
      return { from: new Date(y, m, d - 29), to: tomorrow };
    case "month":
      return { from: new Date(y, m, 1), to: tomorrow };
    case "last-month":
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 1) };
    case "12m":
      return { from: new Date(y, m - 11, 1), to: tomorrow };
    case "all":
      return { from: null, to: null };
    case "custom": {
      const from = parseDay(customFrom);
      const last = parseDay(customTo);
      if (!from || !last || from > last) return null;
      return {
        from,
        to: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      };
    }
  }
}

const formatDay = (date: Date) =>
  date.toLocaleDateString("en-PH", { dateStyle: "medium" });

export function boundsLabel(bounds: Bounds): string {
  if (!bounds.from || !bounds.to) return "All time";
  const last = new Date(
    bounds.to.getFullYear(),
    bounds.to.getMonth(),
    bounds.to.getDate() - 1,
  );
  return `${formatDay(bounds.from)} to ${formatDay(last)}`;
}

const inBounds = (iso: string, bounds: Bounds) => {
  const time = new Date(iso).getTime();
  return (
    (!bounds.from || time >= bounds.from.getTime()) &&
    (!bounds.to || time < bounds.to.getTime())
  );
};

export type Cell = string | number | Date | null;
export type Column = { header: string; width: number; format?: string };
export type Sheet = { columns: Column[]; rows: Cell[][] };

const PESO = '"₱"#,##0';
const WHEN = "yyyy-mm-dd hh:mm";

// Every purchase in the range, voided ones included and marked. The totals
// at the bottom leave voided purchases out, like the dashboard does.
export function salesSheet(
  data: StockData,
  bounds: Bounds,
  packages: Package[],
): Sheet {
  const names = new Map(packages.map((p) => [p.key, p.name]));
  const purchases = data.purchases
    .filter((p) => inBounds(p.created_at, bounds))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const rows: Cell[][] = purchases.map((p) => [
    new Date(p.created_at),
    p.customer_name,
    names.get(p.package_key) ?? p.package_key,
    p.quantity,
    p.amount,
    p.voided_at ? "Voided" : "Active",
    p.voided_at ? new Date(p.voided_at) : null,
    p.voided_by ?? "",
    p.voided_reason ?? "",
  ]);

  const active = purchases.filter((p) => !p.voided_at);
  rows.push([]);
  rows.push([
    "Total, voided purchases left out",
    null,
    null,
    active.reduce((sum, p) => sum + p.quantity, 0),
    active.reduce((sum, p) => sum + p.amount, 0),
  ]);

  return {
    columns: [
      { header: "Date", width: 18, format: WHEN },
      { header: "Customer", width: 30 },
      { header: "Package", width: 28 },
      { header: "Cards", width: 10 },
      { header: "Amount", width: 14, format: PESO },
      { header: "Status", width: 10 },
      { header: "Voided on", width: 18, format: WHEN },
      { header: "Voided by", width: 28 },
      { header: "Reason", width: 36 },
    ],
    rows,
  };
}

// The stock history with the stock after each line, oldest first.
export function stockSheet(data: StockData, bounds: Bounds): Sheet {
  const moves = data.movements
    .filter((m) => inBounds(m.created_at, bounds))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  return {
    columns: [
      { header: "Date", width: 18, format: WHEN },
      { header: "Type", width: 20 },
      { header: "Change", width: 10 },
      { header: "Stock after", width: 12 },
      { header: "By", width: 28 },
      { header: "Note", width: 44 },
    ],
    rows: moves.map((m) => [
      new Date(m.created_at),
      entryLabel(m.kind),
      m.quantity,
      m.after,
      m.actor_email,
      m.note ?? "",
    ]),
  };
}

export function activitySheet(entries: Activity[]): Sheet {
  return {
    columns: [
      { header: "Date", width: 18, format: WHEN },
      { header: "Partner", width: 28 },
      { header: "Type", width: 12 },
      { header: "What happened", width: 90 },
    ],
    rows: entries.map((e) => [
      new Date(e.created_at),
      e.actor_email,
      activityTypeLabel(e.action),
      e.summary,
    ]),
  };
}

export type Summary = {
  label: string;
  cardsSold: number;
  revenue: number;
  purchases: number;
  customers: number;
  voided: number;
  voidedAmount: number;
  restocked: number;
  corrections: number;
  stockNow: number;
  byPackage: { name: string; purchases: number; cards: number; revenue: number }[];
};

// The figures for a range. Voided purchases are left out of sales and counted
// on their own, like on the dashboard. Stock now is today's stock whatever
// the range.
export function buildSummary(
  data: StockData,
  bounds: Bounds,
  packages: Package[],
): Summary {
  const inRange = data.purchases.filter((p) => inBounds(p.created_at, bounds));
  const active = inRange.filter((p) => !p.voided_at);
  const voided = inRange.filter((p) => p.voided_at);
  const entries = data.entries.filter((e) => inBounds(e.created_at, bounds));
  const sum = <T,>(list: T[], pick: (item: T) => number) =>
    list.reduce((total, item) => total + pick(item), 0);

  return {
    label: boundsLabel(bounds),
    cardsSold: sum(active, (p) => p.quantity),
    revenue: sum(active, (p) => p.amount),
    purchases: active.length,
    // The same customer can buy more than once, so names are counted once.
    customers: new Set(active.map((p) => p.customer_name.trim().toLowerCase()))
      .size,
    voided: voided.length,
    voidedAmount: sum(voided, (p) => p.amount),
    restocked: sum(
      entries.filter((e) => e.kind === "restock"),
      (e) => e.quantity,
    ),
    corrections: sum(
      entries.filter((e) => e.kind === "correction"),
      (e) => e.quantity,
    ),
    stockNow: data.stock,
    byPackage: packages.map((pkg) => {
      const mine = active.filter((p) => p.package_key === pkg.key);
      return {
        name: pkg.name,
        purchases: mine.length,
        cards: sum(mine, (p) => p.quantity),
        revenue: sum(mine, (p) => p.amount),
      };
    }),
  };
}
