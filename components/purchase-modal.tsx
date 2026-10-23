"use client";

import { useState, type FormEvent } from "react";
import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { isValidQuantity } from "@/lib/stock";

type Props = {
  opened: boolean;
  stock: number;
  onClose: () => void;
  onSave: (customer: string, quantity: number) => Promise<void>;
};

// Records who bought and how many. The stock goes down by the same amount,
// so there is nothing else to enter.
function PurchaseModalContent({ stock, onClose, onSave }: Omit<Props, "opened">) {
  const [customer, setCustomer] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quantityNumber = Number(quantity.trim());
  const quantityValid = isValidQuantity(quantity) && quantityNumber >= 1;
  const withinStock = quantityValid && quantityNumber <= stock;
  const ready = customer.trim() !== "" && withinStock;

  // Names what is still missing while Save is disabled.
  const missing = [
    customer.trim() === "" && "Customer",
    !withinStock && "Cards",
  ].filter(Boolean);

  const quantityError =
    quantity.trim() === ""
      ? undefined
      : !quantityValid
        ? "Enter a whole number, 1 or more"
        : !withinStock
          ? `Only ${stock} in stock`
          : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(customer, quantityNumber);
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
          <TextInput
            label="Cards"
            withAsterisk
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.currentTarget.value)}
            error={quantityError}
          />
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
