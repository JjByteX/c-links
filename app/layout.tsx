import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Inter,
  Lora,
  Source_Serif_4,
  Source_Sans_3,
} from "next/font/google";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { Providers } from "@/components/providers";
import { fontScript } from "@/lib/font-family";
import { fontScaleScript } from "@/lib/font-scale";

// Weights are limited to 400 and 600 (ux-ui-guidelines.md). The default pair
// is preloaded. Inter and Lora are the other choices in the settings modal,
// so they load only when picked. The active family is set as --font-sans and
// --font-serif (lib/font-family.ts).
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source-serif",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-lora",
  display: "swap",
  preload: false,
});

// Tab title format is "Page | App". A page sets its own title.
export const metadata: Metadata = {
  title: { default: "C-Links", template: "%s | C-Links" },
  // Two files because the logo blue is too dark on a dark tab bar.
  icons: {
    icon: [
      {
        url: "/clinks_logo.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/clinks_logo_dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${inter.variable} ${lora.variable}`}
      {...mantineHtmlProps}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        <script dangerouslySetInnerHTML={{ __html: fontScaleScript }} />
        <script dangerouslySetInnerHTML={{ __html: fontScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
