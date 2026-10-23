"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Group, Loader, Modal, Stack, Text } from "@mantine/core";
import { shortLink, type Card } from "@/lib/cards";
import { logEvent } from "@/lib/activity";
import { chipErrorMessage, writeChip } from "@/lib/nfc";

type Props = {
  card: Card | null; // null = closed
  onClose: () => void;
  onDone: () => void;
};

// Opening the modal starts the write, so the one click on "Write chip" is
// the only manual step. Web NFC needs that click for its permission prompt.
// Success closes the modal (the caller shows the confirmation).
function WriteChipModalContent({
  card,
  onClose,
  onDone,
}: Omit<Props, "card"> & { card: Card }) {
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // The write must not restart when the parent re-renders, so the latest
  // onDone is read from a ref instead of being an effect dependency.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const controller = new AbortController();
    writeChip(shortLink(card.code), controller.signal)
      .then(() => {
        void logEvent("chip_written", card.id);
        onDoneRef.current();
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(chipErrorMessage(e));
      });
    return () => controller.abort();
  }, [card.code, card.id, attempt]);

  const retry = () => {
    setError(null);
    setAttempt((n) => n + 1);
  };

  return (
    <Modal
      opened
      onClose={onClose}
      centered
      radius="lg"
      padding="var(--padding-modal)"
      size="var(--form-max-width)"
      title="Write chip"
    >
      <Stack gap="md">
        <Text fw={600}>{card.label}</Text>
        {error ? (
          <Text role="alert" size="sm" c="error">
            {error}
          </Text>
        ) : (
          <Group gap="sm">
            <Loader size="sm" />
            <Text c="dimmed">Hold the chip against the back of the phone</Text>
          </Group>
        )}
        <Group justify={error ? "space-between" : "flex-start"}>
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          {error && <Button onClick={retry}>Try again</Button>}
        </Group>
      </Stack>
    </Modal>
  );
}

// Mounted only while a card is chosen, so every opening starts a fresh write.
export function WriteChipModal({ card, ...rest }: Props) {
  if (!card) return null;
  return <WriteChipModalContent key={card.id} card={card} {...rest} />;
}
