import { describe, expect, it } from 'vitest';
import { PixelBuffer } from '../src/art/buffer';
import { alpha, hex, mix, red, toHex } from '../src/art/color';
import { parseGrid } from '../src/art/grid';
import { bayer, fbm, hash2, rng, valueNoise } from '../src/art/noise';

describe('color', () => {
  it('round-trips hex', () => {
    expect(toHex(hex('#12ab9f'))).toBe('#12ab9f');
    expect(toHex(hex('#fff'))).toBe('#ffffff');
    expect(alpha(hex('#00000080'))).toBe(128);
  });
  it('mixes', () => {
    expect(red(mix(hex('#000000'), hex('#ff0000'), 0.5))).toBe(128);
  });
});

describe('noise', () => {
  it('is deterministic and in range', () => {
    expect(hash2(3, 4, 1)).toBe(hash2(3, 4, 1));
    expect(hash2(3, 4, 1)).not.toBe(hash2(4, 3, 1));
    for (let i = 0; i < 100; i++) {
      const v = valueNoise(i * 1.7, i * 0.3, 8, 2);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      const f = fbm(i, i * 2, 16, 3, 5);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });
  it('bayer covers 16 distinct thresholds', () => {
    const s = new Set<number>();
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) s.add(bayer(x, y));
    expect(s.size).toBe(16);
  });
  it('rng is seeded', () => {
    const a = rng(7);
    const b = rng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('PixelBuffer', () => {
  it('sets, blends and ignores out-of-bounds', () => {
    const b = new PixelBuffer(4, 4);
    b.set(1, 1, hex('#ff0000'));
    b.set(9, 9, hex('#ff0000'));
    expect(toHex(b.get(1, 1))).toBe('#ff0000');
    b.blend(1, 1, hex('#0000ff', 128));
    expect(red(b.get(1, 1))).toBeGreaterThan(100);
    expect(red(b.get(1, 1))).toBeLessThan(140);
  });
  it('blits with flip and skips transparency', () => {
    const src = new PixelBuffer(2, 1);
    src.set(0, 0, hex('#ff0000'));
    const dst = new PixelBuffer(2, 1);
    dst.set(1, 0, hex('#00ff00'));
    dst.blit(src, 0, 0, true);
    expect(toHex(dst.get(1, 0))).toBe('#ff0000');
    expect(alpha(dst.get(0, 0))).toBe(0);
  });
  it('outlines opaque pixels', () => {
    const b = new PixelBuffer(3, 3);
    b.set(1, 1, hex('#ffffff'));
    b.outline(hex('#000000'));
    expect(toHex(b.get(0, 1))).toBe('#000000');
    expect(alpha(b.get(0, 0))).toBe(0);
  });
});

describe('parseGrid', () => {
  it('maps letters and leaves dots transparent', () => {
    const b = parseGrid(['a.', '.a'], { a: hex('#123456') });
    expect(toHex(b.get(0, 0))).toBe('#123456');
    expect(alpha(b.get(1, 0))).toBe(0);
  });
  it('rejects unknown letters and ragged rows', () => {
    expect(() => parseGrid(['ab'], { a: 1 })).toThrow(/unknown letter 'b'/);
    expect(() => parseGrid(['aa', 'a'], { a: 1 })).toThrow(/expected 2/);
  });
});
