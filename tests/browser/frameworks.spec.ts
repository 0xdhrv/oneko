import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { getBundledSkinSource } from "../../lib/bundled-skins";

// The wrappers import the hosted engine; serve the local build in its place.
const HOSTED = "https://oneko.dhrv.pw";
const FIXTURE = "http://127.0.0.1:3102/frameworks/";

type Harness = { setSkin(skin?: string): void; unmount(): void; states: string[] };

async function open(page: Page, framework: string) {
  await page.route(`${HOSTED}/**`, (route) =>
    route.fulfill({
      body: readFileSync(resolve("public", `.${new URL(route.request().url()).pathname}`)),
      contentType: "text/javascript",
      headers: { "Access-Control-Allow-Origin": "*" },
    }),
  );
  await page.goto(`${FIXTURE}?${framework}`);
}

const cat = (page: Page) => page.locator("#oneko-react");
const sprite = (page: Page) => cat(page).evaluate((el) => el.style.backgroundImage);
const tail = (skin: "ginger" | "calico" | "classic") => getBundledSkinSource(skin).slice(-64);
const harness = <T>(page: Page, run: (harness: Harness) => T) =>
  page.evaluate(
    (source) => new Function("h", `return (${source})(h)`)((window as any).harness),
    run.toString(),
  );

for (const framework of ["svelte", "vue", "solid"]) {
  test(`${framework} wrapper mounts, follows props, reports state, and cleans up`, async ({
    page,
  }) => {
    await open(page, framework);
    await expect(cat(page)).toHaveCount(1);
    await expect.poll(() => sprite(page)).toContain(tail("ginger"));

    await harness(page, (h) => h.setSkin("calico"));
    await expect.poll(() => sprite(page)).toContain(tail("calico"));

    // A prop set to undefined returns to the default coat.
    await harness(page, (h) => h.setSkin(undefined));
    await expect.poll(() => sprite(page)).toContain(tail("classic"));

    await page.mouse.move(40, 40);
    await page.mouse.move(900, 700, { steps: 10 });
    await expect.poll(() => harness(page, (h) => h.states.length)).toBeGreaterThan(0);

    await harness(page, (h) => h.unmount());
    await expect(cat(page)).toHaveCount(0);
  });
}
