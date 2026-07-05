const ONEKO_JS_REPOSITORY_RAW = "https://github.com/adryd325/oneko.js";

function isTrustedGithubHttps(url: URL): boolean {
  return url.protocol === "https:" && url.hostname === "github.com";
}

function stripTrailingSlash(href: string): string {
  return href.endsWith("/") ? href.slice(0, -1) : href;
}

export function normalizeRepositoryUrl(raw: string): string {
  const parsed = new URL(raw);
  if (!isTrustedGithubHttps(parsed)) {
    throw new Error(`Invalid oneko.js attribution URL: ${raw}`);
  }
  return stripTrailingSlash(parsed.href);
}

function attributionHrefFallback(err: unknown): string {
  if (process.env.NODE_ENV !== "production") {
    throw err instanceof Error
      ? err
      : new Error("Invalid oneko.js attribution URL", { cause: err });
  }

  console.error(
    "[InspirationAttribution] Using fallback URL; attribution URL failed validation.",
    err,
  );
  return ONEKO_JS_REPOSITORY_RAW;
}

export function getOnekoJsRepositoryHref(): string {
  try {
    return normalizeRepositoryUrl(ONEKO_JS_REPOSITORY_RAW);
  } catch (err) {
    return attributionHrefFallback(err);
  }
}
