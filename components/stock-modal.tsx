"use client";

import { useState, type FormEvent } from "react";
import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { isValidChange } from "@/lib/stock";

type Props = {
  opened: boolean;
  current: number;
  onClose: () => void;
  onSave: (quantity: number, note: string) => Promise<void>;
};

// Adds cards that arrived. A negative number corrects the count. Either way
// it is logged with today's date.
function StockModalContent({ current, onClose, onSave }: Omit<Props, "opened">) {
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatValid = isValidChange(value);
  const change = formatValid ? Number(value.trim()) : 0;
  const correcting = formatValid && change < 0;
  const noteOk = !correcting || note.trim() !== "";
  const valid = formatValid && current + change >= 0 && noteOk;

  const fieldError =
    value.trim() === ""
      ? undefined
      : !formatValid
        ? "Enter a whole number other than 0"
        : current + change < 0
          ? `Only ${current} in stock`
          : undefined;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(change, note);
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
          <TextInput
            label={correcting ? "Reason" : "Note"}
            description={
              correcting
                ? "Why the count is off"
                : "Optional, like where the cards came from"
            }
            withAsterisk={correcting}
            maxLength={200}
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
          />
          {error && (
            <Text role="alert" size="sm" c="error">
              {error}
            </Text>
          )}
          {!valid && (value.trim() === "" || !noteOk) && (
            <Text size="sm" c="dimmed">
              Required: {value.trim() === "" ? "Cards added" : "Reason"}
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
