import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/content/items';
import { Game } from '../src/game/game';
import { buildWorld } from '../src/game/level';
import { Tile } from '../src/game/tiles';
import { blankScreen, put } from './helpers';

describe('new map pieces and items', () => {
  it('reads ivy walls, rough stone and rings', () => {
    let s = put(blankScreen(), 2, 32, '@');
    s = put(s, 10, 10, '%');
    s = put(s, 11, 10, '&');
    s = put(s, 20, 5, '*');
    const world = buildWorld([{ id: 1, theme: 'overgrown', screens: [s], legend: {} }]);
    expect(world.grid.get(10, 10)).toBe(Tile.Ivy);
    expect(world.grid.get(11, 10)).toBe(Tile.Rough);
    expect(world.grid.isSolid(10, 10)).toBe(true);
    expect(world.grid.isClimbable(10, 10)).toBe(true);
    expect(world.grid.isClimbable(12, 10)).toBe(false);
    const g = new Game(world);
    expect(g.rings).toEqual([{ x: 20 * 8 + 4, y: 5 * 8 + 4 }]);
  });

  it('weighs the Claws 2 and the Hook 3', () => {
    expect(ITEMS.claws.weight).toBe(2);
    expect(ITEMS.hook.weight).toBe(3);
  });
});
