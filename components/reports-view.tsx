"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Loader,
  Select,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconDownload } from "@tabler/icons-react";
import {
  listActivityBetween,
  logEvent,
} from "@/lib/activity";
import { downloadSummaryPdf, downloadXlsx } from "@/lib/export";
import {
  activitySheet,
  boundsLabel,
  buildSummary,
  rangeBounds,
  reportRanges,
  salesSheet,
  stockSheet,
  type ReportRange,
} from "@/lib/reports";
import { formatPeso, loadStock, type StockData } from "@/lib/stock";
import listClasses from "./cards-list.module.css";
import classes from "./reports-view.module.css";

type Loaded = StockData & { now: number };

const reports = [
  {
    id: "sales",
    name: "Sales",
    description:
      "Every purchase with customer, package, cards and amount. Voided ones are marked and left out of the totals.",
    format: "Excel",
  },
  {
    id: "stock",
    name: "Stock history",
    description:
      "Restocks, corrections and cards returned by voids, with the stock after each line.",
    format: "Excel",
  },
  {
    id: "activity",
    name: "Activity",
    description: "Who did what and when, for every partner.",
    format: "Excel",
  },
  {
    id: "summary",
    name: "Summary",
    description:
      "One page with cards sold, revenue, stock and sales by package.",
    format: "PDF",
  },
] as const;

// Files are named after the report and the dates they cover.
const slug = (range: ReportRange, from: string, to: string) =>
  range === "custom" ? `${from}_to_${to}` : range;

const selectStyles = {
  dropdown: { padding: "var(--padding-menu)" },
  option: { padding: "var(--padding-control)" },
};

export function ReportsView() {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<ReportRange>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let cancelled = false;
    loadStock()
      .then((result) => {
        if (cancelled) return;
        setData({ ...result, now: Date.now() });
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
        <Title order={1}>Reports</Title>
        <div className={listClasses.state}>
          <Text role="alert" c="error">
            Reports could not be loaded: {error}
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
        <Title order={1}>Reports</Title>
        <div className={listClasses.state}>
          <Loader size="sm" />
          <Text c="dimmed">Loading reports</Text>
        </div>
      </>
    );
  }

  const bounds = rangeBounds(range, customFrom, customTo, new Date(data.now));
  const summary = bounds ? buildSummary(data, bounds, data.packages) : null;
  const fileTag = slug(range, customFrom, customTo);

  async function run(id: (typeof reports)[number]["id"]) {
    if (!data || !bounds) return;
    setBusy(id);
    try {
      const label = boundsLabel(bounds);
      if (id === "sales") {
        await downloadXlsx(
          `c-links-sales-${fileTag}.xlsx`,
          "Sales",
          salesSheet(data, bounds, data.packages),
        );
      } else if (id === "stock") {
        await downloadXlsx(
          `c-links-stock-history-${fileTag}.xlsx`,
          "Stock history",
          stockSheet(data, bounds),
        );
      } else if (id === "activity") {
        const entries = await listActivityBetween(bounds.from, bounds.to);
        await downloadXlsx(
          `c-links-activity-${fileTag}.xlsx`,
          "Activity",
          activitySheet(entries),
        );
      } else {
        await downloadSummaryPdf(
          `c-links-summary-${fileTag}.pdf`,
          buildSummary(data, bounds, data.packages),
        );
      }
      const name = reports.find((r) => r.id === id)?.name.toLowerCase();
      void logEvent("report_exported", undefined, `${name} report, ${label}`);
    } catch (e) {
      notifications.show({
        message: `The report could not be created: ${e instanceof Error ? e.message : "unknown error"}`,
      });
    } finally {
      setBusy(null);
    }
  }

  const figures = summary
    ? [
        { value: summary.cardsSold, name: "Cards sold" },
        { value: formatPeso(summary.revenue), name: "Revenue" },
        { value: summary.customers, name: "Customers" },
        { value: summary.stockNow, name: "In stock now" },
      ]
    : [];

  return (
    <>
      <div className={listClasses.top}>
        <Title order={1}>Reports</Title>
      </div>

      <div className={classes.controls}>
        <Select
          className={classes.wide}
          aria-label="Date range"
          data={reportRanges}
          value={range}
          onChange={(value) => value && setRange(value as ReportRange)}
          allowDeselect={false}
          checkIconPosition="right"
          styles={selectStyles}
        />
        {range === "custom" && (
          <>
            <TextInput
              type="date"
              aria-label="From date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.currentTarget.value)}
            />
            <TextInput
              type="date"
              aria-label="To date"
              value={customTo}
              onChange={(e) => setCustomTo(e.currentTarget.value)}
            />
          </>
        )}
      </div>

      {summary ? (
        <>
          <div className={classes.figures}>
            {figures.map(({ value, name }) => (
              <div key={name} className={classes.figure}>
                <span className={classes.count}>{value}</span>
                <span className={classes.name}>{name}</span>
              </div>
            ))}
          </div>
          <p className={classes.note}>
            {summary.label}. Voided purchases are left out of the figures.
          </p>
        </>
      ) : (
        <Text c="dimmed" className={classes.note}>
          Choose a From date and a To date, with From on or before To
        </Text>
      )}

      <Title order={2} className={classes.heading}>
        Downloads
      </Title>
      <div>
        {reports.map((report) => (
          <div key={report.id} className={classes.row}>
            <div className={classes.rowMain}>
              <div className={classes.rowName}>{report.name}</div>
              <div className={classes.rowDescription}>
                {report.description}
              </div>
            </div>
            <Button
              variant="default"
              leftSection={<IconDownload size={16} />}
              disabled={bounds === null || busy !== null}
              loading={busy === report.id}
              onClick={() => run(report.id)}
            >
              {report.format}
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
