"use client";

import { useEffect, useState } from "react";
import { Button, Loader, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPencil, IconPlus } from "@tabler/icons-react";
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
          <div className={classes.summary}>
            <span className={classes.count}>{data.stock}</span>
            <span className={classes.unit}>
              {data.stock === 1 ? "card in stock" : "cards in stock"}
            </span>
          </div>

          <Title order={2} className={classes.heading}>
            Customers
          </Title>
          {data.purchases.length === 0 ? (
            <div className={listClasses.state}>
              <Text>No purchases yet</Text>
            </div>
          ) : (
            <div>
              {data.purchases.map((purchase) => (
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
