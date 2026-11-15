import { describe, expect, it } from 'vitest';
import { RELICS, type ItemId } from '../src/content/items';
import { LEVELS } from '../src/content/levels';
import { NPCS } from '../src/content/npcs';
import { LEVEL_NAMES, NOTES } from '../src/content/story';
import { Game } from '../src/game/game';
import { buildWorld } from '../src/game/level';
import { SCREEN_ROWS } from '../src/game/tuning';

/** The whole tower's content is where the full-game spec puts it (sections 2, 5 and 6). */
describe('the tower', () => {
  const world = buildWorld(LEVELS);
  const game = new Game(world);
  /** Level id at a tile row. */
  const levelAt = (ty: number) => world.levels[world.bandLevel[Math.floor(ty / SCREEN_ROWS)]].id;
  const itemLevels = (id: ItemId) => world.spawns.filter((s) => s.entry.kind === 'item' && s.entry.item === id).map((s) => levelAt(s.ty));

  it('has thirty levels in five acts', () => {
    expect(LEVELS.map((l) => l.id)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    const acts = ['overgrown', 'cistern', 'bells', 'dark', 'frozen'];
    for (const l of LEVELS) expect(l.theme).toBe(acts[Math.ceil(l.id / 6) - 1]);
    for (const l of LEVELS) expect(LEVEL_NAMES[l.id]).toBeTruthy();
  });

  it('every level says where its climb comes in and goes out, and what it must carry', () => {
    for (const l of LEVELS) {
      expect(l.entry, `level ${l.id}`).toBeDefined();
      expect(l.exit, `level ${l.id}`).toBeDefined();
      expect(l.load, `level ${l.id}`).toBeGreaterThanOrEqual(5);
    }
  });

  it('puts the relics at the act ends and the altar at the summit', () => {
    expect(itemLevels('orb')).toEqual([12]);
    expect(itemLevels('scepter')).toEqual([18]);
    expect(itemLevels('seal')).toEqual([24]);
    expect(RELICS).toHaveLength(3);
    expect(game.altar).not.toBeNull();
    expect(levelAt(game.altar!.ty)).toBe(30);
  });

  it('puts the new moves and the key tools where the story needs them', () => {
    expect(itemLevels('claws')).toEqual([4]);
    expect(itemLevels('hook')).toEqual([10]);
    expect(itemLevels('lantern')).toEqual([18]);
    expect(itemLevels('crampons')).toEqual([25]);
    expect(itemLevels('fur_cloak')).toEqual([25]);
  });

  it("places each of Maren's notes exactly once", () => {
    const placed = game.notes.map((n) => n.id).sort();
    expect(placed).toEqual(Object.keys(NOTES).sort());
  });

  it('places every NPC a conversation is written for', () => {
    for (const def of Object.values(NPCS)) {
      for (const c of def.conversations) {
        if (!c.at) continue;
        expect(game.npcs.some((n) => n.id === def.id && n.scene === c.at), `${def.id} at ${c.at}`).toBe(true);
      }
    }
  });

  it("runs one bucket lift network up the tower, ending below the summit's last climb", () => {
    const orders = game.lifts.map((l) => l.order).sort((a, b) => a - b);
    expect(orders).toEqual([...new Set(orders)]);
    const byOrder = [...game.lifts].sort((a, b) => a.order - b.order);
    for (let i = 1; i < byOrder.length; i++) expect(byOrder[i].y).toBeLessThan(byOrder[i - 1].y);
    expect(Math.max(...byOrder.map((l) => levelAt(Math.floor(l.y / 8) - 1)))).toBeLessThan(30);
  });

  it('has about seven scares, each one different', () => {
    const kinds = new Set(game.scares.map((s) => s.kind));
    expect(game.scares.length).toBeGreaterThanOrEqual(6);
    expect(game.scares.length).toBeLessThanOrEqual(8);
    expect(new Set(game.scares.map((s) => s.id)).size).toBe(game.scares.length);
    expect(kinds.size).toBeGreaterThanOrEqual(6);
  });

  it("leads Maren's Echo up Act V in order, ending at the altar", () => {
    const echoes = game.npcs.filter((n) => n.id === 'echo').sort((a, b) => a.order - b.order);
    expect(echoes.length).toBeGreaterThanOrEqual(8);
    for (let i = 1; i < echoes.length; i++) expect(echoes[i].y).toBeLessThanOrEqual(echoes[i - 1].y + 8);
    expect(levelAt(Math.floor(echoes[echoes.length - 1].y / 8) - 1)).toBe(30);
  });
});
