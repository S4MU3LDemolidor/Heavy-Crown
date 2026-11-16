import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/content/levels';
import { Game, ITEM_BOX } from '../src/game/game';
import { buildWorld } from '../src/game/level';
import { findFootholds } from '../src/game/reach';
import { TILE, TUNING } from '../src/game/tuning';
import { crossingFootholds } from '../src/game/visibility';

/** Every note can be read, every item picked up, every NPC and lift used and every scare sprung from some place the climber can stand. */
describe('level objects are within reach', () => {
  const world = buildWorld(LEVELS);
  const game = new Game(world);
  for (const g of game.gates) g.open = true;
  for (const c of game.cracked) c.broken = true;
  const footholds = findFootholds(world.grid, game);

  /** True if a climber standing somewhere would get the interaction for this object. */
  const reachable = (test: (bx: number, by: number) => boolean) =>
    footholds.some((f) => {
      for (let x = f.x0; x <= f.x1; x++) if (test(x, f.ty * TILE - TUNING.bodyH)) return true;
      return false;
    });

  it.each(game.notes.map((n) => [n.id, n] as const))('note %s can be read', (_id, n) => {
    const ok = reachable((bx, by) => {
      game.player.body.x = bx;
      game.player.body.y = by;
      game.player.state = 'ground';
      const it = game.interaction();
      return it?.label === 'Read' && it.x === n.tx * TILE + 4;
    });
    expect(ok).toBe(true);
  });

  it.each(game.items.map((it) => [it.id, it.uid, it] as const))('item %s (#%i) can be picked up', (_id, _uid, it) => {
    const ok = reachable((bx, by) => {
      const w = TUNING.bodyW;
      const h = TUNING.bodyH;
      return bx - 3 < it.body.x + ITEM_BOX && it.body.x < bx + w + 3 && by < it.body.y + ITEM_BOX && it.body.y < by + h + 1;
    });
    expect(ok).toBe(true);
  });

  const standNear = (x: number, y: number, reach: number) =>
    footholds.some((f) => Math.abs(f.ty * TILE - y) <= TILE * 2 && x >= f.x0 + TUNING.bodyW / 2 - reach && x <= f.x1 + TUNING.bodyW / 2 + reach);

  it.each(game.npcs.map((n) => [n.key, n] as const))('NPC %s stands where the climber can reach', (_key, n) => {
    expect(standNear(n.x, n.y, 16)).toBe(true);
  });

  it.each(game.lifts.map((l) => [l.key, l] as const))('lift station %s can be used', (_key, l) => {
    expect(standNear(l.x, l.y, 16)).toBe(true);
  });

  it.each(game.scares.map((s) => [s.id, s] as const))('scare %s can be sprung', (_id, s) => {
    const ok = reachable((bx, by) => bx < s.x + s.w && s.x < bx + TUNING.bodyW && by < s.y + s.h && s.y < by + TUNING.bodyH);
    expect(ok).toBe(true);
  });
});

/** No ledge sits so high on a screen that a climber standing on it would be cut off by the screen edge. */
it('no ledge crosses a screen edge', () => {
  const world = buildWorld(LEVELS);
  const game = new Game(world);
  for (const g of game.gates) g.open = true;
  for (const c of game.cracked) c.broken = true;
  const hits = crossingFootholds(world, game).map((f) => `band ${Math.floor(f.ty / 34)} row ${f.ty % 34} cols ${f.x0 / TILE | 0}-${f.x1 / TILE | 0}`);
  expect(hits).toEqual([]);
});
