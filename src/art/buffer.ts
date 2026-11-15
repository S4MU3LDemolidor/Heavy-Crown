import { alpha, blue, green, pack, red, type RGBA } from './color';

/** An RGBA pixel buffer, row-major, packed as 0xAABBGGRR (same byte order as ImageData). */
export class PixelBuffer {
  readonly w: number;
  readonly h: number;
  readonly px: Uint32Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.px = new Uint32Array(w * h);
  }

  inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  get(x: number, y: number): RGBA {
    return this.inside(x, y) ? this.px[y * this.w + x] : 0;
  }

  set(x: number, y: number, c: RGBA): void {
    if (this.inside(x, y)) this.px[y * this.w + x] = c;
  }

  /** Alpha-blends c over the existing pixel. */
  blend(x: number, y: number, c: RGBA): void {
    if (!this.inside(x, y)) return;
    const a = alpha(c);
    if (a === 0) return;
    const i = y * this.w + x;
    if (a === 255) {
      this.px[i] = c;
      return;
    }
    const d = this.px[i];
    const da = alpha(d);
    const t = a / 255;
    const outA = a + da * (1 - t);
    if (outA === 0) return;
    const k = (da * (1 - t)) / outA;
    const s = a / outA;
    this.px[i] = pack(
      Math.round(red(c) * s + red(d) * k),
      Math.round(green(c) * s + green(d) * k),
      Math.round(blue(c) * s + blue(d) * k),
      Math.round(outA),
    );
  }

  fillRect(x: number, y: number, w: number, h: number, c: RGBA): void {
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++) {
      for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) this.px[j * this.w + i] = c;
    }
  }

  /** Copies src onto this buffer at (x, y), skipping transparent pixels; blends partial alpha. */
  blit(src: PixelBuffer, x: number, y: number, flip = false, sx = 0, sy = 0, sw = src.w, sh = src.h): void {
    for (let j = 0; j < sh; j++) {
      for (let i = 0; i < sw; i++) {
        const c = src.get(sx + (flip ? sw - 1 - i : i), sy + j);
        if (alpha(c) === 0) continue;
        this.blend(x + i, y + j, c);
      }
    }
  }

  /** Draws a 1px outline of color c around every opaque pixel (4-neighbour), into transparent pixels only. */
  outline(c: RGBA): void {
    const mark: number[] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (alpha(this.get(x, y)) !== 0) continue;
        if (
          alpha(this.get(x - 1, y)) > 127 ||
          alpha(this.get(x + 1, y)) > 127 ||
          alpha(this.get(x, y - 1)) > 127 ||
          alpha(this.get(x, y + 1)) > 127
        ) {
          mark.push(y * this.w + x);
        }
      }
    }
    for (const i of mark) this.px[i] = c;
  }

  clone(): PixelBuffer {
    const b = new PixelBuffer(this.w, this.h);
    b.px.set(this.px);
    return b;
  }

  /** The bytes as RGBA, ready for ImageData or a PNG encoder. */
  bytes(): Uint8ClampedArray {
    return new Uint8ClampedArray(this.px.buffer, this.px.byteOffset, this.px.byteLength);
  }
}
