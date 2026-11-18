import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Level 5, Nell's Landing (remake spec 4.2). Nell keeps the first lift station on a wide landing over the water;
 * the Spring Boots wait in an alcove behind a plate gate, with a stone to hold it. Maren's fifth note. Load 6 st.
 * Screens top first.
 */
export const L05: LevelDef = {
  id: 5,
  theme: 'cistern',
  legend: {
    N: { kind: 'object', object: 'npc', props: { id: 'nell', scene: 'l5' } },
    L: { kind: 'object', object: 'lift', props: { net: 'a', order: 1 } },
    b: { kind: 'item', item: 'spring_boots' },
    s: { kind: 'item', item: 'stone' },
    p: { kind: 'object', object: 'plate', props: { link: 'boots', need: 3 } },
    P: { kind: 'object', object: 'gate', props: { link: 'boots' } },
    n: { kind: 'object', object: 'note', props: { id: 'note5' } },
    c: { kind: 'item', item: 'coin_pouch' },
  },
  entry: [2, 48, 32],
  exit: [0, 15, 7],
  load: 6,
  screens: [
    // the top: water falling past broken ledges to the exit
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [46, 32, 6, 1, '#'],
      [30, 27, 6, 1, '#'],
      [44, 21, 5, 1, '#'],
      [28, 15, 6, 1, '#'],
      [12, 8, 8, 1, '#'], // the exit
      [4, 20, 5, 1, '#'],
      [5, 19, 1, 1, 'c'],
      [54, 4, 4, 12, '#'],
    ]),
    // the middle: Maren's fifth note on a ledge by the lift rope
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [26, 31, 6, 1, '#'],
      [12, 25, 6, 1, '#'],
      [14, 24, 1, 1, 'n'],
      [26, 19, 5, 1, '#'],
      [40, 13, 6, 1, '#'],
      [50, 7, 6, 1, '#'],
      [2, 10, 6, 6, '#'],
    ]),
    // the bottom: the way in, Nell's landing with the lift, the boots' alcove and its plate
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [46, 33, 6, 1, '#'], // where the climb comes in
      [52, 27, 5, 1, '#'],
      [2, 22, 44, 2, '#'], // the landing
      [26, 21, 1, 1, 'N'],
      [34, 21, 1, 1, 'L'],
      [2, 15, 12, 1, '#'], // the alcove's roof
      [13, 16, 1, 2, '#'],
      [13, 18, 1, 4, 'P'],
      [6, 21, 1, 1, 'b'],
      [40, 21, 1, 1, 'p'],
      [44, 21, 1, 1, 's'],
      [2, 24, 30, 3, '~'], // water under the landing's edge
      [2, 27, 30, 1, '#'],
      [50, 16, 6, 1, '#'],
      [36, 10, 6, 1, '#'],
      [20, 5, 6, 1, '#'],
    ]),
  ],
};
