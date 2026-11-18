import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Level 12, The Ossuary (remake spec 4.2). The Bone Key on a ledge off the climb; the Seal behind the ossuary's bone
 * door; the fourth lift station and the campfire where the Crow admits who sent it (fire scene 4). Maren's twelfth
 * note. Load 8 st. Screens top first.
 */
export const L12: LevelDef = {
  id: 12,
  theme: 'dark',
  legend: {
    k: { kind: 'item', item: 'bone_key' },
    D: { kind: 'object', object: 'gate', props: { key: 'bone_key' } },
    S: { kind: 'item', item: 'seal' },
    L: { kind: 'object', object: 'lift', props: { net: 'a', order: 4 } },
    F: { kind: 'deco', deco: 'fire' },
    s: { kind: 'object', object: 'scene', props: { id: 'fire4', w: 6, h: 4 } },
    W: { kind: 'object', object: 'npc', props: { id: 'hollow', scene: 'l12' } },
    n: { kind: 'object', object: 'note', props: { id: 'note12' } },
  },
  entry: [2, 38, 32],
  exit: [0, 45, 6],
  load: 8,
  needs: ['claws', 'hook'],
  screens: [
    // the top: the ossuary landing; the bone door and the Seal behind it; the lift; the campfire; the exit
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [40, 32, 6, 1, '#'],
      [2, 26, 36, 2, '#'], // the landing
      [2, 19, 12, 1, '#'], // the ossuary's roof
      [13, 20, 1, 2, '#'],
      [13, 22, 1, 4, 'D'],
      [6, 25, 1, 1, 'S'],
      [20, 25, 1, 1, 'L'],
      [30, 25, 1, 1, 'F'],
      [25, 25, 1, 1, 's'],
      [42, 20, 6, 1, '#'],
      [30, 14, 6, 1, '#'],
      [42, 7, 8, 1, '#'], // the exit
    ]),
    // the middle: a floor of bones where a Hollow One waits; Maren's twelfth note
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [34, 32, 6, 1, '#'],
      [22, 26, 6, 1, '#'],
      [2, 20, 14, 1, '#'],
      [8, 19, 1, 1, 'W'],
      [3, 19, 1, 1, 'n'],
      [18, 14, 6, 1, '#'],
      [30, 6, 6, 1, '#'],
    ]),
    // the bottom: the way in; the Bone Key on a ledge off to the side
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [36, 33, 6, 1, '#'], // where the climb comes in
      [48, 27, 6, 1, '#'],
      [36, 21, 6, 1, '#'],
      [24, 15, 5, 1, '#'],
      [26, 14, 1, 1, 'k'],
      [46, 15, 6, 1, '#'],
      [34, 9, 6, 1, '#'],
      [46, 4, 6, 1, '#'],
    ]),
  ],
};
