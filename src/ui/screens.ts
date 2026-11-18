import { rasterText, textWidth } from '../art/font';
import { LEVELS_PER_ACT } from '../content/levels';
import { NOTES } from '../content/story';
import type { Game } from '../game/game';
import { THEMES } from '../content/themes';
import { Tile } from '../game/tiles';
import { SCREEN_COLS, SCREEN_H, SCREEN_ROWS, VIEW_H, VIEW_W } from '../game/tuning';
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
  scares: boolean;
}

export function drawOptions(ctx: CanvasRenderingContext2D, o: Options, sel: number, fullscreen: boolean, t: number): void {
  dimScreen(ctx, 0.7);
  const w = 220;
  const h = 136;
  const x = Math.round((VIEW_W - w) / 2);
  const y = Math.round((VIEW_H - h) / 2);
  drawPanel(ctx, x, y, w, h);
  drawTextCentered(ctx, 'Options', VIEW_W / 2, y + 8, UI.gold);
  const rows: [string, string][] = [
    ['Music', bar(o.music)],
    ['Effects', bar(o.sfx)],
    ['Fullscreen', fullscreen ? 'On' : 'Off'],
    ['Pack bar', o.alwaysMeter ? 'Always' : 'Only when weight changes'],
    ['Scares', o.scares ? 'On' : 'Off'],
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
/** A screen as one pixel per tile, coloured from its theme (for the map). */
export function mapThumb(game: Game, band: number): HTMLCanvasElement {
  const w = game.world;
  const theme = THEMES[w.levels[w.bandLevel[band]].theme];
  const c = document.createElement('canvas');
  c.width = SCREEN_COLS;
  c.height = SCREEN_ROWS;
  const g = c.getContext('2d')!;
  const colors: Record<number, string> = {
    [Tile.Solid]: theme.stone[4],
    [Tile.Water]: theme.accent2[2],
    [Tile.Ice]: theme.accent2[theme.accent2.length - 1],
    [Tile.Ladder]: theme.stone[4],
    [Tile.Ivy]: theme.accent[2],
    [Tile.Rough]: theme.stone[4],
  };
  for (let y = 0; y < SCREEN_ROWS; y++) {
    for (let x = 0; x < SCREEN_COLS; x++) {
      const ty = band * SCREEN_ROWS + y;
      const t = w.grid.get(x, ty);
      g.fillStyle = colors[t] ?? (w.open[ty * SCREEN_COLS + x] ? theme.sky[3] : theme.back[0]);
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

/** Maren's map, one act per page: six levels side by side, three screens each, with what you left behind. */
export function drawMap(ctx: CanvasRenderingContext2D, game: Game, act: number, thumb: (band: number) => HTMLCanvasElement | null, hint: string): void {
  dimScreen(ctx, 0.85);
  const w = game.world;
  const ids = Array.from({ length: LEVELS_PER_ACT }, (_, k) => (act - 1) * LEVELS_PER_ACT + k + 1);
  const cols = ids.map((id) => w.levels.findIndex((l) => l.id === id)).filter((li) => li >= 0);
  const theme = cols.length ? THEMES[w.levels[cols[0]].theme] : null;
  drawTextCentered(ctx, `Maren's map  -  ${theme ? `${theme.numeral}. ${theme.title}` : ''}`, VIEW_W / 2, 8, UI.gold);
  const gapX = 8;
  const x0 = Math.round(VIEW_W / 2 - (cols.length * SCREEN_COLS + (cols.length - 1) * gapX) / 2);
  const tall = Math.max(...cols.map((li) => w.bandLevel.filter((b) => b === li).length), 3);
  const y0 = Math.round(VIEW_H / 2 - (tall * SCREEN_ROWS) / 2) + 2;
  const p = game.player;
  const playerBand = Math.floor(p.centerY / SCREEN_H);
  cols.forEach((li, i) => {
    const x = x0 + i * (SCREEN_COLS + gapX);
    const bands = w.bandLevel.map((b, k) => [b, k]).filter(([b]) => b === li).map(([, k]) => k);
    // levels are drawn bottom-aligned so a four-screen level rises above the rest
    const yTop = y0 + (tall - bands.length) * SCREEN_ROWS;
    bands.forEach((band, k) => {
      const y = yTop + k * SCREEN_ROWS;
      ctx.fillStyle = '#0c0910';
      ctx.fillRect(x - 1, y - 1, SCREEN_COLS + 2, SCREEN_ROWS + 2);
      const c = game.discovered.has(band) ? thumb(band) : null;
      if (c) ctx.drawImage(c, x, y);
      else {
        ctx.fillStyle = '#1a1422';
        ctx.fillRect(x, y, SCREEN_COLS, SCREEN_ROWS);
      }
      if (!c) return;
      const toMap = (wx: number, wy: number): [number, number] => [x + Math.floor(wx / 8), y + Math.floor((wy - band * SCREEN_H) / 8)];
      for (const l of game.lifts) {
        if (Math.floor((l.y - 1) / SCREEN_H) !== band) continue;
        const [mx, my] = toMap(l.x, l.y - 4);
        ctx.fillStyle = '#5ab0ff';
        ctx.fillRect(mx - 1, my - 1, 2, 2);
      }
      for (const n of game.npcs) {
        if (n.gone || Math.floor((n.y - 1) / SCREEN_H) !== band || n.id === 'hollow') continue;
        const [mx, my] = toMap(n.x, n.y - 8);
        ctx.fillStyle = '#e8e0f0';
        ctx.fillRect(mx, my, 1, 2);
      }
      for (const it of game.items) {
        if (Math.floor(it.body.y / SCREEN_H) !== band) continue;
        const [mx, my] = toMap(it.body.x + 4, it.body.y + 4);
        ctx.fillStyle = '#f6d27a';
        ctx.fillRect(mx, my, 1, 1);
      }
      if (band === playerBand) {
        const [mx, my] = toMap(p.centerX, p.centerY);
        ctx.fillStyle = '#ff5050';
        ctx.fillRect(mx - 1, my - 1, 3, 3);
      }
    });
    drawTextCentered(ctx, String(w.levels[li].id), x + SCREEN_COLS / 2, y0 + tall * SCREEN_ROWS + 4, UI.dim);
  });
  drawTextCentered(ctx, 'gold: left behind   blue: lifts   white: people   red: you', VIEW_W / 2, VIEW_H - 26, UI.dim);
  drawTextCentered(ctx, hint, VIEW_W / 2, VIEW_H - 14, UI.dim);
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
