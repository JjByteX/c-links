"use client";

import { useState, type FormEvent } from "react";
import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import type { Purchase } from "@/lib/stock";

type Props = {
  purchase: Purchase | null; // null = closed
  onClose: () => void;
  onSave: (purchase: Purchase, customer: string) => Promise<void>;
};

// Fixes a mistyped customer name. The package and the number of cards cannot
// be edited: void the purchase and record it again instead.
function PurchaseEditModalContent({
  purchase,
  onClose,
  onSave,
}: Omit<Props, "purchase"> & { purchase: Purchase }) {
  const [customer, setCustomer] = useState(purchase.customer_name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready =
    customer.trim() !== "" && customer.trim() !== purchase.customer_name;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(purchase, customer);
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
      title="Edit customer"
    >
      <form onSubmit={submit}>
        <Stack gap="md">
          <TextInput
            label="Customer"
            description="To change the package or the cards, void this purchase and record it again"
            withAsterisk
            data-autofocus
            value={customer}
            onChange={(e) => setCustomer(e.currentTarget.value)}
          />
          {error && (
            <Text role="alert" size="sm" c="error">
              {error}
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

// Mounted only while a purchase is chosen, so every opening starts fresh.
export function PurchaseEditModal({ purchase, ...rest }: Props) {
  if (!purchase) return null;
  return (
    <PurchaseEditModalContent key={purchase.id} purchase={purchase} {...rest} />
  );
}
