import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "./site-url";

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers NEXT_PUBLIC_SITE_URL and trims trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.example.com/");
    vi.stubEnv("NODE_ENV", "development");

    expect(getSiteUrl()).toBe("https://staging.example.com");
  });

  it("uses localhost in development when no override is set", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("uses the Vercel preview URL on preview deployments", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "oneko-git-main-raycast.vercel.app");

    expect(getSiteUrl()).toBe("https://oneko-git-main-raycast.vercel.app");
  });

  it("falls back to the canonical production origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");

    expect(getSiteUrl()).toBe("https://oneko.dhrv.pw");
  });
});
