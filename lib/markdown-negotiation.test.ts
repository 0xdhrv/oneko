import { describe, expect, it } from "vitest";
import { prefersMarkdown } from "./markdown-negotiation";

describe("agent Markdown negotiation", () => {
  it.each([
    ["text/markdown", true],
    ["text/markdown; charset=utf-8", true],
    ["text/markdown;q=1, text/html;q=0.5", true],
    ["text/markdown;q=0, text/html", false],
    ["text/html, text/markdown;q=0.5", false],
    ["text/html, text/markdown", false],
    ["text/markdown;q=0.5, */*;q=0.8", false],
    ["text/markdown, text/*;q=0.5", true],
    ["text/markdown, text/html;q=0, */*", true],
    ["text/html,application/xhtml+xml,*/*;q=0.8", false],
    ["*/*", false],
    ["text/*", false],
    ["TEXT/MARKDOWN", true],
    ["text/markdown;q=invalid", false],
    ["text/markdown;q=2", false],
    [null, false],
  ])("respects representation preferences for %s", (accept, expected) => {
    expect(prefersMarkdown(accept)).toBe(expected);
  });
});
