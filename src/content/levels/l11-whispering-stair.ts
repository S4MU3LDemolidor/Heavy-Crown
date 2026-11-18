import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Level 11, The Whispering Stair (remake spec 4.2). A wall whose foot is cracked stone, and the Pickaxe that breaks
 * it lying in the same room (three stones heavier while you carry it); Oskar again, now selling oil for the
 * lantern; a Hollow One right behind you when you turn (a scare). Maren's eleventh note. Load 8 st.
 * Screens top first.
 */
export const L11: LevelDef = {
  id: 11,
  theme: 'dark',
  legend: {
    x: { kind: 'item', item: 'pickaxe' },
    O: { kind: 'object', object: 'npc', props: { id: 'oskar', scene: 'l11' } },
    W: { kind: 'object', object: 'npc', props: { id: 'hollow', scene: 'l11' } },
    h: { kind: 'object', object: 'scare', props: { id: 'behindyou', kind: 'hollow', cond: 'faceAway', w: 8, h: 5 } },
    n: { kind: 'object', object: 'note', props: { id: 'note11' } },
  },
  entry: [2, 30, 32],
  exit: [0, 25, 6],
  load: 8,
  needs: ['claws', 'hook'],
  screens: [
    // the top: Oskar on his landing; Maren's eleventh note; something behind you; the exit
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [26, 32, 6, 1, '#'],
      [12, 26, 8, 1, '#'],
      [14, 25, 1, 1, 'O'],
      [17, 25, 1, 1, 'h'],
      [24, 20, 6, 1, '#'],
      [26, 19, 1, 1, 'n'],
      [36, 14, 6, 1, '#'],
      [22, 7, 8, 1, '#'], // the exit
    ]),
    // the middle: the room with the cracked wall and the Pickaxe; the stair beyond it
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [50, 31, 6, 1, '#'],
      [2, 24, 48, 1, '#'], // the floor, open at cols 50-55
      [56, 24, 2, 1, '#'],
      [30, 4, 1, 15, '#'], // the wall, cracked at its foot
      [30, 19, 1, 5, 'C'],
      [31, 4, 27, 2, '#'], // the room's ceiling
      [46, 23, 1, 1, 'x'],
      [40, 23, 1, 1, 'W'],
      [16, 18, 5, 1, '#'],
      [4, 12, 5, 1, '#'],
      [16, 6, 6, 1, '#'],
    ]),
    // the bottom: the way in, a stair of ledges through the dark
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [28, 33, 6, 1, '#'], // where the climb comes in
      [16, 27, 6, 1, '#'],
      [4, 21, 6, 1, '#'],
      [14, 15, 6, 1, '#'],
      [26, 10, 6, 1, '#'],
      [38, 5, 6, 1, '#'],
    ]),
  ],
};
