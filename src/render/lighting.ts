import { bayer } from '../art/noise';
import { VIEW_H, VIEW_W } from '../game/tuning';

const hexRgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};

/**
 * Darkness and light (spec section 10, layer 10): a light buffer filled with the level's ambient light,
 * light sprites added on top as banded, dithered pools, then multiplied over the scene.
 */
export class Lighting {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly sprites = new Map<string, HTMLCanvasElement>();

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = VIEW_W;
    this.canvas.height = VIEW_H;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
  }

  /** Starts a frame: ambient level 0..1 tinted by `tint`. */
  begin(ambient: number, tint: string): void {
    const [r, g, b] = hexRgb(tint);
    // keep the ambient a little desaturated toward grey so tints read as mood, not filters
    const k = ambient;
    const mixc = (c: number) => Math.round((c * 0.7 + 255 * 0.3) * k);
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = `rgb(${mixc(r)}, ${mixc(g)}, ${mixc(b)})`;
    this.ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    this.ctx.globalCompositeOperation = 'lighter';
  }

  /** Adds a pool of light centred at (x, y) on screen. */
  add(x: number, y: number, radius: number, color: string, intensity = 1): void {
    const r = Math.max(4, Math.round(radius / 2) * 2);
    const key = `${r}:${color}:${Math.round(intensity * 10)}`;
    let s = this.sprites.get(key);
    if (!s) {
      s = makeLightSprite(r, color, intensity);
      this.sprites.set(key, s);
    }
    this.ctx.drawImage(s, Math.round(x - r), Math.round(y - r));
  }

  /** Multiplies the light buffer over `target`. */
  apply(target: CanvasRenderingContext2D): void {
    target.save();
    target.globalCompositeOperation = 'multiply';
    target.drawImage(this.canvas, 0, 0);
    target.restore();
  }
}

/** A radial light with four hard bands and ordered dithering between them. */
function makeLightSprite(r: number, color: string, intensity: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = r * 2;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(r * 2, r * 2);
  const [cr, cg, cb] = hexRgb(color);
  for (let y = 0; y < r * 2; y++)
    for (let x = 0; x < r * 2; x++) {
      const d = Math.hypot(x + 0.5 - r, y + 0.5 - r) / r;
      if (d >= 1) continue;
      const v = (1 - d) * 4;
      const band = Math.min(4, Math.floor(v + bayer(x, y) - 0.25));
      if (band <= 0) continue;
      const k = (band / 4) * intensity;
      const i = (y * r * 2 + x) * 4;
      img.data[i] = Math.min(255, cr * k);
      img.data[i + 1] = Math.min(255, cg * k);
      img.data[i + 2] = Math.min(255, cb * k);
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  return c;
}
