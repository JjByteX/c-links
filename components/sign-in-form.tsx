"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { createClient } from "@/lib/supabase/client";
import classes from "./layout-shell.module.css";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ready = email.trim() !== "" && password !== "";
  // Names what is still missing while Sign in is disabled.
  const missing = [
    email.trim() === "" && "Email",
    password === "" && "Password",
  ].filter(Boolean);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setError(
        error.code === "invalid_credentials"
          ? "Email or password is incorrect"
          : `Sign in failed: ${error.message}`,
      );
      setLoading(false);
      return;
    }
    router.replace("/cards");
    router.refresh();
  }

  return (
    <main className={classes.centered}>
      <form onSubmit={submit} className={classes.form}>
        <Stack gap="sm">
          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            withAsterisk
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            withAsterisk
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
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
          <Button type="submit" fullWidth disabled={!ready} loading={loading}>
            Sign in
          </Button>
        </Stack>
      </form>
    </main>
  );
}
