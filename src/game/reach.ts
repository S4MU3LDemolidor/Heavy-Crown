import { Player, type PlayerInput } from './player';
import type { CollisionWorld, TileGrid } from './tiles';
import { TILE, TUNING } from './tuning';
import { chargeFramesFor } from './weight';

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
  /** Pixels between sampled take-off points (default 4). */
  xStep?: number;
  /** Number of charge samples from tap to full (default 16). */
  chargeSteps?: number;
  /** Collision world (defaults to the grid). */
  world?: CollisionWorld;
}

export interface ReachResult {
  footholds: Foothold[];
  reached: Set<number>;
  /** For each reached foothold, the foothold it was first reached from (start maps to -1). */
  from: Map<number, number>;
}

const NONE: PlayerInput = { left: false, right: false, jump: false };

/** Where a simulated move ends: the foothold id, or -1 if it never lands. */
function simulate(
  world: CollisionWorld,
  x: number,
  feetY: number,
  stones: number,
  springBoots: boolean,
  hold: number,
  dir: -1 | 0 | 1,
  walkOff: boolean,
  lookup: (feetY: number, x: number) => number,
): number {
  const p = new Player(x, feetY - TUNING.bodyH);
  p.loadout.stones = stones;
  p.loadout.mods.springBoots = springBoots;
  const dirInput = { left: dir < 0, right: dir > 0 };
  if (walkOff) {
    for (let i = 0; i < 60 && p.state !== 'air'; i++) p.update({ ...NONE, ...dirInput }, world);
    if (p.state !== 'air') return -1;
  } else {
    p.update({ ...NONE, jump: true }, world);
    for (let i = 0; i < hold; i++) p.update({ ...NONE, jump: true }, world);
    p.update({ ...NONE, ...dirInput }, world);
  }
  for (let i = 0; i < 1200 && p.state === 'air'; i++) p.update(NONE, world);
  if (p.state === 'air') return -1;
  return lookup(p.feetY, p.body.x);
}

/** Breadth-first search over footholds reachable from the start position. */
export function explore(grid: TileGrid, start: { x: number; y: number }, opts: ReachOptions = {}): ReachResult {
  const world = opts.world ?? grid;
  const stones = opts.stones ?? 0;
  const springBoots = opts.springBoots ?? false;
  const xStep = opts.xStep ?? 4;
  const chargeSteps = opts.chargeSteps ?? 16;
  const footholds = findFootholds(grid, world);
  const byRow = new Map<number, Foothold[]>();
  for (const f of footholds) {
    const list = byRow.get(f.ty) ?? [];
    list.push(f);
    byRow.set(f.ty, list);
  }
  const lookup = (feetY: number, x: number): number => {
    const row = byRow.get(feetY / TILE);
    const f = row?.find((r) => x >= r.x0 && x <= r.x1);
    return f ? f.id : -1;
  };
  const startId = lookup(start.y + TUNING.bodyH, start.x);
  const reached = new Set<number>();
  const from = new Map<number, number>();
  if (startId < 0) return { footholds, reached, from };
  reached.add(startId);
  from.set(startId, -1);
  const queue = [startId];
  const full = chargeFramesFor(stones);
  while (queue.length) {
    const f = footholds[queue.shift()!];
    const feetY = f.ty * TILE;
    const xs: number[] = [];
    for (let x = f.x0; x < f.x1; x += xStep) xs.push(x);
    xs.push(f.x1);
    const visit = (id: number) => {
      if (id >= 0 && !reached.has(id)) {
        reached.add(id);
        from.set(id, f.id);
        queue.push(id);
      }
    };
    for (const x of xs) {
      for (let c = 0; c <= chargeSteps; c++) {
        const hold = Math.round((c / chargeSteps) * full);
        for (const dir of [-1, 0, 1] as const) visit(simulate(world, x, feetY, stones, springBoots, hold, dir, false, lookup));
      }
    }
    visit(simulate(world, f.x0, feetY, stones, springBoots, 0, -1, true, lookup));
    visit(simulate(world, f.x1, feetY, stones, springBoots, 0, 1, true, lookup));
  }
  return { footholds, reached, from };
}
