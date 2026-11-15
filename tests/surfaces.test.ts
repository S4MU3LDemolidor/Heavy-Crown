import { describe, expect, it } from 'vitest';
import { Player, type PlayerInput, type PlayerWorld } from '../src/game/player';
import { TUNING } from '../src/game/tuning';
import { gridFrom } from './helpers';

const NONE: PlayerInput = { left: false, right: false, jump: false };

/** A room with optional water, ice floor and wind. Floor top y = 232 (row 29); standing body y = 214. */
function world(opts: { water?: boolean; ice?: boolean; wind?: number; ledge?: boolean }): PlayerWorld {
  const rows = Array.from({ length: 29 }, () => '#..................#');
  if (opts.ledge) rows[5] = '#####..............#';
  rows.push('####################');
  const grid = gridFrom(rows);
  return {
    solidRect: (x, y, w, h) => grid.solidRect(x, y, w, h),
    waterAt: (_x, y, _w, h) => !!opts.water && y + h > 26 * 8,
    iceUnder: (_x, feetY) => !!opts.ice && feetY === 29 * 8,
    windAt: () => opts.wind ?? 0,
  };
}

function step(p: Player, w: PlayerWorld, input: Partial<PlayerInput>, n = 1) {
  for (let i = 0; i < n; i++) p.update({ ...NONE, ...input }, w);
}

describe('water', () => {
  it('slows walking to 60%', () => {
    const w = world({ water: true });
    const p = new Player(40, 214);
    step(p, w, { right: true });
    expect(p.vx).toBeCloseTo(TUNING.walkSpeed * 0.6);
  });

  it('a long fall into water does not stumble', () => {
    const w = world({ water: true, ledge: true });
    const p = new Player(16, 22);
    for (let i = 0; i < 100 && p.state !== 'air'; i++) step(p, w, { right: true });
    for (let i = 0; i < 400 && p.state === 'air'; i++) step(p, w, {});
    expect(p.state).toBe('ground');
  });
});

describe('ice', () => {
  it('walking accelerates slowly and slides to a stop', () => {
    const w = world({ ice: true });
    const p = new Player(40, 214);
    step(p, w, { right: true });
    expect(p.vx).toBeCloseTo(0.04);
    step(p, w, { right: true }, 60);
    expect(p.vx).toBeCloseTo(TUNING.walkSpeed);
    step(p, w, {});
    expect(p.vx).toBeCloseTo(TUNING.walkSpeed - 0.03);
    const x = p.body.x;
    step(p, w, {}, 60);
    expect(p.vx).toBe(0);
    expect(p.body.x).toBeGreaterThan(x + 10);
  });

  it('a landing on ice keeps sliding', () => {
    const w = world({ ice: true });
    const p = new Player(40, 214);
    step(p, w, { jump: true }, 10);
    step(p, w, { right: true });
    for (let i = 0; i < 200 && p.state === 'air'; i++) step(p, w, {});
    expect(p.state).toBe('ground');
    expect(p.vx).toBeGreaterThan(1);
  });

  it('crampons make ice behave like stone', () => {
    const w = world({ ice: true });
    const p = new Player(40, 214);
    p.loadout.crampons = true;
    step(p, w, { right: true });
    expect(p.vx).toBeCloseTo(TUNING.walkSpeed);
    step(p, w, {});
    expect(p.vx).toBe(0);
  });
});

describe('wind', () => {
  it('pushes airborne bodies; the Fur Cloak cuts it to 30%', () => {
    const w = world({ wind: 0.06 });
    const p = new Player(40, 214);
    step(p, w, { jump: true }, 37);
    step(p, w, {});
    step(p, w, {}, 10);
    expect(p.vx).toBeCloseTo(0.6);
    const q = new Player(40, 214);
    q.loadout.windResist = 0.3;
    step(q, w, { jump: true }, 37);
    step(q, w, {});
    step(q, w, {}, 10);
    expect(q.vx).toBeCloseTo(0.18);
  });

  it('does not push bodies standing on the ground', () => {
    const w = world({ wind: 0.06 });
    const p = new Player(40, 214);
    step(p, w, {}, 30);
    expect(p.body.x).toBe(40);
  });
});
