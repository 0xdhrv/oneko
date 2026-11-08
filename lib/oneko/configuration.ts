import { isRemoteSprite, isSavedSprite, loadRemoteSprite } from "./custom-assets";
import { checkPlaygroundSettings, type OnekoPlaygroundState } from "./playground-defaults";

export type ConfigurationV1 = {
  version: 1;
  settings: OnekoPlaygroundState;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export const MAX_CONFIGURATION_BYTES = 1024 * 1024;
/** Browsers open far longer links than this, but chat apps start cutting them short here. */
export const LONG_SHARE_LINK = 2000;
const MAX_SHARE_FRAGMENT_LENGTH = 1024 * 1024;
/** Deflated, so drawn coats and recorded sounds fit. */
const SHARE_PREFIX = "#oneko2=";
/** Plain base64 links made before sharing custom art and sound. */
const LEGACY_SHARE_PREFIX = "#oneko=";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function fail(error: string): Result<never> {
  return { ok: false, error };
}

export function parseConfiguration(raw: string): Result<ConfigurationV1> {
  if (raw.length > MAX_CONFIGURATION_BYTES)
    return fail("Choose a configuration smaller than 1 MB.");
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
  const settings = checkPlaygroundSettings(parsed.settings);
  if (!settings.ok) return settings;
  return { ok: true, value: { version: 1, settings: settings.value } };
}

export function serializeConfiguration(settings: OnekoPlaygroundState): string {
  return JSON.stringify({ version: 1, settings }, null, 2);
}

function toBase64URL(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64URL(encoded: string): Uint8Array {
  const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function deflate(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Inflate without trusting the link: stop as soon as it outgrows any real configuration. */
async function inflate(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_CONFIGURATION_BYTES) {
      await reader.cancel();
      throw new Error("Shared configuration is too large.");
    }
    chunks.push(value);
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(
    await new Blob(chunks as BlobPart[]).arrayBuffer(),
  );
}

export async function createShareURL(
  base: string,
  settings: OnekoPlaygroundState,
): Promise<Result<string>> {
  const url = new URL("/studio", base);
  try {
    url.hash = `${SHARE_PREFIX}${toBase64URL(await deflate(JSON.stringify({ version: 1, settings })))}`;
  } catch {
    return fail("This browser can’t pack a share link. Download your configuration instead.");
  }
  return { ok: true, value: url.href };
}

export async function parseShareFragment(
  fragment: string,
): Promise<Result<ConfigurationV1 | null>> {
  const legacy = fragment.startsWith(LEGACY_SHARE_PREFIX);
  if (!legacy && !fragment.startsWith(SHARE_PREFIX)) return { ok: true, value: null };
  if (fragment.length > MAX_SHARE_FRAGMENT_LENGTH)
    return fail("This share link is too large. Ask for the downloaded configuration instead.");
  const encoded = fragment.slice((legacy ? LEGACY_SHARE_PREFIX : SHARE_PREFIX).length);
  if (!encoded || !/^[A-Za-z0-9_-]+$/.test(encoded))
    return fail("This share link is incomplete or damaged.");
  try {
    const bytes = fromBase64URL(encoded);
    const text = legacy
      ? new TextDecoder("utf-8", { fatal: true }).decode(bytes)
      : await inflate(bytes);
    const result = parseConfiguration(text);
    return result.ok ? await checkArtwork(result) : result;
  } catch {
    return fail("This share link is incomplete or damaged.");
  }
}

/** A sheet can pass every check and still fail to decode, which would leave the cat invisible. */
async function checkArtwork(
  result: Result<ConfigurationV1> & { ok: true },
): Promise<Result<ConfigurationV1>> {
  const { spriteSrc } = result.value.settings;
  // A hosted coat gets the same size check as /studio?sprite= and "Wear coat".
  if (isRemoteSprite(spriteSrc)) {
    try {
      await loadRemoteSprite(spriteSrc);
      return result;
    } catch (error) {
      return fail(error instanceof Error ? error.message : "The hosted coat could not be opened.");
    }
  }
  if (!isSavedSprite(spriteSrc)) return result;
  const image = new Image();
  image.src = spriteSrc;
  try {
    await image.decode();
    return result;
  } catch {
    return fail(
      "The custom PNG could not be opened. Export the sprite sheet again before sharing it.",
    );
  }
}

export async function readConfiguration(file: File): Promise<Result<ConfigurationV1>> {
  if (file.size > MAX_CONFIGURATION_BYTES) return fail("Choose a configuration smaller than 1 MB.");
  let raw: string;
  try {
    raw = await file.text();
  } catch {
    return fail("This file could not be read. Try choosing it again.");
  }
  const result = parseConfiguration(raw);
  return result.ok ? checkArtwork(result) : result;
}
