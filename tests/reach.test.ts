import { describe, expect, it } from 'vitest';
import { explore, findFootholds } from '../src/game/reach';
import { TUNING } from '../src/game/tuning';
import { gridFrom } from './helpers';

// 12×29 room: floor (row 28), a ledge 9 tiles up (row 19, cols 7–10) and one 18 tiles up (row 10, cols 1–3).
function room() {
  const rows = Array.from({ length: 29 }, () => '#..........#');
  rows[28] = '############';
  rows[19] = '#......####.'.slice(0, 11) + '#';
  rows[10] = '####.......#';
  return gridFrom(rows);
}

describe('reach', () => {
  it('finds footholds on top of solid runs', () => {
    const f = findFootholds(room());
    const rowsWithFootholds = [...new Set(f.map((x) => x.ty))].sort((a, b) => a - b);
    expect(rowsWithFootholds).toEqual([10, 19, 28]);
  });

  it('reaches a 9-tile ledge light but not an 18-tile one; heavy loses the 9-tile ledge', () => {
    const grid = room();
    const start = { x: 20, y: 28 * 8 - TUNING.bodyH };
    const light = explore(grid, start, { stones: 0 });
    const tys = (r: typeof light) => [...r.reached].map((id) => r.footholds[id].ty).sort((a, b) => a - b);
    expect(tys(light)).toEqual([10, 19, 28]); // 9 up, then 9 more from the ledge
    const heavy = explore(grid, start, { stones: 12 });
    expect(tys(heavy)).toEqual([28]);
  });
});
