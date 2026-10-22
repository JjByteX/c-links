// Design tokens. Every visual value used in more than one place is defined
// here once and referenced everywhere else (ux-ui-guidelines.md).
//
// Colors come from Radix Colors 3.0.0: Slate (neutrals), Indigo (accent),
// Red and Green (states). The comment on each value is its Radix step.
// Roles follow the 60/30/10 rule: page is the 60, surface is the 30,
// accent is the 10.

export const colorTokens = {
  light: {
    page: "#fcfcfd", // slate-1
    surface: "#f9f9fb", // slate-2
    hover: "#f0f0f3", // slate-3
    border: "#d9d9e0", // slate-6
    text: "#1c2024", // slate-12
    textMuted: "#60646c", // slate-11
    accent: "#3e63dd", // indigo-9
    accentHover: "#3358d4", // indigo-10
    accentText: "#3a5bc7", // indigo-11
    accentTint: "#edf2fe", // indigo-3
    onAccent: "#ffffff",
    brand: "#19437d", // the logo blue, used for the login brand panel
    onBrand: "#ffffff",
    onBrandMuted: "#c9d6ea", // 6.6 to 1 on brand
    errorText: "#ce2c31", // red-11
    errorTint: "#feebec", // red-3
    successText: "#218358", // green-11
    successTint: "#e6f6eb", // green-3
    disabledBackground: "#e8e8ec", // slate-4
    disabledText: "#8b8d98", // slate-9
    shadowFloating: "0 8px 24px rgba(28, 32, 36, 0.12)",
  },
  dark: {
    page: "#111113", // slate-1
    surface: "#18191b", // slate-2
    hover: "#212225", // slate-3
    border: "#363a3f", // slate-6
    text: "#edeef0", // slate-12
    textMuted: "#b0b4ba", // slate-11
    accent: "#3e63dd", // indigo-9
    accentHover: "#5472e4", // indigo-10
    accentText: "#9eb1ff", // indigo-11
    accentTint: "#182449", // indigo-3
    onAccent: "#ffffff",
    brand: "#12335c", // logo blue, one step deeper for the dark page
    onBrand: "#ffffff",
    onBrandMuted: "#c9d6ea",
    errorText: "#ff9592", // red-11
    errorTint: "#3b1219", // red-3
    successText: "#3dd68c", // green-11
    successTint: "#132d21", // green-3
    disabledBackground: "#272a2d", // slate-4
    disabledText: "#696e77", // slate-9
    shadowFloating: "0 8px 24px rgba(0, 0, 0, 0.5)",
  },
} as const;

// Shared by both color schemes. Spacing sits on the 8px grid, with 4px for
// tight spaces only. Padding tokens follow the table in ux-ui-guidelines.md.
export const sizeTokens = {
  // Typography: three sizes and two weights only.
  fontSizeSmall: "14px",
  fontSizeBody: "16px",
  fontSizeHeading: "32px",
  lineHeightBody: "1.5",
  lineHeightHeading: "1.25",
  fontWeightRegular: "400",
  fontWeightSemibold: "600",

  // Radius: two values only.
  radiusDefault: "8px",
  radiusLarge: "16px",

  // Spacing scale.
  spaceTight: "4px",
  space1: "8px",
  space2: "16px",
  space3: "24px",
  space4: "32px",
  space5: "40px",
  space6: "48px",
  space7: "64px",
  space8: "80px",
  space9: "96px",

  // Padding.
  paddingControl: "8px 16px",
  paddingControlCompact: "8px", // horizontal only, compact buttons in list rows
  paddingCell: "16px",
  paddingMenu: "8px",
  paddingCard: "24px",
  paddingModal: "32px",
  paddingHeader: "0 24px",
  paddingPageDesktop: "32px",
  paddingPageMobile: "16px",

  // Component dimensions.
  headerHeight: "64px",
  tabBarHeight: "64px", // bottom tab bar on mobile
  controlHeight: "40px", // 8px + 24px line + 8px, matches paddingControl
  logoSize: "40px", // logo tile in the header, same height as a control
  logoSizeLarge: "64px", // logo tile in the login brand lockup
  contentMaxWidth: "960px",
  formMaxWidth: "480px", // sign-in form and modals
  dividerThickness: "1px",
} as const;
