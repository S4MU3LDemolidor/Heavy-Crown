import { bayer, fbm } from '../art/noise';
import type { Theme, ThemeId } from '../content/themes';
import { VIEW_H, VIEW_W } from '../game/tuning';

const FOG_W = 960;

const hexRgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};

/**
 * Drifting pixel fog (spec section 10, layer 9): tileable noise quantized to three alpha steps
 * with ordered dithering so it stays crisp, tinted per level.
 */
export class Fog {
  private readonly cache = new Map<string, HTMLCanvasElement>();

  private texture(theme: Theme, kind: 'haze' | 'mist'): HTMLCanvasElement {
    const key = `${theme.id}:${kind}`;
    let c = this.cache.get(key);
    if (c) return c;
    const h = kind === 'mist' ? 90 : 120;
    c = document.createElement('canvas');
    c.width = FOG_W;
    c.height = h;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(FOG_W, h);
    const [r, g, b] = hexRgb(theme.fog);
    const seed = kind === 'mist' ? 41 : 17;
    const scale = kind === 'mist' ? 34 : 60;
    const f = (x: number, y: number) => fbm(x * 0.6, y * 1.4, scale, 4, seed);
    const n = (x: number, y: number) => f(x, y) * ((FOG_W - x) / FOG_W) + f(x - FOG_W, y) * (x / FOG_W);
    const dens = theme.fogDensity * (kind === 'mist' ? 1.15 : 0.7);
    for (let y = 0; y < h; y++) {
      // mist thickens toward the bottom; haze fades at both edges
      const shape = kind === 'mist' ? Math.min(1, (y / h) * 1.6) : Math.sin((y / h) * Math.PI);
      for (let x = 0; x < FOG_W; x++) {
        const v = (n(x, y) - 0.35) * 2.2 * shape * dens * 2;
        if (v <= 0) continue;
        // three alpha steps, dithered between them
        const step = Math.min(3, Math.floor(v * 3 + bayer(x, y)));
        if (step <= 0) continue;
        const i = (y * FOG_W + x) * 4;
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        img.data[i + 3] = [0, 40, 75, 110][step];
      }
    }
    ctx.putImageData(img, 0, 0);
    this.cache.set(key, c);
    return c;
  }

  /** Haze drifting through the middle distance (behind objects and the climber). */
  drawHaze(ctx: CanvasRenderingContext2D, theme: Theme, t: number, alpha = 1): void {
    if (SKIP.has(theme.id)) return;
    const tex = this.texture(theme, 'haze');
    const x = -((t * 0.07) % FOG_W);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(tex, Math.round(x), 70);
    ctx.drawImage(tex, Math.round(x) + FOG_W, 70);
    ctx.restore();
  }

  /** Low mist along the bottom of the view, in front of everything. */
  drawMist(ctx: CanvasRenderingContext2D, theme: Theme, t: number, alpha = 1): void {
    const tex = this.texture(theme, 'mist');
    const x = -((t * 0.18) % FOG_W);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(tex, Math.round(x), VIEW_H - tex.height + 6);
    ctx.drawImage(tex, Math.round(x) + FOG_W, VIEW_H - tex.height + 6);
    ctx.restore();
  }
}

const SKIP = new Set<ThemeId>(['dark']);

/** A dithered vignette that darkens the corners. */
export function makeVignette(strength = 0.55): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = VIEW_W;
  c.height = VIEW_H;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(VIEW_W, VIEW_H);
  for (let y = 0; y < VIEW_H; y++)
    for (let x = 0; x < VIEW_W; x++) {
      const dx = (x - VIEW_W / 2) / (VIEW_W / 2);
      const dy = (y - VIEW_H / 2) / (VIEW_H / 2);
      const d = Math.max(0, Math.hypot(dx * 0.85, dy) - 0.62) / 0.6;
      const a = Math.min(1, d * d) * strength;
      const step = Math.floor(a * 4 + bayer(x, y) * 0.999) / 4;
      if (step <= 0) continue;
      img.data[(y * VIEW_W + x) * 4 + 3] = Math.round(step * 255);
    }
  ctx.putImageData(img, 0, 0);
  return c;
}
