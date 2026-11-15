import type { PixelBuffer } from '../art/buffer';

/** Copies a pixel buffer into a new canvas. */
export function toCanvas(buf: PixelBuffer): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = buf.w;
  c.height = buf.h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  const img = ctx.createImageData(buf.w, buf.h);
  img.data.set(buf.bytes());
  ctx.putImageData(img, 0, 0);
  return c;
}
