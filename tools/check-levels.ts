/**
 * The climbability checker (spec section 15): every rule the level design depends on.
 * Exits with code 1 if any expectation fails.  npm run check:levels
 */
import { LEVELS } from '../src/content/levels';
import { Game } from '../src/game/game';
import { buildWorld, type World } from '../src/game/level';
import { explore } from '../src/game/reach';
import { SCREEN_ROWS, TILE, TUNING } from '../src/game/tuning';

type Cell = [level: number, screen: number, tx: number, ty: number];

interface Check {
  label: string;
  from: Cell | 'start';
  to: Cell;
  stones: number;
  crampons?: boolean;
  /** 'all' opens every gate and breaks cracked walls; 'keys' opens key gates and walls but not plate gates. */
  open?: 'all' | 'keys' | 'none';
  reachable: boolean;
}

const SUMMIT: Cell = [5, 0, 30, 6];

const CHECKS: Check[] = [
  { label: 'empty-handed, the whole tower can be climbed to the summit', from: 'start', to: SUMMIT, stones: 0, crampons: true, open: 'all', reachable: true },
  { label: 'with 4 stones the whole tower can be climbed', from: 'start', to: SUMMIT, stones: 4, crampons: true, open: 'all', reachable: true },
  { label: 'level I: the iron gate cannot be bypassed', from: 'start', to: [1, 1, 45, 2], stones: 0, open: 'none', reachable: false },
  { label: 'level II: the plate gate guards the Spring Boots', from: [2, 3, 44, 30], to: [2, 2, 5, 12], stones: 0, open: 'keys', reachable: false },
  { label: 'level II can be climbed carrying 7 stones', from: [2, 3, 44, 30], to: [2, 0, 32, 0], stones: 7, open: 'all', reachable: true },
  { label: 'level III can be climbed without the Bell Key or the Pickaxe', from: [3, 3, 40, 29], to: [3, 0, 40, 1], stones: 7, open: 'none', reachable: true },
  { label: 'level IV: the Seal lies behind the ossuary door', from: [4, 2, 28, 30], to: [4, 0, 52, 25], stones: 2, open: 'none', reachable: false },
  { label: 'level IV can be climbed carrying 7 stones', from: [4, 2, 28, 30], to: [4, 0, 46, 0], stones: 7, open: 'keys', reachable: true },
  { label: 'level V: one relic, Crampons and Fur Cloak (7 st) reach the summit', from: [5, 3, 38, 29], to: SUMMIT, stones: 7, crampons: true, reachable: true },
  { label: 'level V: two relics, Crampons and Fur Cloak (11 st) cannot', from: [5, 3, 38, 29], to: SUMMIT, stones: 11, crampons: true, reachable: false },
];

function cellToPos(w: World, [L, s, tx, ty]: Cell): { x: number; y: number; feetRow: number } {
  const li = w.levels.findIndex((l) => l.id === L);
  const band = w.bandLevel.indexOf(li) + s;
  const wy = band * SCREEN_ROWS + ty;
  return { x: tx * TILE - 1, y: (wy + 1) * TILE - TUNING.bodyH, feetRow: wy + 1 };
}

let failed = 0;
for (const c of CHECKS) {
  const world = buildWorld(LEVELS);
  const game = new Game(world);
  const open = c.open ?? 'none';
  if (open !== 'none') {
    for (const g of game.gates) if (open === 'all' || !g.link) g.open = true;
    for (const w of game.cracked) w.broken = true;
  }
  const start = c.from === 'start' ? world.start : cellToPos(world, c.from);
  const r = explore(world.grid, start, { stones: c.stones, crampons: c.crampons, world: game });
  const target = cellToPos(world, c.to);
  const tx = c.to[2] * TILE;
  const hit = r.footholds.find((f) => f.ty === target.feetRow && tx >= f.x0 - TUNING.bodyW && tx <= f.x1 + TUNING.bodyW);
  if (!hit) {
    console.log(`✗ ${c.label}\n    (no foothold at the target cell ${c.to.join(':')})`);
    failed++;
    continue;
  }
  const ok = r.reached.has(hit.id) === c.reachable;
  console.log(`${ok ? '✓' : '✗'} ${c.label}`);
  if (!ok) failed++;
}
console.log(failed ? `\n${failed} check(s) failed` : `\nall ${CHECKS.length} checks passed`);
process.exit(failed ? 1 : 0);
