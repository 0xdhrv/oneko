const OUTLINE = "#1b1b1b";

/**
 * Inline SVG for pixel art given as rows of characters ("." is transparent), outlined in the
 * sprite's dark ink so it reads on light and dark pages. The result is one pixel larger on each side.
 */
export function pixelArtSVG(rows: readonly string[], colors: Record<string, string>): string {
  const width = rows[0].length + 2;
  const height = rows.length + 2;
  const filled = (x: number, y: number) => Boolean(colors[rows[y]?.[x] ?? "."]);
  const rects: string[] = [];
  for (let y = -1; y <= rows.length; y++) {
    for (let x = -1; x <= rows[0].length; x++) {
      const fill = filled(x, y)
        ? colors[rows[y][x]]
        : filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)
          ? OUTLINE
          : null;
      if (fill) rects.push(`<rect x="${x + 1}" y="${y + 1}" width="1" height="1" fill="${fill}"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges" style="display:block;width:100%;height:100%">${rects.join("")}</svg>`;
}
