import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Level 6, The Orb's Crown (remake spec 4.2). A climb through the cistern's flooded shaft to the Orb on its pedestal;
 * the next lift station beside it to send it up, and the campfire where Wren tells the Crow what they said that
 * night (fire scene 2). Maren's sixth note; a silver chalice. Load 6 st. Screens top first.
 */
export const L06: LevelDef = {
  id: 6,
  theme: 'cistern',
  legend: {
    O: { kind: 'item', item: 'orb' },
    L: { kind: 'object', object: 'lift', props: { net: 'a', order: 2 } },
    F: { kind: 'deco', deco: 'fire' },
    s: { kind: 'object', object: 'scene', props: { id: 'fire2', w: 6, h: 4 } },
    n: { kind: 'object', object: 'note', props: { id: 'note6' } },
    x: { kind: 'item', item: 'chalice' },
  },
  entry: [2, 8, 32],
  exit: [0, 39, 6],
  load: 6,
  screens: [
    // the top: the Orb's pedestal on the cistern's crown, the lift beside it, the campfire, the exit
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [36, 31, 6, 1, '#'],
      [46, 25, 6, 1, '#'],
      [8, 20, 34, 2, '#'], // the crown of the cistern
      [12, 17, 3, 3, '#'], // the pedestal
      [13, 16, 1, 1, 'O'],
      [20, 19, 1, 1, 'L'],
      [32, 19, 1, 1, 'F'],
      [27, 19, 1, 1, 's'],
      [48, 14, 6, 1, '#'],
      [36, 7, 8, 1, '#'], // the exit
      [2, 10, 4, 1, '#'],
      [3, 9, 1, 1, 'x'],
    ]),
    // the middle: a flooded basin to fall into, ledges zigzagging up past it; Maren's sixth note
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [20, 30, 20, 2, '#'], // the basin's floor
      [20, 26, 20, 4, '~'],
      [18, 26, 2, 6, '#'], // its lips
      [40, 26, 2, 6, '#'],
      [46, 30, 6, 1, '#'],
      [54, 24, 4, 1, '#'],
      [42, 18, 6, 1, '#'],
      [28, 13, 6, 1, '#'],
      [30, 12, 1, 1, 'n'],
      [14, 8, 6, 1, '#'],
      [26, 4, 6, 1, '#'],
    ]),
    // the bottom: the way in on the left, ledges up the cistern wall
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [4, 33, 8, 1, '#'], // where the climb comes in
      [16, 27, 6, 1, '#'],
      [30, 22, 6, 1, '#'],
      [44, 16, 6, 1, '#'],
      [28, 10, 6, 1, '#'],
      [40, 4, 6, 1, '#'],
      [2, 14, 6, 3, '#'],
    ]),
  ],
};
