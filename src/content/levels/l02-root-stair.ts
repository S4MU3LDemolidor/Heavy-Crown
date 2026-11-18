import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Level 2, The Root Stair (remake spec 4.2). A climb past the Rope Coil; then an iron gate shuts the way up, and its
 * key lies at the bottom of a pit too deep to jump out of, so the rope has to be hung on the hook at the pit's rim.
 * Maren's second note on the way; the Crow at the top; a chalice on a ledge only a light climber reaches.
 * Load 4 st (The Words, the map, the rope). Screens top first.
 */
export const L02: LevelDef = {
  id: 2,
  theme: 'overgrown',
  legend: {
    r: { kind: 'item', item: 'rope' },
    k: { kind: 'item', item: 'iron_key' },
    j: { kind: 'object', object: 'rope_hook' },
    G: { kind: 'object', object: 'gate', props: { key: 'iron_key' } },
    n: { kind: 'object', object: 'note', props: { id: 'note2' } },
    c: { kind: 'item', item: 'coin_pouch' },
    x: { kind: 'item', item: 'chalice' },
    o: { kind: 'object', object: 'npc', props: { id: 'crow', scene: 'l2' } },
  },
  entry: [2, 33, 32],
  exit: [0, 23, 7],
  load: 4,
  screens: [
    // the top: a long switchback to the exit past the Crow; the chalice high on the right for the light-footed
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [0, 16, 2, 8, '.'],
      [46, 32, 6, 1, '#'],
      [32, 26, 6, 1, '#'],
      [40, 15, 4, 1, '#'],
      [41, 14, 1, 1, 'x'],
      [18, 20, 6, 1, '#'],
      [6, 14, 6, 1, '#'],
      [8, 13, 1, 1, 'o'],
      [20, 8, 8, 1, '#'], // the exit
      [50, 18, 8, 4, '#'], // a root-choked buttress
    ]),
    // the middle: the pit with the key, the hook at its rim, the gate beyond it; Maren's second note
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [2, 4, 45, 2, '#'], // the ceiling: the only way on is through the gate
      [16, 30, 6, 1, '#'],
      [4, 22, 6, 1, '#'],
      [6, 21, 1, 1, 'n'],
      [22, 22, 5, 1, '#'],
      [30, 14, 28, 20, '#'], // the great block
      [36, 14, 10, 15, ' '], // the pit cut into it
      [35, 13, 1, 1, 'j'],
      [40, 28, 1, 1, 'k'],
      [47, 4, 1, 10, '#'], // the wall with the gate
      [47, 10, 1, 4, 'G'],
      [52, 7, 5, 1, '#'],
    ]),
    // the bottom: the way in, the Rope Coil, a coin pouch off to the side
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [30, 33, 8, 1, '#'], // where the climb comes in
      [44, 27, 6, 1, '#'],
      [52, 20, 5, 1, '#'],
      [38, 14, 6, 1, '#'],
      [40, 13, 1, 1, 'r'],
      [24, 9, 6, 1, '#'],
      [10, 4, 6, 1, '#'],
      [4, 16, 4, 1, '#'],
      [5, 15, 1, 1, 'c'],
      [0, 22, 2, 7, '.'],
    ]),
  ],
};
