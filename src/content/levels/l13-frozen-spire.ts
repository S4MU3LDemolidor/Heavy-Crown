import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Level 13, The Frozen Spire (remake spec 4.2). The Crampons on an icy first ledge; the Fur Cloak on the first
 * windswept screen; the memory of the night before Maren left begins (memory 1). Maren's thirteenth note. Load 9 st
 * (The Words, the claws, the hook, the crampons, the cloak). Screens top first.
 */
export const L13: LevelDef = {
  id: 13,
  theme: 'frozen',
  legend: {
    c: { kind: 'item', item: 'crampons' },
    k: { kind: 'item', item: 'fur_cloak' },
    m: { kind: 'object', object: 'scene', props: { id: 'memory1', w: 6, h: 4 } },
    n: { kind: 'object', object: 'note', props: { id: 'note13' } },
  },
  wind: [{ screen: 1, dir: 1 }],
  entry: [2, 32, 32],
  exit: [0, 25, 5],
  load: 9,
  needs: ['claws', 'hook', 'crampons'],
  screens: [
    // the top: the spire's open flank under the stars, to the exit
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [0, 6, 2, 16, '.'],
      [58, 10, 2, 14, '.'],
      [36, 33, 6, 1, '#'],
      [24, 27, 6, 1, 'i'],
      [26, 26, 1, 1, 'n'],
      [12, 21, 6, 1, '#'],
      [24, 15, 6, 1, 'i'],
      [36, 9, 6, 1, '#'],
      [22, 6, 8, 1, '#'], // the exit
    ]),
    // the middle: the wind; the Fur Cloak; the first memory
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [0, 8, 2, 18, '.'],
      [58, 4, 2, 20, '.'],
      [50, 31, 6, 1, '#'],
      [38, 25, 6, 1, 'i'],
      [40, 24, 1, 1, 'k'],
      [26, 19, 6, 1, '#'],
      [14, 13, 6, 1, '#'],
      [16, 12, 1, 1, 'm'],
      [26, 6, 6, 1, 'i'],
    ]),
    // the bottom: the way in; the Crampons on the first ice
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [30, 33, 6, 1, '#'], // where the climb comes in
      [18, 27, 6, 1, 'i'],
      [20, 26, 1, 1, 'c'],
      [6, 21, 6, 1, '#'],
      [16, 15, 6, 1, 'i'],
      [28, 10, 6, 1, '#'],
      [40, 4, 6, 1, 'i'],
    ]),
  ],
};
