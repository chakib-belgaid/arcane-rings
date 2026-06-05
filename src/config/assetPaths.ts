const basePath = import.meta.env.BASE_URL || "/";

export function withBasePath(path: string) {
  const normalizedBase = basePath.endsWith("/") ? basePath : `${basePath}/`;
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}${normalizedPath}`;
}

function cssUrl(path: string) {
  return `url("${withBasePath(path)}")`;
}

const assetCssVariables: Record<string, string> = {
  "--asset-loop-bg": cssUrl("assets/main-loop-background.png"),
  "--asset-ui-skin": cssUrl("assets/ui-skin-texture.png"),
  "--asset-menu-grove": cssUrl("assets/menu-grove.png"),
  "--asset-grove-texture": cssUrl("assets/grove-texture.png"),
  "--asset-volume-rail": cssUrl("assets/ui/volume-rail.png"),
  "--asset-volume-thumb": cssUrl("assets/ui/volume-thumb.png"),
};

export function applyAssetCssVariables(target: HTMLElement = document.documentElement) {
  for (const [name, value] of Object.entries(assetCssVariables)) {
    target.style.setProperty(name, value);
  }
}
