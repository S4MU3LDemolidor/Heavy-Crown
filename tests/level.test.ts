import { describe, expect, it } from 'vitest';
import { buildWorld, type LevelDef } from '../src/game/level';
import { Tile } from '../src/game/tiles';
import { blankScreen, put } from './helpers';

function level(id: number, screens: string[][], legend: LevelDef['legend'] = {}): LevelDef {
  return { id, theme: 'overgrown', screens, legend };
}

describe('buildWorld', () => {
  it('stacks levels bottom-up and screens top-first within a level', () => {
    const l1 = level(1, [put(blankScreen(), 1, 1, '#'), put(blankScreen(), 2, 2, '@')]);
    const l2 = level(2, [put(blankScreen(), 3, 3, '#')]);
    const w = buildWorld([l1, l2]);
    expect(w.screenCount).toBe(3);
    expect(w.bandLevel).toEqual([1, 0, 0]);
    expect(w.grid.isSolid(3, 3)).toBe(true); // level 2 is on top
    expect(w.grid.isSolid(1, 34 + 1)).toBe(true); // level 1 top screen
    expect(w.start.y).toBeGreaterThan(2 * 272);
  });

  it('reads tile characters, open air and legend spawns', () => {
    let s = put(blankScreen(), 2, 2, '@');
    s = put(s, 4, 4, '.');
    s = put(s, 5, 5, '~');
    s = put(s, 6, 6, 'i');
    s = put(s, 7, 7, 'H');
    s = put(s, 8, 8, 'k');
    const w = buildWorld([level(1, [s], { k: { kind: 'item', item: 'iron_key' } })]);
    expect(w.open[4 * 60 + 4]).toBe(1);
    expect(w.open[5 * 60 + 5]).toBe(0);
    expect(w.grid.get(5, 5)).toBe(Tile.Water);
    expect(w.grid.isSolid(6, 6)).toBe(true);
    expect(w.grid.get(7, 7)).toBe(Tile.Ladder);
    expect(w.grid.isSolid(7, 7)).toBe(false);
    expect(w.spawns).toEqual([{ char: 'k', entry: { kind: 'item', item: 'iron_key' }, tx: 8, ty: 8 }]);
  });

  it('rejects unknown characters with the level and screen', () => {
    const s = put(put(blankScreen(), 2, 2, '@'), 0, 0, 'Z');
    expect(() => buildWorld([level(3, [s])])).toThrow(/level 3 screen 0 row 0 col 0: unknown character 'Z'/);
  });
});

describe('world edges', () => {
  it('treats outside the sides and bottom as solid and above the top as sky', () => {
    const w = buildWorld([level(1, [put(blankScreen(), 2, 2, '@')])]);
    expect(w.grid.isSolid(-1, 5)).toBe(true);
    expect(w.grid.isSolid(60, 5)).toBe(true);
    expect(w.grid.isSolid(5, 34)).toBe(true);
    expect(w.grid.isSolid(5, -1)).toBe(false);
  });
});
