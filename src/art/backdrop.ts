import type { Theme } from '../content/themes';
import { VIEW_H, VIEW_W } from '../game/tuning';
import { PixelBuffer } from './buffer';
import { hex, mix, withAlpha, type RGBA } from './color';
import { bayer, fbm, hash2, rng, valueNoise } from './noise';

/** Vertical parallax factors (spec section 10). */
export const PARALLAX = { far: 0.1, mid: 0.25, near: 0.5 } as const;
export type LayerName = keyof typeof PARALLAX;

/** Dithered vertical gradient through `stops`. */
function gradient(buf: PixelBuffer, stops: RGBA[], y0: number, y1: number): void {
  const n = stops.length - 1;
  for (let y = y0; y < y1; y++) {
    const t = ((y - y0) / Math.max(1, y1 - y0 - 1)) * n;
    const i = Math.min(n - 1, Math.floor(t));
    const f = t - i;
    for (let x = 0; x < buf.w; x++) buf.set(x, y, f > bayer(x, y) ? stops[i + 1] : stops[i]);
  }
}

/** Soft disc with dithered halo rings. */
function sun(buf: PixelBuffer, cx: number, cy: number, r: number, core: RGBA, halo: RGBA): void {
  for (let y = cy - r * 3; y <= cy + r * 3; y++)
    for (let x = cx - r * 3; x <= cx + r * 3; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) buf.set(x, y, d > r - 1.5 ? mix(core, halo, 0.3) : core);
      else if (d < r * 3) {
        const t = 1 - (d - r) / (r * 2);
        if (t * t * 0.9 > bayer(x, y)) buf.blend(x, y, withAlpha(halo, 90));
      }
    }
}

/** Long thin dithered cloud streaks. */
function streaks(buf: PixelBuffer, color: RGBA, y0: number, y1: number, seed: number, density = 0.5): void {
  for (let y = y0; y < y1; y++)
    for (let x = 0; x < buf.w; x++) {
      const n = fbm(x * 0.25, y * 2.2, 24, 3, seed);
      const t = (n - (1 - density * 0.6)) * 4;
      if (t > bayer(x, y)) buf.blend(x, y, withAlpha(color, 150));
    }
}

/** The sky behind everything; fixed to the view. */
export function paintSky(theme: Theme): PixelBuffer {
  const buf = new PixelBuffer(VIEW_W, VIEW_H);
  const stops = theme.sky.map((c) => hex(c));
  gradient(buf, stops, 0, VIEW_H);
  const r = rng(theme.id.length * 97);
  switch (theme.id) {
    case 'overgrown':
      streaks(buf, hex('#f4b07a'), 120, 190, 3, 0.45);
      streaks(buf, hex('#7a4a6a'), 60, 120, 8, 0.4);
      sun(buf, 336, 214, 20, hex('#fff0c0'), hex('#f6c070'));
      break;
    case 'bells':
      streaks(buf, hex('#f6c48a'), 140, 220, 4, 0.5);
      sun(buf, 120, 228, 26, hex('#fff2c8'), hex('#f8b060'));
      break;
    case 'frozen':
    case 'dark': {
      const count = theme.id === 'frozen' ? 220 : 40;
      for (let i = 0; i < count; i++) {
        const x = Math.floor(r() * VIEW_W);
        const y = Math.floor(r() * VIEW_H * 0.8);
        const b = r();
        buf.set(x, y, mix(stops[stops.length - 1], hex('#ffffff'), b));
        if (b > 0.93) {
          buf.blend(x - 1, y, withAlpha(hex('#c8d8ff'), 120));
          buf.blend(x + 1, y, withAlpha(hex('#c8d8ff'), 120));
          buf.blend(x, y - 1, withAlpha(hex('#c8d8ff'), 120));
          buf.blend(x, y + 1, withAlpha(hex('#c8d8ff'), 120));
        }
      }
      if (theme.id === 'frozen') sun(buf, 392, 52, 13, hex('#eef4ff'), hex('#8aa8e0'));
      break;
    }
    case 'cistern':
      streaks(buf, hex('#2a6a6a'), 150, 260, 6, 0.4);
      break;
  }
  return buf;
}

/** Height of a parallax layer for a level `span` pixels tall (top of its top screen to top of its bottom screen). */
export function layerHeight(layer: LayerName, span: number): number {
  return Math.ceil(VIEW_H + span * PARALLAX[layer]) + 2;
}

