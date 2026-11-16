import type { World } from './level';
import { findFootholds, type Foothold } from './reach';
import type { CollisionWorld } from './tiles';
import { SCREEN_ROWS, TILE, TUNING } from './tuning';

/** Lowest ledge row (within a screen) a climber can stand on without crossing into the screen above. */
export const MIN_STAND_ROW = Math.ceil(TUNING.bodyH / TILE);

/**
 * Places where a climber standing would poke into the screen above: the ledge is in its screen's top rows,
 * so the camera cuts the climber off or shows them standing on nothing. Every block should sit fully on
 * the screen it belongs to.
 */
export function crossingFootholds(world: World, collision: CollisionWorld = world.grid, levelIds?: number[]): Foothold[] {
  const ids = levelIds ? new Set(levelIds) : null;
  return findFootholds(world.grid, collision).filter((f) => {
    const band = Math.floor(f.ty / SCREEN_ROWS);
    if (ids && !ids.has(world.levels[world.bandLevel[band]]?.id)) return false;
    return f.ty % SCREEN_ROWS < MIN_STAND_ROW;
  });
}
