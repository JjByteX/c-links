"use client";

import { useState, type FormEvent } from "react";
import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { isValidQuantity } from "@/lib/stock";

type Props = {
  opened: boolean;
  current: number;
  onClose: () => void;
  onSave: (quantity: number) => Promise<void>;
};

// Sets the number of cards in stock. Used for the first count and for
// restocking or correcting it.
function StockModalContent({ current, onClose, onSave }: Omit<Props, "opened">) {
  const [value, setValue] = useState(String(current));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = isValidQuantity(value);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(Number(value.trim()));
    } catch (e) {
      setError(
        `The stock could not be saved: ${e instanceof Error ? e.message : "unknown error"}`,
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
      title="Set stock"
    >
      <form onSubmit={submit}>
        <Stack gap="md">
          <TextInput
            label="Cards in stock"
            withAsterisk
            data-autofocus
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
            error={
              value.trim() !== "" && !valid
                ? "Enter a whole number, 0 or more"
                : undefined
            }
          />
          {error && (
            <Text role="alert" size="sm" c="error">
              {error}
            </Text>
          )}
          {!valid && (
            <Text size="sm" c="dimmed">
              Required: Cards in stock
            </Text>
          )}
          <Group justify="flex-end">
            <Button type="submit" disabled={!valid} loading={busy}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// Mounted only while open, so every opening starts with fresh state.
export function StockModal({ opened, ...rest }: Props) {
  if (!opened) return null;
  return <StockModalContent {...rest} />;
}
