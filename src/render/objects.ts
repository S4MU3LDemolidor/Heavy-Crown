import type { PixelBuffer } from '../art/buffer';
import { gateTile, ITEM_SIZE, itemSprites, ladderTile, NOTE, ROPE_HOOK } from '../art/items';
import type { ItemId } from '../content/items';
import type { Game } from '../game/game';
import { Tile } from '../game/tiles';
import { TILE, VIEW_H } from '../game/tuning';
import { toCanvas } from './canvas';

/** Draws the world's objects and items (spec sections 7–8). */
export class ObjectRenderer {
  private readonly items: Record<ItemId, HTMLCanvasElement>;
  private readonly gate: Record<'top' | 'mid' | 'bottom', HTMLCanvasElement>;
  private readonly hook = toCanvas(ROPE_HOOK);
  private readonly rope = toCanvas(ladderTile(true));
  private readonly wood = toCanvas(ladderTile(false));
  private readonly note = toCanvas(NOTE);

  constructor() {
    const s = itemSprites();
    this.items = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, toCanvas(v as PixelBuffer)])) as Record<ItemId, HTMLCanvasElement>;
    this.gate = { top: toCanvas(gateTile('top')), mid: toCanvas(gateTile('mid')), bottom: toCanvas(gateTile('bottom')) };
  }

  itemCanvas(id: ItemId): HTMLCanvasElement {
    return this.items[id];
  }

  /** Behind the climber: ladders, hooks, notes, gates. */
  drawBack(ctx: CanvasRenderingContext2D, game: Game, camY: number, t: number): void {
    const grid = game.world.grid;
    const ty0 = Math.floor(camY / TILE);
    const ty1 = Math.floor((camY + VIEW_H) / TILE);
    for (let ty = ty0; ty <= ty1; ty++)
      for (let tx = 0; tx < grid.cols; tx++) if (grid.get(tx, ty) === Tile.Ladder) ctx.drawImage(this.wood, tx * TILE, ty * TILE - camY);

    for (const hk of game.hooks) {
      if (hk.ropeUid !== null) {
        for (let ty = hk.ladderTy0; ty <= hk.ladderTy1; ty++) {
          if (ty < ty0 - 1 || ty > ty1 + 1) continue;
          ctx.drawImage(this.rope, hk.ladderTx * TILE, ty * TILE - camY);
        }
      }
      const y = hk.ty * TILE - camY;
      if (y > -TILE && y < VIEW_H) ctx.drawImage(this.hook, hk.tx * TILE, y);
    }

    for (const n of game.notes) {
      const y = n.ty * TILE - camY - 2;
      if (y < -12 || y > VIEW_H) continue;
      ctx.drawImage(this.note, n.tx * TILE, y);
      if (!game.notesRead.has(n.id) && (t >> 4) % 4 === 0) {
        ctx.fillStyle = '#fff6c8';
        ctx.fillRect(n.tx * TILE + 6, y + 1, 1, 1);
      }
    }

    for (const g of game.gates) {
      const x = g.tx * TILE;
      const top = g.ty0 * TILE - camY;
      const h = (g.ty1 - g.ty0 + 1) * TILE;
      if (top > VIEW_H || top + h < 0) continue;
      const rise = g.open ? Math.min(h, Math.round((Math.min(g.anim, 40) / 40) ** 2 * h)) : 0;
      if (rise >= h) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, top, TILE, h);
      ctx.clip();
      for (let ty = g.ty0; ty <= g.ty1; ty++) {
        const part = ty === g.ty0 ? 'top' : ty === g.ty1 ? 'bottom' : 'mid';
        ctx.drawImage(this.gate[part], x, ty * TILE - camY - rise);
      }
      ctx.restore();
    }
  }

  /** Items lying in the world, with a periodic glint. */
  drawItems(ctx: CanvasRenderingContext2D, game: Game, camY: number, t: number): void {
    for (const it of game.items) {
      const x = it.body.x - (ITEM_SIZE - 8) / 2;
      const y = it.body.y + 8 - ITEM_SIZE - camY;
      if (y > VIEW_H || y < -ITEM_SIZE) continue;
      ctx.drawImage(this.items[it.id], x, y);
      const phase = (t + it.uid * 37) % 170;
      if (phase < 6) {
        const gx = x + 8;
        const gy = y + 3;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(gx, gy, 1, 1);
        if (phase > 1 && phase < 5) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillRect(gx - 1, gy, 1, 1);
          ctx.fillRect(gx + 1, gy, 1, 1);
          ctx.fillRect(gx, gy - 1, 1, 1);
          ctx.fillRect(gx, gy + 1, 1, 1);
        }
      }
    }
  }
}
