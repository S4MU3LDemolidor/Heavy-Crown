import { TILE } from './tuning';

export const Tile = {
  Empty: 0,
  Solid: 1,
} as const;

export type TileId = (typeof Tile)[keyof typeof Tile];

/** Anything bodies can collide with. */
export interface CollisionWorld {
  /** True if any solid tile overlaps the rectangle (pixels; top-left corner and size). */
  solidRect(x: number, y: number, w: number, h: number): boolean;
}

/** The tower's tiles, row-major, row 0 at the top of the tower. */
export class TileGrid implements CollisionWorld {
  readonly cols: number;
  readonly rows: number;
  private readonly cells: Uint8Array;

  constructor(cols: number, rows: number, cells: Uint8Array) {
    if (cells.length !== cols * rows) {
      throw new Error(`TileGrid: expected ${cols * rows} cells, got ${cells.length}`);
    }
    this.cols = cols;
    this.rows = rows;
    this.cells = cells;
  }

  /** Left, right and below the tower are solid; above the top is open sky. */
  get(tx: number, ty: number): TileId {
    if (tx < 0 || tx >= this.cols || ty >= this.rows) return Tile.Solid;
    if (ty < 0) return Tile.Empty;
    return this.cells[ty * this.cols + tx] as TileId;
  }

  isSolid(tx: number, ty: number): boolean {
    return this.get(tx, ty) === Tile.Solid;
  }

  solidRect(x: number, y: number, w: number, h: number): boolean {
    const x0 = Math.floor(x / TILE);
    const x1 = Math.floor((x + w - 1) / TILE);
    const y0 = Math.floor(y / TILE);
    const y1 = Math.floor((y + h - 1) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (this.isSolid(tx, ty)) return true;
      }
    }
    return false;
  }
}
