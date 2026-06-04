import { CalendarDays, Gauge, Images, Play, Settings } from "lucide-react";

import { IconButton } from "../components/IconButton";

type MainMenuProps = {
  onPlay: () => void;
  onDaily: () => void;
  dailyDisabled?: boolean;
  onDifficulty: () => void;
  onCollection: () => void;
  onSettings: () => void;
};

export function MainMenu({
  onPlay,
  onDaily,
  dailyDisabled = false,
  onDifficulty,
  onCollection,
  onSettings,
}: MainMenuProps) {
  return (
    <main className="menu-screen">
      <div className="ring-sigil" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <section className="menu-panel" aria-labelledby="main-title">
        <p className="menu-kicker">Moonlit ring puzzle</p>
        <h1 id="main-title">Arcane Rings</h1>
        <div className="menu-actions" aria-label="Main menu actions">
          <IconButton icon={Play} label="Play" text="Play" variant="primary" onClick={onPlay} />
          <IconButton
            icon={CalendarDays}
            label="Daily puzzle"
            text="Daily puzzle"
            onClick={onDaily}
            disabled={dailyDisabled}
          />
          <IconButton icon={Gauge} label="Difficulty selection" text="Difficulty" onClick={onDifficulty} />
          <IconButton icon={Images} label="Image collection" text="Image collection" onClick={onCollection} />
          <IconButton icon={Settings} label="Settings" text="Settings" onClick={onSettings} />
        </div>
      </section>
    </main>
  );
}
