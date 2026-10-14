import { ONEKO_SKINS, loadSkinSource } from "@/lib/oneko/skins";
import { isActiveOn, readSettings, writeSettings, type Settings } from "./settings";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const enabled = $<HTMLInputElement>("enabled");
const site = $<HTMLInputElement>("site");
const siteLabel = $<HTMLSpanElement>("site-label");
const skin = $<HTMLSelectElement>("skin");
const preview = $<HTMLDivElement>("preview");
const scale = $<HTMLSelectElement>("scale");
const meow = $<HTMLInputElement>("meow");
const laser = $<HTMLInputElement>("laser");
const pettable = $<HTMLInputElement>("pettable");

for (const entry of ONEKO_SKINS) skin.add(new Option(entry.name, entry.id));

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const url = tab?.url ? new URL(tab.url) : undefined;
// Chrome never runs content scripts on its own pages or the Web Store.
const host = url && /^(https?|file):$/.test(url.protocol) ? url.hostname : undefined;

let settings = await readSettings();

async function showPreview(id: Settings["skin"]) {
  const source = await loadSkinSource(id);
  if (skin.value === id) preview.style.backgroundImage = `url(${JSON.stringify(source)})`;
}

function render() {
  enabled.checked = settings.enabled;
  site.disabled = !settings.enabled || host === undefined;
  site.checked = host !== undefined && isActiveOn(settings, host);
  siteLabel.textContent =
    host !== undefined ? `On ${host || "local files"}` : "Not available on this page";
  skin.value = settings.skin;
  scale.value = String(settings.scale);
  meow.checked = settings.meow;
  laser.checked = settings.laserPointer;
  pettable.checked = settings.pettable;
  document.body.classList.toggle("off", !settings.enabled);
  void showPreview(settings.skin);
}

function save(patch: Partial<Settings>) {
  settings = { ...settings, ...patch };
  render();
  void writeSettings(settings);
}

enabled.addEventListener("change", () => save({ enabled: enabled.checked }));
site.addEventListener("change", () => {
  if (host === undefined) return;
  const others = settings.disabledHosts.filter((entry) => entry !== host);
  save({ disabledHosts: site.checked ? others : [...others, host] });
});
skin.addEventListener("change", () => save({ skin: skin.value as Settings["skin"] }));
scale.addEventListener("change", () => save({ scale: Number(scale.value) }));
meow.addEventListener("change", () => save({ meow: meow.checked }));
laser.addEventListener("change", () => save({ laserPointer: laser.checked }));
pettable.addEventListener("change", () => save({ pettable: pettable.checked }));

render();
