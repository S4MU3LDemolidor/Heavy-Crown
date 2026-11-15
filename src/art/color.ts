/** Colors as packed RGBA numbers: 0xAABBGGRR (little-endian ImageData order). */
export type RGBA = number;

export function hex(h: string, alpha = 255): RGBA {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const r = parseInt(s.slice(0, 2), 16);
  const g = parseInt(s.slice(2, 4), 16);
  const b = parseInt(s.slice(4, 6), 16);
  const a = s.length === 8 ? parseInt(s.slice(6, 8), 16) : alpha;
  return pack(r, g, b, a);
}

export function pack(r: number, g: number, b: number, a = 255): RGBA {
  return ((a & 255) << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0;
}

export const red = (c: RGBA) => c & 255;
export const green = (c: RGBA) => (c >>> 8) & 255;
export const blue = (c: RGBA) => (c >>> 16) & 255;
export const alpha = (c: RGBA) => c >>> 24;

/** Linear mix of two colors, t in [0, 1]. */
export function mix(a: RGBA, b: RGBA, t: number): RGBA {
  const u = 1 - t;
  return pack(
    Math.round(red(a) * u + red(b) * t),
    Math.round(green(a) * u + green(b) * t),
    Math.round(blue(a) * u + blue(b) * t),
    Math.round(alpha(a) * u + alpha(b) * t),
  );
}

/** Multiplies the RGB channels by k (alpha unchanged). */
export function shade(c: RGBA, k: number): RGBA {
  return pack(
    Math.min(255, Math.round(red(c) * k)),
    Math.min(255, Math.round(green(c) * k)),
    Math.min(255, Math.round(blue(c) * k)),
    alpha(c),
  );
}

export function withAlpha(c: RGBA, a: number): RGBA {
  return ((c & 0xffffff) | ((a & 255) << 24)) >>> 0;
}

export function toHex(c: RGBA): string {
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(red(c))}${h(green(c))}${h(blue(c))}`;
}

/** Picks from a dark→bright ramp by t in [0, 1]. */
export function rampAt(ramp: RGBA[], t: number): RGBA {
  const i = Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)));
  return ramp[i];
}
