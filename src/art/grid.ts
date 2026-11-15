import { PixelBuffer } from './buffer';
import type { RGBA } from './color';

/**
 * Parses a palette-letter grid into a buffer. Each string is a row; each character is looked up in `legend`;
 * '.' and ' ' are transparent. Throws on unknown characters or ragged rows.
 */
export function parseGrid(rows: string[], legend: Record<string, RGBA>): PixelBuffer {
  const w = rows[0]?.length ?? 0;
  const buf = new PixelBuffer(w, rows.length);
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`grid row ${y} is ${row.length} wide, expected ${w}`);
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const c = legend[ch];
      if (c === undefined) throw new Error(`grid row ${y} col ${x}: unknown letter '${ch}'`);
      buf.set(x, y, c);
    }
  });
  return buf;
}
