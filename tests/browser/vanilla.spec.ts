import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { getBundledSkinSource } from "../../lib/bundled-skins";

// Serve the built public/oneko.js from another origin, as a third-party site would load it.
const CDN = "https://cdn.oneko.test";
const SITE = "https://site.oneko.test/";

async function open(page: Page, body: string) {
  await page.route(`${CDN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    route.fulfill({
      body: readFileSync(resolve("public", `.${path}`)),
      contentType: "text/javascript",
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  });
  await page.route(SITE, (route) =>
    route.fulfill({ body: `<!doctype html><body>${body}</body>`, contentType: "text/html" }),
  );
  await page.goto(SITE);
}

const cat = (page: Page) => page.locator("#oneko-react");
const sprite = (page: Page) => cat(page).evaluate((el) => el.style.backgroundImage);
const tail = (skin: "calico" | "ginger" | "classic") => getBundledSkinSource(skin).slice(-64);

test("a bare script tag brings one cat configured by data attributes", async ({ page }) => {
  await open(
    page,
    `<script type="module" src="${CDN}/oneko.js" data-skin="calico" data-scale="2" data-persist-position="false"></script>`,
  );
  await expect(cat(page)).toHaveCount(1);
  await expect.poll(() => sprite(page)).toContain(tail("calico"));
  await expect.poll(() => cat(page).evaluate((el) => el.style.transform)).toContain("scale(2)");
});

test("<oneko-cat> mounts, follows attribute changes, and cleans up on removal", async ({
  page,
}) => {
  await open(
    page,
    `<oneko-cat skin="ginger" persist-position="false"></oneko-cat>
     <script type="module" src="${CDN}/oneko.js"></script>`,
  );
  // The element replaces the script's automatic cat rather than adding a second one.
  await expect(cat(page)).toHaveCount(1);
  await expect.poll(() => sprite(page)).toContain(tail("ginger"));
  await page.evaluate(() => document.querySelector("oneko-cat")!.removeAttribute("skin"));
  await expect.poll(() => sprite(page)).toContain(tail("classic"));
  await page.evaluate(() => document.querySelector("oneko-cat")!.remove());
  await expect(cat(page)).toHaveCount(0);
});

test("createOneko is importable and destroy removes everything it added", async ({ page }) => {
  await open(
    page,
    `<script type="module">
       import { createOneko } from "${CDN}/oneko.js";
       window.cat = createOneko({ persistPosition: false, laserPointer: true });
     </script>
     <script type="module" src="${CDN}/oneko.js" data-manual></script>`,
  );
  await expect(cat(page)).toHaveCount(1);
  await expect(page.locator("body")).toHaveCSS("cursor", "none");
  await page.evaluate(() => (window as unknown as { cat: { destroy(): void } }).cat.destroy());
  await expect(cat(page)).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveCSS("cursor", "none");
});

test("reduced motion hides the scripted cat or leaves it resting", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(
    page,
    `<script type="module" src="${CDN}/oneko.js" data-reduced-motion="rest" data-persist-position="false"></script>`,
  );
  const resting = page.locator('div[aria-hidden="true"][style*="background-position"]');
  await expect(resting).toHaveCount(1);
  await expect(cat(page)).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(resting).toHaveCount(0);
  await expect(cat(page)).toHaveCount(1);
});
