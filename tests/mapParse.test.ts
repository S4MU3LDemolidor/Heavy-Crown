import { describe, expect, it } from 'vitest';
import { parseTower } from '../src/game/mapParse';
import { Tile } from '../src/game/tiles';
import { TILE, TUNING } from '../src/game/tuning';
import { blankScreen, put } from './helpers';

describe('parseTower', () => {
  it('stacks screens top first and reads solids and the start marker', () => {
    const top = put(blankScreen(), 0, 0, '#');
    let bottom = put(blankScreen(), 5, 33, '#');
    bottom = put(bottom, 5, 32, '@');
    const tower = parseTower([top, bottom]);

    expect(tower.screenCount).toBe(2);
    expect(tower.grid.cols).toBe(60);
    expect(tower.grid.rows).toBe(68);
    expect(tower.grid.isSolid(0, 0)).toBe(true);
    expect(tower.grid.isSolid(5, 67)).toBe(true);
    expect(tower.grid.isSolid(5, 66)).toBe(false);
    // body centered on the '@' tile, feet on the bottom of that tile
    expect(tower.start).toEqual({
      x: 5 * TILE + Math.floor((TILE - TUNING.bodyW) / 2),
      y: 67 * TILE - TUNING.bodyH,
    });
  });

  it("treats ' ' and '.' as empty", () => {
    let s = put(blankScreen(), 1, 1, '.');
    s = put(s, 2, 2, '@');
    const tower = parseTower([s]);
    expect(tower.grid.get(1, 1)).toBe(Tile.Empty);
  });

  it('treats outside the sides and bottom as solid and above the top as sky', () => {
    const tower = parseTower([put(blankScreen(), 2, 2, '@')]);
    expect(tower.grid.isSolid(-1, 5)).toBe(true);
    expect(tower.grid.isSolid(60, 5)).toBe(true);
    expect(tower.grid.isSolid(5, 34)).toBe(true);
    expect(tower.grid.isSolid(5, -1)).toBe(false);
  });

  it('rejects wrong sizes, unknown characters and bad start markers', () => {
    const ok = put(blankScreen(), 2, 2, '@');
    expect(() => parseTower([ok.slice(1)])).toThrow(/expected 34 rows/);
    expect(() => parseTower([put(ok, 0, 0, 'Z')])).toThrow(/unknown character 'Z'/);
    expect(() => parseTower([ok.map((r, i) => (i === 3 ? r + ' ' : r))])).toThrow(/expected 60 columns/);
    expect(() => parseTower([blankScreen()])).toThrow(/no @ start marker/);
    expect(() => parseTower([put(ok, 4, 4, '@')])).toThrow(/more than one @/);
  });
});
