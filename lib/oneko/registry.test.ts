import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { expect, it } from "vitest";
import registry from "../../registry.json";

it("ships every local dependency of the installable Oneko component", () => {
  const paths = new Set(registry.items[0].files.map((file) => resolve(file.path)));
  const visited = new Set<string>();
  const visit = (file: string) => {
    if (visited.has(file)) return;
    visited.add(file);
    expect(paths.has(file), `Registry is missing ${file}`).toBe(true);
    if (file.endsWith(".json")) return;
    const source = readFileSync(file, "utf8");
    for (const [, specifier] of source.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)) {
      if (!specifier.startsWith("@/") && !specifier.startsWith(".")) continue;
      const base = specifier.startsWith("@/")
        ? resolve(specifier.slice(2))
        : resolve(dirname(file), specifier);
      const dependency = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find(
        (path) => existsSync(path) && statSync(path).isFile(),
      );
      expect(dependency, `Missing dependency ${specifier}`).toBeDefined();
      visit(dependency!);
    }
  };
  visit(resolve("components/oneko.tsx"));
});
