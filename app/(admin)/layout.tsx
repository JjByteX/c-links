'use client';

// Client component: AppShell.Header and AppShell.Main (dot-notation Mantine
// components) are undefined inside a server component and break the build.
import type { ReactNode } from "react";
import Link from "next/link";
import { AppShell } from "@mantine/core";
import { ProfileMenu } from "@/components/profile-menu";
import classes from "@/components/layout-shell.module.css";

// Layout shell: the header is fixed and every page renders inside it.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell header={{ height: "var(--header-height)" }}>
      <AppShell.Header>
        <div className={classes.header}>
          <Link href="/cards" className={classes.wordmark}>
            C-Links
          </Link>
          <ProfileMenu />
        </div>
      </AppShell.Header>
      <AppShell.Main>
        <div className={classes.content}>{children}</div>
      </AppShell.Main>
    </AppShell>
  );
}
