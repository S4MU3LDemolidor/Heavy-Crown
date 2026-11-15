import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { PNG } from 'pngjs';
import { PixelBuffer } from '../src/art/buffer';
import { hex } from '../src/art/color';

/** Writes a buffer to a PNG, scaled up by a whole number, over an optional backdrop color. */
export function savePng(buf: PixelBuffer, path: string, scale = 1, backdrop?: string): void {
  const out = new PixelBuffer(buf.w * scale, buf.h * scale);
  if (backdrop) out.fillRect(0, 0, out.w, out.h, hex(backdrop));
  for (let y = 0; y < buf.h; y++) {
    for (let x = 0; x < buf.w; x++) {
      const c = buf.get(x, y);
      if (c >>> 24 === 0) continue;
      for (let j = 0; j < scale; j++) for (let i = 0; i < scale; i++) out.blend(x * scale + i, y * scale + j, c);
    }
  }
  const png = new PNG({ width: out.w, height: out.h });
  Buffer.from(out.bytes()).copy(png.data);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, PNG.sync.write(png));
}
