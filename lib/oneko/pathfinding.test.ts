import { describe, expect, it } from "vitest";
import { buildGrid, findRoute, nearestWalkable, worldToCell } from "./pathfinding";

function openGrid(cols: number, rows: number) {
  return new Uint8Array(cols * rows);
}

function blockedCell(grid: Uint8Array, cols: number, col: number, row: number) {
  grid[row * cols + col] = 1;
}

/** Walk each segment in small steps and report whether any step lands on a blocked cell. */
function crossesWall(
  path: { x: number; y: number }[],
  grid: Uint8Array,
  cols: number,
  rows: number,
) {
  for (let i = 1; i < path.length; i++) {
    const [a, b] = [path[i - 1], path[i]];
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2);
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      if (grid[worldToCell(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, cols, rows)]) return true;
    }
  }
  return false;
}

describe("buildGrid", () => {
  it("marks cells covered by obstacles as blocked", () => {
    const open = buildGrid([], 4, 4);
    const blocked = buildGrid([{ left: 24, top: 24, right: 39, bottom: 39 }], 4, 4);

    expect(open.every((cell) => cell === 0)).toBe(true);
    expect(blocked.some((cell) => cell === 1)).toBe(true);
  });

  it("blocks exactly the cells an obstacle and the cat's radius cover, clamped to the grid", () => {
    const cells = (grid: Uint8Array, cols: number) =>
      [...grid.keys()]
        .filter((index) => grid[index] === 1)
        .map((index) => [index % cols, Math.floor(index / cols)]);
    // 24–39 px plus the 8 px sprite radius spans columns and rows 1–3.
    expect(cells(buildGrid([{ left: 24, top: 24, right: 39, bottom: 39 }], 6, 6), 6)).toEqual([
      [1, 1],
      [2, 1],
      [3, 1],
      [1, 2],
      [2, 2],
      [3, 2],
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
    // Partly off-screen: clamped at the top-left edge.
    expect(cells(buildGrid([{ left: -50, top: -50, right: 10, bottom: 10 }], 4, 4), 4)).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ]);
  });
});

describe("worldToCell", () => {
  it("clamps coordinates to the grid", () => {
    expect(worldToCell(-10, -10, 4, 4)).toBe(0);
    expect(worldToCell(999, 999, 4, 4)).toBe(15);
  });
});

describe("nearestWalkable", () => {
  it("returns the same cell when already walkable", () => {
    const grid = openGrid(3, 3);
    expect(nearestWalkable(4, grid, 3, 3)).toBe(4);
  });

  it("finds the nearest open neighbor", () => {
    const grid = openGrid(3, 3);
    blockedCell(grid, 3, 1, 1);
    expect(nearestWalkable(4, grid, 3, 3)).not.toBe(4);
    expect(grid[nearestWalkable(4, grid, 3, 3)]).toBe(0);
  });
});

describe("findRoute", () => {
  it("returns a single point when start equals goal", () => {
    const grid = openGrid(4, 4);
    const path = findRoute(5, 5, grid, 4, 4);
    expect(path).toHaveLength(1);
    expect(path[0]).toEqual({ x: 24, y: 24 });
  });

  it("routes around a wall without crossing a blocked cell", () => {
    const grid = openGrid(5, 3);
    blockedCell(grid, 5, 2, 0);
    blockedCell(grid, 5, 2, 2);

    const path = findRoute(0, 14, grid, 5, 3);
    expect(path.length).toBeGreaterThan(1);
    expect(path[0]).toEqual({ x: 8, y: 8 });
    expect(path.at(-1)).toEqual({ x: 72, y: 40 });
    expect(crossesWall(path, grid, 5, 3)).toBe(false);
  });

  it("takes the straight diagonal across an open grid", () => {
    expect(findRoute(0, 35, openGrid(6, 6), 6, 6)).toEqual([
      { x: 8, y: 8 },
      { x: 88, y: 88 },
    ]);
  });

  it("finds the shortest way through a maze", () => {
    // Two gaps in a wall: the near one at row 1 is the short way round.
    const cols = 9,
      rows = 9;
    const grid = openGrid(cols, rows);
    for (let row = 0; row < rows; row++)
      if (row !== 1 && row !== 8) blockedCell(grid, cols, 4, row);
    const path = findRoute(
      worldToCell(8, 24, cols, rows),
      worldToCell(136, 24, cols, rows),
      grid,
      cols,
      rows,
    );
    expect(crossesWall(path, grid, cols, rows)).toBe(false);
    expect(path.every((point) => point.y === 24)).toBe(true);
  });

  it("does not cut diagonally between touching blocked cells", () => {
    const grid = new Uint8Array([0, 1, 1, 0]);
    expect(findRoute(0, 3, grid, 2, 2)).toEqual([]);
  });

  it("returns empty when no route exists", () => {
    const grid = openGrid(3, 3);
    for (let i = 0; i < grid.length; i++) {
      grid[i] = 1;
    }
    grid[0] = 0;
    grid[8] = 0;
    expect(findRoute(0, 8, grid, 3, 3)).toEqual([]);
  });
});
