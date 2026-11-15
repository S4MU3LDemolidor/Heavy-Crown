import { describe, expect, it } from 'vitest';
import { explore, findFootholds } from '../src/game/reach';
import { gridFrom } from './helpers';

// 12×20 room: floor (row 19), a ledge 6 tiles up (row 13, cols 7–10) and one 12 tiles up (row 7, cols 1–3).
function room() {
  const rows = Array.from({ length: 20 }, () => '#..........#');
  rows[19] = '############';
  rows[13] = '#......####.'.slice(0, 11) + '#';
  rows[7] = '####.......#';
  return gridFrom(rows);
}

describe('reach', () => {
  it('finds footholds on top of solid runs', () => {
    const f = findFootholds(room());
    const rowsWithFootholds = [...new Set(f.map((x) => x.ty))].sort((a, b) => a - b);
    expect(rowsWithFootholds).toEqual([7, 13, 19]);
  });

  it('reaches a 6-tile ledge light but not a 12-tile one; heavy loses the 6-tile ledge', () => {
    const grid = room();
    const start = { x: 20, y: 19 * 8 - 18 };
    const light = explore(grid, start, { stones: 0 });
    const tys = (r: typeof light) => [...r.reached].map((id) => r.footholds[id].ty).sort((a, b) => a - b);
    expect(tys(light)).toEqual([7, 13, 19]); // 6 up, then 6 more from the ledge
    const heavy = explore(grid, start, { stones: 12 });
    expect(tys(heavy)).toEqual([19]);
  });
});
