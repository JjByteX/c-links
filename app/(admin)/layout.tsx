'use client';

// Client component: AppShell.Header and AppShell.Main (dot-notation Mantine
// components) are undefined inside a server component and break the build.
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell } from "@mantine/core";
import { IconCreditCard, IconUsers } from "@tabler/icons-react";
import { ProfileMenu } from "@/components/profile-menu";
import classes from "@/components/layout-shell.module.css";

// Layout shell: the header is fixed and every page renders inside it. On
// mobile the links move from the header to a bottom tab bar (ux-ui-guidelines
// placement conventions); on desktop they stay in the header.
const navLinks = [
  { href: "/cards", label: "Cards", icon: IconCreditCard },
  { href: "/partners", label: "Partners", icon: IconUsers },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <AppShell
      header={{ height: "var(--header-height)" }}
      footer={{ height: { base: "var(--tab-bar-height)", sm: 0 } }}
    >
      <AppShell.Header>
        <div className={classes.header}>
          <Link href="/cards" className={classes.wordmark}>
            C-Links
          </Link>
          <nav className={classes.nav}>
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname.startsWith(href) ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <ProfileMenu />
        </div>
      </AppShell.Header>
      <AppShell.Main>
        <div className={classes.content}>{children}</div>
      </AppShell.Main>
      <AppShell.Footer hiddenFrom="sm">
        <nav className={classes.tabBar}>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={classes.tab}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
            >
              <Icon size={24} />
              {label}
            </Link>
          ))}
        </nav>
      </AppShell.Footer>
    </AppShell>
  );
}
