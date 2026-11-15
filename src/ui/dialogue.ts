import { LINE_H, wrapText } from '../art/font';
import type { DialogueView } from '../game/story';
import { VIEW_H, VIEW_W } from '../game/tuning';
import { drawPanel, drawText, drawTextCentered, textWidth, UI } from './draw';

/** The dialogue box: portrait, name, typed-out text and choices (full-game spec 5.1). */
export function drawDialogue(ctx: CanvasRenderingContext2D, view: DialogueView, typed: number, sel: number, portrait: HTMLCanvasElement | null, hint: string): void {
  const x = 16;
  const w = VIEW_W - 32;
  const h = 92;
  const y = VIEW_H - h - 10;
  drawPanel(ctx, x, y, w, h);
  // portrait
  const px = x + 8;
  const py = y + 8;
  ctx.fillStyle = '#0d0a13';
  ctx.fillRect(px, py, 52, 56);
  if (portrait) {
    const s = Math.min(2, Math.floor(48 / Math.max(portrait.width, portrait.height / 1.1)) || 1);
    ctx.drawImage(portrait, Math.round(px + 26 - (portrait.width * s) / 2), Math.round(py + 54 - portrait.height * s), portrait.width * s, portrait.height * s);
  }
  drawTextCentered(ctx, view.name, px + 26, py + 60, UI.gold);
  // text
  const tx = px + 62;
  const tw = x + w - tx - 10;
  const shown = view.text.slice(0, Math.floor(typed));
  const lines = wrapText(view.text, tw);
  let left = shown.length;
  lines.forEach((line, i) => {
    if (left <= 0) return;
    drawText(ctx, line.slice(0, left), tx, py + 2 + i * LINE_H, UI.ink);
    left -= line.length + 1;
  });
  // choices once the text is out
  if (typed >= view.text.length && view.choices.length) {
    const cy = py + 2 + lines.length * LINE_H + 4;
    view.choices.forEach((c, i) => {
      const yy = cy + i * 11;
      const color = !c.enabled ? '#5a5268' : i === sel ? UI.gold : UI.ink;
      if (i === sel) drawText(ctx, '>', tx, yy, UI.gold);
      drawText(ctx, c.label, tx + 8, yy, color);
    });
  }
  drawText(ctx, hint, x + w - 8 - textWidth(hint), y + h - 12, UI.dim, null);
}

export interface PickEntry {
  icon: HTMLCanvasElement;
  label: string;
}

/** A row of items to choose one from (lift sends, the King's favour). */
export function drawPicker(ctx: CanvasRenderingContext2D, title: string, entries: PickEntry[], sel: number, hint: string, note?: string): void {
  ctx.fillStyle = 'rgba(6, 4, 10, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const w = Math.max(220, entries.length * 20 + 24);
  const h = 76;
  const x = Math.round((VIEW_W - w) / 2);
  const y = Math.round((VIEW_H - h) / 2);
  drawPanel(ctx, x, y, w, h);
  drawTextCentered(ctx, title, VIEW_W / 2, y + 7, UI.gold);
  const startX = Math.round(VIEW_W / 2 - (entries.length * 20) / 2);
  entries.forEach((e, i) => {
    const sx = startX + i * 20;
    ctx.fillStyle = i === sel ? UI.panelLight : '#221a2e';
    ctx.fillRect(sx, y + 20, 18, 18);
    ctx.fillStyle = '#120d18';
    ctx.fillRect(sx + 1, y + 21, 16, 16);
    ctx.drawImage(e.icon, sx + 3, y + 23);
  });
  if (entries[sel]) drawTextCentered(ctx, entries[sel].label, VIEW_W / 2, y + 43, UI.ink);
  if (note) drawTextCentered(ctx, note, VIEW_W / 2, y + 54, UI.dim);
  drawTextCentered(ctx, hint, VIEW_W / 2, y + h - 12, UI.dim);
}
