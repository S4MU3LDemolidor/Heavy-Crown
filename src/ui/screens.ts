import { rasterText, textWidth } from '../art/font';
import { NOTES } from '../content/story';
import type { Game } from '../game/game';
import { SCREEN_H, SCREEN_W, VIEW_H, VIEW_W } from '../game/tuning';
import { dimScreen, drawPanel, drawParagraph, drawText, drawTextCentered, UI } from './draw';

/** Text drawn with each font pixel as an s×s block. */
export function drawTextScaled(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, s: number, color: string, shadow?: string, outline?: string): void {
  const x = Math.round(cx - (textWidth(text) * s) / 2);
  if (outline) {
    ctx.fillStyle = outline;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]])
      rasterText(text, 0, 0, (px, py) => ctx.fillRect(x + px * s + dx, y + py * s + dy, s, s));
  }
  if (shadow) {
    ctx.fillStyle = shadow;
    rasterText(text, 0, 0, (px, py) => ctx.fillRect(x + px * s + s, y + py * s + s, s, s));
  }
  ctx.fillStyle = color;
  rasterText(text, 0, 0, (px, py) => ctx.fillRect(x + px * s, y + py * s, s, s));
}

/** HEAVY CROWN, in gold with a dark outline, and a small crown above it. */
export function drawLogo(ctx: CanvasRenderingContext2D, cx: number, y: number, t: number): void {
  const bob = Math.round(Math.sin(t * 0.03));
  // the little crown
  const crown = ['Y...Y...Y', 'YY.YYY.YY', 'YYYYRYYYY', 'GGGGGGGGG', 'ggggggggg'];
  const cs = 2;
  const cxs = Math.round(cx - (crown[0].length * cs) / 2);
  crown.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '.') continue;
      ctx.fillStyle = c === 'Y' ? '#f8e070' : c === 'G' ? '#d8a030' : c === 'R' ? '#ff7080' : '#8a5a1a';
      ctx.fillRect(cxs + i * cs, y - 16 + bob + j * cs, cs, cs);
    }
  });
  drawTextScaled(ctx, 'HEAVY CROWN', cx, y, 4, '#f6d27a', '#3a2410', '#120d18');
  // a highlight line across the top of the letters
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.restore();
}

export function drawMenu(ctx: CanvasRenderingContext2D, items: string[], sel: number, cx: number, y: number, t: number): void {
  items.forEach((label, i) => {
    const active = i === sel;
    const yy = y + i * 14;
    if (active) {
      const w = textWidth(label) + 18;
      ctx.fillStyle = 'rgba(18, 13, 24, 0.55)';
      ctx.fillRect(Math.round(cx - w / 2), yy - 3, w, 13);
      const blink = Math.floor(t / 20) % 2 === 0;
      if (blink) {
        drawText(ctx, '>', Math.round(cx - w / 2) + 3, yy, UI.gold);
        drawText(ctx, '<', Math.round(cx + w / 2) - 6, yy, UI.gold);
      }
    }
    drawTextCentered(ctx, label, cx, yy, active ? UI.gold : UI.ink);
  });
}

