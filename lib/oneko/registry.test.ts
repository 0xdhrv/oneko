import {
  readFileSync,
  existsSync,
  statSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import ts from "typescript";
import { dirname, resolve, join } from "node:path";
import { expect, it } from "vitest";
import registry from "../../registry.json";
import generated from "../../public/r/oneko.json";
import { DEFAULT_ONEKO_PLAYGROUND_STATE, SETTING_RANGES } from "./playground-defaults";
import { createOnekoUsage } from "./usage";
import { getSkinSource } from "./skins";

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

it("publishes the current component sources, including custom sprite and thought support", () => {
  expect(generated.files.map((file) => file.path).sort()).toEqual(
    registry.items[0].files.map((file) => file.path).sort(),
  );
  for (const file of generated.files) {
    expect(file.content, `Rebuild the registry: ${file.path} is stale`).toBe(
      readFileSync(resolve(file.path), "utf8"),
    );
  }
});

it("compiles studio exports using only the files shipped to shadcn consumers", () => {
  const destination = mkdtempSync(join(tmpdir(), "oneko-registry-"));
  try {
    // Reuse installed packages, but deliberately exclude the site's source files.
    symlinkSync(resolve("node_modules"), join(destination, "node_modules"), "dir");
    for (const file of generated.files) {
      const target = resolve(destination, file.target ?? file.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.content);
    }
    const configured = {
      ...DEFAULT_ONEKO_PLAYGROUND_STATE,
      ...Object.fromEntries(Object.entries(SETTING_RANGES).map(([key, [, max]]) => [key, max])),
      ...Object.fromEntries(
        Object.entries(DEFAULT_ONEKO_PLAYGROUND_STATE)
          .filter(([, value]) => typeof value === "boolean")
          .map(([key, value]) => [key, !value]),
      ),
      spriteSrc: getSkinSource("calico"),
      spriteName: "my-cat.png",
      bubbleText: 'Hello "friend"\nTreat time!',
    };
    const examples = [
      createOnekoUsage(configured),
      createOnekoUsage({ ...configured, spriteSrc: "/my-cat.png", bubbleText: "One thought" }),
      `import Oneko from "@/components/oneko";
       const thoughts = ["Hello", "Treats?"] as const;
       export default function Example() { return <Oneko spriteSrc="/cat.png" bubbleText={thoughts} meow={false} />; }`,
    ];
    const rootNames = examples.map((source, index) => {
      const target = join(destination, `example-${index}.tsx`);
      writeFileSync(target, source);
      return target;
    });
    const program = ts.createProgram(rootNames, {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      resolveJsonModule: true,
      noEmit: true,
      paths: { "@/*": [join(destination, "*")] },
      types: ["react", "react-dom"],
      typeRoots: [resolve("node_modules/@types")],
    });
    const errors = ts
      .getPreEmitDiagnostics(program)
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    expect(errors).toEqual([]);
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
}, 15_000);
