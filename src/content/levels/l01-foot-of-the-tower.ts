import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Level 1, The Foot of the Tower (remake spec 4.2). The village at night, Wren's cottage, the tower's doorway;
 * inside, the first jumps; Maren's map on a ledge with a side trip to a coin pouch; the Crow on its perch beside
 * Maren's first note; the exit. Load 2 st (The Words and the map). Screens top first.
 */
export const L01: LevelDef = {
  id: 1,
  theme: 'overgrown',
  legend: {
    h: { kind: 'deco', deco: 'cottage' },
    l: { kind: 'deco', deco: 'lamp' },
    s: { kind: 'object', object: 'scene', props: { id: 'intro', w: 4, h: 4 } },
    m: { kind: 'item', item: 'map' },
    c: { kind: 'item', item: 'coin_pouch' },
    n: { kind: 'object', object: 'note', props: { id: 'note1' } },
    o: { kind: 'object', object: 'npc', props: { id: 'crow', scene: 'l1' } },
  },
  entry: [2, 5, 29],
  exit: [0, 25, 7],
  load: 2,
  screens: [
    // the top: the Crow's perch, Maren's first note, the exit
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [58, 4, 2, 13, '.'], // a broken window onto the night
      [56, 4, 2, 2, '#'],
      [50, 31, 6, 1, '#'],
      [36, 25, 6, 1, '#'],
      [20, 20, 8, 1, '#'],
      [22, 19, 1, 1, 'n'],
      [8, 13, 6, 1, '#'],
      [2, 12, 2, 2, '#'], // the perch's bracket in the wall
      [10, 12, 1, 1, 'o'],
      [22, 8, 8, 1, '#'], // the exit
    ]),
    // the middle: the first real climb, Maren's map, a coin pouch for the bold
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [0, 8, 2, 10, '.'], // the wall broken open to the sky
      [46, 30, 7, 1, '#'],
      [30, 23, 6, 1, '#'],
      [32, 22, 1, 1, 'm'],
      [14, 17, 8, 1, '#'],
      [6, 26, 3, 1, '#'],
      [7, 25, 1, 1, 'c'],
      [26, 10, 5, 1, '#'],
      [40, 5, 6, 1, '#'],
      [52, 14, 6, 3, '#'], // a ruined buttress
      [54, 17, 4, 4, '#'],
    ]),
    // the bottom: the village under the dead sky, the cottage, the tower's doorway, the first jumps inside
    blockout([
      [0, 0, 34, 30, '.'],
      [0, 30, 60, 4, '#'],
      [34, 4, 3, 18, '#'], // the tower's outer wall, its doorway below
      [33, 20, 5, 2, '#'], // the lintel
      [58, 0, 2, 30, '#'],
      [9, 29, 1, 1, 'h'],
      [24, 29, 1, 1, 'l'],
      [5, 29, 1, 1, '@'],
      [6, 29, 1, 1, 's'],
      [48, 24, 6, 1, '#'],
      [38, 18, 6, 1, '#'],
      [49, 11, 7, 1, '#'],
      [38, 4, 6, 1, '#'],
    ]),
  ],
};
