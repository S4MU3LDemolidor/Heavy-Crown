import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Level 14, The King in the Ice (remake spec 4.2). Hard climbing in the wind; the Old King frozen to the waist on
 * his landing, begging for the relics, offering his favour; his eyes open when you look away (a scare); the
 * memory of the night Maren left (memory 2). Maren's fourteenth note. Load 9 st. Screens top first.
 */
export const L14: LevelDef = {
  id: 14,
  theme: 'frozen',
  legend: {
    K: { kind: 'object', object: 'npc', props: { id: 'king', scene: 'l14' } },
    e: { kind: 'object', object: 'scare', props: { id: 'kingeyes', kind: 'eyes', cond: 'faceAway', w: 8, h: 5 } },
    m: { kind: 'object', object: 'scene', props: { id: 'memory2', w: 6, h: 4 } },
    n: { kind: 'object', object: 'note', props: { id: 'note14' } },
  },
  wind: [
    { screen: 0, dir: -1 },
    { screen: 2, dir: 1 },
  ],
  entry: [2, 38, 32],
  exit: [0, 29, 5],
  load: 9,
  needs: ['claws', 'hook', 'crampons'],
  screens: [
    // the top: into the wind, to the exit; Maren's fourteenth note
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [0, 4, 2, 22, '.'],
      [58, 4, 2, 22, '.'],
      [16, 33, 6, 1, '#'],
      [4, 27, 6, 1, 'i'],
      [16, 21, 6, 1, '#'],
      [28, 15, 6, 1, 'i'],
      [30, 14, 1, 1, 'n'],
      [40, 9, 6, 1, '#'],
      [26, 6, 8, 1, '#'], // the exit
    ]),
    // the middle: the Old King's landing; the second memory
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [10, 31, 6, 1, '#'],
      [20, 25, 30, 2, '#'], // the landing
      [34, 24, 1, 1, 'K'],
      [30, 24, 1, 1, 'e'],
      [53, 19, 4, 1, 'i'],
      [40, 13, 6, 1, '#'],
      [42, 12, 1, 1, 'm'],
      [28, 6, 6, 1, 'i'],
    ]),
    // the bottom: the way in, up the wind-scoured stair
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [0, 10, 2, 16, '.'],
      [36, 33, 6, 1, '#'], // where the climb comes in
      [48, 27, 6, 1, 'i'],
      [36, 21, 6, 1, '#'],
      [24, 15, 6, 1, 'i'],
      [36, 9, 6, 1, '#'],
      [24, 4, 6, 1, 'i'],
    ]),
  ],
};
