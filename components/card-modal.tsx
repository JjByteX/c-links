"use client";

import { useState, type FormEvent } from "react";
import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { isValidUrl, type Card, type CardInput } from "@/lib/cards";

type Props = {
  opened: boolean;
  card: Card | null; // null = adding
  onClose: () => void;
  onSave: (input: CardInput) => Promise<void>;
  onDelete: (card: Card) => Promise<void>;
};

// One modal for add and edit. Delete lives here and asks for confirmation,
// because cards already written to a chip stop working.
function CardModalContent({
  card,
  onClose,
  onSave,
  onDelete,
}: Omit<Props, "opened">) {
  const [label, setLabel] = useState(card?.label ?? "");
  const [url, setUrl] = useState(card?.destination_url ?? "");
  const [touched, setTouched] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlValid = isValidUrl(url);
  const ready = label.trim() !== "" && urlValid;
  // Names what is still missing while Save is disabled.
  const missing = [
    label.trim() === "" && "Label",
    !urlValid && "Destination URL",
  ].filter(Boolean);

  async function run(action: () => Promise<void>, failure: string) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(
        `${failure}: ${e instanceof Error ? e.message : "unknown error"}`,
      );
      setBusy(false);
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (ready)
      void run(
        () => onSave({ label, destination_url: url }),
        "The card could not be saved",
      );
  };

  return (
    <Modal
      opened
      onClose={onClose}
      centered
      radius="lg"
      padding="var(--padding-modal)"
      size="var(--form-max-width)"
      title={confirming ? "Delete card" : card ? "Edit card" : "Add card"}
    >
      {confirming && card ? (
        <Stack gap="md">
          <Text>
            Delete {card.label}? Its {card.tap_count}{" "}
            {card.tap_count === 1 ? "tap" : "taps"} will be lost and the
            short link will stop working, so cards already written to a chip
            will stop working. This cannot be undone.
          </Text>
          {error && (
            <Text role="alert" size="sm" c="error">
              {error}
            </Text>
          )}
          <Group justify="space-between">
            <Button
              variant="default"
              onClick={() => setConfirming(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              c="error"
              loading={busy}
              onClick={() =>
                run(() => onDelete(card), "The card could not be deleted")
              }
            >
              Delete card
            </Button>
          </Group>
        </Stack>
      ) : (
        <form onSubmit={submit}>
          <Stack gap="md">
            <TextInput
              label="Label"
              withAsterisk
              data-autofocus
              value={label}
              onChange={(e) => setLabel(e.currentTarget.value)}
            />
            <TextInput
              label="Destination URL"
              placeholder="https://"
              type="url"
              withAsterisk
              value={url}
              onChange={(e) => setUrl(e.currentTarget.value)}
              onBlur={() => setTouched(true)}
              error={
                touched && !urlValid
                  ? "Enter a full address starting with http:// or https://"
                  : undefined
              }
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
            <Group justify={card ? "space-between" : "flex-end"}>
              {card && (
                <Button
                  variant="default"
                  c="error"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => setConfirming(true)}
                  disabled={busy}
                >
                  Delete card
                </Button>
              )}
              <Button type="submit" disabled={!ready} loading={busy}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}

// Mounted only while open, so every opening starts with fresh state.
export function CardModal({ opened, card, ...rest }: Props) {
  if (!opened) return null;
  return <CardModalContent key={card?.id ?? "new"} card={card} {...rest} />;
}
