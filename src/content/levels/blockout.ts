import { SCREEN_COLS, SCREEN_ROWS } from '../../game/tuning';

/** A rectangle of one map character, in tiles: x, y, width, height, character. */
export type Fill = [x: number, y: number, w: number, h: number, ch: string];

/** One 60×34 screen of interior space with outer walls, filled with rectangles of map characters. */
export function blockout(fills: Fill[]): string[] {
  const g = Array.from({ length: SCREEN_ROWS }, () => Array<string>(SCREEN_COLS).fill(' '));
  for (const row of g) {
    row[0] = '#';
    row[SCREEN_COLS - 1] = '#';
  }
  for (const [x, y, w, h, ch] of fills) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g[y + j][x + i] = ch;
  return g.map((r) => r.join(''));
}
