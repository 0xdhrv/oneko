// Importing this module during SSR has no DOM side effects. Call createOneko after mounting.
export { createOneko } from "../../../lib/oneko/vanilla";
export type { OnekoInstance, OnekoOptions } from "../../../lib/oneko/vanilla";
export { areCatsHidden, setCatsHidden, onCatsHiddenChange } from "../../../lib/oneko/pack";
export { ONEKO_SKINS, isOnekoSkin } from "../../../lib/oneko/skins";
export type { OnekoSkin } from "../../../lib/oneko/skins";
export type { CatActivityState } from "../../../lib/oneko/types";
export type { OnekoZone } from "../../../lib/oneko/zones";
