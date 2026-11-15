/**
 * Level generator (full-game spec section 9). Builds a level around its climbing route: a chain of
 * ledges from the entry up to the exit, interrupted by set pieces (ivy buttresses, rough shafts,
 * climbable pillars, grapple rings, storey floors with a hatch, bells, ice), then walls, rooms and
 * decoration around it. Every candidate is validated with the real climbability checker; the first
 * seed that passes wins, so the output is deterministic per spec.
 */
import type { ThemeId } from '../../src/content/themes';
import { Game } from '../../src/game/game';
import { buildWorld, type LegendEntry, type LevelDef } from '../../src/game/level';
import { explore, type ReachOptions } from '../../src/game/reach';
import { SCREEN_COLS, SCREEN_ROWS, TILE, TUNING } from '../../src/game/tuning';
import { jumpHeight } from '../../src/game/weight';

export const W = SCREEN_COLS;
export const SR = SCREEN_ROWS;
/** Characters the generator treats as solid (bells are objects but solid). */
const SOLID = new Set(['#', '%', '&', 'i', 'C', 'B']);

export type Move = 'claws' | 'hook' | 'crampons';

/** A slab the climber stands on: columns x0..x1, top row y (level-local, 0 = top of the top screen). */
export interface Ledge {
  x0: number;
  x1: number;
  y: number;
}

export type PieceSpec =
  /** A buttress against a side wall whose face is ivy (or rough stone): cling and climb it. */
  | { kind: 'ivy'; at: number; side?: 'L' | 'R'; h?: number; face?: '%' | '&' }
  /** A free-standing climbable column with a ledge on top. */
  | { kind: 'pillar'; at: number; h?: number; face?: '%' | '&' }
  /** A narrow rough-stone shaft against a side wall, entered from below. */
  | { kind: 'shaft'; at: number; side?: 'L' | 'R'; h?: number }
  /** One or two iron rings across a gap too high to jump. */
  | { kind: 'rings'; at: number; count?: 1 | 2 }
  /** A storey floor across the tower with a hatch to jump through (optionally a pool on it). */
  | { kind: 'floor'; at: number; pool?: boolean }
  /** The next few ledges are bells. */
  | { kind: 'bells'; at: number; count?: number }
  /** The next few ledges are ice. */
  | { kind: 'ice'; at: number; count?: number };

export interface Placement {
  char: string;
  entry: LegendEntry;
  /** Along the route: 0 = the entry ledge, 1 = the exit ledge. */
  at: number;
  /** Put it on a small ledge beside the route instead of on it. */
  alcove?: boolean;
  /** Tiles of room needed on the ledge (default 1). */
  room?: number;
  /** Must be reachable with only these moves (e.g. the Claws themselves, before the ivy). */
  reachWith?: Move[];
}

export interface Style {
  /** Side wall thickness range. */
  walls: [number, number];
  /** 0..1: how much of the background is open sky. */
  open: number;
  widths: [number, number];
  /** Step heights in rows; the max is capped by the load. */
  steps: [number, number];
  /** Horizontal gap between consecutive ledges (negative overlaps). */
  gap: [number, number];
  /** Chance per step of turning back. */
  flip: number;
  /** Decorative masses and wall stubs per screen. */
  blocks: number;
  stubs: number;
  /** Ledge thickness range. */
  thick: [number, number];
}

export interface GenSpec {
  id: number;
  slug: string;
  name: string;
  theme: ThemeId;
  seed: number;
  screens?: number;
  /** Stones the route must support, and the moves it may use. */
  load: number;
  needs?: Move[];
  /** Moves without which the exit must be out of reach. */
  requires?: Move[];
  /** Fur Cloak in the checks (wind). */
  cloak?: boolean;
  pieces?: PieceSpec[];
  style?: Partial<Style>;
  place?: Placement[];
  wind?: { screen: number; dir: 1 | -1 }[];
  /** Fixed screens at the top (the summit); the generator fills the screens below them. */
  fixedTop?: string[][];
  fixedLegend?: Record<string, LegendEntry>;
  /** The route's target inside the fixed top: [screen, tx, ty] stand cell. */
  topTarget?: [number, number, number];
  /** The level's exit cell, when it is not the route's last ledge (the summit). */
  exitCell?: [number, number, number];
  /** At this load the exit must be out of reach (the summit's weight rule). */
  failsAt?: number;
}

const STYLE: Record<ThemeId, Style> = {
  overgrown: { walls: [2, 5], open: 0.5, widths: [4, 8], steps: [3, 9], gap: [-1, 3], flip: 0.22, blocks: 2, stubs: 3, thick: [1, 2] },
  cistern: { walls: [2, 6], open: 0.12, widths: [4, 8], steps: [3, 9], gap: [-1, 3], flip: 0.22, blocks: 2, stubs: 3, thick: [1, 2] },
  bells: { walls: [2, 5], open: 0.2, widths: [4, 7], steps: [3, 9], gap: [-1, 3], flip: 0.25, blocks: 1, stubs: 2, thick: [1, 2] },
  dark: { walls: [2, 6], open: 0.04, widths: [4, 7], steps: [3, 9], gap: [-1, 3], flip: 0.25, blocks: 2, stubs: 3, thick: [1, 2] },
  frozen: { walls: [2, 3], open: 0.9, widths: [4, 7], steps: [3, 9], gap: [-1, 3], flip: 0.25, blocks: 1, stubs: 2, thick: [1, 1] },
};

/** Highest step (rows) the climber can make at this load, with some margin. */
export function maxStep(load: number): number {
  return Math.floor((jumpHeight(1, load) - 8) / TILE);
}

