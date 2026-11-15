import { PixelBuffer } from '../art/buffer';
import { hex } from '../art/color';
import { FRAME_W } from '../art/climber';
import { parseGrid } from '../art/grid';
import { PALETTE } from '../art/items';
import type { ItemId } from '../content/items';
import { toCanvas } from './canvas';

/** Small versions of the items that show on the backpack (spec section 7, "Shows on pack"). */
const MINI: Partial<Record<ItemId, string[]>> = {
  lantern: ['.k.', 'kGk', 'GEG', 'GeG', '.g.'],
  rope: ['.nnnn.', 'nB..Bn', '.nnnn.'],
  pickaxe: ['kKKKk', '..B..', '..B..', '..B..'],
  idol: ['.Y.Y.', '.GGG.', '.gYg.', 'GGGGG', '.GgG.', 'ggggg'],
  orb: ['..Y..', '.gGg.', 'gGTGg', 'gGGGg', '.ggg.'],
  scepter: ['.q.', 'YqY', '.G.', '.G.', '.G.', '.g.'],
  seal: ['.ggg.', 'gGYGg', 'gYrYg', 'gGYGg', '.ggg.'],
};

interface Mini {
  w: number;
  h: number;
  r: HTMLCanvasElement;
  l: HTMLCanvasElement;
}

function mini(rows: string[]): Mini {
  const b = parseGrid(rows, PALETTE);
  const pad = new PixelBuffer(b.w + 2, b.h + 2);
  pad.blit(b, 1, 1);
  pad.outline(hex('#120d18'));
  const flipped = new PixelBuffer(pad.w, pad.h);
  flipped.blit(pad, 0, 0, true);
  return { w: pad.w, h: pad.h, r: toCanvas(pad), l: toCanvas(flipped) };
}

export class PackGear {
  private readonly minis: Partial<Record<ItemId, Mini>> = {};

  constructor() {
    for (const [id, rows] of Object.entries(MINI)) this.minis[id as ItemId] = mini(rows!);
  }

  /**
   * Draws carried gear on the pack. `pack` is [x, y, w, h] in frame coordinates (facing right);
   * frameX/frameY is where the frame is drawn on screen.
   */
  draw(ctx: CanvasRenderingContext2D, carried: ItemId[], pack: [number, number, number, number], frameX: number, frameY: number, facing: number, t: number): void {
    const [px, py, pw, ph] = pack;
    const put = (id: ItemId, x: number, y: number) => {
      const m = this.minis[id];
      if (!m) return;
      const fx = facing > 0 ? x : FRAME_W - x - m.w;
      ctx.drawImage(facing > 0 ? m.r : m.l, frameX + fx, frameY + y);
    };
    const has = (id: ItemId) => carried.includes(id);
    if (has('fur_cloak')) {
      // fur draped over the top of the pack
      for (let i = 0; i < pw; i++) {
        const x = px + i;
        const fx = facing > 0 ? x : FRAME_W - 1 - x;
        ctx.fillStyle = i % 3 === 0 ? '#a89c88' : '#e6dcc8';
        ctx.fillRect(frameX + fx, frameY + py, 1, 2 + (i % 2));
      }
    }
    let cursor = px;
    for (const id of ['idol', 'orb', 'seal', 'scepter'] as ItemId[]) {
      if (!has(id)) continue;
      const m = this.minis[id]!;
      put(id, cursor - 1, py - m.h + 3);
      cursor += m.w - 3;
    }
    if (has('pickaxe')) put('pickaxe', px + pw - 5, py - 4);
    if (has('rope')) put('rope', px + Math.floor((pw - 8) / 2), py + ph - 4);
    if (has('lantern')) {
      const sway = Math.round(Math.sin(t * 0.07));
      put('lantern', px - 3 + sway, py + ph - 8);
    }
  }
}
