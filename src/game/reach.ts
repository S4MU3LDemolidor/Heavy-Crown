import { Player, type PlayerInput, type PlayerWorld } from './player';
import type { CollisionWorld, TileGrid } from './tiles';
import { TILE, TUNING } from './tuning';
import { chargeFramesFor } from './weight';

export type { CollisionWorld };

/** A horizontal run of positions where the climber can stand. Feet are at y = ty * TILE. */
export interface Foothold {
  id: number;
  ty: number;
  /** Inclusive range of body x positions. */
  x0: number;
  x1: number;
}

export function findFootholds(grid: TileGrid, world: CollisionWorld = grid): Foothold[] {
  const { bodyW: w, bodyH: h } = TUNING;
  const out: Foothold[] = [];
  const maxX = grid.cols * TILE - w;
  for (let ty = 1; ty < grid.rows + 1; ty++) {
    const feet = ty * TILE;
    let runStart = -1;
    for (let x = 0; x <= maxX + 1; x++) {
      const ok = x <= maxX && !world.solidRect(x, feet - h, w, h) && world.solidRect(x, feet, w, 1);
      if (ok && runStart < 0) runStart = x;
      if (!ok && runStart >= 0) {
        out.push({ id: out.length, ty, x0: runStart, x1: x - 1 });
        runStart = -1;
      }
    }
  }
  return out;
}

export interface ReachOptions {
  stones?: number;
  springBoots?: boolean;
  crampons?: boolean;
  /** Carrying the Climbing Claws. */
  claws?: boolean;
  /** Carrying the Grappling Hook (needs `rings`). */
  hook?: boolean;
  /** Iron rings in the world, for the hook. */
  rings?: { x: number; y: number }[];
  /** Pixels between sampled take-off points (default 4). */
  xStep?: number;
  /** Number of charge samples from tap to full (default 16). */
  chargeSteps?: number;
  /** Collision world (defaults to the grid). May provide ladders, water, ice, climbable walls and rings. */
  world?: PlayerWorld;
}

export interface ReachResult {
  footholds: Foothold[];
  /** Reached node ids: footholds are 0..footholds.length-1, rings follow (footholds.length + ring index). */
  reached: Set<number>;
  /** For each reached node, the node it was first reached from (start maps to -1). */
  from: Map<number, number>;
}

const NONE: PlayerInput = { left: false, right: false, jump: false };
const AIMS: Partial<PlayerInput>[] = [{ up: true }, { up: true, left: true }, { up: true, right: true }, { left: true }, { right: true }, {}];
const SETTLE_LIMIT = 1500;

