"use client";

import { useState } from "react";
import {
  Button,
  Group,
  Modal,
  SegmentedControl,
  Select,
  Slider,
  Stack,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import {
  applyFont,
  fontOptions,
  readFont,
  saveFont,
  type FontValue,
} from "@/lib/font-family";
import {
  applyFontScale,
  FONT_SCALE_DEFAULT,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
  readFontScale,
  saveFontScale,
} from "@/lib/font-scale";

const appearances = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "System" },
];

type Props = {
  opened: boolean;
  onClose: () => void;
};

const marks = [
  { value: FONT_SCALE_MIN, label: `${FONT_SCALE_MIN}%` },
  { value: FONT_SCALE_DEFAULT, label: `${FONT_SCALE_DEFAULT}%` },
  { value: FONT_SCALE_MAX, label: `${FONT_SCALE_MAX}%` },
];

// The modal content mounts only while the modal is open, so the saved size
// is read from the browser when it opens.
function SettingsContent() {
  const [scale, setScale] = useState(readFontScale);
  const [font, setFont] = useState<FontValue>(readFont);
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  function change(value: number) {
    setScale(value);
    applyFontScale(value);
    saveFontScale(value);
  }

  function changeFont(value: FontValue) {
    setFont(value);
    applyFont(value);
    saveFont(value);
  }

  return (
    <Stack gap="md">
      <Stack gap="sm">
        <Text fw={600}>Appearance</Text>
        <SegmentedControl
          fullWidth
          aria-label="Appearance"
          data={appearances}
          value={colorScheme}
          onChange={(value) => setColorScheme(value as typeof colorScheme)}
        />
      </Stack>
      <Select
        label="Font"
        data={fontOptions.map(({ value, label }) => ({ value, label }))}
        value={font}
        onChange={(value) => {
          if (value) changeFont(value as FontValue);
        }}
        allowDeselect={false}
        checkIconPosition="right"
        styles={{
          dropdown: { padding: "var(--padding-menu)" },
          option: { padding: "var(--padding-control)" },
        }}
      />
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>Text size</Text>
          <Text c="dimmed">{scale}%</Text>
        </Group>
        <Slider
          aria-label="Text size"
          min={FONT_SCALE_MIN}
          max={FONT_SCALE_MAX}
          step={FONT_SCALE_STEP}
          marks={marks}
          label={(value) => `${value}%`}
          value={scale}
          onChange={change}
        />
      </Stack>
      <Group>
        <Button
          variant="default"
          disabled={
            scale === FONT_SCALE_DEFAULT &&
            font === "default" &&
            colorScheme === "auto"
          }
          onClick={() => {
            change(FONT_SCALE_DEFAULT);
            changeFont("default");
            setColorScheme("auto");
          }}
        >
          Reset to default
        </Button>
      </Group>
    </Stack>
  );
}

export function SettingsModal({ opened, onClose }: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="lg"
      padding="var(--padding-modal)"
      size="var(--form-max-width)"
      title="Settings"
    >
      <SettingsContent />
    </Modal>
  );
}
