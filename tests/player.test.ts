import { describe, expect, it } from 'vitest';
import { Player, type PlayerEvent, type PlayerInput } from '../src/game/player';
import type { TileGrid } from '../src/game/tiles';
import { TUNING } from '../src/game/tuning';
import { gridFrom } from './helpers';

const NONE: PlayerInput = { left: false, right: false, jump: false };

/** Runs `frames` updates with the same input and collects all events. */
function step(p: Player, world: TileGrid, input: Partial<PlayerInput>, frames = 1): PlayerEvent[] {
  const events: PlayerEvent[] = [];
  for (let i = 0; i < frames; i++) {
    p.update({ ...NONE, ...input }, world);
    events.push(...p.events);
  }
  return events;
}

/** Runs with no input until the player is no longer airborne. Returns the highest body y reached and the events. */
function untilLanded(p: Player, world: TileGrid): { top: number; events: PlayerEvent[] } {
  let top = p.body.y;
  const events: PlayerEvent[] = [];
  for (let i = 0; i < 1000 && p.state === 'air'; i++) {
    events.push(...step(p, world, {}));
    top = Math.min(top, p.body.y);
  }
  return { top, events };
}

/** 12×30 tile room. Floor top at y = 232, so a standing body has y = STAND. Inner walls at x = 8 and x = 88. */
const STAND = 232 - TUNING.bodyH;
function room(): TileGrid {
  return gridFrom([...Array.from({ length: 29 }, () => '#..........#'), '############']);
}

describe('player: walking, charging, jumping', () => {
  it('walks at walk speed, slower when heavy', () => {
    const w = room();
    const p = new Player(40, STAND);
    step(p, w, { right: true });
    expect(p.vx).toBeCloseTo(TUNING.walkSpeed);
    expect(p.facing).toBe(1);
    p.loadout.stones = 10;
    step(p, w, { left: true });
    expect(p.vx).toBeCloseTo(-TUNING.walkSpeed * 0.7);
    expect(p.facing).toBe(-1);
  });

  it('charges while jump is held and a full-charge jump rises maxJump pixels', () => {
    const w = room();
    const p = new Player(40, STAND);
    const startEvents = step(p, w, { jump: true });
    expect(startEvents).toContainEqual({ type: 'chargeStart' });
    step(p, w, { jump: true }, TUNING.chargeFrames);
    expect(p.state).toBe('charge');
    expect(p.charge).toBe(1);

    const jumpEvents = step(p, w, {});
    expect(jumpEvents).toContainEqual({ type: 'jump', charge: 1 });
    expect(p.state).toBe('air');

    const { top } = untilLanded(p, w);
    const rise = STAND - top;
    expect(rise).toBeGreaterThanOrEqual(TUNING.maxJump - 1);
    expect(rise).toBeLessThanOrEqual(TUNING.maxJump + 1);
    expect(p.state).toBe('ground');
    expect(p.body.y).toBe(STAND);
  });

  it('a tap jump rises minJump pixels', () => {
    const w = room();
    const p = new Player(40, STAND);
    step(p, w, { jump: true });
    step(p, w, {});
    const { top } = untilLanded(p, w);
    const rise = STAND - top;
    expect(rise).toBeGreaterThanOrEqual(TUNING.minJump - 1);
    expect(rise).toBeLessThanOrEqual(TUNING.minJump + 1);
  });

  it('weight shortens the jump (10 stones = half height)', () => {
    const w = room();
    const p = new Player(40, STAND);
    p.loadout.stones = 10;
    step(p, w, { jump: true }, 80);
    step(p, w, {});
    const { top } = untilLanded(p, w);
    const rise = STAND - top;
    expect(rise).toBeGreaterThanOrEqual(TUNING.maxJump * 0.5 - 1);
    expect(rise).toBeLessThanOrEqual(TUNING.maxJump * 0.5 + 1);
  });

  it('cannot walk while charging and jumps toward the arrow held at release', () => {
    const w = room();
    const p = new Player(40, STAND);
    step(p, w, { jump: true, right: true }, 20);
    expect(p.body.x).toBe(40);
    step(p, w, { right: true });
    expect(p.state).toBe('air');
    expect(p.vx).toBeCloseTo(TUNING.jumpSpeedX);
  });

  it('a jump with no arrow held goes straight up', () => {
    const w = room();
    const p = new Player(40, STAND);
    step(p, w, { jump: true }, 10);
    step(p, w, {});
    expect(p.vx).toBe(0);
  });
});

