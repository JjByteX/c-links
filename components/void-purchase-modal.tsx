"use client";

import { useState, type FormEvent } from "react";
import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { formatPeso, type Purchase } from "@/lib/stock";

type Props = {
  purchase: Purchase | null; // null = closed
  onClose: () => void;
  onSave: (purchase: Purchase, reason: string) => Promise<void>;
};

// Voiding keeps the purchase in the list, marked as voided, and records who
// did it and why. It cannot be undone: record the purchase again if needed.
function VoidPurchaseModalContent({
  purchase,
  onClose,
  onSave,
}: Omit<Props, "purchase"> & { purchase: Purchase }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = reason.trim() !== "";
  const cards = `${purchase.quantity} ${purchase.quantity === 1 ? "card" : "cards"}`;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(purchase, reason);
    } catch (e) {
      setError(
        `The purchase could not be voided: ${e instanceof Error ? e.message : "unknown error"}`,
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
      title="Void purchase"
    >
      <form onSubmit={submit}>
        <Stack gap="md">
          <Text>
            Void the purchase by {purchase.customer_name} ({cards},{" "}
            {formatPeso(purchase.amount)})? The {cards} go back into stock and
            the sale stops counting as sold or revenue. This cannot be undone.
          </Text>
          <TextInput
            label="Reason"
            withAsterisk
            data-autofocus
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
          />
          {error && (
            <Text role="alert" size="sm" c="error">
              {error}
            </Text>
          )}
          {!ready && (
            <Text size="sm" c="dimmed">
              Required: Reason
            </Text>
          )}
          <Group justify="space-between">
            <Button variant="default" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              c="error"
              disabled={!ready}
              loading={busy}
            >
              Void purchase
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// Mounted only while a purchase is chosen, so every opening starts fresh.
export function VoidPurchaseModal({ purchase, ...rest }: Props) {
  if (!purchase) return null;
  return (
    <VoidPurchaseModalContent key={purchase.id} purchase={purchase} {...rest} />
  );
}
