import sheets from "./skin-sheets.json";

export type OnekoSkin = keyof typeof sheets;

/** Original, unmodified pixel art. See docs/skins.md for provenance and credits. */
export const ONEKO_SKINS = [
  { id: "classic", name: "Classic", description: "The little cat that started it all" },
  { id: "black", name: "Black", description: "A tiny midnight shadow" },
  { id: "gray", name: "Gray", description: "Soft fur, softer footsteps" },
  { id: "calico", name: "Calico", description: "A patchwork of mischief" },
  { id: "tora", name: "Tora", description: "A little tiger at heart" },
  { id: "catppuccin", name: "Catppuccin", description: "A warm cup of cat" },
  { id: "ghost", name: "Ghost", description: "A pleasantly spooky companion" },
  { id: "silver", name: "Silver", description: "Moonlight on little paws" },
  { id: "spirit", name: "Spirit", description: "A curious little daydream" },
  { id: "valentine", name: "Valentine", description: "Wears a heart on every paw" },
  { id: "maia", name: "Maia", description: "Small paws, big personality" },
  { id: "vaporwave", name: "Vaporwave", description: "Dreaming in pink and purple" },
] as const satisfies ReadonlyArray<{ id: OnekoSkin; name: string; description: string }>;

export function isOnekoSkin(value: unknown): value is OnekoSkin {
  return typeof value === "string" && Object.hasOwn(sheets, value);
}

export function getSkinSource(skin: OnekoSkin = "classic"): string {
  return sheets[isOnekoSkin(skin) ? skin : "classic"];
}
