import type { Camera } from '../game/camera';
import type { Player, PlayerState } from '../game/player';
import type { TileGrid } from '../game/tiles';
import { TILE, VIEW_H, VIEW_W } from '../game/tuning';

const BG = '#1b1a24';
const SOLID = '#4a4858';
const EDGE = '#6e6a80';
const TEXT = '#e8e4f0';
const STATE_COLORS: Record<PlayerState, string> = {
  ground: '#e8d8a0',
  charge: '#f0a040',
  air: '#a0d0f0',
  stumble: '#f06060',
  ladder: '#a0f0a0',
  cling: '#80e0c0',
  pull: '#c0a0ff',
  hang: '#e0c0ff',
};

export function drawWorld(ctx: CanvasRenderingContext2D, grid: TileGrid, camera: Camera): void {
  const camY = Math.round(camera.y);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const ty0 = Math.max(0, Math.floor(camY / TILE));
  const ty1 = Math.min(grid.rows - 1, Math.floor((camY + VIEW_H - 1) / TILE));
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = 0; tx < grid.cols; tx++) {
      if (!grid.isSolid(tx, ty)) continue;
      const x = tx * TILE;
      const y = ty * TILE - camY;
      ctx.fillStyle = SOLID;
      ctx.fillRect(x, y, TILE, TILE);
      if (!grid.isSolid(tx, ty - 1)) {
        ctx.fillStyle = EDGE;
        ctx.fillRect(x, y, TILE, 1);
      }
    }
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, camera: Camera): void {
  const camY = Math.round(camera.y);
  const { x, w, h } = player.body;
  const y = player.body.y - camY;
  const squash = player.state === 'charge' ? Math.round(player.charge * 4) : player.state === 'stumble' ? 8 : 0;
  ctx.fillStyle = STATE_COLORS[player.state];
  ctx.fillRect(x, y + squash, w, h - squash);
  ctx.fillStyle = BG;
  ctx.fillRect(player.facing > 0 ? x + w - 3 : x + 1, y + squash + 3, 2, 2);
  if (player.state === 'charge') {
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 2, y - 6, w + 4, 3);
    ctx.fillStyle = STATE_COLORS.charge;
    ctx.fillRect(x - 1, y - 5, Math.round((w + 2) * player.charge), 1);
  }
}

export function drawDebugText(ctx: CanvasRenderingContext2D, lines: string[]): void {
  ctx.font = '8px monospace';
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    ctx.fillStyle = '#000';
    ctx.fillText(line, 5, 5 + i * 10);
    ctx.fillStyle = TEXT;
    ctx.fillText(line, 4, 4 + i * 10);
  });
}
