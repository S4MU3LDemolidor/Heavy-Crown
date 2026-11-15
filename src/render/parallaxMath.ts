import { PARALLAX, type LayerName } from '../art/backdrop';
import type { World } from '../game/level';
import { SCREEN_H, VIEW_CROP, VIEW_H } from '../game/tuning';

/** The bands (top-down indices) a level occupies. */
export function levelBands(world: World, levelIndex: number): { top: number; bottom: number } {
  let top = -1;
  let bottom = -1;
  world.bandLevel.forEach((l, b) => {
    if (l !== levelIndex) return;
    if (top < 0) top = b;
    bottom = b;
  });
  return { top, bottom };
}

/** Pixel span of a level from its top screen to its bottom screen (0 for a one-screen level). */
export function levelSpan(world: World, levelIndex: number): number {
  const { top, bottom } = levelBands(world, levelIndex);
  return (bottom - top) * SCREEN_H;
}

/** Screen y of a parallax layer's top edge for camera y `camY`. At the level's bottom screen the layer's bottom meets the view's bottom. */
export function layerY(world: World, levelIndex: number, layer: LayerName, layerH: number, camY: number): number {
  const { bottom } = levelBands(world, levelIndex);
  const bottomCamY = bottom * SCREEN_H + VIEW_CROP;
  return Math.round(VIEW_H - layerH + (bottomCamY - camY) * PARALLAX[layer]);
}
