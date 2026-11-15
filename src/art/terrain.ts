import type { Theme } from '../content/themes';
import type { World } from '../game/level';
import { Tile } from '../game/tiles';
import { SCREEN_COLS, SCREEN_H, SCREEN_ROWS, SCREEN_W, TILE } from '../game/tuning';
import { PixelBuffer } from './buffer';
import { hex, mix, withAlpha, type RGBA } from './color';
import { bayer, fbm, hash2, valueNoise } from './noise';

/** Ivy-wall leaf ramp (the same green in every level, so it reads as climbable). */
const IVY = ['#1c2a1a', '#2e4422', '#47652a', '#6c8c32', '#a2b84a'];

/** Theme colors as packed RGBA, resolved once. */
export interface Swatch {
  stone: RGBA[];
  back: RGBA[];
  accent: RGBA[];
  accent2: RGBA[];
}

export function swatch(t: Theme): Swatch {
  return {
    stone: t.stone.map((c) => hex(c)),
    back: t.back.map((c) => hex(c)),
    accent: t.accent.map((c) => hex(c)),
    accent2: t.accent2.map((c) => hex(c)),
  };
}

/** Light sources found while painting (glowing fungus etc.), in world pixels. */
export interface BakedLight {
  x: number;
  y: number;
  r: number;
  color: string;
}

/** A grass tuft drawn live so it can sway: base at (x, y) world pixels, growing up `len` pixels. */
export interface Tuft {
  x: number;
  y: number;
  len: number;
  body: RGBA;
  tip: RGBA;
  flower?: RGBA;
}

/** A hanging ivy strand drawn live: top at (x, y), `path` is the x wiggle per pixel down. */
export interface Vine {
  x: number;
  y: number;
  path: number[];
  seed: number;
  dark: RGBA;
  light: RGBA;
  leaf: RGBA;
}

export interface BakedScreen {
  band: number;
  buf: PixelBuffer;
  lights: BakedLight[];
  tufts: Tuft[];
  vines: Vine[];
}

/**
 * Paints one screen (band) of the tower: back wall, stone and the level's accents.
 * Open-air pixels stay transparent so the sky and parallax show through.
 */
