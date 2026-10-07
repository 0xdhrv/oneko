import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import ts from "typescript";
import { dirname, resolve, join, posix } from "node:path";
import { expect, it } from "vitest";
import registry from "../../registry.json";
import generated from "../../public/r/oneko.json";
import { deriveClassicItem } from "../../scripts/build-registry.mjs";
import { DEFAULT_ONEKO_PLAYGROUND_STATE, SETTING_RANGES } from "./playground-defaults";
import { createOnekoUsage } from "./usage";
import { getSkinSource, ONEKO_SKINS } from "./skins";

type RegistryItem = typeof generated;
const SHEET_PATH = "lib/oneko/skin-sheets.json";
const variants = ["oneko", "oneko-classic"] as const;

function readItem(name: (typeof variants)[number]): RegistryItem {
  return JSON.parse(readFileSync(resolve(`public/r/${name}.json`), "utf8"));
}

function compileExamples(item: RegistryItem, examples: string[]): string[] {
  const destination = mkdtempSync(join(tmpdir(), "oneko-registry-"));
  try {
    // Reuse package types, but exclude site source so omitted registry files fail compilation.
    symlinkSync(resolve("node_modules"), join(destination, "node_modules"), "dir");
    for (const file of item.files) {
      const target = resolve(destination, file.target ?? file.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.content);
    }
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
    return ts
      .getPreEmitDiagnostics(program)
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
}

it.each(variants)("%s ships the complete component dependency closure", (name) => {
  const item = readItem(name);
  const files = new Map(item.files.map((file) => [file.path, file.content]));
  const visited = new Set<string>();
  const visit = (path: string) => {
    if (visited.has(path)) return;
    visited.add(path);
    const content = files.get(path);
    expect(content, `Registry is missing ${path}`).toBeDefined();
    if (path.endsWith(".json")) return;
    for (const { fileName: specifier } of ts.preProcessFile(content!, true, true).importedFiles) {
      if (!specifier.startsWith("@/") && !specifier.startsWith(".")) {
        expect(specifier, "Consumers should need only React, not site dependencies").toBe("react");
        continue;
      }
      const base = specifier.startsWith("@/")
        ? specifier.slice(2)
        : posix.normalize(posix.join(posix.dirname(path), specifier));
      const dependency = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find((candidate) =>
        files.has(candidate),
      );
      expect(dependency, `Missing dependency ${specifier} from ${path}`).toBeDefined();
      visit(dependency!);
    }
  };
  visit("components/oneko.tsx");
});

it.each(variants)("%s publishes current sources and the intended sprite data", (name) => {
  const item = readItem(name);
  expect(item.files.map((file) => file.path).sort()).toEqual(
    registry.items[0].files.map((file) => file.path).sort(),
  );
  for (const file of item.files) {
    const source = readFileSync(resolve(file.path), "utf8");
    if (name === "oneko-classic" && file.path === SHEET_PATH) {
      expect(JSON.parse(file.content)).toEqual({ classic: JSON.parse(source).classic });
    } else {
      expect(file.content, `Rebuild the registry: ${file.path} is stale`).toBe(source);
    }
  }
});

it("derives a classic item by replacing only sprite data", () => {
  const classic = deriveClassicItem(generated) as RegistryItem;
  expect(classic.name).toBe("oneko-classic");
  expect(classic.dependencies).toEqual(generated.dependencies);
  expect(classic.registryDependencies).toEqual(generated.registryDependencies);
  for (const file of generated.files) {
    const counterpart = classic.files.find((entry) => entry.path === file.path)!;
    expect(counterpart.path).toBe(file.path);
    expect(counterpart.type).toBe(file.type);
    if (file.path !== SHEET_PATH) expect(counterpart).toEqual(file);
    else expect(Object.keys(JSON.parse(counterpart.content))).toEqual(["classic"]);
  }
});

it("publishes both variants in the discoverable registry index with a substantially smaller classic item", () => {
  const index = JSON.parse(readFileSync(resolve("public/r/registry.json"), "utf8"));
  expect(index.items.map((item: { name: string }) => item.name)).toEqual(variants);
  const full = readItem("oneko");
  const classic = readItem("oneko-classic");
  expect(classic).toEqual(deriveClassicItem(full));
  expect(Buffer.byteLength(JSON.stringify(classic))).toBeLessThan(
    Buffer.byteLength(JSON.stringify(full)) / 2,
  );
});

it.each(variants)(
  "%s compiles isolated studio exports and custom sprites",
  (name) => {
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
     export default function Example() { return <><Oneko /><Oneko spriteSrc="/cat.png" bubbleText={thoughts} /></>; }`,
    ];
    expect(compileExamples(readItem(name), examples)).toEqual([]);
  },
  30_000,
);

it.each(variants)(
  "%s exposes exactly its available skin types and catalog",
  (name) => {
    const skins = name === "oneko" ? ONEKO_SKINS.map(({ id }) => id) : ["classic"];
    const unavailableSkinCheck =
      name === "oneko-classic"
        ? `// @ts-expect-error Classic installation does not bundle calico.
         const unavailable = <Oneko skin="calico" />;`
        : "";
    const example = `import Oneko, { type OnekoSkin } from "@/components/oneko";
    import { ONEKO_SKINS } from "@/lib/oneko/skins";
    const skins = ${JSON.stringify(skins)} as const satisfies readonly OnekoSkin[];
    const available: (typeof skins)[number] = ONEKO_SKINS[0].id;
    ${unavailableSkinCheck}
    export default function Example() { return skins.map(skin => <Oneko key={skin} skin={skin} />); }`;
    expect(compileExamples(readItem(name), [example])).toEqual([]);
  },
  30_000,
);
