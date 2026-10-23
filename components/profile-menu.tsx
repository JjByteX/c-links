"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionIcon, Menu } from "@mantine/core";
import {
  IconHistory,
  IconLogout,
  IconSettings,
  IconUserCircle,
} from "@tabler/icons-react";
import { logEvent } from "@/lib/activity";
import { createClient } from "@/lib/supabase/client";
import { SettingsModal } from "./settings-modal";

export function ProfileMenu() {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function signOut() {
    // Logged first: the entry needs the session that is about to end.
    await logEvent("sign_out");
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
    <Menu
      position="bottom-end"
      styles={{
        dropdown: { padding: "var(--padding-menu)" },
        item: { padding: "var(--padding-control)" },
      }}
    >
      <Menu.Target>
        <ActionIcon
          variant="default"
          size="lg"
          aria-label="Profile"
        >
          <IconUserCircle />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          component={Link}
          href="/activity"
          leftSection={<IconHistory size={16} />}
        >
          Activity
        </Menu.Item>
        <Menu.Item
          leftSection={<IconSettings size={16} />}
          onClick={() => setSettingsOpen(true)}
        >
          Settings
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<IconLogout size={16} />} onClick={signOut}>
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
    <SettingsModal
      opened={settingsOpen}
      onClose={() => setSettingsOpen(false)}
    />
    </>
  );
}
