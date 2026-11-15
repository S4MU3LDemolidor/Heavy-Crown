/** Proves the ?moves playground needs its moves: the top is reached with Claws or Hook, not without. */
import { TEST_MOVES } from '../src/content/levels/test-moves';
import { Game } from '../src/game/game';
import { buildWorld } from '../src/game/level';
import { explore } from '../src/game/reach';
const w = buildWorld([TEST_MOVES]);
const game = new Game(w);
const top = (r: ReturnType<typeof explore>) => Math.min(...[...r.reached].filter((i) => i < r.footholds.length).map((i) => r.footholds[i].ty));
for (const [label, o] of [['nothing', {}], ['claws', { claws: true }], ['hook', { hook: true, rings: game.rings }], ['both', { claws: true, hook: true, rings: game.rings }]] as const) {
  const t0 = Date.now();
  const r = explore(w.grid, w.start, { world: game, ...o });
  console.log(`${label.padEnd(8)} highest row ${top(r)}  (${Date.now() - t0} ms)`);
}
