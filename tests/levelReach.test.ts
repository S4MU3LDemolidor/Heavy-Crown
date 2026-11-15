import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/content/levels';
import { Game, ITEM_BOX } from '../src/game/game';
import { buildWorld } from '../src/game/level';
import { findFootholds } from '../src/game/reach';
import { TILE, TUNING } from '../src/game/tuning';

/** Every note can be read, and every item picked up, from some place the climber can stand. */
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
});
