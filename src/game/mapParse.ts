import { SCREEN_COLS, SCREEN_ROWS, TILE, TUNING } from './tuning';
import { Tile, TileGrid } from './tiles';

export interface ParsedTower {
  grid: TileGrid;
  screenCount: number;
  /** Player start: top-left of the body in pixels, from the '@' marker. */
  start: { x: number; y: number };
}

const CHAR_TILES: Record<string, number> = {
  '#': Tile.Solid,
  ' ': Tile.Empty,
  '.': Tile.Empty,
  '@': Tile.Empty,
};

/** `screens` is ordered from the top of the tower down; each is 34 rows of 60 characters. */
export function parseTower(screens: string[][]): ParsedTower {
  const cols = SCREEN_COLS;
  const rows = screens.length * SCREEN_ROWS;
  const cells = new Uint8Array(cols * rows);
  let start: { x: number; y: number } | null = null;

  for (let si = 0; si < screens.length; si++) {
    const screen = screens[si];
    if (screen.length !== SCREEN_ROWS) {
      throw new Error(`screen ${si}: expected ${SCREEN_ROWS} rows, got ${screen.length}`);
    }
    for (let ry = 0; ry < SCREEN_ROWS; ry++) {
      const line = screen[ry];
      if (line.length !== cols) {
        throw new Error(`screen ${si} row ${ry}: expected ${cols} columns, got ${line.length}`);
      }
      const ty = si * SCREEN_ROWS + ry;
      for (let tx = 0; tx < cols; tx++) {
        const ch = line[tx];
        const tile = CHAR_TILES[ch];
        if (tile === undefined) {
          throw new Error(`screen ${si} row ${ry} col ${tx}: unknown character '${ch}'`);
        }
        cells[ty * cols + tx] = tile;
        if (ch === '@') {
          if (start) throw new Error('more than one @ start marker');
          start = {
            x: tx * TILE + Math.floor((TILE - TUNING.bodyW) / 2),
            y: (ty + 1) * TILE - TUNING.bodyH,
          };
        }
      }
    }
  }

  if (!start) throw new Error('no @ start marker');
  return { grid: new TileGrid(cols, rows, cells), screenCount: screens.length, start };
}
