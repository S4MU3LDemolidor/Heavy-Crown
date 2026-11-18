import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Level 3, The Hoarder's Hollow (remake spec 4.2). Oskar's junk-filled hollow, where he sells the Climbing Claws;
 * an ivy shortcut for those who bought them; a free pair below the first ivy wall that no one climbs without them;
 * the campfire at the top where the Crow and Wren talk (fire scene 1). Load 5 st (The Words, the map, the claws).
 * Screens top first.
 */
export const L03: LevelDef = {
  id: 3,
  theme: 'overgrown',
  legend: {
    O: { kind: 'object', object: 'npc', props: { id: 'oskar', scene: 'l3' } },
    w: { kind: 'item', item: 'claws' },
    f: { kind: 'item', item: 'feather_charm' },
    n: { kind: 'object', object: 'note', props: { id: 'note3' } },
    F: { kind: 'deco', deco: 'fire' },
    s: { kind: 'object', object: 'scene', props: { id: 'fire1', w: 6, h: 4 } },
  },
  entry: [2, 35, 32],
  exit: [0, 46, 6],
  load: 5,
  needs: ['claws'],
  requires: ['claws'],
  screens: [
    // the top: the ivy wall's last stretch, the campfire, Maren's third note, the exit
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [22, 12, 3, 22, '%'], // the ivy wall, from below
      [28, 12, 30, 2, '#'], // past its top, the campfire's floor
      [40, 11, 1, 1, 'F'],
      [34, 11, 1, 1, 's'],
      [44, 7, 8, 1, '#'], // the exit
      [50, 6, 1, 1, 'n'],
      [2, 20, 4, 1, '#'],
      [0, 22, 2, 8, '.'],
    ]),
    // the middle: the free claws below the ivy wall, a feather on a high ledge
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [22, 0, 3, 18, '%'], // the ivy wall rises from here, too high to jump
      [25, 15, 12, 3, '#'], // the ledge at its foot
      [30, 14, 1, 1, 'w'],
      [44, 26, 8, 1, '#'],
      [50, 20, 6, 1, '#'],
      [40, 30, 5, 1, '#'],
      [6, 30, 5, 1, '#'], // the shortcut's side path, up to a feather
      [12, 22, 4, 1, '#'],
      [4, 14, 5, 1, '#'],
      [6, 13, 1, 1, 'f'],
    ]),
    // the bottom: the climb comes in on the right; Oskar's raised hollow, heaped with junk; an ivy shortcut
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [32, 33, 8, 1, '#'], // where the climb comes in
      [44, 27, 6, 1, '#'],
      [2, 22, 26, 4, '#'], // the hollow's floor
      [8, 21, 1, 1, 'O'],
      [2, 18, 4, 4, '#'], // junk heaped against the wall
      [12, 19, 3, 3, '#'],
      [20, 20, 2, 2, '#'],
      [2, 4, 3, 14, '%'], // an ivy shortcut for those with claws
      [34, 15, 6, 1, '#'],
      [48, 9, 6, 1, '#'],
      [36, 4, 6, 1, '#'],
    ]),
  ],
};
