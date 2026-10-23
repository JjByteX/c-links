"use client";

import { useState } from "react";
import { Button, Group, Modal, Slider, Stack, Text } from "@mantine/core";
import {
  applyFontScale,
  FONT_SCALE_DEFAULT,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  FONT_SCALE_STEP,
  readFontScale,
  saveFontScale,
} from "@/lib/font-scale";

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

  function change(value: number) {
    setScale(value);
    applyFontScale(value);
    saveFontScale(value);
  }

  return (
    <Stack gap="md">
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
          disabled={scale === FONT_SCALE_DEFAULT}
          onClick={() => change(FONT_SCALE_DEFAULT)}
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
