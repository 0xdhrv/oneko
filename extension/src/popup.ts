import { ONEKO_SKINS, loadSkinSource } from "@/lib/oneko/skins";
import { isActiveOn, readSettings, writeSettings, type Settings } from "./settings";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const enabled = $<HTMLInputElement>("enabled");
const site = $<HTMLInputElement>("site");
const siteLabel = $<HTMLSpanElement>("site-label");
const reload = $<HTMLParagraphElement>("reload");
const skin = $<HTMLSelectElement>("skin");
const preview = $<HTMLDivElement>("preview");
const scale = $<HTMLSelectElement>("scale");
const meow = $<HTMLInputElement>("meow");
const thoughts = $<HTMLInputElement>("thoughts");
const laser = $<HTMLInputElement>("laser");
const pettable = $<HTMLInputElement>("pettable");
const offSites = $<HTMLDetailsElement>("off-sites");
const offSummary = $<HTMLElement>("off-summary");
const offList = $<HTMLUListElement>("off-list");

for (const entry of ONEKO_SKINS) skin.add(new Option(entry.name, entry.id));

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const url = tab?.url ? new URL(tab.url) : undefined;
// Chrome never runs content scripts on its own pages or the Web Store, nor on local files
// unless "Allow access to file URLs" is on.
const blockedFile =
  url?.protocol === "file:" && !(await chrome.extension.isAllowedFileSchemeAccess());
const host =
  url && /^(https?|file):$/.test(url.protocol) && !blockedFile ? url.hostname : undefined;

// Pages opened before the extension was installed or updated run no content script until reloaded.
const needsReload =
  host !== undefined &&
  tab?.id !== undefined &&
  !(await chrome.tabs.sendMessage(tab.id, "oneko:ping").catch(() => false));

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
    host !== undefined
      ? `On ${host || "local files"}`
      : blockedFile
        ? "Allow file access for local files"
        : "Not available on this page";
  reload.hidden = !needsReload || !isActiveOn(settings, host);
  skin.value = settings.skin;
  scale.value = String(settings.scale);
  meow.checked = settings.meow;
  thoughts.checked = settings.thoughts;
  laser.checked = settings.laserPointer;
  pettable.checked = settings.pettable;
  document.body.classList.toggle("off", !settings.enabled);
  renderOffSites();
  void showPreview(settings.skin);
}

function renderOffSites() {
  const hosts = settings.disabledHosts;
  offSites.hidden = hosts.length === 0;
  offSummary.textContent = `Off on ${hosts.length} ${hosts.length === 1 ? "site" : "sites"}`;
  offList.replaceChildren(
    ...hosts.map((entry) => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = entry || "local files";
      const turnOn = document.createElement("button");
      turnOn.type = "button";
      turnOn.textContent = "Turn on";
      turnOn.setAttribute("aria-label", `Turn on for ${entry || "local files"}`);
      turnOn.addEventListener("click", () =>
        save({ disabledHosts: settings.disabledHosts.filter((other) => other !== entry) }),
      );
      item.append(name, turnOn);
      return item;
    }),
  );
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
thoughts.addEventListener("change", () => save({ thoughts: thoughts.checked }));
laser.addEventListener("change", () => save({ laserPointer: laser.checked }));
pettable.addEventListener("change", () => save({ pettable: pettable.checked }));

render();
