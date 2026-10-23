'use client';

// Client component: AppShell.Header and AppShell.Main (dot-notation Mantine
// components) are undefined inside a server component and break the build.
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell, Image } from "@mantine/core";
import {
  IconCreditCard,
  IconLayoutDashboard,
  IconPackage,
  IconUsers,
} from "@tabler/icons-react";
import { ProfileMenu } from "@/components/profile-menu";
import classes from "@/components/layout-shell.module.css";

// Layout shell: the header is fixed and every page renders inside it. On
// mobile the links move from the header to a bottom tab bar (ux-ui-guidelines
// placement conventions); on desktop they stay in the header.
const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/cards", label: "Cards", icon: IconCreditCard },
  { href: "/stock", label: "Stock", icon: IconPackage },
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
          <Link href="/dashboard" className={classes.wordmark}>
            {/* Decorative: the wordmark beside it carries the name. The logo
                swaps files by color scheme because the light-mode blue is too
                dark on the dark page. */}
            <Image
              src="/clinks_logo.svg"
              alt=""
              className={classes.logo}
              darkHidden
            />
            <Image
              src="/clinks_logo_dark.svg"
              alt=""
              className={classes.logo}
              lightHidden
            />
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
