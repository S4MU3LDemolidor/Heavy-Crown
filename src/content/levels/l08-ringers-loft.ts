import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/** A tune bell: ringing the loft's four bells in the order 1-2-3-4 sets flag tune:loft. */
const tuneBell = (note: number) => ({ kind: 'object' as const, object: 'bell', props: { note, tune: 'loft' } });

/**
 * Level 8, The Ringer's Loft (remake spec 4.2). The Bellringer, who rang the summit bell, and Oskar, who should not
 * be up here, in a loft hung with four bells; the only door on is sealed until the bells are rung in the order of
 * her tune. Beyond it the Bell Key, then a gap only the Grappling Hook crosses. Maren's eighth note. Load 7 st.
 * Screens top first.
 */
export const L08: LevelDef = {
  id: 8,
  theme: 'bells',
  legend: {
    R: { kind: 'object', object: 'npc', props: { id: 'bellringer', scene: 'l8' } },
    O: { kind: 'object', object: 'npc', props: { id: 'oskar', scene: 'l8' } },
    '1': tuneBell(1),
    '2': tuneBell(2),
    '3': tuneBell(3),
    '4': tuneBell(4),
    G: { kind: 'object', object: 'gate', props: { flag: 'tune:loft' } },
    q: { kind: 'item', item: 'bell_key' },
    n: { kind: 'object', object: 'note', props: { id: 'note8' } },
  },
  entry: [2, 38, 32],
  exit: [0, 41, 6],
  load: 7,
  needs: ['claws', 'hook'],
  requires: ['hook'],
  screens: [
    // the top: back and forth to the exit
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [40, 30, 6, 1, '#'],
      [26, 24, 6, 1, '#'],
      [12, 18, 6, 1, '#'],
      [24, 12, 6, 1, '#'],
      [38, 7, 8, 1, '#'], // the exit
      [0, 20, 2, 9, '.'],
    ]),
    // the middle: an iron ring over a gap no jump crosses; Maren's eighth note
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [42, 33, 6, 1, '#'],
      [40, 20, 1, 1, '*'],
      [26, 16, 6, 1, '#'],
      [28, 15, 1, 1, 'n'],
      [38, 10, 6, 1, '#'],
      [50, 4, 6, 1, '#'],
      [2, 26, 8, 8, '#'],
    ]),
    // the bottom: the way in; the loft with its four bells, the Bellringer and Oskar; the sealed door; the Bell Key
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [36, 33, 6, 1, '#'], // where the climb comes in, under the opening in the loft's floor
      [2, 26, 32, 2, '#'], // the loft's floor, open at cols 34-41
      [42, 26, 16, 2, '#'],
      [2, 4, 40, 2, '#'], // its ceiling
      [42, 4, 1, 22, '#'], // its far wall, with the sealed door
      [42, 22, 1, 4, 'G'],
      [18, 16, 3, 3, '1'],
      [6, 16, 3, 3, '2'],
      [26, 16, 3, 3, '3'],
      [12, 16, 3, 3, '4'],
      [4, 25, 1, 1, 'R'],
      [30, 25, 1, 1, 'O'],
      [52, 20, 5, 1, '#'],
      [43, 14, 5, 1, '#'],
      [52, 7, 5, 1, '#'],
      [54, 6, 1, 1, 'q'],
    ]),
  ],
};
