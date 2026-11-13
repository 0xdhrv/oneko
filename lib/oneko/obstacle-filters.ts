import { MIN_OBSTACLE_AREA } from "./constants";

type RectLike = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export function shouldIncludeObstacleRect(
  rect: RectLike,
  viewportWidth: number,
  viewportHeight: number,
): boolean {
  if (rect.width * rect.height < MIN_OBSTACLE_AREA) {
    return false;
  }
  if (rect.right < 0 || rect.bottom < 0 || rect.left > viewportWidth || rect.top > viewportHeight) {
    return false;
  }
  if (rect.width > viewportWidth * 0.85 && rect.height > viewportHeight * 0.5) {
    return false;
  }
  return true;
}
