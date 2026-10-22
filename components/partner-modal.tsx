"use client";

import { useState, type FormEvent } from "react";
import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";

type Props = {
  opened: boolean;
  onClose: () => void;
  onSave: (email: string, password: string) => Promise<void>;
};

// Add-only: partners are not edited or deleted here. The admin sets the
// initial password; the partner can change it after signing in.
function PartnerModalContent({ onClose, onSave }: Omit<Props, "opened">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /\S+@\S+\.\S+/.test(email.trim());
  const ready = emailValid && password.length >= 6;
  // Names what is still missing while Save is disabled.
  const missing = [
    !emailValid && "Email",
    password.length < 6 && "Password",
  ].filter(Boolean);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      await onSave(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unknown error");
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
      title="Add partner"
    >
      <form onSubmit={submit}>
        <Stack gap="md">
          <TextInput
            label="Email"
            type="email"
            withAsterisk
            data-autofocus
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <TextInput
            label="Password"
            type="password"
            withAsterisk
            description="The partner can change this after signing in"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            error={
              password.length > 0 && password.length < 6
                ? "At least 6 characters"
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

export function PartnerModal({ opened, ...rest }: Props) {
  if (!opened) return null;
  return <PartnerModalContent {...rest} />;
}