export function paintScreen(world: World, band: number, theme: Theme): BakedScreen {
  const sw = swatch(theme);
  const buf = new PixelBuffer(SCREEN_W, SCREEN_H);
  const grid = world.grid;
  const ty0 = band * SCREEN_ROWS;
  const oy = ty0 * TILE; // world y of the screen's top
  const lights: BakedLight[] = [];

  const solid = (tx: number, ty: number) => grid.isSolid(tx, ty);
  const tileAt = (tx: number, ty: number) => grid.get(tx, ty);

  // --- class mask per tile: 1 = interior (back wall), 0 = open air (sky) ---
  const cols = SCREEN_COLS;
  const rows = SCREEN_ROWS + 4; // two tiles of margin above and below
  const maskAt = (tx: number, ty: number): number => {
    if (tx < 0 || tx >= cols) return 1;
    if (ty < 0 || ty >= grid.rows) return 1;
    const i = ty * cols + tx;
    if (!solid(tx, ty)) return world.open[i] ? 0 : 1;
    // solid tiles take the class of their open/interior neighbours (open wins)
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = tx + dx;
        const ny = ty + dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= grid.rows || solid(nx, ny)) continue;
        if (world.open[ny * cols + nx]) return 0;
      }
    return 1;
  };
  const mask = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) mask[r * cols + c] = maskAt(c, ty0 - 2 + r);

  // --- pixel distance to the interior/open boundary (chamfer), for ragged broken edges ---
  const PW = SCREEN_W;
  const PH = rows * TILE;
  const cls = new Uint8Array(PW * PH);
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) cls[y * PW + x] = mask[((y / TILE) | 0) * cols + ((x / TILE) | 0)];
  const dist = new Float32Array(PW * PH).fill(99);
  for (let y = 0; y < PH; y++)
    for (let x = 0; x < PW; x++) {
      const i = y * PW + x;
      const c = cls[i];
      if ((x > 0 && cls[i - 1] !== c) || (y > 0 && cls[i - PW] !== c) || (x < PW - 1 && cls[i + 1] !== c) || (y < PH - 1 && cls[i + PW] !== c)) dist[i] = 0.5;
    }
  for (let y = 0; y < PH; y++)
    for (let x = 0; x < PW; x++) {
      const i = y * PW + x;
      if (x > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 1);
      if (y > 0) dist[i] = Math.min(dist[i], dist[i - PW] + 1);
      if (x > 0 && y > 0) dist[i] = Math.min(dist[i], dist[i - PW - 1] + 1.4);
      if (x < PW - 1 && y > 0) dist[i] = Math.min(dist[i], dist[i - PW + 1] + 1.4);
    }
  for (let y = PH - 1; y >= 0; y--)
    for (let x = PW - 1; x >= 0; x--) {
      const i = y * PW + x;
      if (x < PW - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1);
      if (y < PH - 1) dist[i] = Math.min(dist[i], dist[i + PW] + 1);
      if (x < PW - 1 && y < PH - 1) dist[i] = Math.min(dist[i], dist[i + PW + 1] + 1.4);
      if (x > 0 && y < PH - 1) dist[i] = Math.min(dist[i], dist[i + PW - 1] + 1.4);
    }

  // --- depth inside solid masses, in tiles (0 = exposed edge) ---
  const depthOf = (tx: number, ty: number): number => {
    for (let d = 1; d <= 3; d++) {
      for (let dy = -d; dy <= d; dy++)
        for (let dx = -d; dx <= d; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
          const nx = tx + dx;
          const ny = ty + dy;
          if (nx < 0 || nx >= cols || ny >= grid.rows) continue;
          if (!solid(nx, ny)) return d - 1;
        }
    }
    return 3;
  };

  // --- back wall ---
  const back = sw.back;
  const warm = hex(theme.sky[theme.sky.length - 2] ?? theme.sky[0]);
  for (let y = 0; y < SCREEN_H; y++) {
    const wy = oy + y;
    const ty = (wy / TILE) | 0;
    for (let x = 0; x < SCREEN_W; x++) {
      const tx = (x / TILE) | 0;
      if (solid(tx, ty)) continue;
      const di = (y + 2 * TILE) * PW + x;
      const interior = cls[di] === 1;
      const d = dist[di];
      const n = fbm(x, wy, 10, 2, 7);
      // erosion: interior walls crumble near open air; open air keeps jagged stubs of wall
      const wall = interior ? d > n * 7 - 1 : d < n * 9 - 4;
      if (!wall) continue;
      // big staggered bricks 16×8
      const course = (wy / 8) | 0;
      const off = (hash2(course, 3, 11) * 16) | 0;
      const bx = ((x + off) / 16) | 0;
      const inBx = (x + off) % 16;
      const inBy = wy % 8;
      let c: RGBA;
      if (inBy === 7 || inBx === 15) c = back[0];
      else {
        const tone = hash2(bx, course, 5);
        c = tone < 0.3 ? back[1] : tone < 0.85 ? back[2] : back[3];
        if (inBy === 0 && tone > 0.5) c = back[3];
        if (valueNoise(x, wy, 3, 9) > 0.78 && bayer(x, wy) > 0.5) c = back[1];
      }
      // pilasters break up long walls
      const pil = (x + 37) % 150;
      if (interior && pil < 12) {
        const joint = wy % 16 === 15;
        c = pil === 0 || pil === 11 ? back[0] : pil === 1 ? back[3] : joint ? back[1] : back[2];
        if (!joint && pil > 1 && pil < 11 && valueNoise(x, wy, 4, 19) > 0.7 && bayer(x, wy) > 0.5) c = back[1];
      }
      // light spills in from openings: walls near the sky are brighter and warmer
      const glow = interior ? Math.max(0, 1 - d / 44) : 1;
      if (glow > 0 && glow * 0.75 > bayer(x, wy)) c = mix(c, back[3], 0.45);
      if (glow > 0) c = mix(c, warm, glow * 0.22);
      if (interior && d > 60 && bayer(x + 1, wy) > 0.55) c = mix(c, back[0], 0.35);
      // edge of broken wall gets a darker rim
      if (!interior || d < 2) c = mix(c, back[0], 0.5);
      // shadow under ledges: darker if solid is just above
      let shadow = 0;
      for (let k = 1; k <= 3; k++) if (solid(tx, ty - k)) shadow = Math.max(shadow, (4 - k) / 3);
      if (shadow > 0 && bayer(x, wy) < shadow * 0.8) c = mix(c, back[0], 0.6);
      buf.set(x, y, c);
    }
  }

  // --- solid stone ---
  const st = sw.stone;
  for (let ty = ty0; ty < ty0 + SCREEN_ROWS; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      if (!solid(tx, ty)) continue;
      const ice = tileAt(tx, ty) === Tile.Ice;
      const ivy = tileAt(tx, ty) === Tile.Ivy;
      const rough = tileAt(tx, ty) === Tile.Rough;
      const depth = depthOf(tx, ty);
      const upOpen = !solid(tx, ty - 1);
      const downOpen = !solid(tx, ty + 1);
      const leftOpen = !solid(tx - 1, ty);
      const rightOpen = !solid(tx + 1, ty);
      for (let py = 0; py < TILE; py++) {
        const wy = ty * TILE + py;
        const sy = wy - oy;
        const course = ty;
        const off = (hash2(course, 1, 21) * 16) | 0;
        for (let px = 0; px < TILE; px++) {
          const x = tx * TILE + px;
          let bw = 16;
          let bx = ((x + off) / bw) | 0;
          let inBx = (x + off) % bw;
          if (hash2(bx, course, 4) < 0.3) {
            bw = 8;
            bx = bx * 2 + (inBx >= 8 ? 1 : 0);
            inBx %= 8;
          }
          const tone = hash2(bx, course, 8 + bw);
          let idx = tone < 0.25 ? 2 : tone < 0.8 ? 3 : 4;
          idx -= Math.min(depth, 2);
          let c: RGBA;
          if (py === 7 || inBx === bw - 1) c = st[Math.max(0, idx - 2)];
          else {
            if (py === 0) idx += 1;
            if (py === 6) idx -= 1;
            if (fbm(x, wy, 4, 2, 13) > 0.62 && bayer(x, wy) > 0.4) idx -= 1;
            c = st[Math.max(1, Math.min(5, idx))];
          }
          // cracks
          if (hash2(bx, course, 77) < 0.08 && Math.abs(inBx - 4 - py * 0.6) < 0.6) c = st[1];
          // exposed edges
          if (upOpen && py === 0) c = st[5];
          else if (upOpen && py === 1 && bayer(x, wy) > 0.3) c = st[4];
          if (leftOpen && px === 0) c = st[0];
          if (rightOpen && px === 7) c = st[0];
          if (downOpen && py === 7) c = st[0];
          else if (downOpen && py === 6) c = mix(c, st[0], 0.5);
          if (ice) c = mix(c, sw.accent2[2], py < 2 && upOpen ? 0.7 : 0.45);
          if (ivy) {
            // a thick mat of leaves over the stone: climbable with the Claws
            const leaf = fbm(x, wy, 3, 2, 141);
            const h = hash2(x, wy, 142);
            if (leaf > 0.36 || h > 0.6) c = hex(IVY[leaf > 0.72 ? 4 : leaf > 0.6 ? 3 : leaf > 0.47 ? 2 : 1]);
            if (h > 0.97) c = hex(IVY[4]);
            if ((leaf < 0.32 && h < 0.3) || (wy % 4 === 3 && h < 0.35)) c = hex(IVY[0]);
          }
          if (rough) {
            // pitted stone full of handholds
            // handholds: dark pits with a lit lip above, in staggered rows so the wall reads as climbable
            const row = Math.floor(wy / 4);
            const hx = (x + (row % 2) * 2) % 4;
            const pit = hash2(Math.floor((x + (row % 2) * 2) / 4), row, 151);
            c = mix(c, st[2], 0.4);
            if (pit > 0.35 && hx < 2 && wy % 4 === 2) c = st[0];
            else if (pit > 0.35 && hx < 2 && wy % 4 === 1) c = st[5];
          }
          // round off exposed corners
          if (upOpen && ((leftOpen && px === 0) || (rightOpen && px === 7)) && py === 0) continue;
          buf.set(x, sy, c);
        }
      }
    }
  }

  // --- theme accents ---
  const tufts: Tuft[] = [];
  const vines: Vine[] = [];
  paintAccents(buf, world, band, theme, sw, lights, tufts, vines);
  return { band, buf, lights, tufts, vines };
}

