/**
 * Prints the tower with footholds reachable from a start marked '^' and unreachable ones '?'.
 *
 *   npx tsx tools/reach.ts [--stones N] [--levels 1,2] [--from L:s:tx:ty] [--open] [--planks-down]
 *                          [--crampons] [--ropes] [--print 2,3]
 *
 * --from: level id, screen within that level (0 = top), tile x, tile y of the cell the climber stands in.
 * --open: gates open and cracked walls broken. --ropes: every rope hook has a rope hung.
 */
import { LEVELS } from '../src/content/levels';
import { Game } from '../src/game/game';
import { buildWorld, type World } from '../src/game/level';
import { explore } from '../src/game/reach';
import { SCREEN_ROWS, TILE, TUNING } from '../src/game/tuning';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const stones = Number(value('stones') ?? 0);
const levelIds = value('levels')?.split(',').map(Number);
const levels = levelIds ? LEVELS.filter((l) => levelIds.includes(l.id)) : LEVELS;
const world = buildWorld(levels, { requireStart: false });
const game = new Game(world);
if (flag('open') || flag('keys')) {
  for (const g of game.gates) if (flag('open') || !g.link) g.open = true;
  for (const c of game.cracked) c.broken = true;
}
if (flag('planks-down')) for (const p of game.planks) p.down = true;
if (flag('ropes')) for (const h of game.hooks) h.ropeUid = -1;

export function levelCell(w: World, levelId: number, screen: number, tx: number, ty: number): { x: number; y: number } {
  const li = w.levels.findIndex((l) => l.id === levelId);
  const band = w.bandLevel.indexOf(li) + screen;
  const wy = band * SCREEN_ROWS + ty;
  return { x: tx * TILE - 1, y: (wy + 1) * TILE - TUNING.bodyH };
}

let start = world.start;
const from = value('from');
if (from) {
  const [L, s, tx, ty] = from.split(':').map(Number);
  start = levelCell(world, L, s, tx, ty);
}
const t0 = Date.now();
const r = explore(world.grid, start, { stones, crampons: flag('crampons'), world: game });
const ms = Date.now() - t0;

const printIds = value('print')?.split(',').map(Number);
const lines: string[][] = [];
const bandOfLine: number[] = [];
let band = 0;
for (const level of [...levels].reverse())
  for (const s of level.screens) {
    for (const row of s) {
      lines.push(row.split(''));
      bandOfLine.push(band);
    }
    band++;
  }
for (const f of r.footholds) {
  const mark = r.reached.has(f.id) ? '^' : '?';
  const y = f.ty - 1;
  const cx0 = Math.floor(f.x0 / TILE);
  const cx1 = Math.floor((f.x1 + TUNING.bodyW - 1) / TILE);
  for (let x = cx0; x <= cx1; x++) if (lines[y] && (lines[y][x] === ' ' || lines[y][x] === '.')) lines[y][x] = mark;
}
const startTy = Math.floor((start.y + TUNING.bodyH - 1) / TILE);
lines.forEach((row, i) => {
  const b = bandOfLine[i];
  const level = world.levels[world.bandLevel[b]];
  if (printIds && !printIds.includes(level.id)) return;
  if (i % SCREEN_ROWS === 0) {
    const first = world.bandLevel.indexOf(world.bandLevel[b]);
    console.log(`---- level ${level.id} screen ${b - first} (band ${b}) ----`);
  }
  const ry = i % SCREEN_ROWS;
  const tag = i === startTy ? ' <start' : '';
  console.log(`${row.join('')} ${String(ry).padStart(2)}${tag}`);
});
let top = Infinity;
for (const id of r.reached) top = Math.min(top, r.footholds[id].ty);
console.log(`stones ${stones}: reached ${r.reached.size}/${r.footholds.length} footholds, highest row ${top} (${ms} ms)`);
