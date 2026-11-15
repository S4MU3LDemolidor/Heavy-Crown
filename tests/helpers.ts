import { Tile, TileGrid } from '../src/game/tiles';

/** Builds a small grid from strings: '#' is solid, anything else is empty. */
export function gridFrom(lines: string[]): TileGrid {
  const cols = lines[0].length;
  const rows = lines.length;
  const cells = new Uint8Array(cols * rows);
  lines.forEach((line, y) => {
    if (line.length !== cols) throw new Error(`gridFrom: row ${y} has ${line.length} columns, expected ${cols}`);
    for (let x = 0; x < cols; x++) cells[y * cols + x] = line[x] === '#' ? Tile.Solid : Tile.Empty;
  });
  return new TileGrid(cols, rows, cells);
}

/** A blank 60×34 screen of interior space. */
export function blankScreen(): string[] {
  return Array.from({ length: 34 }, () => ' '.repeat(60));
}

/** Returns a copy of `screen` with one character replaced. */
export function put(screen: string[], x: number, y: number, ch: string): string[] {
  return screen.map((row, i) => (i === y ? row.slice(0, x) + ch + row.slice(x + 1) : row));
}
