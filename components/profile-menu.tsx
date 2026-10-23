"use client";

import { useRouter } from "next/navigation";
import { ActionIcon, Menu, useMantineColorScheme } from "@mantine/core";
import {
  IconCheck,
  IconDeviceDesktop,
  IconLogout,
  IconMoon,
  IconSun,
  IconUserCircle,
} from "@tabler/icons-react";
import { logEvent } from "@/lib/activity";
import { createClient } from "@/lib/supabase/client";

const appearances = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "auto", label: "System", icon: IconDeviceDesktop },
] as const;

export function ProfileMenu() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  async function signOut() {
    // Logged first: the entry needs the session that is about to end.
    await logEvent("sign_out");
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
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
        <Menu.Label>Appearance</Menu.Label>
        {appearances.map(({ value, label, icon: Icon }) => (
          <Menu.Item
            key={value}
            leftSection={<Icon size={16} />}
            rightSection={
              colorScheme === value ? <IconCheck size={16} /> : null
            }
            closeMenuOnClick={false}
            onClick={() => setColorScheme(value)}
          >
            {label}
          </Menu.Item>
        ))}
        <Menu.Divider />
        <Menu.Item leftSection={<IconLogout size={16} />} onClick={signOut}>
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
