import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * A playground for the Climbing Claws and the Grappling Hook (?moves). Bottom screen: an ivy wall,
 * a rough-stone chimney to wall-jump up, and a chain of rings. Top screen: more of each, to the top.
 */
export const TEST_MOVES: LevelDef = {
  id: 0,
  theme: 'overgrown',
  legend: {
    c: { kind: 'item', item: 'claws' },
    k: { kind: 'item', item: 'hook' },
  },
  screens: [
    blockout([
      [1, 31, 10, 1, '#'],
      [18, 26, 8, 1, '#'],
      [12, 4, 3, 22, '%'], // ivy wall reaching the top
      [30, 10, 2, 24, '&'], // rough pillar
      [40, 20, 1, 1, '*'],
      [47, 13, 1, 1, '*'],
      [40, 7, 1, 1, '*'],
      [46, 2, 12, 1, '#'], // the top
    ]),
    blockout([
      [1, 31, 58, 3, '#'], // floor
      [3, 30, 1, 1, '@'],
      [6, 30, 1, 1, 'c'],
      [8, 30, 1, 1, 'k'],
      [12, 12, 3, 19, '%'], // ivy wall
      [22, 4, 2, 27, '&'], // rough chimney
      [28, 4, 2, 27, '&'],
      [30, 4, 6, 1, '#'],
      [40, 22, 1, 1, '*'], // ring chain
      [47, 15, 1, 1, '*'],
      [53, 9, 1, 1, '*'],
      [38, 3, 9, 1, '#'],
    ]),
  ],
};
