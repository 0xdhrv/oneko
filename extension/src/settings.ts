import type { OnekoOptions } from "@/lib/oneko/vanilla";
import { isOnekoSkin, type OnekoSkin } from "@/lib/oneko/skins";

export interface Settings {
  enabled: boolean;
  skin: OnekoSkin;
  scale: number;
  meow: boolean;
  thoughts: boolean;
  laserPointer: boolean;
  pettable: boolean;
  disabledHosts: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  skin: "classic",
  scale: 1,
  meow: false,
  thoughts: true,
  laserPointer: false,
  pettable: true,
  disabledHosts: [],
};

const KEY = "settings";

/** Keep each stored value only when it has the right type; anything else uses the default. */
export function parseSettings(value: unknown): Settings {
  const stored: Record<string, unknown> =
    value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const flag = (key: "enabled" | "meow" | "thoughts" | "laserPointer" | "pettable") =>
    typeof stored[key] === "boolean" ? stored[key] : DEFAULT_SETTINGS[key];
  const { scale, skin, disabledHosts } = stored;
  return {
    enabled: flag("enabled"),
    skin: isOnekoSkin(skin) ? skin : DEFAULT_SETTINGS.skin,
    scale:
      typeof scale === "number" && Number.isFinite(scale) && scale > 0
        ? scale
        : DEFAULT_SETTINGS.scale,
    meow: flag("meow"),
    thoughts: flag("thoughts"),
    laserPointer: flag("laserPointer"),
    pettable: flag("pettable"),
    disabledHosts: Array.isArray(disabledHosts)
      ? disabledHosts.filter((host): host is string => typeof host === "string")
      : DEFAULT_SETTINGS.disabledHosts,
  };
}

export async function readSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(KEY);
  return parseSettings(stored[KEY]);
}

export function writeSettings(settings: Settings): Promise<void> {
  return chrome.storage.sync.set({ [KEY]: settings });
}

export function onSettingsChange(callback: (settings: Settings) => void): void {
  chrome.storage.sync.onChanged.addListener((changes) => {
    if (changes[KEY]) callback(parseSettings(changes[KEY].newValue));
  });
}

export function isActiveOn(settings: Settings, host: string): boolean {
  return settings.enabled && !settings.disabledHosts.includes(host);
}

export function toOptions({
  skin,
  scale,
  meow,
  thoughts,
  laserPointer,
  pettable,
}: Settings): OnekoOptions {
  return { skin, scale, meow, bubbleEnabled: thoughts, laserPointer, pettable };
}
