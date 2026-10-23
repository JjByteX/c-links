"use client";

import { useEffect, useState } from "react";
import {
  ActionIcon,
  Button,
  Loader,
  Menu,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBan,
  IconDots,
  IconPackage,
  IconPencil,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import {
  addStock,
  entryLabel,
  formatChange,
  formatPeso,
  loadStock,
  recordPurchase,
  editPurchaseCustomer,
  voidPurchase,
  type Purchase,
  type StockData,
} from "@/lib/stock";
import { PurchaseEditModal } from "./purchase-edit-modal";
import { PurchaseModal } from "./purchase-modal";
import { VoidPurchaseModal } from "./void-purchase-modal";
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
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [voiding, setVoiding] = useState<Purchase | null>(null);

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

  async function saveStock(quantity: number, note: string) {
    await addStock(quantity, note);
    notifications.show({ message: "Stock saved" });
    setModal(null);
    reload();
  }

  async function savePurchase(
    customer: string,
    packageKey: string,
    quantity: number,
  ) {
    await recordPurchase(customer, packageKey, quantity);
    notifications.show({ message: "Purchase saved" });
    setModal(null);
    reload();
  }

  async function saveCustomer(purchase: Purchase, customer: string) {
    await editPurchaseCustomer(purchase.id, customer);
    notifications.show({ message: "Customer saved" });
    setEditing(null);
    reload();
  }

  async function saveVoid(purchase: Purchase, reason: string) {
    await voidPurchase(purchase.id, reason);
    notifications.show({ message: "Purchase voided" });
    setVoiding(null);
    reload();
  }

  // Voided purchases stay in the list but no longer count.
  const bought =
    data?.purchases
      .filter((p) => !p.voided_at)
      .reduce((sum, p) => sum + p.quantity, 0) ?? 0;
  const packageNames = new Map(data?.packages.map((p) => [p.key, p.name]));
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
            leftSection={<IconPackage size={16} />}
            disabled={data === null}
            onClick={() => setModal("stock")}
          >
            Add stock
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
              { value: data.received, name: "Total" },
            ].map(({ value, name }) => (
              <div key={name} className={classes.figure}>
                <span className={classes.count}>{value}</span>
                <span className={classes.name}>{name}</span>
              </div>
            ))}
          </div>

          <div className={classes.sections}>
            <section>
              <Title order={2} className={classes.heading}>
                Stock history
              </Title>
              {data.movements.length === 0 ? (
                <div className={listClasses.state}>
                  <Text>No stock added yet</Text>
                </div>
              ) : (
                <div>
                  {data.movements.map((move) => (
                    <div key={move.id} className={listClasses.row}>
                      <div className={listClasses.main}>
                        <div className={listClasses.label}>
                          {entryLabel(move.kind)}
                        </div>
                        {(move.actor_email || move.note) && (
                          <div className={classes.detail}>
                            {[move.actor_email, move.note]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}
                      </div>
                      <div className={classes.detail}>
                        {formatChange(move.quantity)}{" "}
                        {Math.abs(move.quantity) === 1 ? "card" : "cards"},{" "}
                        {move.after} in stock
                      </div>
                      <div className={classes.detail}>
                        {formatDate(move.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <Title order={2} className={classes.heading}>
                Customers
              </Title>
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
                        <div
                          className={`${listClasses.label} ${purchase.voided_at ? classes.voided : ""}`}
                        >
                          {purchase.customer_name}
                        </div>
                        <div className={classes.detail}>
                          {packageNames.get(purchase.package_key) ??
                            purchase.package_key}
                          , {formatPeso(purchase.amount)}
                        </div>
                        {purchase.voided_at && (
                          <div className={classes.detail}>
                            Voided: {purchase.voided_reason}
                          </div>
                        )}
                      </div>
                      <div className={classes.detail}>
                        {purchase.quantity}{" "}
                        {purchase.quantity === 1 ? "card" : "cards"}
                      </div>
                      <div className={classes.rowEnd}>
                        <span className={classes.detail}>
                          {formatDate(purchase.created_at)}
                        </span>
                        {purchase.voided_at ? (
                          <span className={classes.menuSpace} />
                        ) : (
                          <Menu
                            position="bottom-end"
                            styles={{
                              dropdown: { padding: "var(--padding-menu)" },
                              item: { padding: "var(--padding-control)" },
                            }}
                          >
                            <Menu.Target>
                              <ActionIcon
                                variant="subtle"
                                aria-label={`Actions for the purchase by ${purchase.customer_name}`}
                              >
                                <IconDots size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<IconPencil size={16} />}
                                onClick={() => setEditing(purchase)}
                              >
                                Edit customer
                              </Menu.Item>
                              <Menu.Item
                                c="error"
                                leftSection={<IconBan size={16} />}
                                onClick={() => setVoiding(purchase)}
                              >
                                Void purchase
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <StockModal
        opened={modal === "stock"}
        current={data?.stock ?? 0}
        onClose={() => setModal(null)}
        onSave={saveStock}
      />
      <PurchaseEditModal
        purchase={editing}
        onClose={() => setEditing(null)}
        onSave={saveCustomer}
      />
      <VoidPurchaseModal
        purchase={voiding}
        onClose={() => setVoiding(null)}
        onSave={saveVoid}
      />
      <PurchaseModal
        opened={modal === "purchase"}
        stock={data?.stock ?? 0}
        packages={data?.packages ?? []}
        onClose={() => setModal(null)}
        onSave={savePurchase}
      />
    </>
  );
}
