/** Playground upload limits keep local preferences and copied examples manageable. */
export const MAX_SPRITE_BYTES = 256 * 1024;
export const MAX_THOUGHTS = 50;
export const MAX_THOUGHT_LENGTH = 120;
export const MAX_THOUGHT_TEXT_LENGTH = MAX_THOUGHTS * (MAX_THOUGHT_LENGTH + 1);

export function thoughtLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function normalizeThoughts(text: string): string {
  return thoughtLines(text)
    .slice(0, MAX_THOUGHTS)
    .map((line) => line.slice(0, MAX_THOUGHT_LENGTH))
    .join("\n");
}

export function thoughtsForProp(text: string): string | string[] {
  const lines = thoughtLines(normalizeThoughts(text));
  return lines.length > 1 ? lines : (lines[0] ?? "");
}

export function validateThoughts(text: string): void {
  const lines = thoughtLines(text);
  if (lines.length > MAX_THOUGHTS) throw new Error("Use up to 50 thoughts, one per line.");
  if (lines.some((line) => line.length > MAX_THOUGHT_LENGTH)) {
    throw new Error("Keep each thought to 120 characters. Your changes haven’t been applied yet.");
  }
}

/** Only restore bounded PNG data URLs with the required sheet dimensions. */
export function isSavedSprite(value: unknown): value is string {
  if (typeof value !== "string" || value.length > Math.ceil(MAX_SPRITE_BYTES / 3) * 4 + 22)
    return false;
  if (!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
  try {
    const bytes = atob(value.slice(22, 66));
    return (
      bytes.slice(0, 8) === "\x89PNG\r\n\x1a\n" &&
      bytes.slice(12, 16) === "IHDR" &&
      bytes.slice(16, 24) === "\x00\x00\x01\x00\x00\x00\x00\x80"
    );
  } catch {
    return false;
  }
}

export const MAX_SPRITE_URL_LENGTH = 2048;

/** A hosted sprite sheet: an https URL without credentials, short enough for a share link. */
export function isRemoteSprite(value: unknown): value is string {
  if (typeof value !== "string" || value.length > MAX_SPRITE_URL_LENGTH) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Either an embedded PNG or a hosted https sprite sheet. */
export function isSpriteSource(value: unknown): value is string {
  return isSavedSprite(value) || isRemoteSprite(value);
}

/** Load a hosted sheet and confirm its size before the cat wears it. */
export async function loadRemoteSprite(value: string): Promise<string> {
  const source = value.trim();
  if (!isRemoteSprite(source))
    throw new Error("Use an https:// link to a PNG, up to 2048 characters.");
  const image = new Image();
  image.referrerPolicy = "no-referrer";
  image.src = source;
  try {
    await image.decode();
  } catch {
    throw new Error("That image couldn’t be opened. Check the link and that it allows hotlinking.");
  }
  if (image.naturalWidth !== 256 || image.naturalHeight !== 128)
    throw new Error("Use a 256 × 128 sprite sheet with 8 columns and 4 rows of 32 × 32 frames.");
  return source;
}

/** A readable name for a hosted sheet, such as "cats.example/ginger.png". */
export function spriteNameFromURL(value: string): string {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname}`.slice(0, 255);
  } catch {
    return "";
  }
}

export async function readSprite(file: File): Promise<string> {
  if (file.size > MAX_SPRITE_BYTES) throw new Error("Choose a PNG smaller than 256 KB.");
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).replace(/^data:[^;]*;/, "data:image/png;"));
    reader.onerror = () => reject(new Error("This file couldn’t be read. Try choosing it again."));
    reader.readAsDataURL(file);
  });
  if (!isSavedSprite(source))
    throw new Error("Choose a 256 × 128 PNG with 8 columns and 4 rows of 32 × 32 frames.");
  const image = new Image();
  image.src = source;
  try {
    await image.decode();
  } catch {
    throw new Error("This PNG couldn’t be opened. Try exporting the sprite sheet again.");
  }
  return source;
}

export async function readThoughts(file: File): Promise<string> {
  if (!file.name.toLowerCase().endsWith(".txt"))
    throw new Error("Choose a plain-text (.txt) file.");
  if (file.size > MAX_THOUGHT_TEXT_LENGTH * 4)
    throw new Error("Choose a text file smaller than 24 KB with up to 50 thoughts.");
  const text = await file.text();
  if (text.includes("\0")) throw new Error("Choose a UTF-8 plain-text file.");
  validateThoughts(text);
  if (!thoughtLines(text).length)
    throw new Error("This file has no thoughts yet. Add one per line.");
  return normalizeThoughts(text);
}