export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0 || 1;
  }
  next(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(a: number, b: number): number {
    return a + Math.floor(this.next() * (b - a + 1));
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
}

class Fail extends Error {}

/** The level being drawn: a background layer (sky or back wall), a foreground layer and reservations. */
class Canvas {
  readonly h: number;
  readonly bg: string[];
  readonly fg: string[];
  /** Cells that must stay empty (standing room and jump paths). */
  readonly keep: Uint8Array;
  /** Cells where no decoration may go (so set pieces cannot be bypassed). */
  readonly bare: Uint8Array;
  /** Rows above this are fixed (not generated). */
  lockedAbove = 0;
  constructor(readonly screens: number) {
    this.h = screens * SR;
    this.bg = new Array(W * this.h).fill(' ');
    this.fg = new Array(W * this.h).fill('');
    this.keep = new Uint8Array(W * this.h);
    this.bare = new Uint8Array(W * this.h);
  }
  inside(x: number, y: number): boolean {
    return x >= 0 && x < W && y >= 0 && y < this.h;
  }
  ch(x: number, y: number): string {
    if (x < 0 || x >= W || y >= this.h) return '#';
    if (y < 0) return '.';
    const i = y * W + x;
    return this.fg[i] || this.bg[i];
  }
  solid(x: number, y: number): boolean {
    return SOLID.has(this.ch(x, y));
  }
  set(x: number, y: number, ch: string): void {
    if (this.inside(x, y)) this.fg[y * W + x] = ch;
  }
  fill(x0: number, y0: number, x1: number, y1: number, ch: string): void {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, ch);
  }
  fillBg(x0: number, y0: number, x1: number, y1: number, ch: string): void {
    for (let y = Math.max(0, y0); y <= Math.min(this.h - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) this.bg[y * W + x] = ch;
  }
  clear(x0: number, y0: number, x1: number, y1: number): void {
    this.fill(x0, y0, x1, y1, '');
  }
  anySolid(x0: number, y0: number, x1: number, y1: number): boolean {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.solid(x, y)) return true;
    return false;
  }
  any(mask: Uint8Array, x0: number, y0: number, x1: number, y1: number): boolean {
    for (let y = Math.max(0, y0); y <= Math.min(this.h - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) if (mask[y * W + x]) return true;
    return false;
  }
  mark(mask: Uint8Array, x0: number, y0: number, x1: number, y1: number): void {
    for (let y = Math.max(0, y0); y <= Math.min(this.h - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) mask[y * W + x] = 1;
  }
  rows(): string[][] {
    const out: string[][] = [];
    for (let s = 0; s < this.screens; s++) {
      const rows: string[] = [];
      for (let y = s * SR; y < (s + 1) * SR; y++) {
        let line = '';
        for (let x = 0; x < W; x++) line += this.ch(x, y);
        rows.push(line);
      }
      out.push(rows);
    }
    return out;
  }
}

export interface GenInput {
  spec: GenSpec;
  /** The level below (for the entry and for falls), and its exit stand cell in its top screen. */
  prev: LevelDef;
  /** A fixed level above whose entry this level must lead to, if any. */
  next?: LevelDef;
}

export interface GenOutput {
  level: LevelDef;
  seed: number;
  tries: number;
  route: Ledge[];
}

/** The solid run on `row` of `rows` that contains column `tx` (or the nearest run). */
export function runAt(row: string, tx: number): [number, number] {
  const solid = (x: number) => x >= 0 && x < row.length && SOLID.has(row[x]);
  let x = tx;
  if (!solid(x)) {
    for (let d = 1; d < W; d++) {
      if (solid(tx - d)) {
        x = tx - d;
        break;
      }
      if (solid(tx + d)) {
        x = tx + d;
        break;
      }
    }
  }
  let x0 = x;
  let x1 = x;
  while (solid(x0 - 1)) x0--;
  while (solid(x1 + 1)) x1++;
  return [x0, x1];
}

/** Generates a level, trying seeds from spec.seed until one passes the checks. */
export function generate(input: GenInput, maxTries = 400): GenOutput {
  const { spec } = input;
  let lastErr = '';
  const fails: Record<string, number> = {};
  for (let t = 0; t < maxTries; t++) {
    const seed = spec.seed + t;
    try {
      const g = new Gen(input, seed);
      const level = g.build();
      const verdict = validate(input, level, g);
      if (verdict === null) return { level, seed, tries: t + 1, route: g.route };
      lastErr = verdict;
    } catch (e) {
      if (!(e instanceof Fail)) throw e;
      lastErr = e.message;
    }
    fails[lastErr] = (fails[lastErr] ?? 0) + 1;
  }
  throw new Error(`level ${spec.id}: no seed passed in ${maxTries} tries (last: ${lastErr}; ${JSON.stringify(fails)})`);
}

class Gen {
  readonly spec: GenSpec;
  readonly st: Style;
  readonly rng: Rng;
  readonly c: Canvas;
  readonly ms: number;
  readonly wl: number[];
  readonly wr: number[];
  readonly route: Ledge[] = [];
  /** Ledges that carry placements, with the route index they belong to. */
  readonly spots: { l: Ledge; i: number }[] = [];
  entry!: Ledge;
  exitCell!: [number, number, number];
  readonly legend: Record<string, LegendEntry> = {};
  readonly placed: { p: Placement; tx: number; ty: number }[] = [];
  /** First generated row (rows above belong to a fixed top). */
  readonly top: number;
  readonly prevExit: Ledge;
  readonly target: Ledge | null;

  constructor(
    readonly input: GenInput,
    readonly seed: number,
  ) {
    this.spec = input.spec;
    const screens = this.spec.screens ?? 3;
    this.st = { ...STYLE[this.spec.theme], ...this.spec.style };
    this.rng = new Rng(seed * 7919 + this.spec.id * 104729);
    this.c = new Canvas(screens);
    this.ms = Math.min(this.st.steps[1], maxStep(this.spec.load));
    this.wl = new Array(this.c.h).fill(2);
    this.wr = new Array(this.c.h).fill(2);
    const fixed = this.spec.fixedTop ?? [];
    this.top = fixed.length * SR;
    // where the climb comes from: the exit of the level below, in this level's rows
    const pe = input.prev.exit;
    if (!pe) throw new Error(`level ${input.prev.id} has no exit`);
    const prow = input.prev.screens[0][pe[2] + 1];
    const [px0, px1] = runAt(prow, pe[1]);
    this.prevExit = { x0: px0, x1: px1, y: this.c.h + pe[2] + 1 };
    // where it must go
    if (input.next) {
      const ne = input.next.entry!;
      const nscreen = input.next.screens[ne[0]];
      const [nx0, nx1] = runAt(nscreen[ne[2] + 1], ne[1]);
      const fromBottom = input.next.screens.length - ne[0];
      this.target = { x0: nx0, x1: nx1, y: ne[2] + 1 - fromBottom * SR };
    } else if (this.spec.topTarget) {
      const [s, tx, ty] = this.spec.topTarget;
      const [x0, x1] = runAt(fixed[s][ty + 1], tx);
      this.target = { x0, x1, y: s * SR + ty + 1 };
    } else this.target = null;
  }

  // ---------- bounds ----------

  /** First and last interior columns over rows y0..y1. */
  bounds(y0: number, y1: number): [number, number] {
    let L = 0;
    let R = W - 1;
    for (let y = Math.max(0, y0); y <= Math.min(this.c.h - 1, y1); y++) {
      L = Math.max(L, this.wl[y]);
      R = Math.min(R, W - 1 - this.wr[y]);
    }
    return [L, R];
  }

  // ---------- painting ----------

  paintBackground(): void {
    const { c, rng } = this;
    const theme = this.spec.theme;
    // per theme, how likely each kind of screen is: open sky, a sky shaft, big windows, closed interior
    const W8: Record<ThemeId, [number, number, number, number]> = {
      overgrown: [0.25, 0.35, 0.3, 0.1],
      cistern: [0, 0.25, 0.4, 0.35],
      bells: [0, 0.25, 0.45, 0.3],
      dark: [0, 0.1, 0.15, 0.75],
      frozen: [0.9, 0.05, 0.05, 0],
    };
    let shaft: [number, number] | null = null;
    for (let s = c.screens - 1; s >= this.top / SR; s--) {
      const y0 = s * SR;
      const y1 = y0 + SR - 1;
      const w = W8[theme];
      let r = rng.next();
      const kind = (r -= w[0]) < 0 ? 'open' : (r -= w[1]) < 0 ? 'shaft' : (r -= w[2]) < 0 ? 'windows' : 'interior';
      if (kind === 'open') {
        c.fillBg(0, y0, W - 1, y1, '.');
        // remnants of the old walls
        for (let k = rng.int(0, 2); k > 0; k--) {
          const left = rng.chance(0.5);
          const ww = rng.int(5, 14);
          const hh = rng.int(6, 18);
          const yy = y0 + rng.int(0, SR - hh);
          c.fillBg(left ? 0 : W - ww, yy, left ? ww - 1 : W - 1, yy + hh - 1, ' ');
        }
        shaft = null;
        continue;
      }
      c.fillBg(0, y0, W - 1, y1, ' ');
      if (kind === 'shaft') {
        // a tall open shaft, often continuing the one below
        const below: [number, number] | null = shaft;
        const keepOn = below !== null && rng.chance(0.6);
        const ww: number = keepOn && below ? below[1] - below[0] + 1 : rng.int(10, 24);
        const x0: number = keepOn && below ? below[0] : rng.int(6, W - 6 - ww);
        const top = rng.chance(0.4) ? y0 + rng.int(2, 10) : y0;
        c.fillBg(x0, top, x0 + ww - 1, y1, '.');
        shaft = [x0, x0 + ww - 1];
        if (rng.chance(0.35)) {
          const w2 = rng.int(6, 12);
          const x2 = x0 + ww + 6 + w2 < W - 4 ? x0 + ww + 6 : Math.max(4, x0 - 6 - w2);
          c.fillBg(x2, y0 + rng.int(4, 12), x2 + w2 - 1, y0 + rng.int(20, 30), '.');
        }
        continue;
      }
      shaft = null;
      if (kind === 'windows') {
        const n = rng.int(1, 2);
        for (let k = 0; k < n; k++) {
          const ww = rng.int(14, 32);
          const hh = rng.int(10, 20);
          const x0 = rng.int(4, W - 4 - ww);
          const yy = y0 + rng.int(1, SR - 1 - hh);
          c.fillBg(x0, yy, x0 + ww - 1, yy + hh - 1, '.');
        }
        continue;
      }
      // interior: perhaps a slit window
      if (rng.chance(theme === 'dark' ? 0.25 : 0.6)) {
        const ww = rng.int(3, 6);
        const hh = rng.int(6, 12);
        const x0 = rng.int(8, W - 8 - ww);
        const yy = y0 + rng.int(3, SR - 3 - hh);
        c.fillBg(x0, yy, x0 + ww - 1, yy + hh - 1, '.');
      }
    }
  }

  paintWalls(): void {
    const { c, rng, st } = this;
    const [lo, hi] = st.walls;
    // continue the walls of the level below at the bottom
    const below = this.input.prev.screens[0][0];
    let L = Math.max(0, below.search(/[^#]/));
    let R = Math.max(0, below.length - 1 - below.search(/[^#](?=#*$)/));
    if (L < 0 || L > 10) L = lo;
    if (R < 0 || R > 10) R = lo;
    let y = c.h - 1;
    let first = true;
    while (y >= this.top) {
      const len = first ? rng.int(3, 6) : rng.int(5, 13);
      for (let k = 0; k < len && y >= this.top; k++, y--) {
        this.wl[y] = L;
        this.wr[y] = R;
      }
      first = false;
      L = Math.max(lo, Math.min(hi, L + rng.int(-2, 2)));
      R = Math.max(lo, Math.min(hi, R + rng.int(-2, 2)));
    }
    (this.spec.fixedTop ?? []).forEach((rows, s) => rows.forEach((line, y) => {
      const lead = line.search(/[^#]/);
      const trail = line.length - 1 - line.search(/#*$/);
      this.wl[s * SR + y] = lead < 0 ? 0 : lead;
      this.wr[s * SR + y] = Math.max(0, line.length - line.search(/#*$/));
      void trail;
    }));
    // a few big masses: the walls lurch inward for a stretch, stepped like masonry
    const masses = Math.round((c.screens - this.top / SR) * (st.walls[1] >= 4 ? 1.2 : 0.6));
    for (let k = 0; k < masses; k++) {
      const len = rng.int(5, 12);
      const y0 = rng.int(this.top + 6, c.h - 8 - len);
      const left = rng.chance(0.5);
      const depth = rng.int(4, 9);
      for (let y = y0; y < y0 + len; y++) {
        const taper = Math.min(y - y0, y0 + len - 1 - y, 2);
        const d = Math.max(2, depth - (2 - taper) * 2);
        if (left) this.wl[y] = Math.max(this.wl[y], this.wl[y] + d);
        else this.wr[y] = Math.max(this.wr[y], this.wr[y] + d);
      }
    }
    for (let yy = this.top; yy < c.h; yy++) {
      c.fill(0, yy, this.wl[yy] - 1, yy, '#');
      c.fill(W - this.wr[yy], yy, W - 1, yy, '#');
    }
  }

  /** Paints a ledge and reserves standing room above it. */
  commit(l: Ledge, mat = '#', thick = 1): void {
    const { c } = this;
    for (let y = l.y; y < Math.min(c.h, l.y + thick); y++) c.fill(l.x0, y, l.x1, y, mat);
    c.mark(c.keep, l.x0, l.y - 3, l.x1, l.y - 1);
    this.route.push(l);
    this.spots.push({ l, i: this.route.length - 1 });
  }

  /** Reserves the space between two consecutive ledges (the jump). */
  corridor(a: Ledge, b: Ledge): void {
    const x0 = Math.min(a.x0, b.x0);
    const x1 = Math.max(a.x1, b.x1);
    const { c } = this;
    for (let y = b.y - 3; y <= a.y - 1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (y >= b.y && y < b.y + 3 && x >= b.x0 && x <= b.x1 && c.solid(x, y)) continue;
        if (c.inside(x, y)) c.keep[y * W + x] = 1;
      }
    }
  }

  /** Can a ledge go here? Slab free and not reserved, not merging into other ledges, standing room clear. */
  fits(l: Ledge, thick: number): boolean {
    const { c } = this;
    const yb = l.y + thick - 1;
    if (l.y < 1 || yb >= c.h) return false;
    if (c.anySolid(l.x0, l.y, l.x1, yb)) return false;
    const [L, R] = this.bounds(l.y, yb);
    if (l.x0 - 1 >= L && c.anySolid(l.x0 - 1, l.y - 1, l.x0 - 1, yb + 1)) return false;
    if (l.x1 + 1 <= R && c.anySolid(l.x1 + 1, l.y - 1, l.x1 + 1, yb + 1)) return false;
    if (c.any(c.keep, l.x0, l.y, l.x1, yb)) return false;
    if (c.anySolid(l.x0, l.y - 3, l.x1, l.y - 1)) return false;
    return true;
  }

  /** A new ledge stepping up from `cur` toward `dir`. */
  step(cur: Ledge, dir: number, o: { dy?: number; w?: number; mat?: string; thick?: number; dyMax?: number } = {}): Ledge | null {
    const { rng, st } = this;
    const thick = o.thick ?? rng.int(st.thick[0], st.thick[1]);
    for (let t = 0; t < 24; t++) {
      const hi = Math.min(this.ms, o.dyMax ?? 99);
      const dy = o.dy ?? rng.int(Math.min(st.steps[0], hi), hi);
      const w = o.w ?? rng.int(st.widths[0], st.widths[1]);
      const gMax = dy <= 3 ? st.gap[1] + 2 : dy >= this.ms ? st.gap[1] - 1 : st.gap[1];
      const g = rng.int(st.gap[0], Math.max(st.gap[0], gMax));
      const y = cur.y - dy;
      const [L, R] = this.bounds(y - 3, y + thick - 1);
      let x0 = dir > 0 ? cur.x1 + 1 + g : cur.x0 - 1 - g - w + 1;
      let x1 = x0 + w - 1;
      // snap to a wall that is close, so ledges grow out of the walls
      if (x0 - L <= 2) {
        x1 -= x0 - L;
        x0 = L;
      }
      if (R - x1 <= 2) {
        x0 += R - x1;
        x1 = R;
      }
      if (x0 < L || x1 > R || x1 - x0 < 2) continue;
      // overlapping the ledge below needs head room under it and somewhere to take off from
      const overlap = Math.min(x1, cur.x1) - Math.max(x0, cur.x0) + 1;
      if (overlap > 0 && (dy < 4 || cur.x1 - cur.x0 + 1 - overlap < 2)) continue;
      const l = { x0, x1, y };
      if (!this.fits(l, thick)) continue;
      this.commit(l, o.mat ?? '#', thick);
      this.corridor(cur, l);
      return l;
    }
    return null;
  }

  /** Steps upward until `cur` is within one step of row `y`. */
  chainTo(cur: Ledge, dir: number, y: number, lean = 0): { cur: Ledge; dir: number } {
    const { rng, st } = this;
    let guard = 0;
    while (cur.y - y > this.ms && guard++ < 60) {
      const room = cur.y - y - 3;
      if (lean && cur.y - y <= 3 * this.ms) dir = lean;
      let n = this.step(cur, dir, { dyMax: Math.max(3, room) });
      if (!n) {
        dir = -dir;
        n = this.step(cur, dir, { dyMax: Math.max(3, room) });
      }
      if (!n) throw new Fail('stuck: chain');
      cur = n;
      const [L, R] = this.bounds(cur.y, cur.y);
      if ((dir > 0 && R - cur.x1 < 8) || (dir < 0 && cur.x0 - L < 8) || rng.chance(st.flip)) dir = -dir;
    }
    return { cur, dir };
  }

  // ---------- set pieces ----------

  piece(p: PieceSpec, cur: Ledge, dir: number): { cur: Ledge; dir: number } {
    switch (p.kind) {
      case 'ivy':
        return this.buttress(cur, dir, p.side, p.h, p.face ?? '%');
      case 'shaft':
        return this.shaft(cur, dir, p.side, p.h);
      case 'pillar':
        return this.pillar(cur, dir, p.h, p.face ?? '%');
      case 'rings':
        return this.rings(cur, dir, p.count ?? 1);
      case 'floor':
        return this.floor(cur, dir, !!p.pool);
      case 'bells':
      case 'ice': {
        const n = p.count ?? 3;
        for (let k = 0; k < n; k++) {
          const opts = p.kind === 'bells' ? { mat: 'B', thick: 3, w: this.rng.int(4, 5) } : { mat: 'i', thick: 1 };
          let s = this.step(cur, dir, opts);
          if (!s) {
            dir = -dir;
            s = this.step(cur, dir, opts);
          }
          if (!s) throw new Fail(`stuck: ${p.kind}`);
          cur = s;
          if (this.rng.chance(0.5)) dir = -dir;
        }
        return { cur, dir };
      }
    }
  }

  /** Steps toward a side wall until `cur` is close to it. */
  toSide(cur: Ledge, side: 'L' | 'R', near: number): Ledge {
    const sdir = side === 'L' ? -1 : 1;
    for (let k = 0; k < 8; k++) {
      const [L, R] = this.bounds(cur.y, cur.y);
      const dist = side === 'L' ? cur.x0 - L : R - cur.x1;
      if (dist <= near) return cur;
      const n = this.step(cur, sdir);
      if (!n) throw new Fail('stuck: toSide');
      cur = n;
    }
    throw new Fail('stuck: toSide far');
  }

  /** Fills any gap between the side wall and column `edge` (exclusive) over rows y0..y1. */
  mergeWall(side: 'L' | 'R', y0: number, y1: number, edge: number): void {
    for (let y = y0; y <= y1; y++) {
      if (side === 'L') this.c.fill(this.wl[y], y, edge - 1, y, '#');
      else this.c.fill(edge + 1, y, W - 1 - this.wr[y], y, '#');
    }
  }

  /**
   * The ledge a side piece stands on: from the wall out to `minW`..`maxW` tiles. It stays clear of `cur`
   * when there is room, otherwise it overlaps it from above (one row thick, four rows up, take-off room left).
   */
  sideBase(cur: Ledge, side: 'L' | 'R', minW: number, maxW: number, yRange: [number, number]): { A: Ledge; thick: number } {
    const { rng } = this;
    for (let t = 0; t < 12; t++) {
      const [L, R] = this.bounds(yRange[0], yRange[1]);
      const room = side === 'L' ? cur.x0 - L : R - cur.x1;
      const clear = room >= minW + 1;
      const dyA = clear ? rng.int(3, Math.min(5, this.ms)) : rng.int(4, Math.min(5, this.ms));
      const yA = cur.y - dyA;
      let w: number;
      if (clear) w = Math.min(maxW, room - rng.int(0, 2));
      else {
        w = rng.int(minW, maxW);
        const left = side === 'L' ? cur.x1 - (L + w - 1) : R - w + 1 - cur.x0;
        if (left < 2) continue;
      }
      if (w < minW) continue;
      const A: Ledge = side === 'L' ? { x0: L, x1: L + w - 1, y: yA } : { x0: R - w + 1, x1: R, y: yA };
      const thick = clear ? 2 : 1;
      if (!this.fits(A, thick)) continue;
      return { A, thick };
    }
    throw new Fail('room: side base');
  }

  buttress(cur0: Ledge, dir: number, side0: 'L' | 'R' | undefined, h0: number | undefined, face: string): { cur: Ledge; dir: number } {
    const { c, rng } = this;
    const side = side0 ?? (dir > 0 ? 'R' : 'L');
    const cur = this.toSide(cur0, side, 12);
    const h = h0 ?? rng.int(11, 14);
    const bw = rng.int(3, 4);
    const yGuess = cur.y - 4;
    if (yGuess - h - 3 < this.top + 2) throw new Fail('room: buttress top');
    const { A, thick } = this.sideBase(cur, side, bw + 3, bw + 6, [yGuess - h - 3, yGuess + 1]);
    const yA = A.y;
    const yT = yA - h;
    if (yT - 3 < this.top + 2) throw new Fail('room: buttress top');
    const [L, R] = this.bounds(yT - 3, yA);
    const bx0 = side === 'L' ? L : R - bw + 1;
    const bx1 = bx0 + bw - 1;
    if ((side === 'L' && A.x0 !== L) || (side === 'R' && A.x1 !== R)) throw new Fail('room: buttress wall');
    const fx = side === 'L' ? bx1 : bx0;
    const lane = side === 'L' ? [fx + 1, A.x1 + 2] : [A.x0 - 2, fx - 1];
    if (c.anySolid(lane[0], yT - 3, lane[1], yA - 1)) throw new Fail('room: buttress lane');
    if (c.any(c.keep, bx0, yT, bx1, yA - 1)) throw new Fail('room: buttress keep');
    const gap = side === 'L' ? cur.x0 - A.x1 - 1 : A.x0 - cur.x1 - 1;
    if (gap > this.st.gap[1] + 1) throw new Fail('reach: buttress');
    this.commit(A, '#', thick);
    this.corridor(cur, A);
    c.fill(bx0, yT, bx1, yA - 1, '#');
    this.mergeWall(side, yT, yA - 1, side === 'L' ? bx0 : bx1);
    for (let y = yT; y < yA; y++) c.set(fx, y, face);
    if (rng.chance(0.5)) for (let y = yT; y < yT + 2; y++) c.set(side === 'L' ? fx - 1 : fx + 1, y, face);
    const T: Ledge = { x0: bx0, x1: bx1, y: yT };
    c.clear(bx0, yT - 3, bx1, yT - 1);
    this.route.push(T);
    this.spots.push({ l: T, i: this.route.length - 1 });
    c.mark(c.keep, lane[0], yT - 3, lane[1], yA - 1);
    c.mark(c.keep, bx0, yT - 3, bx1, yT - 1);
    const [iL, iR] = this.bounds(yT, yA);
    if (side === 'L') c.mark(c.bare, bx1 + 1, yT - 2, iR, yA - 1);
    else c.mark(c.bare, iL, yT - 2, bx0 - 1, yA - 1);
    return { cur: T, dir: side === 'L' ? 1 : -1 };
  }

  shaft(cur0: Ledge, dir: number, side0: 'L' | 'R' | undefined, h0: number | undefined): { cur: Ledge; dir: number } {
    const { c, rng } = this;
    const side = side0 ?? (dir > 0 ? 'R' : 'L');
    const cur = this.toSide(cur0, side, 14);
    const h = h0 ?? rng.int(12, 15);
    const sw = 3;
    const iw = 3;
    const yGuess = cur.y - 4;
    if (yGuess - h - 3 < this.top + 2) throw new Fail('room: shaft top');
    const { A, thick } = this.sideBase(cur, side, sw + iw + 3, sw + iw + 5, [yGuess - h - 3, yGuess + 1]);
    const yA = A.y;
    const yT = yA - h;
    if (yT - 3 < this.top + 2) throw new Fail('room: shaft top');
    const [L, R] = this.bounds(yT - 3, yA);
    if ((side === 'L' && A.x0 !== L) || (side === 'R' && A.x1 !== R)) throw new Fail('room: shaft wall');
    // shaft columns s0..s1, inner wall i0..i1, base ledge from the wall out past the inner wall
    const s0 = side === 'L' ? L : R - sw + 1;
    const s1 = s0 + sw - 1;
    const i0 = side === 'L' ? s1 + 1 : s0 - iw;
    const i1 = i0 + iw - 1;
    const out = side === 'L' ? [i1 + 1, A.x1 + 1] : [A.x0 - 1, i0 - 1];
    if (c.anySolid(Math.min(s0, out[0]), yT - 3, Math.max(s1, out[1]), yA - 1)) throw new Fail('room: shaft lane');
    if (c.any(c.keep, Math.min(s0, i0), yT, Math.max(s1, i1), yA - 4)) throw new Fail('room: shaft keep');
    const gap = side === 'L' ? cur.x0 - A.x1 - 1 : A.x0 - cur.x1 - 1;
    if (gap > this.st.gap[1] + 1) throw new Fail('reach: shaft');
    this.commit(A, '#', thick);
    this.corridor(cur, A);
    // inner wall with a doorway at its foot; rough faces inside the shaft
    c.fill(i0, yT, i1, yA - 4, '#');
    const innerFace = side === 'L' ? i0 : i1;
    const wallFace = side === 'L' ? s0 - 1 : s1 + 1;
    for (let y = yT; y <= yA - 4; y++) c.set(innerFace, y, '&');
    this.mergeWall(side, yT - 3, yA - 1, side === 'L' ? s0 : s1);
    for (let y = yT + 2; y < yA; y++) c.set(wallFace, y, '&');
    const T: Ledge = { x0: i0, x1: i1, y: yT };
    c.clear(i0, yT - 3, i1, yT - 1);
    this.route.push(T);
    this.spots.push({ l: T, i: this.route.length - 1 });
    c.mark(c.keep, s0, yT - 3, s1, yA - 1);
    c.mark(c.keep, i0, yT - 3, i1, yT - 1);
    c.mark(c.keep, Math.min(out[0], out[1]), yA - 3, Math.max(out[0], out[1]), yA - 1);
    const [iL, iR] = this.bounds(yT, yA);
    if (side === 'L') c.mark(c.bare, i1 + 1, yT - 2, iR, yA - 4);
    else c.mark(c.bare, iL, yT - 2, i0 - 1, yA - 4);
    return { cur: T, dir: side === 'L' ? 1 : -1 };
  }

  pillar(cur: Ledge, dir: number, h0: number | undefined, face: string): { cur: Ledge; dir: number } {
    const { c, rng } = this;
    const h = h0 ?? rng.int(11, 14);
    let A = this.step(cur, dir, { w: rng.int(8, 10), thick: 2 });
    if (!A) {
      dir = -dir;
      A = this.step(cur, dir, { w: rng.int(8, 10), thick: 2 });
    }
    if (!A) throw new Fail('stuck: pillar base');
    const px0 = dir > 0 ? A.x1 - 2 : A.x0;
    const px1 = px0 + 2;
    const yT = A.y - h;
    if (yT - 3 < this.top + 2) throw new Fail('room: pillar');
    if (c.anySolid(px0 - 3, yT - 3, px1 + 3, A.y - 1)) throw new Fail('room: pillar');
    c.fill(px0, yT, px1, A.y - 1, '#');
    for (let y = yT; y < A.y; y++) {
      c.set(px0, y, face);
      c.set(px1, y, face);
    }
    const T: Ledge = { x0: px0, x1: px1, y: yT };
    this.route.push(T);
    this.spots.push({ l: T, i: this.route.length - 1 });
    c.mark(c.keep, px0 - 3, yT - 3, px1 + 3, A.y - 1);
    const [L, R] = this.bounds(yT, A.y);
    c.mark(c.bare, L, yT - 2, R, A.y - 1);
    return { cur: T, dir: rng.chance(0.5) ? 1 : -1 };
  }

  rings(cur: Ledge, dir: number, count: number): { cur: Ledge; dir: number } {
    const { c, rng } = this;
    const [L, R] = this.bounds(cur.y - 22, cur.y);
    const cx = Math.round((cur.x0 + cur.x1) / 2);
    let rx = Math.max(L + 2, Math.min(R - 2, cx + dir * rng.int(1, 3)));
    let ry = cur.y - rng.int(9, 10);
    const rings: [number, number][] = [[rx, ry]];
    if (count === 2) {
      const nx = rx + dir * rng.int(4, 6);
      if (nx < L + 2 || nx > R - 2) dir = -dir;
      rx = Math.max(L + 2, Math.min(R - 2, rx + dir * rng.int(4, 6)));
      ry -= rng.int(5, 7);
      rings.push([rx, ry]);
    }
    const dyB = rng.int(2, Math.max(2, this.ms - 2));
    const w = rng.int(4, 7);
    const yB = ry + 3 - dyB;
    let x0 = dir > 0 ? rx + 2 : rx - 2 - w + 1;
    let x1 = x0 + w - 1;
    const [bL, bR] = this.bounds(yB - 3, yB + 1);
    if (x0 - bL <= 2) {
      x1 -= x0 - bL;
      x0 = bL;
    }
    if (bR - x1 <= 2) {
      x0 += bR - x1;
      x1 = bR;
    }
    if (x0 < bL || x1 > bR) throw new Fail('room: rings');
    if (cur.y - yB < this.ms + 2) throw new Fail('room: rings low');
    if (yB - 3 < this.top + 1) throw new Fail('room: rings top');
    const lx0 = Math.min(cur.x0, ...rings.map((r) => r[0] - 1), x0);
    const lx1 = Math.max(cur.x1, ...rings.map((r) => r[0] + 1), x1);
    if (c.anySolid(Math.min(...rings.map((r) => r[0])) - 1, ry - 1, Math.max(...rings.map((r) => r[0])) + 1, cur.y - 1)) throw new Fail('room: ring lane');
    const B = { x0, x1, y: yB };
    if (!this.fits(B, 1)) throw new Fail('room: rings landing');
    for (const [x, y] of rings) c.set(x, y, '*');
    this.commit(B, '#', rng.int(1, 2));
    for (const [x, y] of rings) c.mark(c.keep, x - 1, y - 1, x + 1, y + 3);
    c.mark(c.keep, Math.min(...rings.map((r) => r[0])) - 1, ry, Math.max(...rings.map((r) => r[0])) + 1, cur.y - 1);
    c.mark(c.bare, lx0 - 3, yB - 2, lx1 + 3, cur.y - 1);
    return { cur: B, dir };
  }

  floor(cur: Ledge, dir: number, pool: boolean): { cur: Ledge; dir: number } {
    const { c, rng } = this;
    const dyF = Math.min(this.ms, 5);
    const yF = cur.y - dyF;
    const [L, R] = this.bounds(yF - 3, yF + 1);
    const hw = rng.int(4, 5);
    let hx0 = dir > 0 ? cur.x1 - 1 : cur.x0 + 1 - hw + 1;
    if (hx0 < L + 3 || hx0 + hw - 1 > R - 3) {
      dir = -dir;
      hx0 = dir > 0 ? cur.x1 - 1 : cur.x0 + 1 - hw + 1;
    }
    const hx1 = hx0 + hw - 1;
    if (hx0 < L + 3 || hx1 > R - 3) throw new Fail('room: floor hole');
    if (yF - 4 < this.top + 2) throw new Fail('room: floor top');
    if (c.any(c.keep, L, yF, R, yF + 1)) throw new Fail('room: floor');
    c.fill(L, yF, hx0 - 1, yF + 1, '#');
    c.fill(hx1 + 1, yF, R, yF + 1, '#');
    const left: Ledge = { x0: L, x1: hx0 - 1, y: yF };
    const right: Ledge = { x0: hx1 + 1, x1: R, y: yF };
    const on = dir > 0 ? right : left;
    const off = dir > 0 ? left : right;
    this.route.push(on);
    this.spots.push({ l: on, i: this.route.length - 1 }, { l: off, i: this.route.length - 1 });
    c.mark(c.keep, hx0 - 1, yF - 4, hx1 + 1, yF + 1);
    c.mark(c.keep, on.x0, yF - 3, on.x1, yF - 1);
    if (pool && off.x1 - off.x0 > 8) {
      const p0 = dir > 0 ? off.x0 : off.x0 + 3;
      const p1 = dir > 0 ? off.x1 - 3 : off.x1;
      c.fill(p0, yF - 2, p1, yF - 1, '~');
      c.fill(dir > 0 ? p1 + 1 : p0 - 1, yF - 2, dir > 0 ? p1 + 1 : p0 - 1, yF - 1, '#');
    }
    // the next step leaves from near the hatch
    const near: Ledge = dir > 0 ? { x0: hx1 + 1, x1: Math.min(R, hx1 + 7), y: yF } : { x0: Math.max(L, hx0 - 7), x1: hx0 - 1, y: yF };
    return { cur: near, dir: rng.chance(0.5) ? dir : -dir };
  }

  // ---------- the route ----------

  buildRoute(): void {
    const { rng, c } = this;
    const pe = this.prevExit;
    // the entry ledge, a step up and to the side of the exit below
    const lo = Math.max(3, pe.y - (c.h - 1));
    let entry: Ledge | null = null;
    for (let t = 0; t < 30 && !entry; t++) {
      const dy = rng.int(lo, Math.max(lo, this.ms));
      const y = pe.y - dy;
      const w = rng.int(5, 8);
      const g = rng.int(0, 2);
      const right = rng.chance(0.5);
      const [L, R] = this.bounds(y - 3, Math.min(c.h - 1, y + 1));
      let x0 = right ? pe.x1 + 1 + g : pe.x0 - 1 - g - w + 1;
      if (x0 < L || x0 + w - 1 > R) x0 = !right ? pe.x1 + 1 + g : pe.x0 - 1 - g - w + 1;
      if (x0 < L || x0 + w - 1 > R) continue;
      const l = { x0, x1: x0 + w - 1, y };
      if (!this.fits(l, 1)) continue;
      entry = l;
    }
    if (!entry) throw new Fail('stuck: entry');
    this.commit(entry, '#', Math.min(2, c.h - entry.y));
    this.corridor({ ...pe }, entry);
    c.mark(c.keep, pe.x0 - 1, Math.max(0, c.h - 3), pe.x1 + 1, c.h - 1);
    this.entry = entry;
    let cur = entry;
    let dir = (entry.x0 + entry.x1) / 2 > W / 2 ? -1 : 1;

    const goal = this.target ? this.target.y : this.top + 3;
    const span = cur.y - goal;
    const pieces = [...(this.spec.pieces ?? [])].sort((a, b) => a.at - b.at);
    for (const p of pieces) {
      const mark = Math.round(entry.y - p.at * span);
      const side = 'side' in p && p.side ? p.side : null;
      const lean = side === 'L' ? -1 : side === 'R' ? 1 : 0;
      ({ cur, dir } = this.chainTo(cur, dir, mark, lean));
      ({ cur, dir } = this.piece(p, cur, dir));
    }

    if (!this.target) {
      // a free exit near the top of the top screen
      ({ cur, dir } = this.chainTo(cur, dir, goal));
      const dy = cur.y - goal;
      if (dy < 3) throw new Fail('stuck: exit low');
      let ex = this.step(cur, dir, { dy, w: rng.int(5, 8), thick: 2 });
      if (!ex) ex = this.step(cur, -dir, { dy, w: rng.int(5, 8), thick: 2 });
      if (!ex) throw new Fail('stuck: exit');
      c.mark(c.keep, ex.x0 - 2, 0, ex.x1 + 2, ex.y - 1);
      this.exitCell = [0, Math.round((ex.x0 + ex.x1) / 2), ex.y - 1];
      return;
    }

    // a fixed target above: plan the last ledge beside it, then steer to it
    const T = this.target;
    let last: Ledge | null = null;
    for (let t = 0; t < 20 && !last; t++) {
      const lo = Math.max(3, 1 - T.y, this.top + 1 - T.y);
      if (lo > this.ms) throw new Fail('reach: target too high');
      const dy = rng.int(lo, this.ms);
      const y = T.y + dy;
      const w = rng.int(5, 7);
      const g = rng.int(0, 2);
      const leftSide = rng.chance(0.5);
      const [L, R] = this.bounds(y - 3, y + 1);
      const x0 = leftSide ? T.x0 - 1 - g - w + 1 : T.x1 + 1 + g;
      if (x0 < L || x0 + w - 1 > R) continue;
      const l = { x0, x1: x0 + w - 1, y };
      if (!this.fits(l, 1)) continue;
      last = l;
    }
    if (!last) throw new Fail('stuck: last');
    let guard = 0;
    while (cur.y - last.y > this.ms && guard++ < 40) {
      const toward = (last.x0 + last.x1) / 2 > (cur.x0 + cur.x1) / 2 ? 1 : -1;
      const near = cur.y - last.y <= 3 * this.ms;
      const d = near ? toward : dir;
      let n = this.step(cur, d, { dyMax: Math.max(3, cur.y - last.y - 3) });
      if (!n) n = this.step(cur, -d, { dyMax: Math.max(3, cur.y - last.y - 3) });
      if (!n) throw new Fail('stuck: approach');
      cur = n;
      const [L, R] = this.bounds(cur.y, cur.y);
      if ((dir > 0 && R - cur.x1 < 8) || (dir < 0 && cur.x0 - L < 8) || rng.chance(this.st.flip)) dir = -dir;
    }
    const dy = cur.y - last.y;
    const gap = last.x0 > cur.x1 ? last.x0 - cur.x1 - 1 : cur.x0 > last.x1 ? cur.x0 - last.x1 - 1 : -1;
    if (dy < 3 || dy > this.ms || gap > this.st.gap[1] + 1) throw new Fail('reach: last');
    this.commit(last, '#', 1);
    this.corridor(cur, last);
    this.corridor(last, T);
    this.exitCell = this.spec.exitCell ?? [Math.floor((last.y - 1) / SR), Math.round((last.x0 + last.x1) / 2), (last.y - 1) % SR];
  }

  // ---------- decoration ----------

  decorate(): void {
    const { c, rng, st } = this;
    const theme = this.spec.theme;
    const ok = (x0: number, y0: number, x1: number, y1: number) =>
      y0 >= this.top + 1 && y1 < c.h - 1 && !c.anySolid(x0 - 1, y0 - 1, x1 + 1, y1 + 1) && !c.any(c.keep, x0 - 1, y0 - 3, x1 + 1, y1 + 1) && !c.any(c.bare, x0 - 1, y0 - 2, x1 + 1, y1 + 1);
    for (let s = this.top / SR; s < c.screens; s++) {
      const y0 = s * SR;
      // free-standing ruins: a block, sometimes a broken column
      for (let k = 0, tries = 0; k < st.blocks && tries < 60; tries++) {
        const col = rng.chance(0.35);
        const w = col ? 2 : rng.int(3, 6);
        const h = col ? rng.int(4, 8) : rng.int(2, 4);
        const x = rng.int(4, W - 5 - w);
        const y = y0 + rng.int(2, SR - 3 - h);
        if (!ok(x, y, x + w - 1, y + h - 1)) continue;
        c.fill(x, y, x + w - 1, y + h - 1, '#');
        k++;
      }
      // stubs and corbels out of the side walls
      for (let k = 0, tries = 0; k < st.stubs && tries < 80; tries++) {
        const left = rng.chance(0.5);
        const y = y0 + rng.int(2, SR - 4);
        const [L, R] = this.bounds(y, y + 2);
        const w = rng.int(2, 5);
        const h = rng.chance(0.4) ? 2 : 1;
        const x0 = left ? L : R - w + 1;
        const x1 = x0 + w - 1;
        if (!(left ? ok(x0 + 1, y, x1, y + h - 1) : ok(x0, y, x1 - 1, y + h - 1))) continue;
        c.fill(x0, y, x1, y + h - 1, '#');
        // a corbel under a thick stub
        if (h === 2 && w >= 3) c.fill(left ? x0 : x1, y + h, left ? x0 : x1, y + h, '#');
        k++;
      }
    }
    // the side walls' faces: ivy (and roots) low in the tower, rough stone in the bells and the dark
    const face = theme === 'overgrown' || theme === 'cistern' ? '%' : theme === 'bells' || theme === 'dark' ? '&' : '';
    if (!face) return;
    const runs = Math.round((c.screens - this.top / SR) * (theme === 'overgrown' ? 2 : 1));
    for (let k = 0, tries = 0; k < runs && tries < 40; tries++) {
      const left = rng.chance(0.5);
      const len = rng.int(4, 9);
      const y0 = rng.int(this.top + 2, c.h - 3 - len);
      let clear = true;
      const xs: number[] = [];
      for (let y = y0; y < y0 + len && clear; y++) {
        const x = left ? this.wl[y] - 1 : W - this.wr[y];
        if (x < 0 || x >= W || !c.solid(x, y) || c.ch(x, y) !== '#') clear = false;
        const nx = left ? x + 1 : x - 1;
        if (c.any(c.bare, nx - 1, y - 1, nx + 1, y + 1)) clear = false;
        xs.push(x);
      }
      if (!clear) continue;
      xs.forEach((x, i) => c.set(x, y0 + i, face));
      k++;
    }
  }

  // ---------- placements ----------

  place(): void {
    const { c, rng } = this;
    const used = new Set<string>();
    for (const p of this.spec.place ?? []) {
      if (!this.legend[p.char]) this.legend[p.char] = p.entry;
      const room = p.room ?? 1;
      const n = this.route.length;
      const want = Math.round(p.at * (n - 1));
      if (p.alcove && this.alcove(p, want, used)) continue;
      let done = false;
      for (let d = 0; d < n && !done; d++) {
        for (const i of [want + d, want - d]) {
          if (i < 0 || i >= n || done) continue;
          const l = this.route[i];
          if (l.x1 - l.x0 + 1 < room + 1) continue;
          const prev = this.route[i - 1];
          // the end away from where the climber arrives
          const farRight = !prev || (prev.x0 + prev.x1) / 2 < (l.x0 + l.x1) / 2;
          const xs = farRight ? [l.x1, l.x1 - 1, l.x1 - 2, l.x0 + 1, l.x0] : [l.x0, l.x0 + 1, l.x0 + 2, l.x1 - 1, l.x1];
          for (const x of xs) {
            const y = l.y - 1;
            if (x < l.x0 || x > l.x1 || used.has(`${x},${y}`) || c.solid(x, y) || c.fg[y * W + x]) continue;
            c.set(x, y, p.char);
            used.add(`${x},${y}`);
            for (let k = -room; k <= room; k++) used.add(`${x + k},${y}`);
            this.placed.push({ p, tx: x, ty: y });
            done = true;
            break;
          }
        }
      }
      if (!done) throw new Fail(`place: ${p.char}`);
      void rng;
    }
  }

  /** A little ledge out of a side wall, a short step up from a route ledge, with the placement on it. */
  alcove(p: Placement, want: number, used: Set<string>): boolean {
    const { c, rng } = this;
    for (let d = 0; d < this.route.length; d++) {
      for (const i of [want + d, want - d]) {
        const l = this.route[i];
        if (!l) continue;
        for (let t = 0; t < 8; t++) {
          const left = rng.chance(0.5);
          const dy = rng.int(3, Math.min(5, this.ms));
          const y = l.y - dy;
          const [L, R] = this.bounds(y - 3, y);
          const w = rng.int(3, 4);
          const x0 = left ? L : R - w + 1;
          const x1 = x0 + w - 1;
          const gap = left ? l.x0 - x1 - 1 : x0 - l.x1 - 1;
          if (gap < 0 || gap > 4) continue;
          if (c.anySolid(left ? x0 : x0 - 1, y - 3, left ? x1 + 1 : x1, y) || c.any(c.keep, x0, y, x1, y) || c.any(c.bare, x0, y - 2, x1, y)) continue;
          c.fill(x0, y, x1, y, '#');
          const tx = left ? x0 : x1;
          c.set(tx, y - 1, p.char);
          used.add(`${tx},${y - 1}`);
          this.placed.push({ p, tx, ty: y - 1 });
          return true;
        }
      }
      if (d > 4) break;
    }
    return false;
  }

  build(): LevelDef {
    const { spec, c } = this;
    if (spec.fixedTop) {
      spec.fixedTop.forEach((rows, s) => rows.forEach((line, y) => {
        for (let x = 0; x < W; x++) {
          c.bg[(s * SR + y) * W + x] = line[x] === '.' ? '.' : ' ';
          if (line[x] !== '.' && line[x] !== ' ') c.fg[(s * SR + y) * W + x] = line[x];
        }
      }));
      Object.assign(this.legend, spec.fixedLegend ?? {});
    }
    this.paintBackground();
    this.paintWalls();
    this.buildRoute();
    this.decorate();
    this.place();
    if (c.fg.includes('B')) this.legend.B = { kind: 'object', object: 'bell' };
    return {
      id: spec.id,
      theme: spec.theme,
      legend: this.legend,
      ...(spec.wind ? { wind: spec.wind } : {}),
      entry: [Math.floor((this.entry.y - 1) / SR), Math.round((this.entry.x0 + this.entry.x1) / 2), (this.entry.y - 1) % SR],
      exit: this.exitCell,
      load: spec.load,
      ...(spec.needs?.length ? { needs: spec.needs } : {}),
      screens: c.rows(),
    };
  }
}

// ---------- validation ----------

export interface CheckWorld {
  levels: LevelDef[];
  /** Index of the level being checked within `levels` (bottom-up). */
  at: number;
}

/** Pixel position of a stand cell [screen, tx, ty] of level `li` in a world. */
export function cellPos(world: ReturnType<typeof buildWorld>, li: number, cell: [number, number, number]): { x: number; y: number; feetRow: number } {
  const band = world.bandLevel.indexOf(li) + cell[0];
  const wy = band * SR + cell[2];
  return { x: cell[1] * TILE - 1, y: (wy + 1) * TILE - TUNING.bodyH, feetRow: wy + 1 };
}

export function reachOpts(level: Pick<LevelDef, 'load' | 'needs'>, game: Game, moves?: Move[], cloak?: boolean): ReachOptions {
  const m = new Set(moves ?? level.needs ?? []);
  return { stones: level.load ?? 0, claws: m.has('claws'), hook: m.has('hook'), crampons: m.has('crampons'), rings: game.rings, world: game, ...(cloak ? { windResist: 0.3 } : {}) };
}

/** Is stand cell `to` of level `toLi` reachable from cell `from` of level `fromLi`? */
export function reaches(levels: LevelDef[], fromLi: number, from: [number, number, number], targets: { li: number; cell: [number, number, number] }[], opts: (g: Game) => ReachOptions): boolean[] {
  const world = buildWorld(levels, { requireStart: false });
  const game = new Game(world);
  for (const g of game.gates) g.open = true;
  for (const w of game.cracked) w.broken = true;
  const start = cellPos(world, fromLi, from);
  const r = explore(world.grid, start, opts(game));
  return targets.map(({ li, cell }) => {
    const t = cellPos(world, li, cell);
    const x = cell[1] * TILE;
    const hit = r.footholds.find((f) => f.ty === t.feetRow && x >= f.x0 - TUNING.bodyW && x <= f.x1 + TUNING.bodyW);
    return !!hit && r.reached.has(hit.id);
  });
}

function validate(input: GenInput, level: LevelDef, g: Gen): string | null {
  const { spec } = input;
  const levels = input.next ? [input.prev, level, input.next] : [input.prev, level];
  const li = 1;
  const target = input.next ? { li: 2, cell: input.next.entry! } : { li, cell: level.exit! };
  const placeTargets = g.placed.map((p) => ({ li, cell: [Math.floor(p.ty / SR), p.tx, p.ty % SR] as [number, number, number], p: p.p }));
  const [ok, ...placed] = reaches(levels, li, level.entry!, [target, ...placeTargets], (game) => reachOpts(level, game, undefined, spec.cloak));
  if (!ok) return 'unreachable: exit';
  const bad = placed.findIndex((x) => !x);
  if (bad >= 0) return `unreachable: ${placeTargets[bad].p.char}`;
  // items that must be found before a move is available
  for (const pt of placeTargets) {
    if (!pt.p.reachWith) continue;
    const [r] = reaches(levels, li, level.entry!, [pt], (game) => reachOpts(level, game, pt.p.reachWith, spec.cloak));
    if (!r) return `unreachable early: ${pt.p.char}`;
  }
  if (spec.failsAt !== undefined) {
    const [r] = reaches(levels, li, level.entry!, [target], (game) => ({ ...reachOpts(level, game, undefined, spec.cloak), stones: spec.failsAt }));
    if (r) return `bypass: heavy`;
  }
  for (const m of spec.requires ?? []) {
    const without = (level.needs ?? []).filter((x) => x !== m);
    const [r] = reaches(levels, li, level.entry!, [target], (game) => reachOpts(level, game, without, spec.cloak));
    if (r) return `bypass: ${m}`;
  }
  return null;
}