/** A ridge line: fills below y = base - amp * noise with `body`, rim-lit on top, hazed toward `haze`. */
function ridge(buf: PixelBuffer, base: number, amp: number, scale: number, seed: number, body: RGBA, rim: RGBA, haze?: RGBA, hazeDepth = 40): void {
  for (let x = 0; x < buf.w; x++) {
    const n = fbm(x, seed * 13, scale, 4, seed);
    const sharp = Math.abs(valueNoise(x, seed, scale * 0.5, seed + 3) - 0.5) * 2;
    const top = Math.round(base - amp * (n * 0.75 + sharp * 0.25));
    for (let y = Math.max(0, top); y < buf.h; y++) {
      let c = y === top ? rim : body;
      if (haze && y > top) {
        const t = Math.min(1, (y - top) / hazeDepth);
        if (t * 0.6 > bayer(x, y)) c = mix(body, haze, 0.35);
      }
      buf.set(x, y, c);
    }
  }
}

function pine(buf: PixelBuffer, cx: number, baseY: number, h: number, body: RGBA, rim: RGBA): void {
  for (let k = 0; k < h; k++) {
    const y = baseY - k;
    const w = Math.max(0, Math.round(((h - k) / h) * (h * 0.32)) + (k % 3 === 0 ? 1 : 0));
    for (let x = cx - w; x <= cx + w; x++) buf.set(x, y, x === cx - w ? rim : body);
  }
}

function ruinTower(buf: PixelBuffer, x: number, baseY: number, w: number, h: number, body: RGBA, rim: RGBA, hole: RGBA | null, seed: number): void {
  for (let y = baseY - h; y < baseY; y++)
    for (let i = 0; i < w; i++) buf.set(x + i, y, i === 0 ? rim : body);
  // crenellations / broken top
  for (let i = 0; i < w; i += 3) {
    const k = Math.floor(hash2(i, seed, 3) * 4);
    for (let j = 1; j <= k; j++) buf.set(x + i, baseY - h - j, body);
  }
  // windows
  if (hole)
    for (let y = baseY - h + 6; y < baseY - 8; y += 12) {
      const wx = x + Math.floor(w / 2) - 1;
      for (let j = 0; j < 5; j++) for (let i = 0; i < 2; i++) buf.set(wx + i, y + j, hole);
    }
}

/** Pillars joined by round arches, rising the full layer height. */
function arcade(buf: PixelBuffer, body: RGBA, rim: RGBA, dark: RGBA, seed: number, spacing: number, pillarW: number): void {
  const r = rng(seed);
  for (let px = -20; px < buf.w + spacing; px += spacing) {
    const x = px + Math.floor(r() * 30) - 15;
    const broken = r();
    const top = broken < 0.35 ? Math.floor(r() * buf.h * 0.6) : 0;
    for (let y = top; y < buf.h; y++) {
      for (let i = 0; i < pillarW; i++) {
        const c = i === 0 ? rim : i === pillarW - 1 ? dark : body;
        buf.set(x + i, y, c);
      }
      // capital bands
      if ((y + seed) % 90 === 0) for (let i = -2; i < pillarW + 2; i++) buf.set(x + i, y, rim);
    }
    // ragged broken top
    if (top > 0) for (let i = 0; i < pillarW; i++) for (let j = 1; j < 1 + Math.floor(hash2(i, x, seed) * 6); j++) buf.set(x + i, top - j, body);
    // arch to the next pillar, repeated every 90px of height
    if (broken >= 0.35) {
      for (let ay = 40 + (seed % 30); ay < buf.h; ay += 90) {
        const span = spacing - pillarW;
        const ax = x + pillarW;
        for (let i = 0; i < span; i++) {
          const t = i / span;
          const archY = ay + Math.round(Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2)) * -16);
          for (let j = 0; j < 6; j++) buf.set(ax + i, archY + j, j === 0 ? rim : body);
          for (let j = 6; j < 16 - Math.round(Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2)) * 14); j++) buf.set(ax + i, archY + j, body);
        }
      }
    }
  }
}

