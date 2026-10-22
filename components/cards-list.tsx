"use client";

import { useEffect, useState } from "react";
import { Button, Loader, Text, Title } from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconCopy, IconPencil, IconPlus } from "@tabler/icons-react";
import {
  addCard,
  deleteCard,
  listCards,
  shortLink,
  updateCard,
  type Card,
  type CardInput,
} from "@/lib/cards";
import { CardModal } from "./card-modal";
import classes from "./cards-list.module.css";

function CopyButton({ code }: { code: string }) {
  const clipboard = useClipboard({ timeout: 2000 });
  return (
    <Button
      variant="subtle"
      size="compact-sm"
      leftSection={
        clipboard.copied ? <IconCheck size={16} /> : <IconCopy size={16} />
      }
      onClick={() => clipboard.copy(shortLink(code))}
    >
      {clipboard.copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function CardsList() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ card: Card | null } | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let cancelled = false;
    listCards()
      .then((list) => {
        if (cancelled) return;
        setCards(list);
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

  async function save(input: CardInput) {
    const editing = modal?.card;
    if (editing) {
      await updateCard(editing.id, input);
      notifications.show({ message: "Card saved" });
    } else {
      const created = await addCard(input);
      // Automatic: the short link is copied so the only manual step left is
      // writing it to the chip. Browsers can refuse, so failure is reported.
      try {
        await navigator.clipboard.writeText(shortLink(created.code));
        notifications.show({ message: "Card added. Short link copied" });
      } catch {
        notifications.show({
          message: "Card added. Copy its short link from the list",
        });
      }
    }
    setModal(null);
    reload();
  }

  async function remove(card: Card) {
    await deleteCard(card.id);
    notifications.show({ message: "Card deleted" });
    setModal(null);
    reload();
  }

  return (
    <>
      <div className={classes.top}>
        <Title order={1}>Cards</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setModal({ card: null })}
        >
          Add card
        </Button>
      </div>

      {error ? (
        <div className={classes.state}>
          <Text role="alert" c="error">
            Cards could not be loaded: {error}
          </Text>
          <Button variant="default" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : cards === null ? (
        <div className={classes.state}>
          <Loader size="sm" />
          <Text c="dimmed">Loading cards</Text>
        </div>
      ) : cards.length === 0 ? (
        <div className={classes.state}>
          <Text>No cards yet</Text>
        </div>
      ) : (
        <div>
          {cards.map((card) => (
            <div key={card.id} className={classes.row}>
              <div className={classes.main}>
                <div className={classes.label}>{card.label}</div>
                <div className={classes.destination}>
                  {card.destination_url}
                </div>
              </div>
              <div className={classes.link}>
                <div className={classes.shortLink}>
                  <span>{shortLink(card.code)}</span>
                  <CopyButton code={card.code} />
                </div>
              </div>
              <div className={classes.meta}>
                <span className={classes.taps}>
                  {card.tap_count} {card.tap_count === 1 ? "tap" : "taps"}
                </span>
                <Button
                  variant="default"
                  size="compact-sm"
                  leftSection={<IconPencil size={16} />}
                  onClick={() => setModal({ card })}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CardModal
        opened={modal !== null}
        card={modal?.card ?? null}
        onClose={() => setModal(null)}
        onSave={save}
        onDelete={remove}
      />
    </>
  );
}
