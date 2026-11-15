import { describe, expect, it } from 'vitest';
import { makeBody, moveX, moveY, onGround } from '../src/game/body';
import { gridFrom } from './helpers';

// Interior spans x 8..39 and y 0..23; the floor's top is at y = 24.
const box = () => gridFrom(['#....#', '#....#', '#....#', '######']);

describe('body movement', () => {
  it('moveX stops flush against a wall and reports the hit', () => {
    const b = makeBody(8, 6, 10, 18);
    expect(moveX(b, 100, box())).toBe(true);
    expect(b.x).toBe(30);
    expect(b.remX).toBe(0);
    expect(moveX(b, -100, box())).toBe(true);
    expect(b.x).toBe(8);
  });

  it('moveX accumulates sub-pixel movement', () => {
    const b = makeBody(8, 6, 10, 18);
    expect(moveX(b, 0.4, box())).toBe(false);
    expect(b.x).toBe(8);
    moveX(b, 0.4, box());
    expect(b.x).toBe(9);
    expect(b.remX).toBeCloseTo(-0.2);
  });

  it('moveY lands on the floor and onGround sees it', () => {
    const b = makeBody(8, 0, 10, 18);
    expect(onGround(b, box())).toBe(false);
    expect(moveY(b, 50, box())).toBe(true);
    expect(b.y).toBe(6);
    expect(onGround(b, box())).toBe(true);
  });

  it('moveY returns false when nothing is in the way', () => {
    const b = makeBody(8, 6, 10, 18);
    expect(moveY(b, -3, box())).toBe(false);
    expect(b.y).toBe(3);
  });
});
