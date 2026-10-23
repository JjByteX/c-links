"use client";

import { useEffect, useState } from "react";
import { Button, Loader, Text, Title } from "@mantine/core";
import { listCards, type Card } from "@/lib/cards";
import { loadStock, type Purchase, type StockData } from "@/lib/stock";
import listClasses from "./cards-list.module.css";
import classes from "./dashboard-view.module.css";

type Day = { date: Date; sold: number };
type DashboardData = StockData & { cards: Card[]; days: Day[] };

const RECENT_COUNT = 5;
const CHART_DAYS = 14;

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// Cards sold on each of the last CHART_DAYS days, oldest first, counting
// days by the partner's local date. Days with no purchase are 0.
function dailySales(purchases: Purchase[]): Day[] {
  const sold = new Map<string, number>();
  for (const p of purchases) {
    const key = dayKey(new Date(p.created_at));
    sold.set(key, (sold.get(key) ?? 0) + p.quantity);
  }
  return Array.from({ length: CHART_DAYS }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (CHART_DAYS - 1 - i));
    return { date, sold: sold.get(dayKey(date)) ?? 0 };
  });
}

const formatDay = (d: Date) =>
  d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", { dateStyle: "medium" });

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadStock(), listCards()])
      .then(([stock, cards]) => {
        if (cancelled) return;
        setData({ ...stock, cards, days: dailySales(stock.purchases) });
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

  const sold = data.purchases.reduce((sum, p) => sum + p.quantity, 0);
  // The same customer can buy more than once, so names are counted once.
  const customers = new Set(
    data.purchases.map((p) => p.customer_name.trim().toLowerCase()),
  ).size;
  const taps = data.cards.reduce((sum, c) => sum + c.tap_count, 0);
  const recent = data.purchases.slice(0, RECENT_COUNT);
  const mostTapped = [...data.cards]
    .filter((c) => c.tap_count > 0)
    .sort((a, b) => b.tap_count - a.tap_count)
    .slice(0, RECENT_COUNT);

  const peakDay = Math.max(...data.days.map((d) => d.sold));
  const soldRecently = data.days.reduce((sum, d) => sum + d.sold, 0);
  const topTaps = mostTapped[0]?.tap_count ?? 0;

  const figures = [
    { value: data.stock, name: "In stock" },
    { value: sold, name: "Sold" },
    { value: customers, name: "Customers" },
    { value: taps, name: "Taps" },
  ];

  return (
    <>
      <div className={listClasses.top}>
        <Title order={1}>Dashboard</Title>
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
        <div className={classes.chartHeader}>
          <Title order={2} className={classes.heading}>
            Sold per day
          </Title>
          <Text size="sm" c="dimmed">
            {soldRecently} in the last {CHART_DAYS} days
          </Text>
        </div>
        <div
          className={classes.columns}
          role="img"
          aria-label={`Cards sold per day over the last ${CHART_DAYS} days: ${soldRecently} in total, most in one day ${peakDay}`}
        >
          {data.days.map((day) => (
            <div
              key={dayKey(day.date)}
              className={classes.column}
              title={`${formatDay(day.date)}: ${day.sold} ${day.sold === 1 ? "card" : "cards"}`}
            >
              <div
                className={classes.columnBar}
                style={{
                  height: peakDay === 0 ? 0 : `${(day.sold / peakDay) * 100}%`,
                }}
              />
            </div>
          ))}
        </div>
        <div className={classes.axis}>
          <span>{formatDay(data.days[0].date)}</span>
          <span>{formatDay(data.days[data.days.length - 1].date)}</span>
        </div>
      </section>

      <div className={classes.sections}>
        <section>
          <Title order={2} className={classes.heading}>
            Recent purchases
          </Title>
          {recent.length === 0 ? (
            <Text c="dimmed">No purchases yet</Text>
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
                    {formatDate(purchase.created_at)}
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
          {mostTapped.length === 0 ? (
            <Text c="dimmed">No taps yet</Text>
          ) : (
            <div>
              {mostTapped.map((card) => (
                <div key={card.id} className={classes.barItem}>
                  <div className={classes.barHead}>
                    <span className={classes.itemLabel}>{card.label}</span>
                    <span className={classes.detail}>
                      {card.tap_count} {card.tap_count === 1 ? "tap" : "taps"}
                    </span>
                  </div>
                  <div className={classes.barTrack}>
                    <div
                      className={classes.barFill}
                      style={{ width: `${(card.tap_count / topTaps) * 100}%` }}
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
