"use client";

import { useEffect, useState } from "react";
import { Button, Loader, Select, Text, TextInput, Title } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import {
  activityGroups,
  listActivity,
  type Activity,
} from "@/lib/activity";
import { listPartners, type Partner } from "@/lib/partners";
import listClasses from "./cards-list.module.css";
import classes from "./activity-view.module.css";

type RangeKey = "all" | "today" | "7d" | "30d";

const ranges: { value: RangeKey; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

// Where a range starts, in the partner's local time.
function since(range: RangeKey) {
  if (range === "all") return null;
  const now = new Date();
  const days = range === "today" ? 0 : range === "7d" ? 6 : 29;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
}

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const selectStyles = {
  dropdown: { padding: "var(--padding-menu)" },
  option: { padding: "var(--padding-control)" },
};

type Result = { key: string; list?: Activity[]; error?: string };

// Who did what, newest first. Entries are written by the database when a
// partner changes cards, purchases or stock, and by the app and server for
// sign-ins, written chips and new partners.
export function ActivityView() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [actorId, setActorId] = useState("all");
  const [group, setGroup] = useState("all");
  const [range, setRange] = useState<RangeKey>("all");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  // The partner choices. If they cannot be loaded the filter just offers
  // every partner.
  useEffect(() => {
    let cancelled = false;
    listPartners()
      .then((list) => {
        if (!cancelled) setPartners(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Entries are fetched again whenever a filter changes.
  const key = `${actorId}|${group}|${range}|${reloadKey}`;
  useEffect(() => {
    let cancelled = false;
    listActivity({
      actorId: actorId === "all" ? null : actorId,
      group: group === "all" ? null : group,
      since: since(range),
    })
      .then((list) => {
        if (!cancelled) setResult({ key, list });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setResult({
            key,
            error: e instanceof Error ? e.message : "unknown error",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [key, actorId, group, range]);

  const current = result?.key === key ? result : null;
  const entries = current?.list ?? null;
  const filtered =
    actorId !== "all" || group !== "all" || range !== "all";

  const needle = query.trim().toLowerCase();
  const shown = (entries ?? []).filter(
    (entry) =>
      entry.summary.toLowerCase().includes(needle) ||
      entry.actor_email.toLowerCase().includes(needle),
  );

  return (
    <>
      <div className={listClasses.top}>
        <Title order={1}>Activity</Title>
      </div>

      <div className={classes.filters}>
        <TextInput
          className={classes.wide}
          aria-label="Search activity"
          placeholder="Search activity"
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
        <Select
          className={classes.wide}
          aria-label="Partner"
          data={[
            { value: "all", label: "All partners" },
            ...partners.map((p) => ({ value: p.id, label: p.email })),
          ]}
          value={actorId}
          onChange={(value) => value && setActorId(value)}
          allowDeselect={false}
          checkIconPosition="right"
          styles={selectStyles}
        />
        <Select
          aria-label="Type"
          data={[
            { value: "all", label: "All types" },
            ...activityGroups.map((g) => ({ value: g.value, label: g.label })),
          ]}
          value={group}
          onChange={(value) => value && setGroup(value)}
          allowDeselect={false}
          checkIconPosition="right"
          styles={selectStyles}
        />
        <Select
          aria-label="Date range"
          data={ranges}
          value={range}
          onChange={(value) => value && setRange(value as RangeKey)}
          allowDeselect={false}
          checkIconPosition="right"
          styles={selectStyles}
        />
      </div>

      {current?.error ? (
        <div className={listClasses.state}>
          <Text role="alert" c="error">
            Activity could not be loaded: {current.error}
          </Text>
          <Button variant="default" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : entries === null ? (
        <div className={listClasses.state}>
          <Loader size="sm" />
          <Text c="dimmed">Loading activity</Text>
        </div>
      ) : entries.length === 0 ? (
        <div className={listClasses.state}>
          <Text>{filtered ? "No activity matches the filters" : "No activity yet"}</Text>
        </div>
      ) : shown.length === 0 ? (
        <div className={listClasses.state}>
          <Text>No activity matches</Text>
        </div>
      ) : (
        <div>
          {shown.map((entry) => (
            <div key={entry.id} className={listClasses.row}>
              <div className={listClasses.main}>
                <div className={listClasses.label}>{entry.summary}</div>
              </div>
              <div className={classes.detail}>
                {entry.actor_email || "Unknown"}
              </div>
              <div className={classes.detail}>{formatWhen(entry.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
