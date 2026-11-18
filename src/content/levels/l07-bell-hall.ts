import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Level 7, The Bell Hall (remake spec 4.2). The Grappling Hook on an early ledge; hanging bells for stepping stones
 * that ring under every landing; an iron ring for a shortcut; a plank bridge to a coin pouch that will not hold a
 * heavy climber. Maren's seventh note. Load 7 st (The Words, the map, the claws, the hook). Screens top first.
 */
export const L07: LevelDef = {
  id: 7,
  theme: 'bells',
  legend: {
    k: { kind: 'item', item: 'hook' },
    B: { kind: 'object', object: 'bell' },
    n: { kind: 'object', object: 'note', props: { id: 'note7' } },
    c: { kind: 'item', item: 'coin_pouch' },
  },
  entry: [2, 48, 32],
  exit: [0, 29, 6],
  load: 7,
  needs: ['claws', 'hook'],
  screens: [
    // the top: a bell to land on, up to the exit
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [30, 32, 6, 1, '#'],
      [16, 26, 6, 1, '#'],
      [30, 20, 4, 3, 'B'],
      [42, 14, 6, 1, '#'],
      [26, 7, 8, 1, '#'], // the exit
      [0, 12, 2, 10, '.'],
    ]),
    // the middle: ledges and a bell; a ring for the hook; Maren's seventh note; a plank bridge that breaks under weight
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [42, 31, 6, 1, '#'],
      [30, 25, 5, 1, '#'],
      [30, 22, 1, 1, '*'],
      [16, 19, 6, 1, '#'],
      [28, 13, 4, 3, 'B'],
      [40, 6, 6, 1, '#'],
      [42, 5, 1, 1, 'n'],
      [46, 6, 10, 1, '='], // a hinged plank bridge
      [56, 6, 2, 1, '#'],
      [56, 5, 1, 1, 'c'],
    ]),
    // the bottom: the way in, the Grappling Hook, two bells to climb by
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [46, 33, 6, 1, '#'], // where the climb comes in
      [34, 27, 6, 1, '#'],
      [44, 21, 6, 1, '#'],
      [46, 20, 1, 1, 'k'],
      [34, 15, 4, 3, 'B'],
      [22, 10, 4, 3, 'B'],
      [32, 5, 6, 1, '#'],
      [0, 10, 2, 10, '.'],
    ]),
  ],
};
