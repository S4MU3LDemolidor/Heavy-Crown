import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Level 4, The Sunken Gate (remake spec 4.2). A shallow pool where something reaches out of the water (the first
 * scare); then a gate held shut by a pressure plate far from it, so a Counterweight Stone (or your own gear) has to be
 * left on the plate. Maren's fourth note; a ruby off the route. Load 5 st (The Words, the map, the claws, a coin).
 * Screens top first.
 */
export const L04: LevelDef = {
  id: 4,
  theme: 'cistern',
  legend: {
    s: { kind: 'item', item: 'stone' },
    p: { kind: 'object', object: 'plate', props: { link: 'sunken', need: 3 } },
    P: { kind: 'object', object: 'gate', props: { link: 'sunken' } },
    h: { kind: 'object', object: 'scare', props: { id: 'hand', kind: 'hand', w: 6, h: 4 } },
    n: { kind: 'object', object: 'note', props: { id: 'note4' } },
    y: { kind: 'item', item: 'ruby' },
  },
  entry: [2, 54, 32],
  exit: [0, 39, 7],
  load: 5,
  screens: [
    // the top: up past Maren's fourth note to the exit; a ruby on a high shelf
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [10, 32, 6, 1, '#'],
      [26, 26, 6, 1, '#'],
      [40, 20, 6, 1, '#'],
      [42, 19, 1, 1, 'n'],
      [52, 13, 4, 1, '#'],
      [53, 12, 1, 1, 'y'],
      [24, 14, 6, 1, '#'],
      [36, 8, 8, 1, '#'], // the exit
      [0, 10, 2, 9, '.'],
    ]),
    // the middle: the plate on the right, the gate in the wall on the left, the stone on a shelf above the plate
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [50, 31, 6, 1, '#'],
      [2, 24, 48, 1, '#'], // the floor, open at cols 50-55
      [56, 24, 2, 1, '#'],
      [30, 4, 1, 20, '#'], // the wall with the gate
      [30, 20, 1, 4, 'P'],
      [31, 4, 27, 2, '#'], // the plate room's ceiling
      [47, 23, 1, 1, 'p'],
      [38, 18, 4, 1, '#'],
      [44, 12, 5, 1, '#'],
      [46, 11, 1, 1, 's'],
      [16, 18, 5, 1, '#'],
      [4, 12, 5, 1, '#'],
      [18, 6, 6, 1, '#'],
    ]),
    // the bottom: the way in, the flooded floor with a rock to climb out by, something in the water
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [52, 33, 6, 1, '#'], // where the climb comes in
      [44, 27, 6, 1, '#'],
      [2, 32, 28, 2, '#'], // the pool's floor
      [2, 29, 28, 3, '~'],
      [30, 28, 2, 6, '#'], // its lip
      [10, 29, 4, 3, '#'], // a rock in the pool
      [18, 31, 1, 1, 'h'],
      [4, 22, 5, 1, '#'],
      [14, 16, 6, 1, '#'],
      [30, 11, 6, 1, '#'],
      [38, 6, 6, 1, '#'],
    ]),
  ],
};
