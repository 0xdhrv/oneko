import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "./proxy";

const request = (path: string, accept: string) =>
  new NextRequest(`https://oneko.example${path}`, { headers: { accept } });

describe("markdown negotiation proxy", () => {
  it("rewrites agents that ask for Markdown to the docs, and says the answer varies", () => {
    for (const path of ["/", "/docs"]) {
      const response = proxy(request(path, "text/markdown"));
      expect(new URL(response.headers.get("x-middleware-rewrite")!).pathname).toBe("/docs.md");
      expect(response.headers.get("Vary")).toBe("Accept");
    }
  });

  it("serves browsers the page, still varying on Accept so caches keep them apart", () => {
    const response = proxy(request("/", "text/html,application/xhtml+xml,*/*;q=0.8"));
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(response.headers.get("Vary")).toBe("Accept");
  });

  it("only runs on the pages that have a Markdown twin", () => {
    expect(config.matcher).toEqual(["/", "/docs"]);
  });
});
