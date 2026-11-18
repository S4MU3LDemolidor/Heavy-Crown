import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Level 15, The Summit (remake spec 4.2). The last climb, with one relic at most: wind and ice to the open top of
 * the tower, where the altar stands under the dead sky and Maren kneels beside it; the fifth lift station; Maren's
 * last note. Load 8 st (The Words, the crampons, the cloak, one relic). Screens top first.
 */
export const L15: LevelDef = {
  id: 15,
  theme: 'frozen',
  legend: {
    A: { kind: 'object', object: 'altar' },
    M: { kind: 'object', object: 'npc', props: { id: 'maren', scene: 'l15' } },
    L: { kind: 'object', object: 'lift', props: { net: 'a', order: 5 } },
    n: { kind: 'object', object: 'note', props: { id: 'note15' } },
  },
  wind: [{ screen: 1, dir: -1 }],
  entry: [2, 42, 32],
  exit: [0, 33, 25],
  load: 8,
  needs: ['crampons'],
  screens: [
    // the top: the summit plateau under the open sky; the altar; Maren; the last lift; the last note
    blockout([
      [0, 0, 60, 26, '.'],
      [0, 26, 2, 8, '#'],
      [58, 26, 2, 8, '#'],
      [10, 26, 40, 3, '#'], // the plateau
      [30, 25, 1, 1, 'A'],
      [26, 25, 1, 1, 'M'],
      [42, 25, 1, 1, 'L'],
      [14, 25, 1, 1, 'n'],
      [53, 33, 4, 1, '#'],
    ]),
    // the middle: the last stair, into the wind
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [0, 6, 2, 20, '.'],
      [58, 6, 2, 20, '.'],
      [16, 31, 6, 1, '#'],
      [28, 25, 6, 1, 'i'],
      [40, 19, 6, 1, '#'],
      [28, 13, 6, 1, 'i'],
      [40, 7, 6, 1, '#'],
      [44, 5, 6, 1, '#'],
    ]),
    // the bottom: the way in
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [40, 33, 6, 1, '#'], // where the climb comes in
      [28, 27, 6, 1, 'i'],
      [16, 21, 6, 1, '#'],
      [28, 15, 6, 1, 'i'],
      [40, 9, 6, 1, '#'],
      [28, 4, 6, 1, 'i'],
    ]),
  ],
};
