import { describe, expect, it } from 'vitest';
import { Game } from '../src/game/game';
import { buildWorld } from '../src/game/level';
import { explore } from '../src/game/reach';
import { blankScreen, put } from './helpers';

/**
 * One screen: floor on row 33. An ivy column at the left edge (cols 1–3, rows 10–32) whose top is far too high to jump to.
 * A ledge on row 24 (cols 30–36) you can jump to, a ring at (44, 15), and a high ledge on row 12 (cols 48–57)
 * that only the hook (ring, then a jump) reaches.
 */
function world() {
  let s = blankScreen();
  s[33] = '#'.repeat(60);
  s = put(s, 10, 32, '@');
  for (let y = 10; y <= 32; y++) for (let x = 1; x <= 3; x++) s = put(s, x, y, '%');
  for (let x = 30; x <= 36; x++) s = put(s, x, 24, '#');
  for (let x = 48; x <= 57; x++) s = put(s, x, 12, '#');
  s = put(s, 44, 15, '*');
  const w = buildWorld([{ id: 1, theme: 'overgrown', screens: [s], legend: {} }]);
  return { w, game: new Game(w) };
}

const reachedRows = (r: ReturnType<typeof explore>) => new Set([...r.reached].filter((id) => id < r.footholds.length).map((id) => r.footholds[id].ty));

describe('the checker knows the new moves', () => {
  it('reaches the top of an ivy wall only with the Climbing Claws', () => {
    const { w, game } = world();
    expect(reachedRows(explore(w.grid, w.start, { world: game, xStep: 8, chargeSteps: 8 })).has(10)).toBe(false);
    expect(reachedRows(explore(w.grid, w.start, { world: game, claws: true, xStep: 8, chargeSteps: 8 })).has(10)).toBe(true);
  });

  it('reaches the high ledge only with the Grappling Hook', () => {
    const { w, game } = world();
    expect(reachedRows(explore(w.grid, w.start, { world: game, xStep: 8, chargeSteps: 8 })).has(12)).toBe(false);
    const r = explore(w.grid, w.start, { world: game, hook: true, rings: game.rings, xStep: 8, chargeSteps: 8 });
    expect(r.reached.has(r.footholds.length)).toBe(true); // the ring itself
    expect(reachedRows(r).has(12)).toBe(true);
  });
});
