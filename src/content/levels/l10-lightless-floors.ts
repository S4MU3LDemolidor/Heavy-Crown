import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Level 10, The Lightless Floors (remake spec 4.2). Maren's lantern, left burning at the edge of the dark; a long
 * corridor where the Hollow Ones stand and a face waits at the edge of the light (a scare); the only way on is an
 * iron ring above the corridor's far end. Maren's tenth note. Load 8 st (The Words, the claws, the hook, the
 * lantern). Screens top first.
 */
export const L10: LevelDef = {
  id: 10,
  theme: 'dark',
  legend: {
    l: { kind: 'item', item: 'lantern' },
    W: { kind: 'object', object: 'npc', props: { id: 'hollow', scene: 'l10' } },
    f: { kind: 'object', object: 'scare', props: { id: 'lanternface', kind: 'face', cond: 'lantern', w: 6, h: 5 } },
    n: { kind: 'object', object: 'note', props: { id: 'note10' } },
  },
  entry: [2, 32, 32],
  exit: [0, 43, 6],
  load: 8,
  needs: ['claws', 'hook'],
  requires: ['hook'],
  screens: [
    // the top: up through the dark to the exit
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [40, 32, 6, 1, '#'],
      [27, 26, 6, 1, '#'],
      [14, 20, 6, 1, '#'],
      [27, 14, 6, 1, '#'],
      [40, 7, 8, 1, '#'], // the exit
    ]),
    // the middle: the corridor of the Hollow Ones; the ring above its far end; Maren's tenth note
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [52, 32, 6, 1, '#'],
      [2, 25, 44, 2, '#'], // the corridor
      [20, 24, 1, 1, 'W'],
      [34, 24, 1, 1, 'W'],
      [14, 24, 1, 1, 'f'],
      [3, 24, 1, 1, 'n'],
      [8, 14, 1, 1, '*'],
      [16, 12, 6, 1, '#'],
      [29, 6, 6, 1, '#'],
    ]),
    // the bottom: the way in; Maren's lantern still burning on a ledge
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [30, 33, 6, 1, '#'], // where the climb comes in
      [18, 28, 6, 1, '#'],
      [20, 27, 1, 1, 'l'],
      [6, 22, 6, 1, '#'],
      [18, 16, 6, 1, '#'],
      [30, 11, 6, 1, '#'],
      [42, 6, 6, 1, '#'],
    ]),
  ],
};
