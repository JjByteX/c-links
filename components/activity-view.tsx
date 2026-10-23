"use client";

import { useEffect, useState } from "react";
import { Button, Loader, Text, TextInput, Title } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { listActivity, type Activity } from "@/lib/activity";
import listClasses from "./cards-list.module.css";
import classes from "./activity-view.module.css";

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

// Who did what, newest first. Entries are written by the database when a
// partner changes cards, purchases or stock, and when a partner is added.
export function ActivityView() {
  const [entries, setEntries] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let cancelled = false;
    listActivity()
      .then((list) => {
        if (cancelled) return;
        setEntries(list);
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

      {!error && entries !== null && entries.length > 0 && (
        <div className={listClasses.searchRow}>
          <TextInput
            className={listClasses.search}
            aria-label="Search activity"
            placeholder="Search activity"
            leftSection={<IconSearch size={16} />}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
        </div>
      )}

      {error ? (
        <div className={listClasses.state}>
          <Text role="alert" c="error">
            Activity could not be loaded: {error}
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
          <Text>No activity yet</Text>
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
