import { describe, expect, it } from 'vitest';
import { LEVELS, LEVELS_PER_ACT } from '../src/content/levels';
import { NPCS } from '../src/content/npcs';
import { SCENES } from '../src/content/cutscenes';
import type { ItemId } from '../src/content/items';
import { SCREEN_ROWS } from '../src/game/tuning';
import { LEVEL_NAMES, NOTES } from '../src/content/story';
import { Game } from '../src/game/game';
import { buildWorld } from '../src/game/level';

/** The remake tower's structure (remake spec section 4). */
describe('the tower', () => {
  const world = buildWorld(LEVELS);
  const game = new Game(world);

  it('numbers its levels from 1 and gives each act its setting', () => {
    expect(LEVELS.map((l) => l.id)).toEqual(LEVELS.map((_, i) => i + 1));
    const acts = ['overgrown', 'cistern', 'bells', 'dark', 'frozen'];
    for (const l of LEVELS) expect(l.theme, `level ${l.id}`).toBe(acts[Math.ceil(l.id / LEVELS_PER_ACT) - 1]);
  });

  it('names all fifteen levels', () => {
    expect(Object.keys(LEVEL_NAMES).map(Number)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it('every level says where its climb comes in and goes out, and what it carries', () => {
    for (const l of LEVELS) {
      expect(l.entry, `level ${l.id}`).toBeDefined();
      expect(l.exit, `level ${l.id}`).toBeDefined();
      expect(l.load, `level ${l.id}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("places each of Maren's notes exactly once", () => {
    expect(game.notes.map((n) => n.id).sort()).toEqual(Object.keys(NOTES).sort());
  });

  it('places every NPC a conversation is written for', () => {
    for (const def of Object.values(NPCS)) {
      for (const c of def.conversations) {
        if (!c.at) continue;
        expect(game.npcs.some((n) => n.id === def.id && n.scene === c.at), `${def.id} at ${c.at}`).toBe(true);
      }
    }
  });

  /** Level id at a tile row. */
  const levelAt = (ty: number) => world.levels[world.bandLevel[Math.floor(ty / SCREEN_ROWS)]].id;
  const itemLevels = (id: ItemId) => world.spawns.filter((s) => s.entry.kind === 'item' && s.entry.item === id).map((s) => levelAt(s.ty));

  it('has a written scene for every scene trigger', () => {
    for (const t of game.sceneTriggers) expect(SCENES[t.id], t.id).toBeDefined();
  });

  it("puts Act I's things where the story needs them", () => {
    expect(itemLevels('map')).toEqual([1]);
    expect(itemLevels('rope')).toEqual([2]);
    expect(itemLevels('iron_key')).toEqual([2]);
    expect(itemLevels('claws')).toEqual([3]);
    expect(game.sceneTriggers.map((t) => t.id)).toEqual(expect.arrayContaining(['intro', 'fire1']));
  });
});
