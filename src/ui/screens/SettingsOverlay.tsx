import { RotateCcw, Trash2, Volume2, Waves } from "lucide-react";
import { useId, useState } from "react";

import { IconButton } from "../components/IconButton";
import { ModalShell } from "../components/ModalShell";

type SettingsOverlayProps = {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onResetProgress: () => void;
  onClose: () => void;
  variant: "menu" | "puzzle";
};

export type AppSettings = {
  reducedMotion: boolean;
  soundEffects: boolean;
  haptics: boolean;
  referenceDefault: boolean;
  highContrastBorders: boolean;
  colorblindCoupling: boolean;
};

export const defaultAppSettings: AppSettings = {
  reducedMotion: false,
  soundEffects: true,
  haptics: true,
  referenceDefault: true,
  highContrastBorders: false,
  colorblindCoupling: true,
};

export function SettingsOverlay({
  settings,
  onSettingsChange,
  onResetProgress,
  onClose,
  variant,
}: SettingsOverlayProps) {
  const id = useId();
  const [status, setStatus] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const setBoolean = (key: keyof typeof settings) => (value: boolean) => {
    onSettingsChange({ ...settings, [key]: value });
    setConfirmReset(false);
  };

  const previewSound = () => {
    setConfirmReset(false);
    setStatus(settings.soundEffects ? "Sound preview played" : "Sound effects are off");
  };

  const previewHaptics = () => {
    setConfirmReset(false);
    if (settings.haptics) {
      window.navigator.vibrate?.(20);
    }
    setStatus(settings.haptics ? "Haptic preview sent" : "Haptic feedback is off");
  };

  const restoreDefaults = () => {
    onSettingsChange(defaultAppSettings);
    setConfirmReset(false);
    setStatus("Defaults restored");
  };

  const resetProgress = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setStatus("Press confirm reset to clear progress");
      return;
    }

    onResetProgress();
    setConfirmReset(false);
    setStatus("Progress reset");
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
      <p className="settings-status" role="status" aria-live="polite">
        {status}
      </p>
      <footer className="settings-actions">
        <IconButton icon={Volume2} label="Preview sound effects" onClick={previewSound} />
        <IconButton icon={Waves} label="Preview haptic feedback" onClick={previewHaptics} />
        <IconButton icon={RotateCcw} label="Restore defaults" onClick={restoreDefaults} />
        <IconButton
          icon={Trash2}
          label={confirmReset ? "Confirm reset" : "Reset progress"}
          text={confirmReset ? "Confirm reset" : "Reset progress"}
          variant="danger"
          onClick={resetProgress}
        />
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
    <label className="toggle-row" data-checked={checked ? "true" : "false"} htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
    </label>
  );
}
