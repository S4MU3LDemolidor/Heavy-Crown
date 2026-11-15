import { TILE } from './tuning';

export const Tile = {
  Empty: 0,
  Solid: 1,
  Water: 2,
  Ice: 3,
  Ladder: 4,
} as const;

export type TileId = (typeof Tile)[keyof typeof Tile];

const SOLID: boolean[] = [false, true, false, true, false];

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

  set(tx: number, ty: number, id: TileId): void {
    if (tx >= 0 && tx < this.cols && ty >= 0 && ty < this.rows) this.cells[ty * this.cols + tx] = id;
  }

  isSolid(tx: number, ty: number): boolean {
    return SOLID[this.get(tx, ty)];
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

  /** True if any tile of type `id` overlaps the rectangle. */
  anyIn(x: number, y: number, w: number, h: number, id: TileId): boolean {
    const x0 = Math.floor(x / TILE);
    const x1 = Math.floor((x + w - 1) / TILE);
    const y0 = Math.floor(y / TILE);
    const y1 = Math.floor((y + h - 1) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) if (this.get(tx, ty) === id) return true;
    }
    return false;
  }
}
