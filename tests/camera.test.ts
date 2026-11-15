import { describe, expect, it } from 'vitest';
import { Camera } from '../src/game/camera';
import { SCREEN_H, TUNING, VIEW_CROP } from '../src/game/tuning';

describe('camera', () => {
  it('starts on the bottom screen', () => {
    const c = new Camera(3);
    expect(c.band).toBe(2);
    expect(c.y).toBe(2 * SCREEN_H + VIEW_CROP);
    expect(c.screenFromBottom).toBe(0);
  });

  it('slides to a new screen over cameraSlideFrames frames', () => {
    const c = new Camera(3);
    const focus = SCREEN_H + 20; // inside band 1
    c.update(focus);
    expect(c.band).toBe(1);
    expect(c.y).toBeLessThan(2 * SCREEN_H + VIEW_CROP);
    expect(c.y).toBeGreaterThan(SCREEN_H + VIEW_CROP);
    for (let i = 1; i < TUNING.cameraSlideFrames; i++) c.update(focus);
    expect(c.y).toBe(SCREEN_H + VIEW_CROP);
    expect(c.screenFromBottom).toBe(1);
  });

  it('snapTo jumps without sliding', () => {
    const c = new Camera(3);
    c.snapTo(10);
    expect(c.band).toBe(0);
    expect(c.y).toBe(VIEW_CROP);
  });

  it('clamps to the tower', () => {
    const c = new Camera(3);
    expect(c.bandAt(-50)).toBe(0);
    expect(c.bandAt(99999)).toBe(2);
  });
});
