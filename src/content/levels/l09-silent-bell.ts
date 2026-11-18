import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Level 9, The Silent Bell (remake spec 4.2). The Bell Door hides a Gilded Idol worth a fortune and five stones; the
 * great bell nobody rings rings, and something sits on it (a scare); at the top the Scepter on its plinth, the third
 * lift station and the campfire where Wren is angry at Maren (fire scene 3). Maren's ninth note. Load 7 st.
 * Screens top first.
 */
export const L09: LevelDef = {
  id: 9,
  theme: 'bells',
  legend: {
    D: { kind: 'object', object: 'gate', props: { key: 'bell_key' } },
    I: { kind: 'item', item: 'idol' },
    B: { kind: 'object', object: 'bell' },
    f: { kind: 'object', object: 'scare', props: { id: 'bellfigure', kind: 'figure', w: 8, h: 5 } },
    S: { kind: 'item', item: 'scepter' },
    L: { kind: 'object', object: 'lift', props: { net: 'a', order: 3 } },
    F: { kind: 'deco', deco: 'fire' },
    s: { kind: 'object', object: 'scene', props: { id: 'fire3', w: 6, h: 4 } },
    n: { kind: 'object', object: 'note', props: { id: 'note9' } },
  },
  entry: [2, 50, 32],
  exit: [0, 45, 6],
  load: 7,
  needs: ['claws', 'hook'],
  screens: [
    // the top: the Scepter on its plinth, the lift, the campfire; up to the exit
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [36, 33, 6, 1, '#'],
      [2, 26, 30, 2, '#'], // the belfry's top floor
      [6, 23, 3, 3, '#'], // the plinth
      [7, 22, 1, 1, 'S'],
      [14, 25, 1, 1, 'L'],
      [24, 25, 1, 1, 'F'],
      [19, 25, 1, 1, 's'],
      [40, 20, 6, 1, '#'],
      [28, 14, 6, 1, '#'],
      [42, 7, 8, 1, '#'], // the exit
    ]),
    // the middle: the great bell that rings by itself, and what sits on it; Maren's ninth note
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [26, 31, 6, 1, '#'],
      [12, 25, 6, 1, '#'],
      [24, 19, 8, 4, 'B'], // the Silent Bell
      [28, 18, 1, 1, 'f'],
      [40, 13, 6, 1, '#'],
      [42, 12, 1, 1, 'n'],
      [26, 7, 6, 1, '#'],
    ]),
    // the bottom: the way in; the Bell Door and the idol behind it
    blockout([
      [0, 0, 2, 34, '#'],
      [58, 0, 2, 34, '#'],
      [48, 33, 6, 1, '#'], // where the climb comes in
      [36, 27, 6, 1, '#'],
      [22, 21, 6, 1, '#'],
      [2, 16, 16, 1, '#'], // the idol room's floor and the step outside its door
      [2, 9, 11, 1, '#'],
      [12, 10, 1, 2, '#'],
      [12, 12, 1, 4, 'D'],
      [5, 15, 1, 1, 'I'],
      [34, 15, 6, 1, '#'],
      [48, 9, 6, 1, '#'],
      [36, 4, 6, 1, '#'],
    ]),
  ],
};