function paintAccents(buf: PixelBuffer, world: World, band: number, theme: Theme, sw: Swatch, lights: BakedLight[], tufts: Tuft[], vines: Vine[]): void {
  const grid = world.grid;
  const ty0 = band * SCREEN_ROWS;
  const oy = ty0 * TILE;
  const solid = (tx: number, ty: number) => grid.isSolid(tx, ty);
  const a = sw.accent;
  const a2 = sw.accent2;
  const setW = (x: number, wy: number, c: RGBA) => buf.set(x, wy - oy, c);
  const blendW = (x: number, wy: number, c: RGBA) => buf.blend(x, wy - oy, c);

  for (let ty = ty0 - 1; ty < ty0 + SCREEN_ROWS + 1; ty++) {
    for (let tx = 0; tx < SCREEN_COLS; tx++) {
      if (!solid(tx, ty)) continue;
      const top = !solid(tx, ty - 1) && ty - 1 >= 0;
      const bottom = !solid(tx, ty + 1);
      const x0 = tx * TILE;
      const y0 = ty * TILE;

      if (theme.id === 'overgrown' || theme.id === 'cistern') {
        const wet = theme.id === 'cistern';
        if (top) {
          for (let px = 0; px < TILE; px++) {
            const x = x0 + px;
            const n = fbm(x, y0, 6, 2, 31);
            if (n < (wet ? 0.45 : 0.32)) continue;
            const thick = 1 + Math.floor((n - 0.3) * 6);
            for (let k = 0; k < thick && k < 4; k++) setW(x, y0 + k, k === 0 ? a[3] : k === 1 ? a[2] : a[1]);
            // tufts above the surface
            const h = hash2(x, ty, 41);
            if (!wet && h > 0.55) {
              const len = h > 0.93 ? 4 : h > 0.8 ? 3 : h > 0.68 ? 2 : 1;
              const flower = h > 0.985 ? (hash2(x, ty, 9) > 0.5 ? a2[0] : a2[3]) : undefined;
              tufts.push({ x, y: y0, len: flower ? 3 : len, body: a[3], tip: a[4], flower });
            }
          }
          // moss creeping down open sides
          for (const side of [-1, 1]) {
            if (solid(tx + side, ty)) continue;
            const x = side < 0 ? x0 : x0 + TILE - 1;
            const len = Math.floor(hash2(tx, ty, side + 50) * 5);
            for (let k = 0; k < len; k++) setW(x, y0 + k, k < 2 ? a[2] : a[1]);
          }
        }
        if (bottom && !wet) {
          // hanging ivy
          for (let px = 0; px < TILE; px += 1) {
            const x = x0 + px;
            const h = hash2(x, ty, 61);
            if (h < 0.86) continue;
            const len = 3 + Math.floor(hash2(x, ty, 62) * 16);
            let vx = x;
            const path: number[] = [];
            for (let k = 0; k < len; k++) {
              const wy = y0 + TILE + k;
              if (solid((vx / TILE) | 0, (wy / TILE) | 0)) break;
              if (hash2(x, k, 63) > 0.8) vx += hash2(x, k, 64) > 0.5 ? 1 : -1;
              path.push(vx - x);
            }
            if (path.length > 1) vines.push({ x, y: y0 + TILE, path, seed: hash2(x, ty, 65) * 6.28, dark: a[1], light: a[3], leaf: a[2] });
          }
        }
        if (bottom && wet) {
          // wet streaks and drips under ledges
          for (let px = 0; px < TILE; px++) {
            const x = x0 + px;
            if (hash2(x, ty, 71) < 0.9) continue;
            const len = 2 + Math.floor(hash2(x, ty, 72) * 6);
            for (let k = 0; k < len; k++) blendW(x, y0 + TILE + k, withAlpha(a2[2], 180 - k * 20));
          }
        }
      } else if (theme.id === 'bells') {
        if (top) {
          for (let px = 0; px < TILE; px++) {
            const x = x0 + px;
            if (fbm(x, y0, 5, 2, 33) > 0.55) setW(x, y0, a[3]);
            if (hash2(x, ty, 34) > 0.93) setW(x, y0 - 1, a[2]);
          }
        }
        if (bottom && hash2(tx, ty, 35) > 0.85) {
          // cobweb in the corner under a ledge
          const len = 4 + Math.floor(hash2(tx, ty, 36) * 5);
          for (let k = 0; k < len; k++) {
            blendW(x0 + k, y0 + TILE + Math.floor(k * 0.6), withAlpha(a[4], 90));
            blendW(x0 + Math.floor(k * 0.4), y0 + TILE + k, withAlpha(a[4], 70));
          }
        }
      } else if (theme.id === 'dark') {
        if (top && hash2(tx, ty, 91) > 0.82) {
          // glowing fungus cluster
          const n = 2 + Math.floor(hash2(tx, ty, 92) * 3);
          for (let i = 0; i < n; i++) {
            const x = x0 + 1 + Math.floor(hash2(tx, i, 93) * 6);
            const h = 1 + Math.floor(hash2(tx, i, 94) * 3);
            for (let k = 1; k <= h; k++) setW(x, y0 - k, k === h ? a[4] : a[2]);
            setW(x - 1, y0 - h, a[3]);
            setW(x + 1, y0 - h, a[3]);
          }
          lights.push({ x: x0 + 4, y: y0 - 2, r: 22, color: theme.accent[3] });
        }
      } else if (theme.id === 'frozen') {
        if (top) {
          for (let px = -1; px <= TILE; px++) {
            const x = x0 + px;
            const n = valueNoise(x, y0, 5, 51);
            const h = 1 + Math.floor(n * 3);
            if ((px === -1 && solid(tx - 1, ty)) || (px === TILE && solid(tx + 1, ty))) continue;
            if ((px === -1 || px === TILE) && n < 0.5) continue;
            for (let k = 0; k < h; k++) setW(x, y0 - k + 1, k === h - 1 ? a[4] : k === 0 ? a[2] : a[3]);
          }
        }
        if (bottom) {
          for (let px = 0; px < TILE; px++) {
            const x = x0 + px;
            const h = hash2(x, ty, 55);
            if (h < 0.78) continue;
            const len = 2 + Math.floor(hash2(x, ty, 56) * 7);
            for (let k = 0; k < len; k++) {
              const wy = y0 + TILE + k;
              if (solid((x / TILE) | 0, (wy / TILE) | 0)) break;
              setW(x, wy, k < len / 2 ? a2[3] : a2[2]);
              if (k < len / 3) setW(x + 1, wy, a2[1]);
            }
          }
        }
      }
    }
  }

  // water surfaces (cistern pools): translucent body with a bright top line
  for (let ty = ty0; ty < ty0 + SCREEN_ROWS; ty++) {
    for (let tx = 0; tx < SCREEN_COLS; tx++) {
      if (grid.get(tx, ty) !== Tile.Water) continue;
      const surface = grid.get(tx, ty - 1) !== Tile.Water;
      for (let py = 0; py < TILE; py++)
        for (let px = 0; px < TILE; px++) {
          const x = tx * TILE + px;
          const wy = ty * TILE + py;
          const deep = Math.min(1, (py + (surface ? 0 : 8)) / 16);
          blendW(x, wy, withAlpha(mix(a2[1], a2[0], deep), 150));
          if (surface && py === 0) setW(x, wy, a2[3]);
          if (surface && py === 1 && bayer(x, wy) > 0.6) blendW(x, wy, withAlpha(a2[2], 200));
        }
    }
  }

}
