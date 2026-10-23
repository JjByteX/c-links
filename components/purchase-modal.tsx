"use client";

import { useState, type FormEvent } from "react";
import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  formatPeso,
  isValidQuantity,
  packageAmount,
  packagePrice,
  packageQuantityError,
  type Package,
} from "@/lib/stock";

type Props = {
  opened: boolean;
  stock: number;
  packages: Package[];
  onClose: () => void;
  onSave: (
    customer: string,
    packageKey: string,
    quantity: number,
  ) => Promise<void>;
};

// Records who bought, which package and how many cards. The price comes from
// the package and the stock goes down by the same number of cards.
function PurchaseModalContent({
  stock,
  packages,
  onClose,
  onSave,
}: Omit<Props, "opened">) {
  const [customer, setCustomer] = useState("");
  const [packageKey, setPackageKey] = useState<string | null>(
    packages[0]?.key ?? null,
  );
  const [quantity, setQuantity] = useState(
    String(packages[0]?.min_quantity ?? 1),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pkg = packages.find((p) => p.key === packageKey);

  const quantityNumber = Number(quantity.trim());
  const quantityValid = isValidQuantity(quantity) && quantityNumber >= 1;
  const packageError =
    pkg && quantityValid ? packageQuantityError(pkg, quantityNumber) : null;
  const withinStock = quantityValid && quantityNumber <= stock;
  const cardsValid = quantityValid && packageError === null && withinStock;
  const ready = customer.trim() !== "" && pkg !== undefined && cardsValid;

  // Names what is still missing while Save is disabled.
  const missing = [
    customer.trim() === "" && "Customer",
    !pkg && "Package",
    !cardsValid && "Cards",
  ].filter(Boolean);

  const quantityError =
    quantity.trim() === ""
      ? undefined
      : !quantityValid
        ? "Enter a whole number, 1 or more"
        : packageError
          ? packageError
          : !withinStock
            ? `Only ${stock} in stock`
            : undefined;

  const pickPackage = (key: string | null) => {
    setPackageKey(key);
    const next = packages.find((p) => p.key === key);
    // Start from the smallest number of cards the package allows.
    if (next) setQuantity(String(next.min_quantity));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || !pkg) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(customer, pkg.key, quantityNumber);
    } catch (e) {
      setError(
        `The purchase could not be saved: ${e instanceof Error ? e.message : "unknown error"}`,
      );
      setBusy(false);
    }
  };

  return (
    <Modal
      opened
      onClose={onClose}
      centered
      radius="lg"
      padding="var(--padding-modal)"
      size="var(--form-max-width)"
      title="Record purchase"
    >
      <form onSubmit={submit}>
        <Stack gap="md">
          <TextInput
            label="Customer"
            withAsterisk
            data-autofocus
            value={customer}
            onChange={(e) => setCustomer(e.currentTarget.value)}
          />
          <Select
            label="Package"
            withAsterisk
            data={packages.map((p) => ({
              value: p.key,
              label: `${p.name}, ${packagePrice(p)}`,
            }))}
            value={packageKey}
            onChange={pickPackage}
            allowDeselect={false}
            checkIconPosition="right"
            styles={{
              dropdown: { padding: "var(--padding-menu)" },
              option: { padding: "var(--padding-control)" },
            }}
          />
          <TextInput
            label="Cards"
            withAsterisk
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.currentTarget.value)}
            error={quantityError}
          />
          {pkg && cardsValid && (
            <Text size="sm" c="dimmed">
              Total: {formatPeso(packageAmount(pkg, quantityNumber))}
            </Text>
          )}
          {error && (
            <Text role="alert" size="sm" c="error">
              {error}
            </Text>
          )}
          {missing.length > 0 && (
            <Text size="sm" c="dimmed">
              Required: {missing.join(", ")}
            </Text>
          )}
          <Group justify="flex-end">
            <Button type="submit" disabled={!ready} loading={busy}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// Mounted only while open, so every opening starts with fresh state.
export function PurchaseModal({ opened, ...rest }: Props) {
  if (!opened) return null;
  return <PurchaseModalContent {...rest} />;
}
