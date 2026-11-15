import { ITEMS } from '../content/items';
import type { Game, Interaction } from '../game/game';
import { VIEW_H, VIEW_W } from '../game/tuning';
import { loadTier } from '../game/weight';
import type { Input } from '../engine/input';
import type { ObjectRenderer } from '../render/objects';
import { dimScreen, drawPanel, drawParagraph, drawText, drawTextCentered, textWidth, UI } from './draw';

export const TIER_NAMES = ['Empty', 'Light', 'Loaded', 'Heavy', 'Overloaded'];

/** "[E] Take Iron Key (1 st)" floating above the thing it acts on. */
export function drawPrompt(ctx: CanvasRenderingContext2D, it: Interaction, camY: number, input: Input): void {
  const key = input.label('interact');
  const text = `${it.label}`;
  const kw = textWidth(key) + 6;
  const w = kw + textWidth(text) + 6;
  const x = Math.max(2, Math.min(VIEW_W - w - 2, Math.round(it.x - w / 2)));
  const y = Math.max(2, Math.min(VIEW_H - 14, Math.round(it.y - camY - 14)));
  drawPanel(ctx, x, y, w, 12);
  ctx.fillStyle = UI.panelLight;
  ctx.fillRect(x + 2, y + 2, kw - 2, 8);
  drawText(ctx, key, x + 4, y + 3, UI.panel, null);
  drawText(ctx, text, x + kw + 2, y + 3, UI.ink, null);
}

/** Bottom-left pack icon, stone count and tier pips. */
export function drawWeightMeter(ctx: CanvasRenderingContext2D, stones: number, alpha: number): void {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  const tier = loadTier(stones);
  const x = 6;
  const y = VIEW_H - 20;
  drawPanel(ctx, x, y, 92, 15);
  // tiny pack icon
  ctx.fillStyle = '#7a6040';
  ctx.fillRect(x + 4, y + 4, 7, 8);
  ctx.fillStyle = '#a08458';
  ctx.fillRect(x + 5, y + 5, 5, 3);
  ctx.fillStyle = '#5a3c26';
  ctx.fillRect(x + 6, y + 3, 3, 1);
  drawText(ctx, `${stones} st`, x + 15, y + 4, UI.ink, null);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i < tier ? (tier >= 4 ? UI.red : UI.gold) : '#3a3150';
    ctx.fillRect(x + 50 + i * 5, y + 5, 4, 5);
  }
  drawText(ctx, TIER_NAMES[tier].slice(0, 6), x + 71, y + 4, tier >= 4 ? UI.red : UI.dim, null);
  ctx.restore();
}

/** The inventory panel (game paused). */
export function drawInventory(ctx: CanvasRenderingContext2D, game: Game, sel: number, input: Input, objects: ObjectRenderer, message: string | null): void {
  dimScreen(ctx, 0.6);
  const w = 260;
  const h = 150;
  const x = Math.round((VIEW_W - w) / 2);
  const y = Math.round((VIEW_H - h) / 2);
  drawPanel(ctx, x, y, w, h);
  const stones = game.stones;
  drawText(ctx, 'Pack', x + 8, y + 7, UI.gold);
  drawText(ctx, `${stones} st  ·  ${TIER_NAMES[loadTier(stones)]}`, x + 36, y + 7, UI.dim);
  const gold = game.gold;
  if (gold > 0) {
    const gt = `${gold} gold`;
    drawText(ctx, gt, x + w - 8 - textWidth(gt), y + 7, UI.gold);
  }
  const cols = 12;
  const slot = 19;
  const gx = x + 8;
  const gy = y + 22;
  const n = Math.max(game.carried.length, 1);
  for (let i = 0; i < Math.max(cols, Math.ceil(n / cols) * cols); i++) {
    const sx = gx + (i % cols) * (slot + 1);
    const sy = gy + Math.floor(i / cols) * (slot + 1);
    ctx.fillStyle = i === sel && game.carried.length ? UI.panelLight : '#221a2e';
    ctx.fillRect(sx, sy, slot, slot);
    ctx.fillStyle = '#120d18';
    ctx.fillRect(sx + 1, sy + 1, slot - 2, slot - 2);
    const c = game.carried[i];
    if (c) ctx.drawImage(objects.itemCanvas(c.id), sx + 3, sy + 3);
  }
  const cur = game.carried[sel];
  const ty = gy + 2 * (slot + 1) + 4;
  if (cur) {
    const def = ITEMS[cur.id];
    drawText(ctx, def.name, x + 8, ty, UI.ink);
    const ws = `${def.weight} st`;
    drawText(ctx, ws, x + w - 8 - textWidth(ws), ty, UI.gold);
    drawParagraph(ctx, def.desc, x + 8, ty + 13, w - 16, UI.dim);
  } else {
    drawParagraph(ctx, 'Your pack is empty. Light as a feather, and just as poor.', x + 8, ty, w - 16, UI.dim);
  }
  const hint = `${input.label('left')}/${input.label('right')} choose   ${input.label('drop')} drop   ${input.label('inventory')} close`;
  drawTextCentered(ctx, message ?? hint, VIEW_W / 2, y + h - 13, message ? UI.red : UI.dim);
}

