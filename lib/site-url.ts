/** Production hostname (no trailing slash on the constant; function returns origin only). */
const CANONICAL_SITE_ORIGIN = "https://oneko.dhrv.pw";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function resolveExplicitSiteUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  return explicit ? trimTrailingSlash(explicit) : undefined;
}

function resolveDevelopmentSiteUrl(): string | undefined {
  return process.env.NODE_ENV === "development" ? "http://localhost:3000" : undefined;
}

function resolvePreviewSiteUrl(): string | undefined {
  if (process.env.VERCEL_ENV !== "preview" || !process.env.VERCEL_URL) {
    return undefined;
  }
  return `https://${process.env.VERCEL_URL}`;
}

/**
 * Canonical site origin for metadata, sitemap, and robots.
 * Override with NEXT_PUBLIC_SITE_URL when needed (e.g. staging).
 */
export function getSiteUrl(): string {
  return (
    resolveExplicitSiteUrl() ??
    resolveDevelopmentSiteUrl() ??
    resolvePreviewSiteUrl() ??
    CANONICAL_SITE_ORIGIN
  );
}
