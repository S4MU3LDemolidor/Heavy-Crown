import { describe, expect, it } from 'vitest';
import { PixelBuffer } from '../src/art/buffer';
import { BODY_FRAMES, buildClimberSheet, FEET_X, FEET_Y, FRAME_H, FRAME_W, OUTLINE, OUTLINE_MIX, PALETTE } from '../src/art/climber';
import { alpha, hex, mix, red, toHex } from '../src/art/color';
import { parseGrid } from '../src/art/grid';
import { PORTRAIT_SIZE, portrait, WREN_FACES } from '../src/art/portraits';
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

describe('selective outline', () => {
  it('outlines each region in a dark tone of its own colour', () => {
    const b = new PixelBuffer(6, 3);
    b.set(1, 1, hex('#d6453b')); // red
    b.set(4, 1, hex('#3f4f8a')); // blue
    b.selout(hex('#120d24'), 0.6);
    const left = b.get(0, 1);
    const right = b.get(5, 1);
    expect(left).not.toBe(0);
    expect(right).not.toBe(0);
    expect(left).not.toBe(right);
    expect(left & 255).toBeGreaterThan((left >>> 16) & 255); // the red's outline stays reddish
    expect((right >>> 16) & 255).toBeGreaterThan(right & 255); // the blue's outline stays bluish
    expect(b.get(1, 1)).toBe(hex('#d6453b')); // the figure itself is untouched
  });
});

describe("Wren's sheet", () => {
  const { sheet, frames } = buildClimberSheet();
  /** Bounding box and colour count of one frame's opaque pixels. */
  const measure = (tier: number, name: (typeof BODY_FRAMES)[number]) => {
    const f = frames[tier][name];
    let x0 = FRAME_W, x1 = -1, y0 = FRAME_H, y1 = -1;
    const colours = new Set<number>();
    for (let y = 0; y < FRAME_H; y++)
      for (let x = 0; x < FRAME_W; x++) {
        const c = sheet.get(f.sx + x, f.sy + y);
        if (!(c >>> 24)) continue;
        colours.add(c);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
    return { w: x1 - x0 + 1, h: y1 - y0 + 1, bottom: y1, colours: colours.size };
  };

  it('is one row per load tier and one column per body frame, at the remake frame size', () => {
    expect([FRAME_W, FRAME_H]).toEqual([40, 44]);
    expect(sheet.w).toBe(BODY_FRAMES.length * FRAME_W);
    expect(sheet.h).toBe(5 * FRAME_H);
  });

  it('stands Wren about 30 px tall with the feet on FEET_Y', () => {
    const m = measure(0, 'idle0');
    expect(m.h).toBeGreaterThanOrEqual(29);
    expect(m.h).toBeLessThanOrEqual(33);
    expect(m.bottom).toBe(FEET_Y);
  });

  it('breathes: idle0 and idle1 differ', () => {
    const a = frames[0].idle0;
    const b = frames[0].idle1;
    let diff = 0;
    for (let y = 0; y < FRAME_H; y++) for (let x = 0; x < FRAME_W; x++) if (sheet.get(a.sx + x, a.sy + y) !== sheet.get(b.sx + x, b.sy + y)) diff++;
    expect(diff).toBeGreaterThan(4);
  });

  it('uses only its palette (at most 30 colours) and one outline tone of each', () => {
    expect(PALETTE.length).toBeLessThanOrEqual(30);
    const allowed = new Set([...PALETTE, ...PALETTE.map((c) => mix(c, OUTLINE, OUTLINE_MIX))]);
    for (const tier of [0, 2, 4]) {
      const f = frames[tier].idle0;
      for (let y = 0; y < FRAME_H; y++)
        for (let x = 0; x < FRAME_W; x++) {
          const c = sheet.get(f.sx + x, f.sy + y);
          if (c >>> 24) expect(allowed.has(c), `tier ${tier} (${x}, ${y})`).toBe(true);
        }
    }
  });

  it('the pack grows with the load tier', () => {
    expect(frames[3].idle0.pack[3]).toBeGreaterThan(frames[1].idle0.pack[3]);
    expect(frames[1].idle0.pack[3]).toBeGreaterThan(frames[0].idle0.pack[3]);
  });

  it('draws a pose for every body frame (only land and the last stumble frame reuse a crouch on purpose)', () => {
    const sig = (name: (typeof BODY_FRAMES)[number]) => {
      const f = frames[0][name];
      let s = '';
      for (let y = 0; y < FRAME_H; y++) for (let x = 0; x < FRAME_W; x++) s += (sheet.get(f.sx + x, f.sy + y) >>> 0).toString(36) + ',';
      return s;
    };
    const seen = new Map<string, string>();
    const shared = new Set(['land', 'stumble3']);
    for (const name of BODY_FRAMES) {
      const s = sig(name);
      if (!shared.has(name)) expect(seen.get(s), `${name} repeats ${seen.get(s)}`).toBeUndefined();
      seen.set(s, name);
    }
    expect(BODY_FRAMES).toContain('cling0');
    expect(BODY_FRAMES).toContain('hang');
  });

  it('lies flat when knocked down: the first stumble frames are wider than tall', () => {
    const m = measure(0, 'stumble0');
    expect(m.w).toBeGreaterThan(m.h);
    expect(m.bottom).toBe(FEET_Y);
  });

  it('puts the neck inside the frame, near the top of the body', () => {
    const [nx, ny] = frames[0].idle0.neck;
    expect(nx).toBeGreaterThan(FEET_X - 8);
    expect(nx).toBeLessThan(FEET_X + 8);
    expect(ny).toBeLessThan(FEET_Y - 15);
  });
});

describe('portraits', () => {
  it("draws Wren's neutral face at 64×64, mostly opaque, in a small palette", () => {
    const p = portrait('wren', 'neutral');
    expect([p.w, p.h]).toEqual([PORTRAIT_SIZE, PORTRAIT_SIZE]);
    let opaque = 0;
    const colours = new Set<number>();
    for (let y = 0; y < p.h; y++)
      for (let x = 0; x < p.w; x++) {
        const c = p.get(x, y);
        if (c >>> 24) {
          opaque++;
          colours.add(c);
        }
      }
    expect(opaque / (p.w * p.h)).toBeGreaterThan(0.45);
    expect(colours.size).toBeLessThanOrEqual(40);
  });

  it("changes only the face between Wren's expressions", () => {
    const n = portrait('wren', 'neutral');
    for (const face of WREN_FACES) {
      const p = portrait('wren', face);
      let changed = 0;
      for (let y = 0; y < p.h; y++)
        for (let x = 0; x < p.w; x++) {
          if (p.get(x, y) === n.get(x, y)) continue;
          changed++;
          expect(x >= 28 && x <= 52 && y >= 22 && y <= 44, `${face} changes (${x}, ${y})`).toBe(true);
        }
      if (face !== 'neutral') expect(changed, face).toBeGreaterThan(6);
    }
  });
});
