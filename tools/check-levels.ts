/**
 * The climbability checker (spec section 15, full-game spec section 9). Every level is checked from its entry
 * to the next level's entry at its stated load with its stated moves; generated levels also check that their
 * set pieces cannot be skipped; and the hand-written rules below still hold. Exits with code 1 on failure.
 *   npm run check:levels [ids...]
 */
import { LEVELS } from '../src/content/levels';
import type { LevelDef } from '../src/game/level';
import { reaches, reachOpts, type Move } from './levelgen/gen';
import { SPECS } from './levelgen/specs';

type Cell = [screen: number, tx: number, ty: number];
type Open = 'all' | 'keys' | 'none';

const byId = (id: number) => LEVELS.find((l) => l.id === id)!;
const only = new Set(process.argv.slice(2).map(Number));
let failed = 0;
let count = 0;

/** Checks reachability within the levels around `id` (one below, one above). */
function check(label: string, id: number, from: Cell, to: { id: number; cell: Cell }, opts: { stones?: number; moves?: Move[]; cloak?: boolean; open?: Open }, expect: boolean): void {
  count++;
  const levels: LevelDef[] = [byId(id - 1), byId(id), byId(id + 1)].filter(Boolean);
  const li = levels.indexOf(byId(id));
  const ti = levels.indexOf(byId(to.id));
  const level = byId(id);
  const t0 = performance.now();
  const [ok] = reaches(
    levels,
    li,
    from,
    [{ li: ti, cell: to.cell }],
    (game) => {
      const open = opts.open ?? 'all';
      for (const g of game.gates) g.open = open === 'all' || (open === 'keys' && !g.link && !g.flag);
      for (const w of game.cracked) w.broken = open !== 'none';
      return { ...reachOpts(level, game, opts.moves, opts.cloak), ...(opts.stones !== undefined ? { stones: opts.stones } : {}) };
    },
  );
  const pass = ok === expect;
  console.log(`${pass ? '✓' : '✗'} ${label} (${Math.round(performance.now() - t0)} ms)`);
  if (!pass) failed++;
}

// every level climbs into the next at its load
for (const l of LEVELS) {
  if (only.size && !only.has(l.id)) continue;
  const next = byId(l.id + 1);
  const cloak = l.theme === 'frozen' && l.id > 25;
  const to = next ? { id: next.id, cell: next.entry! } : { id: l.id, cell: l.exit! };
  const what = [`${l.load} st`, ...(l.needs ?? []), ...(cloak ? ['fur cloak'] : [])].join(', ');
  check(`level ${l.id}: climbs ${next ? `into level ${next.id}` : 'to the summit'} carrying ${what}`, l.id, l.entry!, to, { cloak }, true);
  const spec = SPECS.find((s) => s.id === l.id);
  for (const m of spec?.requires ?? []) {
    check(`level ${l.id}: cannot be climbed without the ${m}`, l.id, l.entry!, to, { moves: (l.needs ?? []).filter((x) => x !== m), cloak }, false);
  }
}

// the hand-made rules
const RULES: { id: number; run: () => void }[] = [
  { id: 1, run: () => check('level 1: the iron gate cannot be bypassed', 1, byId(1).entry!, { id: 1, cell: [1, 45, 2] }, { stones: 0, open: 'none' }, false) },
  { id: 7, run: () => check('level 7: the plate gate guards the Spring Boots', 7, [3, 44, 30], { id: 7, cell: [2, 5, 12] }, { stones: 0, open: 'keys' }, false) },
  { id: 13, run: () => check('level 13 can be climbed without the Bell Key or the Pickaxe', 13, byId(13).entry!, { id: 13, cell: byId(13).exit! }, { stones: 7, open: 'none' }, true) },
  { id: 19, run: () => check('level 19: the ossuary door guards its chalice', 19, byId(19).entry!, { id: 19, cell: [0, 52, 25] }, { stones: 2, open: 'none' }, false) },
  { id: 30, run: () => check('level 30: one relic, Crampons and Fur Cloak (7 st) reach the summit', 30, byId(30).entry!, { id: 30, cell: byId(30).exit! }, { stones: 7, cloak: true }, true) },
  { id: 30, run: () => check('level 30: two relics, Crampons and Fur Cloak (11 st) cannot', 30, byId(30).entry!, { id: 30, cell: byId(30).exit! }, { stones: 11, cloak: true }, false) },
];
for (const r of RULES) if (!only.size || only.has(r.id)) r.run();

console.log(failed ? `\n${failed} of ${count} checks failed` : `\nall ${count} checks passed`);
process.exit(failed ? 1 : 0);
