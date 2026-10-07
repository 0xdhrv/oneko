import {
  isSavedSprite,
  MAX_SPRITE_BYTES,
  MAX_THOUGHT_TEXT_LENGTH,
  validateThoughts,
} from "./custom-assets";
import {
  DEFAULT_ONEKO_PLAYGROUND_STATE,
  SETTING_RANGES,
  type OnekoPlaygroundState,
} from "./playground-defaults";
import { isOnekoSkin } from "./skins";

export type ConfigurationV1 = {
  version: 1;
  settings: OnekoPlaygroundState;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const MAX_CONFIGURATION_BYTES = 512 * 1024;
export const MAX_SHARE_URL_LENGTH = 8192;
const SHARE_PREFIX = "#oneko=";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function fail(error: string): Result<never> {
  return { ok: false, error };
}

export function parseConfiguration(raw: string): Result<ConfigurationV1> {
  if (raw.length > MAX_CONFIGURATION_BYTES)
    return fail("Choose a configuration smaller than 512 KB.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fail("This file is not valid JSON. Choose a downloaded Oneko configuration.");
  }
  if (!isRecord(parsed)) return fail("The configuration must be a JSON object.");
  if (parsed.version !== 1)
    return fail("This configuration version is not supported. Expected version 1.");
  const extra = Object.keys(parsed).find((key) => key !== "version" && key !== "settings");
  if (extra !== undefined) return fail(`Unknown configuration field: ${JSON.stringify(extra)}.`);
  if (!isRecord(parsed.settings)) return fail("The configuration is missing its settings object.");
  const settings = parsed.settings;
  const keys = Object.keys(DEFAULT_ONEKO_PLAYGROUND_STATE) as (keyof OnekoPlaygroundState)[];
  const unknown = Object.keys(settings).find(
    (key) => !Object.hasOwn(DEFAULT_ONEKO_PLAYGROUND_STATE, key),
  );
  if (unknown !== undefined) return fail(`Unknown setting: ${JSON.stringify(unknown)}.`);

  for (const key of keys) {
    if (!Object.hasOwn(settings, key)) return fail(`Missing setting: ${key}.`);
    const value = settings[key];
    if (key === "skin") {
      if (!isOnekoSkin(value)) return fail("skin must name an available Oneko coat.");
    } else if (key === "bubblePlacement") {
      if (value !== "auto" && value !== "above" && value !== "below")
        return fail("bubblePlacement must be auto, above, or below.");
    } else if (key === "spriteSrc") {
      if (value !== "" && !isSavedSprite(value))
        return fail("spriteSrc must be an embedded 256 × 128 PNG smaller than 256 KB, or empty.");
      if (typeof value === "string" && value) {
        try {
          if (atob(value.slice(22)).length > MAX_SPRITE_BYTES)
            return fail("spriteSrc must be smaller than 256 KB.");
        } catch {
          return fail("spriteSrc contains invalid PNG data.");
        }
      }
    } else if (key === "spriteName") {
      if (typeof value !== "string" || value.length > 255 || value.includes("\0"))
        return fail("spriteName must be text of up to 255 characters.");
    } else if (key === "bubbleText") {
      if (
        typeof value !== "string" ||
        value.length > MAX_THOUGHT_TEXT_LENGTH ||
        value.includes("\0")
      )
        return fail("bubbleText must contain up to 50 thoughts of 120 characters each.");
      try {
        validateThoughts(value);
      } catch (error) {
        return fail(error instanceof Error ? error.message : "The thoughts could not be read.");
      }
    } else if (Object.hasOwn(SETTING_RANGES, key)) {
      const [min, max] = SETTING_RANGES[key as keyof typeof SETTING_RANGES];
      if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max)
        return fail(`${key} must be a number between ${min} and ${max}.`);
    } else if (typeof value !== "boolean") {
      return fail(`${key} must be true or false.`);
    }
  }

  return { ok: true, value: { version: 1, settings: settings as OnekoPlaygroundState } };
}

export function serializeConfiguration(settings: OnekoPlaygroundState): string {
  return JSON.stringify({ version: 1, settings }, null, 2);
}

export function createShareURL(base: string, settings: OnekoPlaygroundState): Result<string> {
  if (settings.spriteSrc)
    return fail(
      "Custom artwork travels in a configuration file. Download your configuration to share this cat.",
    );
  const bytes = new TextEncoder().encode(JSON.stringify({ version: 1, settings }));
  const encoded = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const url = new URL("/studio", base);
  url.hash = `${SHARE_PREFIX}${encoded}`;
  if (url.href.length > MAX_SHARE_URL_LENGTH)
    return fail(
      "These settings are too large for a share link. Download your configuration to keep every thought.",
    );
  return { ok: true, value: url.href };
}

export function parseShareFragment(fragment: string): Result<ConfigurationV1 | null> {
  if (!fragment.startsWith(SHARE_PREFIX)) return { ok: true, value: null };
  if (fragment.length > MAX_SHARE_URL_LENGTH)
    return fail("This share link is too large. Ask for the downloaded configuration instead.");
  const encoded = fragment.slice(SHARE_PREFIX.length);
  if (!encoded || !/^[A-Za-z0-9_-]+$/.test(encoded))
    return fail("This share link is incomplete or damaged.");
  try {
    const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    const text = new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    );
    const result = parseConfiguration(text);
    if (result.ok && result.value.settings.spriteSrc)
      return fail(
        "Custom artwork needs a configuration file. Import the downloaded configuration instead.",
      );
    return result;
  } catch {
    return fail("This share link is incomplete or damaged.");
  }
}

export async function readConfiguration(file: File): Promise<Result<ConfigurationV1>> {
  if (file.size > MAX_CONFIGURATION_BYTES)
    return fail("Choose a configuration smaller than 512 KB.");
  let raw: string;
  try {
    raw = await file.text();
  } catch {
    return fail("This file could not be read. Try choosing it again.");
  }
  const result = parseConfiguration(raw);
  if (!result.ok || !result.value.settings.spriteSrc) return result;
  const image = new Image();
  image.src = result.value.settings.spriteSrc;
  try {
    await image.decode();
  } catch {
    return fail(
      "The custom PNG could not be opened. Export the sprite sheet again before sharing it.",
    );
  }
  return result;
}