/** One parallax layer for a level. */
export function paintLayer(theme: Theme, layer: LayerName, height: number): PixelBuffer {
  const buf = new PixelBuffer(VIEW_W, height);
  const ramp = (layer === 'far' ? theme.far : layer === 'mid' ? theme.mid : theme.near).map((c) => hex(c));
  const sky = theme.sky.map((c) => hex(c));
  const horizonHaze = sky[sky.length - 1];
  const bottom = height;
  switch (theme.id) {
    case 'overgrown': {
      if (layer === 'far') {
        ridge(buf, bottom - 70, 60, 70, 1, ramp[2], mix(ramp[2], horizonHaze, 0.5), horizonHaze, 60);
        ridge(buf, bottom - 40, 40, 50, 2, ramp[1], ramp[2], horizonHaze, 40);
      } else if (layer === 'mid') {
        ridge(buf, bottom - 46, 18, 60, 5, ramp[0], ramp[1]);
        const r = rng(11);
        for (let x = 0; x < buf.w; x += 5 + Math.floor(r() * 7)) {
          const base = bottom - 30 - Math.floor(fbm(x, 0, 60, 3, 5) * 14);
          pine(buf, x, base, 10 + Math.floor(r() * 16), ramp[0], ramp[1]);
        }
        ruinTower(buf, 70, bottom - 40, 14, 70, ramp[1], ramp[2], hex(theme.sky[4]), 1);
        ruinTower(buf, 410, bottom - 36, 10, 46, ramp[1], ramp[2], hex(theme.sky[4]), 2);
      } else {
        arcade(buf, ramp[1], ramp[2], ramp[0], 7, 150, 18);
      }
      break;
    }
    case 'cistern': {
      if (layer === 'far') arcade(buf, ramp[1], ramp[2], ramp[0], 3, 110, 10);
      else if (layer === 'mid') arcade(buf, ramp[1], ramp[2], ramp[0], 5, 160, 16);
      else arcade(buf, ramp[1], ramp[2], ramp[0], 9, 210, 24);
      break;
    }
    case 'bells': {
      if (layer === 'far') {
        ridge(buf, bottom - 50, 50, 80, 21, ramp[2], mix(ramp[2], horizonHaze, 0.5), horizonHaze, 50);
      } else if (layer === 'mid') {
        ruinTower(buf, 40, bottom, 30, height - 40, ramp[1], ramp[2], hex(theme.sky[5]), 3);
        ruinTower(buf, 300, bottom, 24, height - 90, ramp[1], ramp[2], hex(theme.sky[5]), 4);
      } else arcade(buf, ramp[1], ramp[2], ramp[0], 13, 170, 20);
      break;
    }
    case 'dark': {
      if (layer !== 'far') arcade(buf, ramp[1], ramp[2], ramp[0], layer === 'mid' ? 17 : 19, layer === 'mid' ? 140 : 200, layer === 'mid' ? 12 : 20);
      break;
    }
    case 'frozen': {
      if (layer === 'far') {
        // snowy peaks far below the summit
        const snow = hex('#c8d8f0');
        ridge(buf, bottom - 30, 70, 60, 31, ramp[1], snow, hex(theme.sky[5]), 30);
        for (let y = 0; y < buf.h; y++)
          for (let x = 0; x < buf.w; x++) {
            const c = buf.get(x, y);
            if (c >>> 24 && c !== snow && fbm(x, y, 8, 2, 4) > 0.62 - (bottom - y) * 0.002) buf.set(x, y, mix(snow, ramp[2], 0.3));
          }
      } else if (layer === 'mid') {
        ruinTower(buf, 30, bottom, 18, height - 30, ramp[1], ramp[2], null, 5);
        ruinTower(buf, 420, bottom, 14, height - 120, ramp[1], ramp[2], null, 6);
      } else arcade(buf, ramp[1], ramp[2], ramp[0], 23, 220, 16);
      break;
    }
  }
  return buf;
}

/** The first sunrise in a hundred years (the ending). */
export function paintDawn(): PixelBuffer {
  const buf = new PixelBuffer(VIEW_W, VIEW_H);
  const stops = ['#2a3a78', '#4a4a92', '#8a5a9a', '#d27a8a', '#f6a878', '#ffd890', '#fff2c0'].map((c) => hex(c));
  gradient(buf, stops, 0, VIEW_H);
  streaks(buf, hex('#ffd0a0'), 150, 230, 12, 0.5);
  streaks(buf, hex('#b07aa8'), 80, 140, 14, 0.4);
  sun(buf, 240, 236, 26, hex('#fffbe8'), hex('#ffd890'));
  return buf;
}
