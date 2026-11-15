import type { PixelBuffer } from '../art/buffer';
import { gateTile, ITEM_SIZE, itemSprites, ladderTile, NOTE, ROPE_HOOK } from '../art/items';
import { ITEMS, type ItemId } from '../content/items';
import { THEMES } from '../content/themes';
import { SCREEN_H } from '../game/tuning';
import type { Game } from '../game/game';
import { Tile } from '../game/tiles';
import { TILE, VIEW_H } from '../game/tuning';
import { toCanvas } from './canvas';

/** Draws the world's objects and items (spec sections 7–8). */
export class ObjectRenderer {
  private readonly items: Record<ItemId, HTMLCanvasElement>;
  private readonly gate: Record<string, Record<'top' | 'mid' | 'bottom', HTMLCanvasElement>>;
  private readonly hook = toCanvas(ROPE_HOOK);
  private readonly rope = toCanvas(ladderTile(true));
  private readonly wood = toCanvas(ladderTile(false));
  private readonly note = toCanvas(NOTE);

  constructor() {
    const s = itemSprites();
    this.items = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, toCanvas(v as PixelBuffer)])) as Record<ItemId, HTMLCanvasElement>;
    this.gate = {};
    for (const tint of ['iron', 'bronze', 'bone'] as const) {
      this.gate[tint] = { top: toCanvas(gateTile('top', tint)), mid: toCanvas(gateTile('mid', tint)), bottom: toCanvas(gateTile('bottom', tint)) };
    }
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
      const rise = Math.min(h, Math.round((g.anim / 40) ** 2 * h));
      if (rise >= h) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, top, TILE, h);
      ctx.clip();
      const tint = g.opens === 'bell_key' ? 'bronze' : g.opens === 'bone_key' ? 'bone' : 'iron';
      for (let ty = g.ty0; ty <= g.ty1; ty++) {
        const part = ty === g.ty0 ? 'top' : ty === g.ty1 ? 'bottom' : 'mid';
        ctx.drawImage(this.gate[tint][part], x, ty * TILE - camY - rise);
      }
      ctx.restore();
    }
    this.drawPlanks(ctx, game, camY);
    this.drawPlates(ctx, game, camY);
    this.drawCracked(ctx, game, camY);
    this.drawBells(ctx, game, camY, t);
    this.drawAltar(ctx, game, camY, t);
  }

  private drawPlanks(ctx: CanvasRenderingContext2D, game: Game, camY: number): void {
    for (const pl of game.planks) {
      const x0 = pl.tx0 * TILE;
      const w = (pl.tx1 - pl.tx0 + 1) * TILE;
      const y = pl.ty * TILE - camY;
      if (y < -40 || y > VIEW_H + 4) continue;
      // hinge brackets on the walls
      ctx.fillStyle = '#3a3a48';
      ctx.fillRect(x0 - 1, y, 2, 3);
      ctx.fillRect(x0 + w - 1, y, 2, 3);
      if (!pl.down) {
        ctx.fillStyle = '#120d18';
        ctx.fillRect(x0, y - 1, w, 5);
        for (let i = 0; i < w; i++) {
          ctx.fillStyle = i % 8 === 7 ? '#4a3024' : i % 8 < 4 ? '#8a6038' : '#7a5232';
          ctx.fillRect(x0 + i, y, 1, 3);
        }
        ctx.fillStyle = '#b08850';
        ctx.fillRect(x0, y, w, 1);
        ctx.fillStyle = '#a0a0b0';
        for (let i = 2; i < w; i += 8) ctx.fillRect(x0 + i, y + 1, 1, 1);
      } else {
        // two halves hanging from their hinges
        const half = Math.floor(w / 2);
        for (const [hx] of [[x0], [x0 + w - 3]]) {
          ctx.fillStyle = '#120d18';
          ctx.fillRect(hx - 1, y, 5, half + 1);
          ctx.fillStyle = '#7a5232';
          ctx.fillRect(hx, y, 3, half);
          ctx.fillStyle = '#a07a48';
          ctx.fillRect(hx, y, 1, half);
        }
      }
    }
  }

  private drawPlates(ctx: CanvasRenderingContext2D, game: Game, camY: number): void {
    for (const pl of game.plates) {
      const x = pl.tx * TILE - 1;
      const y = (pl.ty + 1) * TILE - camY - (pl.pressed ? 1 : 2);
      ctx.fillStyle = '#120d18';
      ctx.fillRect(x - 1, y - 1, 12, pl.pressed ? 2 : 3);
      ctx.fillStyle = pl.pressed ? '#6a8a6a' : '#8a8478';
      ctx.fillRect(x, y, 10, pl.pressed ? 1 : 2);
      ctx.fillStyle = '#d8c070';
      for (let i = 0; i < pl.need; i++) ctx.fillRect(x + 2 + i * 2, y, 1, 1);
    }
  }

  private drawCracked(ctx: CanvasRenderingContext2D, game: Game, camY: number): void {
    for (const c of game.cracked) {
      if (c.broken) continue;
      for (const [tx, ty] of c.cells) {
        const x = tx * TILE;
        const y = ty * TILE - camY;
        if (y < -TILE || y > VIEW_H) continue;
        const theme = THEMES[game.world.levels[game.world.bandLevel[Math.floor((ty * TILE) / SCREEN_H)]].theme];
        ctx.fillStyle = theme.stone[3];
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = theme.stone[4];
        ctx.fillRect(x, y, TILE, 1);
        ctx.fillStyle = theme.stone[1];
        ctx.fillRect(x, y + 7, TILE, 1);
        // zigzag crack
        ctx.fillStyle = theme.stone[0];
        const seed = (tx * 7 + ty * 13) % 3;
        for (let k = 0; k < 8; k++) ctx.fillRect(x + 2 + ((k + seed) % 3), y + k, 1, 1);
        ctx.fillRect(x + 5, y + 3 + seed, 2, 1);
      }
    }
  }

  private drawBells(ctx: CanvasRenderingContext2D, game: Game, camY: number, t: number): void {
    for (const b of game.bells) {
      const y = b.y - camY;
      if (y > VIEW_H || y + b.h < 0) continue;
      const sway = b.swing > 0 ? Math.round(Math.sin(b.swing * 0.5) * (b.swing / 20)) : 0;
      const cx = b.x + b.w / 2 + sway;
      // yoke
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(b.x + 2, y - 3, b.w - 4, 3);
      for (let j = 0; j < b.h; j++) {
        const f = j / (b.h - 1);
        const half = Math.round((b.w / 2 - 1) * (0.45 + 0.55 * f ** 1.6)) + (j === b.h - 1 ? 1 : 0);
        for (let i = -half; i < half; i++) {
          const edge = i === -half || i === half - 1;
          const light = i < -half / 3 && i > -half + 1;
          ctx.fillStyle = edge ? '#3a2410' : j === b.h - 2 ? '#f0c050' : light ? '#e0a840' : i > half / 2 ? '#7a4a14' : '#b07a28';
          ctx.fillRect(Math.round(cx + i), y + j, 1, 1);
        }
      }
      ctx.fillStyle = '#120d18';
      ctx.fillRect(Math.round(cx - 1), y + b.h, 3, 2);
      void t;
    }
  }

  private drawAltar(ctx: CanvasRenderingContext2D, game: Game, camY: number, t: number): void {
    const a = game.altar;
    if (!a) return;
    const x = a.tx * TILE - TILE;
    const y = (a.ty + 1) * TILE - camY - 12;
    if (y > VIEW_H || y < -40) return;
    ctx.fillStyle = '#120d18';
    ctx.fillRect(x - 1, y - 1, 26, 13);
    ctx.fillStyle = '#6e7690';
    ctx.fillRect(x, y, 24, 12);
    ctx.fillStyle = '#9aa2bc';
    ctx.fillRect(x, y, 24, 2);
    ctx.fillStyle = '#4a5068';
    ctx.fillRect(x + 2, y + 5, 20, 1);
    // three sockets
    const order: ItemId[] = ['orb', 'scepter', 'seal'];
    order.forEach((id, i) => {
      const sx = x + 2 + i * 8;
      ctx.fillStyle = '#2a2e40';
      ctx.fillRect(sx + 1, y + 7, 5, 3);
      if (a.placed.includes(id)) ctx.drawImage(this.items[id], sx - 3, y - 10);
    });
    // Maren's scarf tied to the corner, fluttering
    const flap = Math.round(Math.sin(t * 0.15) * 1.5);
    ctx.fillStyle = '#962838';
    ctx.fillRect(x + 23, y + 2, 2, 2);
    ctx.fillStyle = '#d6453b';
    for (let k = 0; k < 6; k++) ctx.fillRect(x + 25 + k, y + 3 + Math.round(Math.sin(t * 0.2 + k * 0.8) * 0.8) + (k > 3 ? flap : 0), 1, 2);
    if (!a.crownTaken) ctx.drawImage(this.items.crown, x + 6, y - 22 + Math.round(Math.sin(t * 0.05)));
  }

  /** Little sparkles that should glow through darkness (drawn after lighting). */
  drawGlints(ctx: CanvasRenderingContext2D, game: Game, camY: number, t: number): void {
    for (const it of game.items) {
      const x = it.body.x - (ITEM_SIZE - 8) / 2;
      const y = it.body.y + 8 - ITEM_SIZE - camY;
      if (y > VIEW_H || y < -ITEM_SIZE) continue;
      const phase = (t + it.uid * 37) % 170;
      if (phase >= 6) continue;
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

  /** Light sources from objects and items, in world coordinates. */
  lights(game: Game): { x: number; y: number; r: number; color: string; k?: number }[] {
    const out: { x: number; y: number; r: number; color: string; k?: number }[] = [];
    for (const it of game.items) {
      const r = ITEMS[it.id].light;
      if (r) out.push({ x: it.body.x + 4, y: it.body.y + 2, r, color: it.id === 'lantern' ? '#ffd890' : it.id === 'ruby' ? '#ff6070' : '#ffe8a0' });
    }
    for (const n of game.notes) out.push({ x: n.tx * TILE + 4, y: n.ty * TILE + 3, r: 12, color: '#fff0c8', k: 0.5 });
    const a = game.altar;
    if (a) {
      if (a.placed.length) out.push({ x: a.tx * TILE + 4, y: a.ty * TILE, r: 30 + a.placed.length * 10, color: '#ffe8a0' });
      if (!a.crownTaken) out.push({ x: a.tx * TILE + 4, y: a.ty * TILE - 14, r: 34, color: '#ffe080', k: 0.8 });
    }
    return out;
  }

  /** Items lying in the world, with a periodic glint. */
  drawItems(ctx: CanvasRenderingContext2D, game: Game, camY: number): void {
    for (const it of game.items) {
      const x = it.body.x - (ITEM_SIZE - 8) / 2;
      const y = it.body.y + 8 - ITEM_SIZE - camY;
      if (y > VIEW_H || y < -ITEM_SIZE) continue;
      ctx.drawImage(this.items[it.id], x, y);
    }
  }
}
