import type { ThemeId } from '../content/themes';
import { SCREEN_COLS, SCREEN_ROWS, TILE, TUNING } from './tuning';
import { Tile, TileGrid, type TileId } from './tiles';

/** What a legend character places in the world. */
export type LegendEntry =
  | { kind: 'item'; item: string }
  | { kind: 'object'; object: string; props?: Record<string, string | number> }
  | { kind: 'deco'; deco: string };

export interface LevelDef {
  id: number;
  theme: ThemeId;
  /** Screens from the top of the level down; each is 34 rows of 60 characters. */
  screens: string[][];
  /** Level-specific characters. Legend cells are interior empty space unless the entry says otherwise. */
  legend: Record<string, LegendEntry>;
  /** Screens (index within this level, 0 = top) with gusting wind and its direction. */
  wind?: { screen: number; dir: 1 | -1 }[];
  /** Where the climb comes in and goes out: [screen (0 = top), tile x, tile y of the cell the climber stands in]. */
  entry?: [number, number, number];
  exit?: [number, number, number];
  /** The load (stones) the route must support, and the items it needs. */
  load?: number;
  needs?: ('claws' | 'hook' | 'crampons')[];
  /** Moves the climb cannot be done without (the checker proves the route fails without each). */
  requires?: ('claws' | 'hook' | 'crampons')[];
}

export interface Spawn {
  char: string;
  entry: LegendEntry;
  tx: number;
  ty: number;
}

export interface World {
  grid: TileGrid;
  /** 1 where the cell is open air (no back wall; the sky shows through). */
  open: Uint8Array;
  /** Number of screens; bands are counted from the top of the tower. */
  screenCount: number;
  /** Level index (into `levels`) of each band, top-down. */
  bandLevel: number[];
  /** Levels from the bottom of the tower up. */
  levels: LevelDef[];
  /** Player start (top-left of the body, pixels), from the '@' marker. */
  start: { x: number; y: number };
  spawns: Spawn[];
  /** Wind direction per band (0 = no wind). */
  bandWind: number[];
}

/** Built-in characters that place objects. */
const OBJECT_CHARS: Record<string, LegendEntry> = {
  '=': { kind: 'object', object: 'plank' },
  C: { kind: 'object', object: 'cracked' },
  '*': { kind: 'object', object: 'ring' },
};

/** Built-in tile characters. */
const TILE_CHARS: Record<string, { tile: TileId; open?: boolean }> = {
  '#': { tile: Tile.Solid },
  ' ': { tile: Tile.Empty },
  '.': { tile: Tile.Empty, open: true },
  '~': { tile: Tile.Water },
  i: { tile: Tile.Ice },
  H: { tile: Tile.Ladder },
  '@': { tile: Tile.Empty },
  '%': { tile: Tile.Ivy },
  '&': { tile: Tile.Rough },
};

/** Builds the tower from levels listed bottom to top. */
export function buildWorld(levels: LevelDef[], opts: { requireStart?: boolean } = {}): World {
  const bands: { level: number; rows: string[] }[] = [];
  for (let li = levels.length - 1; li >= 0; li--) {
    for (const rows of levels[li].screens) bands.push({ level: li, rows });
  }
  const cols = SCREEN_COLS;
  const rows = bands.length * SCREEN_ROWS;
  const cells = new Uint8Array(cols * rows);
  const open = new Uint8Array(cols * rows);
  const spawns: Spawn[] = [];
  let start: { x: number; y: number } | null = null;

  bands.forEach((band, bi) => {
    const where = `level ${levels[band.level].id} screen ${bi}`;
    if (band.rows.length !== SCREEN_ROWS) throw new Error(`${where}: expected ${SCREEN_ROWS} rows, got ${band.rows.length}`);
    const legend = levels[band.level].legend;
    band.rows.forEach((line, ry) => {
      if (line.length !== cols) throw new Error(`${where} row ${ry}: expected ${cols} columns, got ${line.length}`);
      const ty = bi * SCREEN_ROWS + ry;
      for (let tx = 0; tx < cols; tx++) {
        const ch = line[tx];
        const i = ty * cols + tx;
        const base = TILE_CHARS[ch];
        if (base) {
          cells[i] = base.tile;
          open[i] = base.open ? 1 : 0;
        } else if (OBJECT_CHARS[ch]) {
          cells[i] = Tile.Empty;
          spawns.push({ char: ch, entry: OBJECT_CHARS[ch], tx, ty });
        } else if (legend[ch]) {
          cells[i] = Tile.Empty;
          spawns.push({ char: ch, entry: legend[ch], tx, ty });
        } else {
          throw new Error(`${where} row ${ry} col ${tx}: unknown character '${ch}'`);
        }
        if (ch === '@') {
          if (start) throw new Error('more than one @ start marker');
          start = { x: tx * TILE + Math.floor((TILE - TUNING.bodyW) / 2), y: (ty + 1) * TILE - TUNING.bodyH };
        }
      }
    });
  });
  if (!start) {
    if (opts.requireStart !== false) throw new Error('no @ start marker');
    start = { x: 0, y: 0 };
  }
  const bandWind = bands.map((band, bi) => {
    const level = levels[band.level];
    const first = bands.findIndex((b) => b.level === band.level);
    return level.wind?.find((w) => w.screen === bi - first)?.dir ?? 0;
  });
  return {
    bandWind,
    grid: new TileGrid(cols, rows, cells),
    open,
    screenCount: bands.length,
    bandLevel: bands.map((b) => b.level),
    levels,
    start,
    spawns,
  };
}
