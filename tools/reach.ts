/**
 * Prints each screen of the tower with footholds the climber can reach from the start marked '^'
 * and unreachable ones marked '?'. Usage: npx tsx tools/reach.ts [stones] [levelIds...]
 */
import { LEVELS } from '../src/content/levels';
import { buildWorld } from '../src/game/level';
import { explore } from '../src/game/reach';
import { SCREEN_ROWS, TILE, TUNING } from '../src/game/tuning';

const stones = Number(process.argv[2] ?? 0);
const ids = process.argv.slice(3).map(Number);
const levels = ids.length ? LEVELS.filter((l) => ids.includes(l.id)) : LEVELS;
const TUNING_W = TUNING.bodyW;
const world = buildWorld(levels);
const t0 = Date.now();
const r = explore(world.grid, world.start, { stones });
const ms = Date.now() - t0;

const lines: string[][] = [];
for (const level of [...levels].reverse()) for (const s of level.screens) for (const row of s) lines.push(row.split(''));
for (const f of r.footholds) {
  const mark = r.reached.has(f.id) ? '^' : '?';
  const y = f.ty - 1;
  const cx0 = Math.floor(f.x0 / TILE);
  const cx1 = Math.floor((f.x1 + TUNING_W - 1) / TILE);
  for (let x = cx0; x <= cx1; x++) if (lines[y][x] === ' ' || lines[y][x] === '.') lines[y][x] = mark;
}
let topReached = Infinity;
for (const id of r.reached) topReached = Math.min(topReached, r.footholds[id].ty);
lines.forEach((row, i) => {
  if (i % SCREEN_ROWS === 0) console.log(`---- screen ${world.screenCount - 1 - i / SCREEN_ROWS} (from bottom) ----`);
  console.log(row.join(''));
});
console.log(`stones ${stones}: reached ${r.reached.size}/${r.footholds.length} footholds, highest row ${topReached} (${ms} ms)`);
