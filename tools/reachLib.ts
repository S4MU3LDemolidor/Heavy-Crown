/** Reachability helpers for the level tools: is one stand cell reachable from another, at a load, with given moves? */
import { Game } from '../src/game/game';
import { buildWorld, type LevelDef } from '../src/game/level';
import { explore, type ReachOptions } from '../src/game/reach';
import { SCREEN_ROWS, TILE, TUNING } from '../src/game/tuning';

export type Move = 'claws' | 'hook' | 'crampons';

/** Pixel position of a stand cell [screen, tx, ty] of level `li` in a world. */
export function cellPos(world: ReturnType<typeof buildWorld>, li: number, cell: [number, number, number]): { x: number; y: number; feetRow: number } {
  const band = world.bandLevel.indexOf(li) + cell[0];
  const wy = band * SCREEN_ROWS + cell[2];
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
