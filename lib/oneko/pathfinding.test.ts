import { describe, expect, it } from "vitest";
import { buildGrid, findRoute, nearestWalkable, worldToCell } from "./pathfinding";

function openGrid(cols: number, rows: number) {
  return new Uint8Array(cols * rows);
}

function blockedCell(grid: Uint8Array, cols: number, col: number, row: number) {
  grid[row * cols + col] = 1;
}

describe("buildGrid", () => {
  it("marks cells covered by obstacles as blocked", () => {
    const open = buildGrid([], 4, 4);
    const blocked = buildGrid([{ left: 24, top: 24, right: 39, bottom: 39 }], 4, 4);

    expect(open.every((cell) => cell === 0)).toBe(true);
    expect(blocked.some((cell) => cell === 1)).toBe(true);
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

  it("routes around a wall", () => {
    const grid = openGrid(5, 3);
    blockedCell(grid, 5, 2, 0);
    blockedCell(grid, 5, 2, 2);

    const path = findRoute(0, 14, grid, 5, 3);
    expect(path.length).toBeGreaterThan(1);
    expect(path.at(-1)).toEqual({ x: 72, y: 40 });
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
