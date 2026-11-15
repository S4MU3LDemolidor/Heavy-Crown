import { describe, expect, it } from 'vitest';
import { TEST_TOWER } from '../src/content/levels/test-tower';
import { parseTower } from '../src/game/mapParse';

describe('test tower', () => {
  it('parses into two screens with a start position on the bottom screen', () => {
    const tower = parseTower(TEST_TOWER);
    expect(tower.screenCount).toBe(2);
    expect(tower.start.y).toBeGreaterThan(272);
  });
});
