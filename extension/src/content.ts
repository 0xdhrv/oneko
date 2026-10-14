import { createOneko, type OnekoInstance } from "@/lib/oneko/vanilla";
import { isActiveOn, onSettingsChange, readSettings, toOptions, type Settings } from "./settings";

// The cat lives on someone else's page, so it keeps its position to itself instead of the site's storage.
const BASE = {
  soundBasePath: chrome.runtime.getURL("cat-sounds"),
  persistPosition: false,
};

let cat: OnekoInstance | undefined;

function apply(settings: Settings) {
  if (!isActiveOn(settings, location.hostname)) {
    cat?.destroy();
    cat = undefined;
    return;
  }
  if (cat) cat.update(toOptions(settings));
  else cat = createOneko(toOptions(settings), BASE);
}

readSettings().then(apply);
onSettingsChange(apply);
