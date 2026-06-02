import { RotateCcw, Trash2, Volume2, Waves } from "lucide-react";
import { useId, useState } from "react";

import { IconButton } from "../components/IconButton";
import { ModalShell } from "../components/ModalShell";

type SettingsOverlayProps = {
  onClose: () => void;
  variant: "menu" | "puzzle";
};

export function SettingsOverlay({ onClose, variant }: SettingsOverlayProps) {
  const id = useId();
  const [settings, setSettings] = useState({
    reducedMotion: false,
    soundEffects: true,
    music: false,
    haptics: true,
    referenceDefault: true,
    highContrastBorders: false,
    colorblindCoupling: true,
  });

  const setBoolean = (key: keyof typeof settings) => (value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  return (
    <ModalShell title="Settings" closeLabel="Close settings" onClose={onClose}>
      <div className="settings-grid" data-overlay-scope={variant}>
        <Toggle
          id={`${id}-motion`}
          label="Reduced motion"
          checked={settings.reducedMotion}
          onChange={setBoolean("reducedMotion")}
        />
        <Toggle
          id={`${id}-sfx`}
          label="Sound effects"
          checked={settings.soundEffects}
          onChange={setBoolean("soundEffects")}
        />
        <Toggle id={`${id}-music`} label="Music" checked={settings.music} onChange={setBoolean("music")} />
        <Toggle
          id={`${id}-haptics`}
          label="Haptic feedback"
          checked={settings.haptics}
          onChange={setBoolean("haptics")}
        />
        <Toggle
          id={`${id}-reference`}
          label="Reference thumbnail default"
          checked={settings.referenceDefault}
          onChange={setBoolean("referenceDefault")}
        />
        <Toggle
          id={`${id}-contrast`}
          label="High contrast ring borders"
          checked={settings.highContrastBorders}
          onChange={setBoolean("highContrastBorders")}
        />
        <Toggle
          id={`${id}-colorblind`}
          label="Colorblind-friendly coupling signs"
          checked={settings.colorblindCoupling}
          onChange={setBoolean("colorblindCoupling")}
        />
      </div>
      <footer className="settings-actions">
        <IconButton icon={Volume2} label="Preview sound effects" />
        <IconButton icon={Waves} label="Preview haptic feedback" />
        <IconButton icon={RotateCcw} label="Restore defaults" />
        <IconButton icon={Trash2} label="Reset progress" text="Reset progress" variant="danger" />
      </footer>
    </ModalShell>
  );
}

type ToggleProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function Toggle({ id, label, checked, onChange }: ToggleProps) {
  return (
    <label className="toggle-row" htmlFor={id}>
      <span>{label}</span>
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} />
    </label>
  );
}
