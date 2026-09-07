import sheets from "./skin-sheets.json";

export type OnekoSkin = keyof typeof sheets;

/** Bundled pixel art. See docs/skins.md for provenance and generated variants. */
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
  { id: "ginger", name: "Ginger", description: "Golden fur and cream-colored paws" },
  { id: "sage", name: "Sage", description: "A little garden companion" },
  { id: "siamese", name: "Siamese", description: "Chocolate points and bright blue eyes" },
  {
    id: "strawberry-milk",
    name: "Strawberry Milk",
    description: "Soft pink with a splash of cream",
  },
  { id: "blue-frost", name: "Blue Frost", description: "Snowy paws and an icy blue coat" },
  { id: "lavender", name: "Lavender", description: "Lilac fur and a little daydream" },
  { id: "tuxedo", name: "Tuxedo", description: "Dressed up in a white bib and socks" },
  { id: "peach", name: "Peach", description: "Apricot fur with a touch of vanilla" },
  { id: "honey", name: "Honey", description: "Golden fur and a sunny disposition" },
  { id: "mocha", name: "Mocha", description: "Cocoa fur with a splash of milk" },
  { id: "mint", name: "Mint", description: "Fresh turquoise and snowy little paws" },
  { id: "midnight-blue", name: "Midnight Blue", description: "Navy fur with a silver lining" },
] as const satisfies ReadonlyArray<{ id: OnekoSkin; name: string; description: string }>;

export function isOnekoSkin(value: unknown): value is OnekoSkin {
  return typeof value === "string" && Object.hasOwn(sheets, value);
}

export function getSkinSource(skin: OnekoSkin = "classic"): string {
  return sheets[isOnekoSkin(skin) ? skin : "classic"];
}
