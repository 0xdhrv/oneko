# Skin variants

Created with the built-in image generation tool from the bundled Classic sheet.

- `ginger-concept.png`: warm ginger fur with cream muzzle and dark outlines.
- `sage-concept.png`: muted sage fur with mint highlights and forest outlines.

These are concept sheets, not runtime-ready atlases. Generation enlarged the
images and altered pixel geometry. They have not been added to the skin catalog.
The runtime requires exactly 256 × 128 pixels with 32 × 32 cells; simply resizing
these concepts does not guarantee correct frame alignment or animation continuity.

## Sprite analysis

The original is an 8-column, 4-row transparent atlas with strong dark contours,
compact silhouettes, and sparse facial pixels. Paired walking poses cover eight
directions. Other cells support sitting, grooming, scratching, and sleeping.
Preserve cell positions, silhouette anchors, facial readability, and sleep marks
when preparing production variants. Original art credits remain in `docs/skins.md`.

## Prompt set

Ginger: Edit the Classic Oneko sheet; change white fur to pale ginger (#edb879)
with a cream muzzle. Preserve every pixel position, silhouette, pose, dark outline,
eyes, whiskers, sleep symbols, and frame spacing. Request 256 × 128 transparent
output, 8 × 4 cells, hard pixel edges, no labels, rescaling, or antialiasing.

Sage: Edit the Classic Oneko sheet; use muted sage-green fur, pale mint muzzle,
and dark forest-green outlines. Preserve all 32 poses in their original cells,
spacing, proportions, and sleep symbols. Request 256 × 128 transparent output,
8 × 4 cells, hard pixel edges, no labels, gradients, or antialiasing.

## Additional variants

Created using the built-in image generation tool with classic-reference.png as
an edit target. These are also concepts requiring pixel cleanup and alignment
before runtime use.

- siamese-concept.png: ivory fur, chocolate face mask, ears, paws and tail, blue eyes.
- strawberry-milk-concept.png: pastel pink fur, cream muzzle, belly and paws, raspberry outlines.
- blue-frost-concept.png: powder blue fur, snowy white muzzle, chest and paws, navy outlines.

Prompt set: Create each coat above as an edit of the original Oneko sheet;
preserve all 32 poses and their order in the 8-column, 4-row atlas, including
walking directions, grooming, scratching, and sleep marks. Request transparent
256 x 128 output with 32 x 32 cells, consistent markings, compact silhouettes,
crisp limited-palette pixel art, no gradients, blur, labels, grid lines or props.
Siamese additionally requests dark point markings and tiny blue eyes;
Strawberry Milk requests rose-pink ears; Blue Frost requests periwinkle ears.

## Studio integration

All 12 generated variants now have runtime copies named `<skin-id>.png`, embedded in the
shared skin catalog. Rebuild them with `node scripts/prepare-generated-skins.mjs`.
This applies nearest-neighbor sizing and binary alpha cleanup. Generated pose
differences remain; the concept files above are preserved unchanged.

## Lavender, Tuxedo, and Peach

Three more coats are bundled in the studio: pale lilac with plum outlines,
charcoal with a white bib and socks, and apricot with vanilla highlights.
Exact prompts are saved in `additional-prompts.md`. Source concepts and prepared
256 × 128 runtime PNGs are both retained in this directory.

## Honey, Mocha, Mint, and Midnight Blue

Four more coats are available in the studio: golden yellow and ivory, cocoa and
beige, turquoise and white, and navy with silver-blue markings. Exact prompts
are in `four-more-prompts.md`. Both source concepts and prepared runtime copies
are retained in this directory.
