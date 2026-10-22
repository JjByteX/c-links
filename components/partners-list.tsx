"use client";

import { useEffect, useState } from "react";
import { Button, Loader, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import { addPartner, listPartners, type Partner } from "@/lib/partners";
import { PartnerModal } from "./partner-modal";
import classes from "./cards-list.module.css";

export function PartnersList() {
  const [partners, setPartners] = useState<Partner[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  useEffect(() => {
    let cancelled = false;
    listPartners()
      .then((list) => {
        if (cancelled) return;
        setPartners(list);
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

  async function save(email: string, password: string) {
    await addPartner(email, password);
    notifications.show({ message: "Partner added" });
    setModalOpen(false);
    reload();
  }

  return (
    <>
      <div className={classes.top}>
        <Title order={1}>Partners</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setModalOpen(true)}
        >
          Add partner
        </Button>
      </div>

      {error ? (
        <div className={classes.state}>
          <Text role="alert" c="error">
            Partners could not be loaded: {error}
          </Text>
          <Button variant="default" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : partners === null ? (
        <div className={classes.state}>
          <Loader size="sm" />
          <Text c="dimmed">Loading partners</Text>
        </div>
      ) : partners.length === 0 ? (
        <div className={classes.state}>
          <Text>No partners yet</Text>
        </div>
      ) : (
        <div>
          {partners.map((partner) => (
            <div key={partner.id} className={classes.row}>
              <div className={classes.main}>
                <div className={classes.label}>{partner.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PartnerModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={save}
      />
    </>
  );
}