/** Lines of story text fading in one after another over a dark veil. */
export function drawStoryLines(ctx: CanvasRenderingContext2D, lines: string[], t: number, per = 150, veil = 0.75): void {
  ctx.fillStyle = `rgba(6, 4, 10, ${veil})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const top = Math.round(VIEW_H / 2 - (lines.length * 18) / 2);
  lines.forEach((line, i) => {
    const k = Math.max(0, Math.min(1, (t - i * per) / 50));
    if (k <= 0) return;
    ctx.save();
    ctx.globalAlpha = k;
    drawTextCentered(ctx, line, VIEW_W / 2, top + i * 18, UI.ink);
    ctx.restore();
  });
}

/** "II · The Drowned Cistern": fades in and out over three seconds. */
export function drawTitleCard(ctx: CanvasRenderingContext2D, numeral: string, title: string, t: number): void {
  const k = t < 30 ? t / 30 : t > 150 ? Math.max(0, (180 - t) / 30) : 1;
  if (k <= 0) return;
  ctx.save();
  ctx.globalAlpha = k;
  const y = 40;
  drawTextScaled(ctx, numeral, VIEW_W / 2, y - 18, 2, '#f6d27a', '#120d18');
  drawTextScaled(ctx, title, VIEW_W / 2, y, 2, UI.ink, '#120d18');
  const w = textWidth(title) * 2;
  ctx.fillStyle = 'rgba(246, 210, 122, 0.7)';
  ctx.fillRect(Math.round(VIEW_W / 2 - w / 2), y + 17, w, 1);
  ctx.restore();
}

export interface Options {
  music: number;
  sfx: number;
  alwaysMeter: boolean;
}

export function drawOptions(ctx: CanvasRenderingContext2D, o: Options, sel: number, fullscreen: boolean, t: number): void {
  dimScreen(ctx, 0.7);
  const w = 220;
  const h = 120;
  const x = Math.round((VIEW_W - w) / 2);
  const y = Math.round((VIEW_H - h) / 2);
  drawPanel(ctx, x, y, w, h);
  drawTextCentered(ctx, 'Options', VIEW_W / 2, y + 8, UI.gold);
  const rows: [string, string][] = [
    ['Music', bar(o.music)],
    ['Effects', bar(o.sfx)],
    ['Fullscreen', fullscreen ? 'On' : 'Off'],
    ['Weight meter', o.alwaysMeter ? 'Always' : 'When it changes'],
    ['Back', ''],
  ];
  rows.forEach(([label, value], i) => {
    const yy = y + 26 + i * 16;
    const active = i === sel;
    if (active && Math.floor(t / 20) % 2 === 0) drawText(ctx, '>', x + 10, yy, UI.gold);
    drawText(ctx, label, x + 18, yy, active ? UI.gold : UI.ink);
    if (value) drawText(ctx, value, x + w - 14 - textWidth(value), yy, active ? UI.gold : UI.dim);
  });
}

const bar = (v: number) => {
  const n = Math.round(v * 10);
  return '[' + '='.repeat(n) + ' '.repeat(10 - n) + ']';
};

/** Maren's map: the 18 screens as thumbnails in two columns, with dropped items and the climber. */
export function drawMap(ctx: CanvasRenderingContext2D, game: Game, thumb: (band: number) => HTMLCanvasElement | null): void {
  dimScreen(ctx, 0.8);
  const n = game.world.screenCount;
  const tw = 40;
  const th = Math.round((tw * SCREEN_H) / SCREEN_W);
  const perCol = Math.ceil(n / 2);
  const x0 = Math.round(VIEW_W / 2 - tw - 14);
  const y0 = Math.round(VIEW_H / 2 - (perCol * (th + 2)) / 2) + 6;
  drawTextCentered(ctx, "Maren's map", VIEW_W / 2, y0 - 16, UI.gold);
  for (let k = 0; k < n; k++) {
    // k counts screens from the bottom of the tower
    const band = n - 1 - k;
    const col = k < perCol ? 0 : 1;
    const row = perCol - 1 - (k % perCol);
    const x = x0 + col * (tw + 28);
    const y = y0 + row * (th + 2);
    ctx.fillStyle = '#120d18';
    ctx.fillRect(x - 1, y - 1, tw + 2, th + 2);
    const c = game.discovered.has(band) ? thumb(band) : null;
    if (c) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(c, x, y, tw, th);
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.fillStyle = '#221a2e';
      ctx.fillRect(x, y, tw, th);
    }
    const toMap = (wx: number, wy: number): [number, number] => [x + Math.round((wx / SCREEN_W) * tw), y + Math.round(((wy - band * SCREEN_H) / SCREEN_H) * th)];
    for (const it of game.items) {
      if (Math.floor(it.body.y / SCREEN_H) !== band || !game.discovered.has(band)) continue;
      const [mx, my] = toMap(it.body.x + 4, it.body.y + 4);
      ctx.fillStyle = '#f6d27a';
      ctx.fillRect(mx, my, 1, 1);
    }
    const p = game.player;
    if (Math.floor(p.centerY / SCREEN_H) === band) {
      const [mx, my] = toMap(p.centerX, p.centerY);
      ctx.fillStyle = '#ff5050';
      ctx.fillRect(mx - 1, my - 1, 3, 3);
    }
    drawText(ctx, String(k + 1), col === 0 ? x - 12 : x + tw + 4, y + th / 2 - 3, UI.dim, null);
  }
  drawTextCentered(ctx, 'gold: things you left behind   red: you', VIEW_W / 2, VIEW_H - 14, UI.dim);
}

/** The journal: every note read so far, one per page. */
export function drawJournal(ctx: CanvasRenderingContext2D, read: string[], page: number, hint: string): void {
  dimScreen(ctx, 0.75);
  const w = 250;
  const h = 150;
  const x = Math.round((VIEW_W - w) / 2);
  const y = Math.round((VIEW_H - h) / 2);
  drawPanel(ctx, x, y, w, h, UI.paper, UI.paperEdge, '#f6eed8');
  drawTextCentered(ctx, 'Journal', VIEW_W / 2, y + 8, '#7a4a2a', null);
  if (!read.length) {
    drawParagraph(ctx, 'Nothing yet. Maren left notes where she rested.', x + 14, y + 30, w - 28, UI.paperInk);
  } else {
    const id = read[Math.max(0, Math.min(read.length - 1, page))];
    const note = NOTES[id];
    drawTextCentered(ctx, note?.title ?? '', VIEW_W / 2, y + 26, '#7a4a2a', null);
    drawParagraph(ctx, note?.text ?? '', x + 14, y + 42, w - 28, UI.paperInk);
    drawTextCentered(ctx, `${page + 1} / ${read.length}`, VIEW_W / 2, y + h - 26, '#8a7650', null);
  }
  drawTextCentered(ctx, hint, VIEW_W / 2, y + h - 13, '#8a7650', null);
}

export interface EndStats {
  time: string;
  jumps: number;
  falls: number;
  biggestFall: number;
  gold: number;
}

export function drawStats(ctx: CanvasRenderingContext2D, s: EndStats, k: number, hint: string): void {
  ctx.save();
  ctx.globalAlpha = Math.min(1, k);
  dimScreen(ctx, 0.25);
  const w = 200;
  const h = 128;
  const x = Math.round((VIEW_W - w) / 2);
  const y = Math.round((VIEW_H - h) / 2) - 24;
  drawPanel(ctx, x, y, w, h);
  drawTextCentered(ctx, 'The climb', VIEW_W / 2, y + 8, UI.gold);
  const rows: [string, string][] = [
    ['Time', s.time],
    ['Jumps', String(s.jumps)],
    ['Falls', String(s.falls)],
    ['Biggest fall', `${s.biggestFall.toFixed(1)} screens`],
    ['Gold carried to the top', String(s.gold)],
  ];
  rows.forEach(([a, b], i) => {
    const yy = y + 28 + i * 15;
    drawText(ctx, a, x + 14, yy, UI.ink);
    drawText(ctx, b, x + w - 14 - textWidth(b), yy, UI.gold);
  });
  drawTextCentered(ctx, hint, VIEW_W / 2, y + h - 14, UI.dim);
  ctx.restore();
}

export function formatTime(frames: number): string {
  const s = Math.floor(frames / 60);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return h ? `${h}:${mm}:${String(sec).padStart(2, '0')}` : `${mm}:${String(sec).padStart(2, '0')}`;
}

export const CREDITS = [
  'HEAVY CROWN',
  '',
  'A climb in five levels.',
  'Pixel effects: pixelfx by patch-gg (MIT).',
  'Everything else was drawn in code.',
  '',
  'Thank you for climbing.',
];
