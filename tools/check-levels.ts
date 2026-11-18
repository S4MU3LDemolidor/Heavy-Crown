/**
 * The climbability checker (spec section 15, full-game spec section 9). Every level is checked from its entry
 * to the next level's entry at its stated load with its stated moves; generated levels also check that their
 * set pieces cannot be skipped; and the hand-written rules below still hold. Exits with code 1 on failure.
 *   npm run check:levels [ids...]
 */
import { LEVELS } from '../src/content/levels';
import type { LevelDef } from '../src/game/level';
import { reaches, reachOpts, type Move } from './reachLib';

type Cell = [screen: number, tx: number, ty: number];
type Open = 'all' | 'keys' | 'none';

const byId = (id: number) => LEVELS.find((l) => l.id === id)!;
const only = new Set(process.argv.slice(2).map(Number));
let failed = 0;
let count = 0;

/** Checks reachability within the levels around `id` (one below, one above). */
function check(label: string, id: number, from: Cell, to: { id: number; cell: Cell }, opts: { stones?: number; moves?: Move[]; cloak?: boolean; open?: Open; ropes?: boolean }, expect: boolean): void {
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
      // every rope hook has a rope hung on it, when asked
      if (opts.ropes) for (const h of game.hooks) h.ropeUid = -1;
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
  const cloak = l.theme === 'frozen' && l.id > 13;
  const to = next ? { id: next.id, cell: next.entry! } : { id: l.id, cell: l.exit! };
  const what = [`${l.load} st`, ...(l.needs ?? []), ...(cloak ? ['fur cloak'] : [])].join(', ');
  check(`level ${l.id}: climbs ${next ? `into level ${next.id}` : 'to the summit'} carrying ${what}`, l.id, l.entry!, to, { cloak }, true);
  for (const m of l.requires ?? []) {
    check(`level ${l.id}: cannot be climbed without the ${m}`, l.id, l.entry!, to, { moves: (l.needs ?? []).filter((x) => x !== m), cloak }, false);
  }
}

// the hand-made rules (remake: written with each act)
const RULES: { id: number; run: () => void }[] = [
  // Act I
  { id: 2, run: () => check('level 2: the iron gate cannot be bypassed', 2, byId(2).entry!, { id: 2, cell: byId(2).exit! }, { open: 'none' }, false) },
  { id: 2, run: () => check('level 2: the key pit cannot be climbed out of without the rope', 2, [1, 40, 28], { id: 2, cell: [1, 33, 13] }, { open: 'none' }, false) },
  { id: 2, run: () => check('level 2: with the rope hung, the key pit can be climbed out of', 2, [1, 40, 28], { id: 2, cell: [1, 33, 13] }, { open: 'none', ropes: true }, true) },
  // Act II
  { id: 4, run: () => check('level 4: the plate gate cannot be bypassed', 4, byId(4).entry!, { id: 4, cell: byId(4).exit! }, { open: 'keys' }, false) },
  { id: 5, run: () => check('level 5: the plate gate guards the Spring Boots', 5, byId(5).entry!, { id: 5, cell: [2, 6, 21] }, { open: 'keys' }, false) },
  // Act III
  { id: 8, run: () => check('level 8: the door is sealed until the loft is rung', 8, byId(8).entry!, { id: 8, cell: byId(8).exit! }, { open: 'keys', moves: ['claws', 'hook'] }, false) },
  { id: 9, run: () => check('level 9: the Bell Door guards the idol', 9, byId(9).entry!, { id: 9, cell: [2, 5, 15] }, { open: 'none', moves: ['claws', 'hook'] }, false) },
];
for (const r of RULES) if (!only.size || only.has(r.id)) r.run();

console.log(failed ? `\n${failed} of ${count} checks failed` : `\nall ${count} checks passed`);
process.exit(failed ? 1 : 0);