/** 12×10 room with a ceiling. Floor top at y = 72 (standing body y = LOW_STAND); ceiling bottom at y = 8. */
const LOW_STAND = 72 - TUNING.bodyH;
function lowRoom(): TileGrid {
  return gridFrom(['############', ...Array.from({ length: 8 }, () => '#..........#'), '############']);
}

/** 12×42 room with a ledge (cols 1–4, row 5, top at y = 40) and the floor top at y = 328: a 288 px drop. */
const LEDGE_STAND = 40 - TUNING.bodyH;
function ledgeRoom(): TileGrid {
  return gridFrom([
    ...Array.from({ length: 5 }, () => '#..........#'),
    '#####......#',
    ...Array.from({ length: 35 }, () => '#..........#'),
    '############',
  ]);
}

/** Walks right off the ledge in ledgeRoom and returns once airborne. */
function walkOffLedge(p: Player, w: TileGrid): void {
  for (let i = 0; i < 100 && p.state !== 'air'; i++) step(p, w, { right: true });
}

describe('player: walls, ceilings, falls', () => {
  it('bounces off walls at wallBounce times the speed', () => {
    const w = room();
    const p = new Player(40, STAND);
    step(p, w, { jump: true, right: true }, TUNING.chargeFrames + 1);
    step(p, w, { right: true });
    let bonked = false;
    for (let i = 0; i < 200 && !bonked; i++) {
      bonked = step(p, w, {}).some((e) => e.type === 'bonkWall');
    }
    expect(bonked).toBe(true);
    expect(p.vx).toBeCloseTo(-TUNING.jumpSpeedX * TUNING.wallBounce);
    expect(p.facing).toBe(-1);
  });

  it('a ceiling stops the rise and the player falls back down', () => {
    const w = lowRoom();
    const p = new Player(40, LOW_STAND);
    step(p, w, { jump: true }, TUNING.chargeFrames + 1);
    step(p, w, {});
    const { top, events } = untilLanded(p, w);
    expect(events.some((e) => e.type === 'bonkCeiling')).toBe(true);
    expect(top).toBe(8);
    expect(p.state).toBe('ground');
  });

  it('walking off a ledge keeps walking speed', () => {
    const w = ledgeRoom();
    const p = new Player(16, LEDGE_STAND);
    walkOffLedge(p, w);
    expect(p.state).toBe('air');
    expect(p.vx).toBeCloseTo(TUNING.walkSpeed);
  });

  it('a long fall stumbles for stumbleFrames and ignores input meanwhile', () => {
    const w = ledgeRoom();
    const p = new Player(16, LEDGE_STAND);
    walkOffLedge(p, w);
    const { events } = untilLanded(p, w);
    expect(events.find((e) => e.type === 'land')).toEqual({ type: 'land', fall: 288, drop: 288, hard: true });
    expect(p.state).toBe('stumble');

    const x = p.body.x;
    step(p, w, { right: true, jump: true }, TUNING.stumbleFrames - 1);
    expect(p.state).toBe('stumble');
    expect(p.body.x).toBe(x);
    step(p, w, {});
    expect(p.state).toBe('ground');
  });

  it('the Feather Charm prevents the stumble', () => {
    const w = ledgeRoom();
    const p = new Player(16, LEDGE_STAND);
    p.loadout.noStumble = true;
    walkOffLedge(p, w);
    const { events } = untilLanded(p, w);
    expect(events.find((e) => e.type === 'land')).toMatchObject({ hard: false });
    expect(p.state).toBe('ground');
  });

  it('a normal jump landing does not stumble', () => {
    const w = room();
    const p = new Player(40, STAND);
    step(p, w, { jump: true }, TUNING.chargeFrames + 1);
    step(p, w, {});
    const { events } = untilLanded(p, w);
    expect(events.find((e) => e.type === 'land')).toMatchObject({ hard: false, drop: 0 });
  });
});
