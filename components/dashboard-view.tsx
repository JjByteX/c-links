"use client";

import { useEffect, useState } from "react";
import { Button, Loader, Select, Text, Title } from "@mantine/core";
import { listCards, type Card } from "@/lib/cards";
import {
  entryLabel,
  formatChange,
  formatPeso,
  loadStock,
  type Purchase,
  type StockData,
} from "@/lib/stock";
import { tapsByCard } from "@/lib/taps";
import listClasses from "./cards-list.module.css";
import classes from "./dashboard-view.module.css";

type RangeKey = "7d" | "30d" | "12m" | "all";
type DashboardData = StockData & { cards: Card[]; now: number };

const RECENT_COUNT = 5;

const ranges: { value: RangeKey; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "12m", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

// Where a range starts, in the partner's local time. Taps are counted from
// here. "All time" has no start: it uses each card's lifetime tap count.
function tapsSince(range: Exclude<RangeKey, "all">, now: Date) {
  if (range === "12m") return new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const days = range === "7d" ? 7 : 30;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));
}

type Bucket = { start: Date; sold: number };

// Splits the purchases in a range into bars: one per day for the short
// ranges, one per month for the long ones. Days and months follow the
// partner's local time. Returns the bars and the purchases they count.
function buildChart(purchases: Purchase[], range: RangeKey, now: Date) {
  const monthly = range === "12m" || range === "all";
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let first: Date;
  let count: number;
  if (!monthly) {
    count = range === "7d" ? 7 : 30;
    first = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (count - 1));
  } else {
    let from = now;
    if (range === "12m") {
      from = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    } else if (purchases.length > 0) {
      from = new Date(
        Math.min(...purchases.map((p) => new Date(p.created_at).getTime())),
      );
    }
    first = new Date(from.getFullYear(), from.getMonth(), 1);
    count =
      (thisMonth.getFullYear() - first.getFullYear()) * 12 +
      (thisMonth.getMonth() - first.getMonth()) +
      1;
  }

  const buckets: Bucket[] = Array.from({ length: count }, (_, i) => ({
    start: monthly
      ? new Date(first.getFullYear(), first.getMonth() + i, 1)
      : new Date(first.getFullYear(), first.getMonth(), first.getDate() + i),
    sold: 0,
  }));

  const counted: Purchase[] = [];
  for (const p of purchases) {
    const d = new Date(p.created_at);
    const index = monthly
      ? (d.getFullYear() - first.getFullYear()) * 12 +
        (d.getMonth() - first.getMonth())
      : Math.round(
          (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
            first.getTime()) /
            86_400_000,
        );
    if (index < 0 || index >= count) continue;
    buckets[index].sold += p.quantity;
    counted.push(p);
  }
  return { buckets, monthly, counted };
}

const formatDay = (d: Date) =>
  d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });

