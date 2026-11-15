import type { LevelDef } from '../../game/level';
import { SCREEN_COLS, SCREEN_ROWS } from '../../game/tuning';

type Rect = [x: number, y: number, w: number, h: number];

/** Builds one 60×34 screen: outer walls, solid rectangles (in tiles) and an optional '@' start. */
function buildScreen(solids: Rect[], start?: [x: number, y: number]): string[] {
  const g = Array.from({ length: SCREEN_ROWS }, () => Array<string>(SCREEN_COLS).fill(' '));
  for (const row of g) {
    row[0] = '#';
    row[SCREEN_COLS - 1] = '#';
  }
  for (const [x, y, w, h] of solids) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g[y + j][x + i] = '#';
  }
  if (start) g[start[1]][start[0]] = '@';
  return g.map((row) => row.join(''));
}

/** Grey two-screen playground for tuning the jump (debug only). */
export const TEST_TOWER: LevelDef = {
  id: 0,
  theme: 'overgrown',
  legend: {},
  screens: [
    buildScreen([
      [40, 30, 8, 1],
      [26, 25, 8, 1],
      [12, 20, 8, 1],
      [2, 14, 6, 1],
      [14, 8, 10, 1],
      [30, 3, 28, 1],
    ]),
    buildScreen(
      [
        [1, 31, 58, 3], // floor
        [6, 27, 6, 1],
        [15, 22, 6, 1],
        [26, 16, 6, 1],
        [38, 9, 6, 1],
        [50, 3, 8, 1],
        [4, 19, 8, 2], // low ceiling block
        [33, 23, 2, 8], // pillar
      ],
      [3, 30],
    ),
  ],
};
