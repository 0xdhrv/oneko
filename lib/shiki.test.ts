import { describe, expect, it } from "vitest";
import { highlightCode } from "./shiki";
import type { CodeLanguage } from "./shiki-config";

describe("highlightCode", () => {
  it("uses Oneko theme variables instead of an unrelated editor palette", async () => {
    const html = await highlightCode('const cat = "purr";', "tsx");

    expect(html).toContain("shiki oneko");
    expect(html).toContain("var(--syntax-token-keyword)");
    expect(html).toContain("var(--syntax-token-string-expression)");
    expect(html).not.toContain("--shiki-light");
    expect(html).not.toContain("github-");
  });

  it.each<[CodeLanguage, string]>([
    ["bash", "pnpm deploy"],
    ["html", '<div data-oneko-zone="avoid">Navigation</div>'],
    ["text", "A little adventure awaits"],
    ["tsx", '<Oneko skin="calico" />'],
  ])("highlights the supported %s language", async (language, code) => {
    const html = await highlightCode(code, language);
    expect(html).toContain("<pre");
    expect(html).toContain("<code>");
  });
});
