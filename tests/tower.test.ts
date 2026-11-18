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

  it("puts Act II's things where the story needs them", () => {
    expect(itemLevels('stone').sort()).toEqual([4, 5]);
    expect(itemLevels('spring_boots')).toEqual([5]);
    expect(itemLevels('orb')).toEqual([6]);
    expect(game.lifts.map((l) => [levelAt(Math.floor(l.y / 8) - 1), l.net, l.order])).toEqual(expect.arrayContaining([[5, 'a', 1], [6, 'a', 2]]));
    expect(game.scares.map((s) => s.id)).toContain('hand');
    expect(game.sceneTriggers.map((t) => t.id)).toContain('fire2');
  });

  it("puts Act III's things where the story needs them", () => {
    expect(itemLevels('hook')).toEqual([7]);
    expect(itemLevels('bell_key')).toEqual([8]);
    expect(itemLevels('scepter')).toEqual([9]);
    expect(itemLevels('idol')).toEqual([9]);
    expect(game.bells.filter((b) => b.tune === 'loft').map((b) => b.note).sort()).toEqual([1, 2, 3, 4]);
    expect(game.gates.some((g) => g.flag === 'tune:loft')).toBe(true);
    expect(game.lifts.map((l) => [levelAt(Math.floor(l.y / 8) - 1), l.order])).toEqual(expect.arrayContaining([[9, 3]]));
    expect(game.scares.map((s) => s.id)).toContain('bellfigure');
    expect(game.sceneTriggers.map((t) => t.id)).toContain('fire3');
  });

  it("puts Act IV's things where the story needs them", () => {
    expect(itemLevels('lantern')).toEqual([10]);
    expect(itemLevels('pickaxe')).toEqual([11]);
    expect(itemLevels('bone_key')).toEqual([12]);
    expect(itemLevels('seal')).toEqual([12]);
    expect(game.cracked.length).toBeGreaterThan(0);
    expect(game.lifts.map((l) => [levelAt(Math.floor(l.y / 8) - 1), l.order])).toEqual(expect.arrayContaining([[12, 4]]));
    expect(game.scares.map((s) => s.id)).toEqual(expect.arrayContaining(['lanternface', 'behindyou']));
    expect(game.npcs.filter((n) => n.id === 'hollow').length).toBeGreaterThanOrEqual(3);
    expect(game.sceneTriggers.map((t) => t.id)).toContain('fire4');
  });

  it('never gives a legend letter that the map already uses for a tile or object', () => {
    for (const l of LEVELS) for (const k of Object.keys(l.legend)) expect('# .~iH@=C%&*'.includes(k), `level ${l.id} legend '${k}'`).toBe(false);
  });

  it("puts Act V's things where the story needs them, and the altar at the summit", () => {
    expect(itemLevels('crampons')).toEqual([13]);
    expect(itemLevels('fur_cloak')).toEqual([13]);
    expect(game.altar).not.toBeNull();
    expect(levelAt(game.altar!.ty)).toBe(15);
    expect(game.npcs.some((n) => n.id === 'maren' && levelAt(Math.floor(n.y / 8) - 1) === 15)).toBe(true);
    expect(game.npcs.some((n) => n.id === 'king' && levelAt(Math.floor(n.y / 8) - 1) === 14)).toBe(true);
    expect(game.lifts.map((l) => [levelAt(Math.floor(l.y / 8) - 1), l.order])).toEqual(expect.arrayContaining([[15, 5]]));
    expect(game.sceneTriggers.map((t) => t.id)).toEqual(expect.arrayContaining(['memory1', 'memory2']));
    expect(game.scares.map((s) => s.id)).toContain('kingeyes');
  });

  it('has fifteen levels in five acts, every relic placed once, and fifteen notes', () => {
    expect(LEVELS).toHaveLength(15);
    for (const r of ['orb', 'scepter', 'seal'] as ItemId[]) expect(itemLevels(r)).toHaveLength(1);
    expect(Object.keys(NOTES)).toHaveLength(15);
  });
});