/** Breadth-first search over footholds (and rings) reachable from the start position. */
export function explore(grid: TileGrid, start: { x: number; y: number }, opts: ReachOptions = {}): ReachResult {
  const world: PlayerWorld = opts.world ?? grid;
  const stones = opts.stones ?? 0;
  const xStep = opts.xStep ?? 4;
  const chargeSteps = opts.chargeSteps ?? 16;
  const rings = opts.hook ? (opts.rings ?? []) : [];
  const footholds = findFootholds(grid, world);
  const N = footholds.length;
  const byRow = new Map<number, Foothold[]>();
  for (const f of footholds) {
    const list = byRow.get(f.ty) ?? [];
    list.push(f);
    byRow.set(f.ty, list);
  }
  const lookup = (feetY: number, x: number): number => {
    if (feetY % TILE !== 0) return -1;
    const row = byRow.get(feetY / TILE);
    const f = row?.find((r) => x >= r.x0 && x <= r.x1);
    return f ? f.id : -1;
  };
  const ringNode = (r: { x: number; y: number } | null): number => {
    if (!r) return -1;
    const i = rings.findIndex((q) => q.x === r.x && q.y === r.y);
    return i < 0 ? -1 : N + i;
  };

  const fresh = (x: number, feetY: number): Player => {
    const p = new Player(x, feetY - TUNING.bodyH);
    p.loadout.stones = stones;
    p.loadout.mods.springBoots = opts.springBoots ?? false;
    p.loadout.crampons = opts.crampons;
    p.loadout.claws = opts.claws;
    p.loadout.hook = opts.hook;
    return p;
  };
  const atRing = (r: { x: number; y: number }): Player => {
    const p = fresh(Math.round(r.x - TUNING.bodyW / 2), r.y + 3 + TUNING.bodyH);
    p.state = 'hang';
    p.ring = r;
    return p;
  };

  /**
   * Runs a player with `input` held until it comes to rest and returns the nodes it can end on.
   * A cling branches into climbing up, climbing down, a wall jump and letting go (depth-limited).
   */
  const settle = (p: Player, input: PlayerInput, depth: number): number[] => {
    for (let i = 0; i < SETTLE_LIMIT; i++) {
      const s = p.state as string;
      if (s === 'ground' && p.vx === 0) break;
      if (s !== 'air' && s !== 'stumble' && s !== 'pull' && s !== 'ground') break;
      p.update(s === 'pull' ? NONE : input, world);
    }
    const s = p.state as string;
    if (s === 'ground') {
      const id = lookup(p.feetY, p.body.x);
      return id >= 0 ? [id] : [];
    }
    if (s === 'hang') {
      const id = ringNode(p.ring);
      return id >= 0 ? [id] : [];
    }
    if (s === 'cling' && depth < 4) {
      const out: number[] = [];
      const toward = { left: p.wallDir < 0, right: p.wallDir > 0 };
      // climb up (onto the top, or as far as it goes, then jump off)
      const up = p.clone();
      let last = up.body.y;
      let still = 0;
      for (let i = 0; i < 3000 && (up.state as string) === 'cling' && still < 8; i++) {
        up.update({ ...NONE, up: true }, world);
        still = up.body.y === last ? still + 1 : 0;
        last = up.body.y;
      }
      if ((up.state as string) === 'cling') {
        up.update({ ...NONE, jump: true }, world);
        up.update(NONE, world);
        out.push(...settle(up, NONE, depth + 1));
        const up2 = up.clone();
        out.push(...settle(up2, { ...NONE, ...toward }, depth + 1));
      } else out.push(...settle(up, NONE, depth + 1));
      // wall jump from here, drifting free or holding toward the far wall (chimneys)
      for (const hold of [NONE, { ...NONE, left: p.wallDir > 0, right: p.wallDir < 0 }]) {
        const wj = p.clone();
        wj.update({ ...NONE, jump: true }, world);
        wj.update(NONE, world);
        out.push(...settle(wj, hold, depth + 1));
      }
      // climb down to the floor
      const down = p.clone();
      for (let i = 0; i < 3000 && (down.state as string) === 'cling'; i++) down.update({ ...NONE, down: true }, world);
      out.push(...settle(down, NONE, depth + 1));
      return out;
    }
    return [];
  };

  /** A charged jump from `p` (standing or hanging): hold jump, release toward `dir`, optionally keep holding `dir`. */
  const jumpFrom = (p: Player, hold: number, dir: -1 | 0 | 1, holdDir: boolean): number[] => {
    const d = { left: dir < 0, right: dir > 0 };
    p.update({ ...NONE, jump: true }, world);
    for (let i = 0; i < hold; i++) p.update({ ...NONE, jump: true }, world);
    p.update({ ...NONE, ...d }, world);
    return settle(p, holdDir ? { ...NONE, ...d } : NONE, 0);
  };

  const hooksFrom = (make: () => Player): number[] => {
    const out: number[] = [];
    for (const aim of AIMS) {
      const p = make();
      p.update({ ...NONE, ...aim, hook: true }, world);
      if ((p.state as string) !== 'pull') continue;
      out.push(...settle(p, NONE, 0));
    }
    return out;
  };

  const startId = lookup(start.y + TUNING.bodyH, start.x);
  const reached = new Set<number>();
  const from = new Map<number, number>();
  if (startId < 0) return { footholds, reached, from };
  reached.add(startId);
  from.set(startId, -1);
  const queue = [startId];
  const full = chargeFramesFor(stones);
  const holds = Array.from({ length: chargeSteps + 1 }, (_, c) => Math.round((c / chargeSteps) * full));
  const dirs = opts.claws ? [false, true] : [false];

  while (queue.length) {
    const node = queue.shift()!;
    const visit = (ids: number[]) => {
      for (const id of ids) {
        if (id >= 0 && !reached.has(id)) {
          reached.add(id);
          from.set(id, node);
          queue.push(id);
        }
      }
    };

    if (node >= N) {
      // hanging from a ring: jump, drop, or hook on to another ring
      const r = rings[node - N];
      for (const hold of holds) for (const dir of [-1, 0, 1] as const) for (const hd of dirs) visit(jumpFrom(atRing(r), hold, dir, hd && dir !== 0));
      const drop = atRing(r);
      drop.update({ ...NONE, down: true }, world);
      visit(settle(drop, NONE, 0));
      visit(hooksFrom(() => atRing(r)));
      continue;
    }

    const f = footholds[node];
    const feetY = f.ty * TILE;
    const xs: number[] = [];
    for (let x = f.x0; x < f.x1; x += xStep) xs.push(x);
    xs.push(f.x1);
    for (const x of xs) {
      for (const hold of holds) for (const dir of [-1, 0, 1] as const) for (const hd of dirs) {
        if (hd && dir === 0) continue;
        visit(jumpFrom(fresh(x, feetY), hold, dir, hd));
      }
    }
    // walking off either end
    for (const [x, dir] of [[f.x0, -1], [f.x1, 1]] as const) {
      const d: PlayerInput = { ...NONE, left: dir < 0, right: dir > 0 };
      const walkOff = () => {
        const p = fresh(x, feetY);
        for (let i = 0; i < 60 && p.state !== 'air'; i++) p.update(d, world);
        return p;
      };
      const p = walkOff();
      if (p.state === 'air') {
        visit(settle(p, NONE, 0));
        if (opts.claws) visit(settle(walkOff(), d, 0));
      }
    }
    // ladders
    if (world.ladderAt) {
      for (const x of xs) {
        const cx = x + (TUNING.bodyW >> 1);
        if (!world.ladderAt(cx - 7, feetY - TUNING.bodyH, 14, TUNING.bodyH + 6)) continue;
        for (const up of [true, false]) for (const side of [-1, 1] as const) visit([climb(world, fresh(x, feetY), up, side, lookup)]);
        break;
      }
    }
    // climbing walls from the ground
    if (opts.claws && world.climbableAt) {
      for (const x of [f.x0, f.x1]) {
        for (const dir of [-1, 1] as const) {
          const p = fresh(x, feetY);
          p.update({ ...NONE, up: true, left: dir < 0, right: dir > 0 }, world);
          if ((p.state as string) === 'cling') visit(settle(p, NONE, 0));
        }
      }
    }
    // the hook, from a few points along the foothold
    if (rings.length) for (const x of [f.x0, Math.round((f.x0 + f.x1) / 2), f.x1]) visit(hooksFrom(() => fresh(x, feetY)));
  }
  return { footholds, reached, from };
}

/** Climbs a ladder up or down from a standing player and steps off; returns the foothold reached, or -1. */
function climb(world: PlayerWorld, p: Player, up: boolean, side: -1 | 1, lookup: (feetY: number, x: number) => number): number {
  p.update({ ...NONE, up, down: !up }, world);
  if (p.state !== 'ladder') return -1;
  let lastY = p.body.y;
  let still = 0;
  for (let i = 0; i < 4000 && p.state === 'ladder' && still < 6; i++) {
    p.update({ ...NONE, up, down: !up }, world);
    still = p.body.y === lastY ? still + 1 : 0;
    lastY = p.body.y;
  }
  const state = () => p.state as string;
  if (state() === 'ladder') p.update({ ...NONE, left: side < 0, right: side > 0 }, world);
  for (let i = 0; i < 30 && state() === 'ground'; i++) p.update({ ...NONE, left: side < 0, right: side > 0 }, world);
  for (let i = 0; i < 1200 && state() === 'air'; i++) p.update(NONE, world);
  if (state() === 'air' || state() === 'ladder') return -1;
  return lookup(p.feetY, p.body.x);
}