const formatMonth = (d: Date) =>
  d.toLocaleDateString("en-PH", { month: "short", year: "numeric" });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", { dateStyle: "medium" });

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");
  const [tapCounts, setTapCounts] = useState<{
    key: string;
    byCard: Record<string, number>;
  } | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadStock(), listCards()])
      .then(([stock, cards]) => {
        if (cancelled) return;
        setData({ ...stock, cards, now: Date.now() });
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "unknown error");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Taps for the chosen range come from the tap log. They are fetched again
  // whenever the range changes.
  useEffect(() => {
    if (data === null || range === "all") return;
    let cancelled = false;
    tapsByCard(tapsSince(range, new Date(data.now)))
      .then((byCard) => {
        if (!cancelled) setTapCounts({ key: `${range}-${data.now}`, byCard });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "unknown error");
      });
    return () => {
      cancelled = true;
    };
  }, [range, data]);

  if (error) {
    return (
      <>
        <Title order={1}>Dashboard</Title>
        <div className={listClasses.state}>
          <Text role="alert" c="error">
            The dashboard could not be loaded: {error}
          </Text>
          <Button variant="default" onClick={reload}>
            Try again
          </Button>
        </div>
      </>
    );
  }

  if (data === null) {
    return (
      <>
        <Title order={1}>Dashboard</Title>
        <div className={listClasses.state}>
          <Loader size="sm" />
          <Text c="dimmed">Loading dashboard</Text>
        </div>
      </>
    );
  }

  // Voided purchases no longer count as sales.
  const activePurchases = data.purchases.filter((p) => !p.voided_at);
  const { buckets, monthly, counted } = buildChart(
    activePurchases,
    range,
    new Date(data.now),
  );
  const unit = monthly ? "month" : "day";
  const formatBucket = monthly ? formatMonth : formatDay;
  const peak = Math.max(0, ...buckets.map((b) => b.sold));
  const sold = counted.reduce((sum, p) => sum + p.quantity, 0);
  const revenue = counted.reduce((sum, p) => sum + p.amount, 0);
  // The same customer can buy more than once, so names are counted once.
  const customers = new Set(
    counted.map((p) => p.customer_name.trim().toLowerCase()),
  ).size;
  const tapsLoaded =
    range === "all" || tapCounts?.key === `${range}-${data.now}`;
  const tapsOf = (card: Card) =>
    range === "all" ? card.tap_count : (tapCounts?.byCard[card.id] ?? 0);
  const cardTaps = tapsLoaded
    ? data.cards.map((card) => ({ card, taps: tapsOf(card) }))
    : [];
  const taps = tapsLoaded ? cardTaps.reduce((sum, c) => sum + c.taps, 0) : null;
  // Purchases arrive newest first.
  const recent = counted.slice(0, RECENT_COUNT);
  const mostTapped = cardTaps
    .filter((c) => c.taps > 0)
    .sort((a, b) => b.taps - a.taps)
    .slice(0, RECENT_COUNT);

  // Stock log entries in the chosen range, newest first.
  const since = range === "all" ? null : tapsSince(range, new Date(data.now));
  const restocks = data.entries
    .filter((e) => since === null || new Date(e.created_at) >= since)
    .slice(0, RECENT_COUNT);

  const topTaps = mostTapped[0]?.taps ?? 0;

  const figures = [
    { value: data.stock, name: "In stock" },
    { value: sold, name: "Sold" },
    { value: formatPeso(revenue), name: "Revenue" },
    { value: customers, name: "Customers" },
    { value: taps ?? "–", name: "Taps" },
  ];

  return (
    <>
      <div className={listClasses.top}>
        <Title order={1}>Dashboard</Title>
        <Select
          className={classes.range}
          aria-label="Date range"
          data={ranges}
          value={range}
          onChange={(value) => {
            if (value) setRange(value as RangeKey);
          }}
          allowDeselect={false}
          checkIconPosition="right"
          styles={{
            dropdown: { padding: "var(--padding-menu)" },
            option: { padding: "var(--padding-control)" },
          }}
        />
      </div>

      <div className={classes.figures}>
        {figures.map(({ value, name }) => (
          <div key={name} className={classes.figure}>
            <span className={classes.count}>{value}</span>
            <span className={classes.name}>{name}</span>
          </div>
        ))}
      </div>

      <section className={classes.chart}>
        <Title order={2} className={classes.heading}>
          Sold per {unit}
        </Title>
        <div
          className={classes.columns}
          role="img"
          aria-label={`Cards sold per ${unit}, ${ranges.find((r) => r.value === range)?.label.toLowerCase()}: ${sold} in total, most in one ${unit} ${peak}`}
        >
          {buckets.map((bucket) => (
            <div
              key={bucket.start.getTime()}
              className={classes.column}
              title={`${formatBucket(bucket.start)}: ${bucket.sold} ${bucket.sold === 1 ? "card" : "cards"}`}
            >
              <div
                className={classes.columnBar}
                style={{
                  height: peak === 0 ? 0 : `${(bucket.sold / peak) * 100}%`,
                }}
              />
            </div>
          ))}
        </div>
        <div className={classes.axis}>
          <span>{formatBucket(buckets[0].start)}</span>
          <span>{formatBucket(buckets[buckets.length - 1].start)}</span>
        </div>
      </section>

      <div className={classes.sections}>
        <section>
          <Title order={2} className={classes.heading}>
            Recent purchases
          </Title>
          {recent.length === 0 ? (
            <Text c="dimmed">
              {activePurchases.length === 0
                ? "No purchases yet"
                : "No purchases in this range"}
            </Text>
          ) : (
            <div>
              {recent.map((purchase) => (
                <div key={purchase.id} className={classes.item}>
                  <span className={classes.itemLabel}>
                    {purchase.customer_name}
                  </span>
                  <span className={classes.detail}>
                    {purchase.quantity}{" "}
                    {purchase.quantity === 1 ? "card" : "cards"},{" "}
                    {formatPeso(purchase.amount)},{" "}
                    {formatDate(purchase.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <Title order={2} className={classes.heading}>
            Recent restocks
          </Title>
          {restocks.length === 0 ? (
            <Text c="dimmed">
              {data.entries.length === 0
                ? "No stock added yet"
                : "No restocks in this range"}
            </Text>
          ) : (
            <div>
              {restocks.map((entry) => (
                <div key={entry.id} className={classes.item}>
                  <span className={classes.itemLabel}>
                    {entryLabel(entry.kind)}
                  </span>
                  <span className={classes.detail}>
                    {formatChange(entry.quantity)}{" "}
                    {Math.abs(entry.quantity) === 1 ? "card" : "cards"},{" "}
                    {formatDate(entry.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <Title order={2} className={classes.heading}>
            Most tapped
          </Title>
          {!tapsLoaded ? (
            <div className={listClasses.state}>
              <Loader size="sm" />
            </div>
          ) : mostTapped.length === 0 ? (
            <Text c="dimmed">
              {range === "all" ? "No taps yet" : "No taps in this range"}
            </Text>
          ) : (
            <div>
              {mostTapped.map(({ card, taps: count }) => (
                <div key={card.id} className={classes.barItem}>
                  <div className={classes.barHead}>
                    <span className={classes.itemLabel}>{card.label}</span>
                    <span className={classes.detail}>
                      {count} {count === 1 ? "tap" : "taps"}
                    </span>
                  </div>
                  <div className={classes.barTrack}>
                    <div
                      className={classes.barFill}
                      style={{ width: `${(count / topTaps) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
