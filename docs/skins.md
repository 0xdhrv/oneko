# Pixel-art skins

Oneko includes 12 unmodified sprite sheets. Each is a 256 × 128 PNG with an 8 × 4 grid of
32-pixel frames, using the animation layout of [adryd325/oneko.js](https://github.com/adryd325/oneko.js).

The sheets were sourced from [oneko-swift](https://github.com/oneko-swift/oneko-swift/tree/8cc42f0689c009ec53561d5022597fccd7469337/Resources)
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

`lib/oneko/skins.ts` is the typed catalog. `lib/oneko/skin-sheets.json` contains the original PNG bytes
as data URLs, so the component and its previews work without third-party image requests. Sites with
a Content Security Policy should allow `data:` in `img-src`. No smoothing, recoloring, or resampling
is applied to the bundled art.

To add a coat, preserve the original file and attribution, add its data URL and catalog entry, then
run `pnpm test` and `pnpm run registry:build`. The skin tests decode every sheet and check that every
animation frame contains visible pixels.
