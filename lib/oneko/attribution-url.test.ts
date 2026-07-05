import { afterEach, describe, expect, it, vi } from "vitest";
import { getOnekoJsRepositoryHref, normalizeRepositoryUrl } from "./attribution-url";

describe("normalizeRepositoryUrl", () => {
  it("returns a trusted github https URL without trailing slash", () => {
    expect(normalizeRepositoryUrl("https://github.com/adryd325/oneko.js")).toBe(
      "https://github.com/adryd325/oneko.js",
    );
    expect(normalizeRepositoryUrl("https://github.com/adryd325/oneko.js/")).toBe(
      "https://github.com/adryd325/oneko.js",
    );
  });

  it("rejects non-github origins", () => {
    expect(() => normalizeRepositoryUrl("https://example.com/adryd325/oneko.js")).toThrow(
      /Invalid oneko.js attribution URL/,
    );
  });
});

describe("getOnekoJsRepositoryHref", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the trusted github repository URL", () => {
    expect(getOnekoJsRepositoryHref()).toBe("https://github.com/adryd325/oneko.js");
  });
});
