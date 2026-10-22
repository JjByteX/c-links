"use client";

import type { ReactNode } from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { cssVariablesResolver, theme } from "@/theme/theme";

// Client wrapper: the theme and the CSS variables resolver cannot be passed
// from a server component. "auto" follows the device color scheme, and the
// profile menu override (open-questions #8) is added with the layout shell.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="auto"
    >
      <Notifications position="bottom-center" />
      {children}
    </MantineProvider>
  );
}
