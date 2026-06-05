import { withBasePath } from "./config/assetPaths";

export const assets = {
  puzzleGrove: {
    id: "grove-path",
    src: withBasePath("assets/puzzle-grove.png"),
    alt: "Moonlit enchanted grove with a path, cottage, tower, and fireflies"
  },
  menuGrove: withBasePath("assets/menu-grove.png"),
  mainLoopBackground: withBasePath("assets/main-loop-background.png"),
  uiSkinTexture: withBasePath("assets/ui-skin-texture.png"),
  referenceMedallion: withBasePath("assets/reference-medallion.png"),
  referenceZoomFrame: withBasePath("assets/reference-zoom-frame.png"),
  groveTexture: withBasePath("assets/grove-texture.png"),
  brandLogo: withBasePath("brand/arcane-rings-logo.svg"),
  uiIcons: {
    reference: withBasePath("assets/ui/puzzle-icon-reference.png"),
    undo: withBasePath("assets/ui/puzzle-icon-undo.png"),
    hint: withBasePath("assets/ui/puzzle-icon-hint.png"),
    restart: withBasePath("assets/ui/puzzle-icon-restart.png"),
    settings: withBasePath("assets/ui/puzzle-icon-settings.png"),
    close: withBasePath("assets/ui/puzzle-icon-close.png")
  }
} as const;
