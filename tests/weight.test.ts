import { describe, expect, it } from 'vitest';
import { TUNING } from '../src/game/tuning';
import {
  chargeFramesFor,
  isOverloaded,
  jumpHeight,
  jumpHeightFactor,
  jumpSpeedXFactor,
  launchSpeed,
  loadTier,
  walkFactor,
} from '../src/game/weight';

describe('weight formulas (spec section 5)', () => {
  it('jump height factor drops 5% per stone, to 0.40 at 12 stones', () => {
    expect(jumpHeightFactor(0)).toBe(1);
    expect(jumpHeightFactor(5)).toBeCloseTo(0.75);
    expect(jumpHeightFactor(12)).toBeCloseTo(0.4);
  });

  it('horizontal jump and walk factors have floors', () => {
    expect(jumpSpeedXFactor(4)).toBeCloseTo(0.9);
    expect(jumpSpeedXFactor(20)).toBe(0.7);
    expect(walkFactor(5)).toBeCloseTo(0.85);
    expect(walkFactor(20)).toBe(0.6);
  });

  it('charging takes 4% longer per stone', () => {
    expect(chargeFramesFor(0)).toBe(TUNING.chargeFrames);
    expect(chargeFramesFor(12)).toBe(Math.round(TUNING.chargeFrames * 1.48));
  });

  it('load tiers match the spec table', () => {
    expect([0, 1, 4, 5, 8, 9, 12, 13, 20].map(loadTier)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it('is overloaded from 13 stones', () => {
    expect(isOverloaded(12)).toBe(false);
    expect(isOverloaded(13)).toBe(true);
  });

  it('jump height spans min..max with charge and scales with weight', () => {
    const { minJump, maxJump } = TUNING;
    expect(jumpHeight(0, 0)).toBe(minJump);
    expect(jumpHeight(1, 0)).toBe(maxJump);
    expect(jumpHeight(0.5, 0)).toBeCloseTo((minJump + maxJump) / 2);
    expect(jumpHeight(1, 10)).toBeCloseTo(maxJump * 0.5);
    expect(jumpHeight(2, 0)).toBe(maxJump);
    expect(jumpHeight(-1, 0)).toBe(minJump);
  });

  it('overloaded jumps are a fixed hop', () => {
    expect(jumpHeight(1, 13)).toBe(TUNING.overloadedHop);
    expect(jumpHeight(0, 15)).toBe(TUNING.overloadedHop);
  });

  it('spring boots multiply the height by 1.25 after the weight factor', () => {
    expect(jumpHeight(1, 2, { springBoots: true })).toBeCloseTo(TUNING.maxJump * 0.9 * 1.25);
  });

  it('launch speed reaches the requested height under gravity', () => {
    const v = launchSpeed(80);
    expect((v * v) / (2 * TUNING.gravity)).toBeCloseTo(80);
  });
});
