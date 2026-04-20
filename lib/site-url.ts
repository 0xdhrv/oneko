/** Production hostname (no trailing slash on the constant; function returns origin only). */
const CANONICAL_SITE_ORIGIN = "https://oneko.dhrv.pw";

/**
 * Canonical site origin for metadata, sitemap, and robots.
 * Override with NEXT_PUBLIC_SITE_URL when needed (e.g. staging).
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return CANONICAL_SITE_ORIGIN;
}
