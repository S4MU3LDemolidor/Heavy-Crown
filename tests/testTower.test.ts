import { describe, expect, it } from 'vitest';
import { TEST_TOWER } from '../src/content/levels/test-tower';
import { buildWorld } from '../src/game/level';

describe('test tower', () => {
  it('builds into two screens with a start position on the bottom screen', () => {
    const world = buildWorld([TEST_TOWER]);
    expect(world.screenCount).toBe(2);
    expect(world.start.y).toBeGreaterThan(272);
  });
});