/** Maren's note on a scrap of paper (game paused). */
export function drawNote(ctx: CanvasRenderingContext2D, title: string, text: string, input: Input): void {
  dimScreen(ctx, 0.65);
  const w = 230;
  const x = Math.round((VIEW_W - w) / 2);
  const lines = Math.ceil(textWidth(text) / (w - 28)) + 2;
  const h = Math.max(80, 44 + lines * 10);
  const y = Math.round((VIEW_H - h) / 2);
  drawPanel(ctx, x, y, w, h, UI.paper, UI.paperEdge, '#f6eed8');
  ctx.fillStyle = '#c8303a';
  ctx.fillRect(x + w / 2 - 1, y + 3, 3, 3);
  drawTextCentered(ctx, title, VIEW_W / 2, y + 10, '#7a4a2a', null);
  drawParagraph(ctx, text, x + 14, y + 26, w - 28, UI.paperInk, null);
  drawTextCentered(ctx, `${input.label('interact')} close`, VIEW_W / 2, y + h - 13, '#8a7650', null);
}

/**
 * The pack bar, always on screen (top-left): carried items with the selected one highlighted,
 * the load, and the keys to drop or open the pack. Fades while the climber is behind it.
 */
export function drawPackBar(ctx: CanvasRenderingContext2D, game: Game, input: Input, objects: ObjectRenderer, camY: number): void {
  const x = 4;
  const y = 4;
  const slot = 14;
  const n = game.carried.length;
  const stones = game.stones;
  const tier = loadTier(stones);
  const sel = game.carried[game.selected];
  const weight = `${stones} st`;
  const tierName = TIER_NAMES[tier];
  const hint = sel ? `${input.label('drop')} drop ${ITEMS[sel.id].name}   ${input.label('inventory')} pack` : `${input.label('inventory')} pack   ${input.label('interact')} take`;
  const iconsW = Math.max(1, n) * slot;
  const topW = iconsW + 8 + textWidth(weight) + 6 + textWidth(tierName);
  const w = Math.max(topW, textWidth(hint)) + 10;
  const h = 31;
  const p = game.player.body;
  const behind = p.x < x + w && p.x + p.w > x && p.y - camY < y + h && p.y - camY + p.h > y;
  ctx.save();
  ctx.globalAlpha = behind ? 0.35 : 0.92;
  drawPanel(ctx, x, y, w, h);
  for (let i = 0; i < n; i++) {
    const sx = x + 4 + i * slot;
    const sy = y + 3;
    if (i === game.selected) {
      ctx.fillStyle = UI.panelLight;
      ctx.fillRect(sx - 1, sy - 1, slot, slot);
      ctx.fillStyle = '#120d18';
      ctx.fillRect(sx, sy, slot - 2, slot - 2);
    }
    ctx.drawImage(objects.itemCanvas(game.carried[i].id), sx, sy);
  }
  if (!n) drawText(ctx, '-', x + 8, y + 6, UI.dim, null);
  const tx = x + 4 + iconsW + 4;
  drawText(ctx, weight, tx, y + 6, UI.gold, null);
  drawText(ctx, tierName, tx + textWidth(weight) + 6, y + 6, tier >= 4 ? UI.red : tier >= 3 ? UI.gold : UI.dim, null);
  drawText(ctx, hint, x + 5, y + 19, UI.dim, null);
  ctx.restore();
}

/** A short message at the bottom of the screen. */
export function drawToast(ctx: CanvasRenderingContext2D, text: string, t: number): void {
  const k = Math.min(1, t / 20);
  ctx.save();
  ctx.globalAlpha = k;
  const w = textWidth(text) + 16;
  const x = Math.round((VIEW_W - w) / 2);
  drawPanel(ctx, x, VIEW_H - 30, w, 14);
  drawText(ctx, text, x + 8, VIEW_H - 26, UI.red, null);
  ctx.restore();
}
