import type { OnekoOptions } from "@/lib/oneko/vanilla";
import type { OnekoSkin } from "@/lib/oneko/skins";

export interface Settings {
  enabled: boolean;
  skin: OnekoSkin;
  scale: number;
  meow: boolean;
  laserPointer: boolean;
  pettable: boolean;
  disabledHosts: string[];
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  skin: "classic",
  scale: 1,
  meow: false,
  laserPointer: false,
  pettable: true,
  disabledHosts: [],
};

const KEY = "settings";

export async function readSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[KEY] as Partial<Settings> | undefined) };
}

export function writeSettings(settings: Settings): Promise<void> {
  return chrome.storage.sync.set({ [KEY]: settings });
}

export function onSettingsChange(callback: (settings: Settings) => void): void {
  chrome.storage.sync.onChanged.addListener((changes) => {
    if (changes[KEY]) callback({ ...DEFAULT_SETTINGS, ...changes[KEY].newValue });
  });
}

export function isActiveOn(settings: Settings, host: string): boolean {
  return settings.enabled && !settings.disabledHosts.includes(host);
}

export function toOptions({ skin, scale, meow, laserPointer, pettable }: Settings): OnekoOptions {
  return { skin, scale, meow, laserPointer, pettable };
}
