# Pixel-art skins

Oneko includes 24 sprite sheets: 12 original sheets and 12 generated variants. Each is a 256 × 128 PNG with an 8 × 4 grid of
32-pixel frames, using the animation layout of [adryd325/oneko.js](https://github.com/adryd325/oneko.js).

The 12 original sheets were sourced from [oneko-swift](https://github.com/oneko-swift/oneko-swift/tree/8cc42f0689c009ec53561d5022597fccd7469337/Resources)
at revision `8cc42f0689c009ec53561d5022597fccd7469337`. Artwork belongs to its original creators;
this project's MIT code license does not relicense the sprite art.

| Skin ID                                                             | Credit / original source                                                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `classic`                                                           | Masayuki Koba's original X11 oneko, via [adryd325/oneko.js](https://github.com/adryd325/oneko.js)                         |
| `tora`                                                              | Original X11 bitmaps from [tie/oneko](https://github.com/tie/oneko), assembled with cat transparency masks by oneko-swift |
| `catppuccin`                                                        | [k01e-01/catppuccineko](https://github.com/k01e-01/catppuccineko), MIT, using Catppuccin colors                           |
| `maia`, `vaporwave`                                                 | [kyrie25/spicetify-oneko](https://github.com/kyrie25/spicetify-oneko)                                                     |
| `black`, `gray`, `calico`, `ghost`, `silver`, `spirit`, `valentine` | Community art from the [Oneko Source Database](https://github.com/tallypaws/oneko_db), as credited by oneko-swift         |

See the upstream [credits](https://github.com/oneko-swift/oneko-swift#credits) for provenance.

## Use a skin

```tsx
<Oneko skin="calico" meow={false} />
```

Changing `skin` swaps the coat in place without resetting the cat's position or activity. Unknown
skin IDs fall back to `classic`. `hueRotate` remains available for tinting; selecting a coat in the
playground clears the tint to show the original art.

`lib/oneko/skins.ts` is the typed catalog. `lib/oneko/skin-sheets.json` contains the bundled PNG bytes
as data URLs, so the component and its previews work without third-party image requests. Sites with
a Content Security Policy should allow `data:` in `img-src`. The 12 original sheets remain unmodified.

To add a coat, preserve the original file and attribution, add its data URL and catalog entry, then
run `pnpm test` and `pnpm run registry:build`. The skin tests decode every sheet and check that every
animation frame contains visible pixels.

## Your own sprite sheet

Open **Appearance → Use your own sprite** in the studio (`/studio`) to download the classic sheet as a template and
upload a PNG up to 256 KB. Use 256 × 128 pixels: 8 columns and 4 rows of 32 × 32 frames.
Keep the template’s frame positions so walking, grooming, wall scratching, and naps match the
animation. Transparent backgrounds work best. Preserve the original artwork credits when adapting it.

Uploads stay in your browser and persist with your preferences. Selecting a built-in coat or
resetting the cat removes the upload. The generated React example embeds the uploaded sheet;
for a hosted asset, use `<Oneko spriteSrc="/my-sprite.png" />`. `spriteSrc` overrides `skin`
and updates without resetting position. Omit it to return to the selected built-in coat.

## Generated coat variants

`ginger`, `sage`, `siamese`, `strawberry-milk`, `blue-frost`, `lavender`, `tuxedo`, `peach`, `honey`, `mocha`, `mint`, and `midnight-blue` were generated with
the built-in image generation tool using Classic as a reference. Original artwork
credits still apply. These variants reinterpret some pose details rather than
preserving the original pixels exactly.

Source artwork and prompts live in `output/skins/`. Run
`node scripts/prepare-generated-skins.mjs` to prepare 256 × 128 PNGs with nearest-neighbor
sampling and binary transparency and embed them in the catalog. Then run
`pnpm run registry:build`. Every variant is available in the studio and exported
React examples through its skin ID.
