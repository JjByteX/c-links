"use client";

import { useEffect, useState } from "react";
import { Button, Loader, Text, TextInput, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPencil, IconPlus, IconSearch } from "@tabler/icons-react";
import {
  loadStock,
  recordPurchase,
  setStock,
  type StockData,
} from "@/lib/stock";
import { PurchaseModal } from "./purchase-modal";
import { StockModal } from "./stock-modal";
import listClasses from "./cards-list.module.css";
import classes from "./stock-view.module.css";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", { dateStyle: "medium" });

export function StockView() {
  const [data, setData] = useState<StockData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"stock" | "purchase" | null>(null);
  const [query, setQuery] = useState("");

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let cancelled = false;
    loadStock()
      .then((result) => {
        if (cancelled) return;
        setData(result);
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

  async function saveStock(quantity: number) {
    await setStock(quantity);
    notifications.show({ message: "Stock saved" });
    setModal(null);
    reload();
  }

  async function savePurchase(customer: string, quantity: number) {
    await recordPurchase(customer, quantity);
    notifications.show({ message: "Purchase saved" });
    setModal(null);
    reload();
  }

  const bought = data?.purchases.reduce((sum, p) => sum + p.quantity, 0) ?? 0;
  const needle = query.trim().toLowerCase();
  const shown =
    data?.purchases.filter((p) =>
      p.customer_name.toLowerCase().includes(needle),
    ) ?? [];

  return (
    <>
      <div className={listClasses.top}>
        <Title order={1}>Stock</Title>
        <div className={classes.actions}>
          <Button
            variant="default"
            leftSection={<IconPencil size={16} />}
            disabled={data === null}
            onClick={() => setModal("stock")}
          >
            Set stock
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            disabled={data === null}
            onClick={() => setModal("purchase")}
          >
            Record purchase
          </Button>
        </div>
      </div>

      {error ? (
        <div className={listClasses.state}>
          <Text role="alert" c="error">
            Stock could not be loaded: {error}
          </Text>
          <Button variant="default" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : data === null ? (
        <div className={listClasses.state}>
          <Loader size="sm" />
          <Text c="dimmed">Loading stock</Text>
        </div>
      ) : (
        <>
          <div className={classes.figures}>
            {[
              { value: data.stock, name: "In stock" },
              { value: bought, name: "Bought" },
              { value: data.stock + bought, name: "Total" },
            ].map(({ value, name }) => (
              <div key={name} className={classes.figure}>
                <span className={classes.count}>{value}</span>
                <span className={classes.name}>{name}</span>
              </div>
            ))}
          </div>

          {data.purchases.length > 0 && (
            <div className={listClasses.searchRow}>
              <TextInput
                className={listClasses.search}
                aria-label="Search customers"
                placeholder="Search customers"
                leftSection={<IconSearch size={16} />}
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
              />
            </div>
          )}
          {data.purchases.length === 0 ? (
            <div className={listClasses.state}>
              <Text>No purchases yet</Text>
            </div>
          ) : shown.length === 0 ? (
            <div className={listClasses.state}>
              <Text>No customers match</Text>
            </div>
          ) : (
            <div>
              {shown.map((purchase) => (
                <div key={purchase.id} className={listClasses.row}>
                  <div className={listClasses.main}>
                    <div className={listClasses.label}>
                      {purchase.customer_name}
                    </div>
                  </div>
                  <div className={classes.detail}>
                    {purchase.quantity}{" "}
                    {purchase.quantity === 1 ? "card" : "cards"}
                  </div>
                  <div className={classes.detail}>
                    {formatDate(purchase.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <StockModal
        opened={modal === "stock"}
        current={data?.stock ?? 0}
        onClose={() => setModal(null)}
        onSave={saveStock}
      />
      <PurchaseModal
        opened={modal === "purchase"}
        stock={data?.stock ?? 0}
        onClose={() => setModal(null)}
        onSave={savePurchase}
      />
    </>
  );
}
