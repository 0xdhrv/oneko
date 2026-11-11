import { createOneko, type OnekoInstance } from "@/lib/oneko/vanilla";
import { isActiveOn, onSettingsChange, readSettings, toOptions, type Settings } from "./settings";

// The cat lives on someone else's page, so it keeps its position to itself instead of the site's storage.
// With reduced motion on, a still, sleeping cat keeps the popup's "on" honest.
const BASE = {
  soundBasePath: chrome.runtime.getURL("cat-sounds"),
  persistPosition: false,
  reducedMotion: "rest",
} as const;

let cat: OnekoInstance | undefined;

function apply(settings: Settings) {
  if (!isActiveOn(settings, location.hostname)) {
    cat?.destroy();
    cat = undefined;
    return;
  }
  // The coat comes from the extension, not a data: URL, so strict page CSPs still show it.
  const options = {
    ...toOptions(settings),
    spriteSrc: chrome.runtime.getURL(`skins/${settings.skin}.png`),
  };
  if (cat) cat.update(options);
  else cat = createOneko(options, BASE);
}

readSettings().then(apply);
onSettingsChange(apply);
// Lets the popup tell a page that was open before install, which has no cat yet.
chrome.runtime.onMessage.addListener((message, _sender, reply) => {
  if (message === "oneko:ping") reply(true);
});
