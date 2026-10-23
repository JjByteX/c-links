"use client";

import { useState, type FormEvent } from "react";
import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { isValidChange } from "@/lib/stock";

type Props = {
  opened: boolean;
  current: number;
  onClose: () => void;
  onSave: (quantity: number) => Promise<void>;
};

// Adds cards that arrived. A negative number corrects the count. Either way
// it is logged with today's date.
function StockModalContent({ current, onClose, onSave }: Omit<Props, "opened">) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatValid = isValidChange(value);
  const change = formatValid ? Number(value.trim()) : 0;
  const valid = formatValid && current + change >= 0;

  const fieldError =
    value.trim() === ""
      ? undefined
      : !formatValid
        ? "Enter a whole number other than 0"
        : !valid
          ? `Only ${current} in stock`
          : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(change);
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
      title="Add stock"
    >
      <form onSubmit={submit}>
        <Stack gap="md">
          <TextInput
            label="Cards added"
            description="Use a negative number, like -3, to correct the count"
            withAsterisk
            data-autofocus
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
            error={fieldError}
          />
          {error && (
            <Text role="alert" size="sm" c="error">
              {error}
            </Text>
          )}
          {!valid && value.trim() === "" && (
            <Text size="sm" c="dimmed">
              Required: Cards added
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
