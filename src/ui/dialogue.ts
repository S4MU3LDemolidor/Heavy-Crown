import { LINE_H, wrapText } from '../art/font';
import { VIEW_H, VIEW_W } from '../game/tuning';
import { drawPanel, drawText, drawTextCentered, textWidth, UI } from './draw';

/** What the dialogue box shows: a name, the line, and choices (each available or not). */
export interface DialogueLine {
  name: string;
  text: string;
  choices: { label: string; enabled: boolean }[];
}

/**
 * The dialogue box (remake spec 5.3): the speaker's 64×64 portrait in a frame on their side (Wren on the left,
 * everyone else on the right), their name above the typed-out text, then the choices. It moves to the top of the
 * screen when the climber stands where it would cover them.
 */
export function drawDialogue(ctx: CanvasRenderingContext2D, view: DialogueLine, typed: number, sel: number, portrait: HTMLCanvasElement | null, side: 'left' | 'right', hint: string, atTop = false): void {
  const x = 12;
  const w = VIEW_W - 24;
  const h = 86;
  // at the bottom of the screen, unless that would hide the climber
  const y = atTop ? 8 : VIEW_H - h - 8;
  drawPanel(ctx, x, y, w, h);
  const frame = 70;
  const hasPortrait = !!portrait;
  const fx = side === 'left' ? x + 8 : x + w - 8 - frame;
  const fy = y + 8;
  if (portrait) {
    ctx.fillStyle = '#0d0a13';
    ctx.fillRect(fx, fy, frame, frame);
    ctx.fillStyle = '#3a2e4a';
    ctx.fillRect(fx, fy, frame, 1);
    ctx.fillRect(fx, fy + frame - 1, frame, 1);
    ctx.fillRect(fx, fy, 1, frame);
    ctx.fillRect(fx + frame - 1, fy, 1, frame);
    const pw = portrait.width;
    const ph = portrait.height;
    const s = pw > frame - 4 ? 1 : Math.max(1, Math.floor((frame - 6) / Math.max(pw, ph)));
    const px = Math.round(fx + frame / 2 - (pw * s) / 2);
    const py = Math.round(fy + frame - 3 - ph * s);
    if (side === 'right' && pw >= 48) {
      // everyone but Wren faces left, toward Wren
      ctx.save();
      ctx.translate(px + pw * s, py);
      ctx.scale(-1, 1);
      ctx.drawImage(portrait, 0, 0, pw * s, ph * s);
      ctx.restore();
    } else ctx.drawImage(portrait, px, py, pw * s, ph * s);
  }
  // name and text on the other side
  const tx = hasPortrait && side === 'left' ? fx + frame + 10 : x + 12;
  const tw = (hasPortrait && side === 'right' ? fx - 10 : x + w - 10) - tx;
  if (view.name) drawText(ctx, view.name, tx, y + 9, UI.gold);
  const top = y + (view.name ? 22 : 12);
  const shown = view.text.slice(0, Math.floor(typed));
  const lines = wrapText(view.text, tw);
  let left = shown.length;
  lines.forEach((line, i) => {
    if (left <= 0) return;
    drawText(ctx, line.slice(0, left), tx, top + i * LINE_H, UI.ink);
    left -= line.length + 1;
  });
  // choices once the text is out
  if (typed >= view.text.length && view.choices.length) {
    const cy = top + lines.length * LINE_H + 3;
    view.choices.forEach((c, i) => {
      const yy = cy + i * 11;
      const color = !c.enabled ? '#5a5268' : i === sel ? UI.gold : UI.ink;
      if (i === sel) drawText(ctx, '>', tx, yy, UI.gold);
      drawText(ctx, c.label, tx + 8, yy, color);
    });
  }
  const hx = hasPortrait && side === 'right' ? fx - 8 - textWidth(hint) : x + w - 8 - textWidth(hint);
  drawText(ctx, hint, hx, y + h - 12, UI.dim, null);
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
