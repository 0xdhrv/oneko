import { describe, expect, it } from "vitest";
import { highlightCode } from "./shiki";

describe("highlightCode", () => {
  it("uses Oneko theme variables instead of an unrelated editor palette", async () => {
    const html = await highlightCode('const cat = "purr";', "tsx");

    expect(html).toContain("shiki oneko");
    expect(html).toContain("var(--syntax-token-keyword)");
    expect(html).toContain("var(--syntax-token-string-expression)");
    expect(html).not.toContain("--shiki-light");
    expect(html).not.toContain("github-");
  });
});
