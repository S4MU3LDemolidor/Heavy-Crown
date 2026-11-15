/** Prints the chain of footholds the checker used to reach a target cell. Usage: tsx tools/trace.ts L:s:tx:ty [stones] */
import { LEVELS } from '../src/content/levels';
import { Game } from '../src/game/game';
import { buildWorld } from '../src/game/level';
import { explore } from '../src/game/reach';
import { SCREEN_ROWS, TILE } from '../src/game/tuning';

const [L, s, tx, ty] = process.argv[2].split(':').map(Number);
const stones = Number(process.argv[3] ?? 0);
const world = buildWorld(LEVELS, { requireStart: false });
const game = new Game(world);
const r = explore(world.grid, world.start, { stones, world: game });
const li = world.levels.findIndex((l) => l.id === L);
const band = world.bandLevel.indexOf(li) + s;
const feetRow = band * SCREEN_ROWS + ty + 1;
const target = r.footholds.find((f) => f.ty === feetRow && tx * TILE >= f.x0 - 9 && tx * TILE <= f.x1 + 9);
if (!target) throw new Error('no foothold there');
const describe = (id: number) => {
  const f = r.footholds[id];
  const b = Math.floor((f.ty - 1) / SCREEN_ROWS);
  const lvl = world.levels[world.bandLevel[b]].id;
  const scr = b - world.bandLevel.indexOf(world.bandLevel[b]);
  return `L${lvl} s${scr} row ${(f.ty - 1) % SCREEN_ROWS + 1} cols ${Math.floor(f.x0 / 8)}-${Math.floor((f.x1 + 9) / 8)}`;
};
let id: number | undefined = target.id;
if (!r.reached.has(id)) console.log('not reached');
while (id !== undefined && id >= 0) {
  console.log(describe(id));
  id = r.from.get(id);
}
