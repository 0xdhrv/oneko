import { describe, expect, it } from "vitest";
import { shouldIncludeObstacleRect } from "./obstacle-filters";

describe("shouldIncludeObstacleRect", () => {
  it("rejects tiny obstacles", () => {
    expect(
      shouldIncludeObstacleRect(
        { left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 },
        800,
        600,
      ),
    ).toBe(false);
  });

  it("rejects off-screen obstacles", () => {
    expect(
      shouldIncludeObstacleRect(
        { left: -200, top: 0, right: -50, bottom: 100, width: 150, height: 100 },
        800,
        600,
      ),
    ).toBe(false);
  });

  it("rejects viewport-sized containers", () => {
    expect(
      shouldIncludeObstacleRect(
        { left: 0, top: 0, right: 800, bottom: 400, width: 800, height: 400 },
        800,
        600,
      ),
    ).toBe(false);
  });

  it("accepts normal obstacles", () => {
    expect(
      shouldIncludeObstacleRect(
        { left: 100, top: 100, right: 300, bottom: 200, width: 200, height: 100 },
        800,
        600,
      ),
    ).toBe(true);
  });
});
