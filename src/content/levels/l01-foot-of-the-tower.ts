import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Placeholder for level 1 (remake plan 1): a plain two-screen stair so the game and the checks run while the
 * real hand-made levels are drawn. Plan 4 replaces it with The Foot of the Tower.
 */
export const L01: LevelDef = {
  id: 1,
  theme: 'overgrown',
  legend: {},
  entry: [1, 3, 30],
  exit: [0, 14, 8],
  load: 1,
  screens: [
    blockout([
      [10, 9, 10, 1, '#'], // the exit
      [24, 15, 8, 1, '#'],
      [38, 21, 8, 1, '#'],
      [24, 27, 8, 1, '#'],
      [10, 33, 8, 1, '#'],
    ]),
    blockout([
      [1, 31, 58, 3, '#'], // floor
      [3, 30, 1, 1, '@'],
      [24, 7, 8, 1, '#'],
      [38, 13, 8, 1, '#'],
      [24, 19, 8, 1, '#'],
      [10, 25, 8, 1, '#'],
    ]),
  ],
};
