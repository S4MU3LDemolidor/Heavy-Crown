import { describe, expect, it } from 'vitest';
import { Player, type PlayerEvent, type PlayerInput, type PlayerWorld } from '../src/game/player';
import { TUNING } from '../src/game/tuning';
import { gridFrom } from './helpers';

const NONE: PlayerInput = { left: false, right: false, jump: false };

/**
 * 20×30 room. Floor top at y = 232 (standing body y = 214). An ivy wall fills cols 10–11 from row 10 down
 * to the floor, so its left face is at x = 80 and its top at y = 80. Rings can be added.
 */
function room(rings: { x: number; y: number }[] = []): PlayerWorld {
  const rows: string[] = Array.from({ length: 29 }, (_, y) => (y >= 10 ? '#.........%%.......#' : '#..................#'));
  rows.push('####################');
  const grid = gridFrom(rows);
  return {
    solidRect: (x, y, w, h) => grid.solidRect(x, y, w, h),
    climbableAt: (x, y, w, h) => grid.climbableRect(x, y, w, h),
    ringFor: (cx, cy, ax, ay, range) => {
      let best: { x: number; y: number } | null = null;
      let bestD = Infinity;
      for (const r of rings) {
        const d = Math.hypot(r.x - cx, r.y - cy);
        const cos = ((r.x - cx) * ax + (r.y - cy) * ay) / (d * Math.hypot(ax, ay));
        if (d <= range && cos >= Math.SQRT1_2 && d < bestD) {
          best = r;
          bestD = d;
        }
      }
      return best;
    },
  };
}

function step(p: Player, w: PlayerWorld, input: Partial<PlayerInput>, n = 1): PlayerEvent[] {
  const ev: PlayerEvent[] = [];
  for (let i = 0; i < n; i++) {
    p.update({ ...NONE, ...input }, w);
    ev.push(...p.events);
  }
  return ev;
}

/** Stands flush against the wall's left face. */
function atWall(stones = 0, claws = true): Player {
  const p = new Player(70, 214);
  p.loadout.stones = stones;
  p.loadout.claws = claws;
  return p;
}

describe('Climbing Claws', () => {
  it('without Claws, an ivy wall is just a wall', () => {
    const w = room();
    const p = atWall(0, false);
    step(p, w, { right: true, up: true }, 5);
    expect(p.state).toBe('ground');
    expect(p.body.x).toBe(70);
  });

  it('from the ground, toward + up grabs the wall and climbing up mantles onto its top', () => {
    const w = room();
    const p = atWall();
    step(p, w, { right: true, up: true });
    expect(p.state).toBe('cling');
    const y0 = p.body.y;
    step(p, w, { up: true }, 30);
    expect(p.body.y).toBeLessThan(y0 - 15);
    for (let i = 0; i < 400 && p.state === 'cling'; i++) step(p, w, { up: true });
    expect(p.state).toBe('ground');
    expect(p.feetY).toBe(80);
    expect(p.body.x).toBeGreaterThan(70);
  });

  it('grabs the wall in the air instead of bouncing when holding toward it', () => {
    const w = room();
    const p = new Player(30, 214);
    p.loadout.claws = true;
    step(p, w, { jump: true, right: true }, 20);
    step(p, w, { right: true });
    let clung = false;
    for (let i = 0; i < 120 && !clung; i++) clung = step(p, w, { right: true }).some((e) => e.type === 'cling');
    expect(clung).toBe(true);
    expect(p.state).toBe('cling');
  });

  it('wall jump kicks away from the wall', () => {
    const w = room();
    const p = atWall();
    step(p, w, { right: true, up: true });
    step(p, w, { up: true }, 20);
    const ev = step(p, w, { jump: true });
    expect(ev.some((e) => e.type === 'wallJump')).toBe(true);
    expect(p.state).toBe('air');
    expect(p.vx).toBeLessThan(0);
    expect(p.vy).toBeLessThan(0);
  });

  it('pressing away lets go', () => {
    const w = room();
    const p = atWall();
    step(p, w, { right: true, up: true });
    step(p, w, { up: true }, 20);
    step(p, w, { left: true });
    expect(p.state).toBe('air');
  });

  it('a heavy climber (9–12 st) slides down and cannot climb up', () => {
    const w = room();
    // falling alongside the wall halfway up, holding toward it
    const p = new Player(70, 120);
    p.loadout.stones = 10;
    p.loadout.claws = true;
    p.state = 'air';
    step(p, w, { right: true });
    expect(p.state).toBe('cling');
    const y = p.body.y;
    step(p, w, { up: true }, 10);
    expect(p.state).toBe('cling');
    expect(p.body.y).toBe(y + 10);
  });

  it('an overloaded climber (13+ st) cannot cling', () => {
    const w = room();
    const p = atWall(13);
    step(p, w, { right: true, up: true }, 3);
    expect(p.state).toBe('ground');
  });
});

describe('Grappling Hook', () => {
  const ring = { x: 60, y: 140 };

  it('does nothing without the Hook', () => {
    const w = room([ring]);
    const p = new Player(30, 214);
    step(p, w, { hook: true, up: true, right: true });
    expect(p.state).toBe('ground');
  });

  it('pulls up to a ring in range and hangs below it', () => {
    const w = room([ring]);
    const p = new Player(30, 214);
    p.loadout.hook = true;
    const ev = step(p, w, { hook: true, up: true, right: true });
    expect(ev.some((e) => e.type === 'hookFire')).toBe(true);
    expect(p.state).toBe('pull');
    for (let i = 0; i < 200 && p.state === 'pull'; i++) step(p, w, {});
    expect(p.state).toBe('hang');
    expect(p.body.x + p.body.w / 2).toBeCloseTo(ring.x, 0);
    expect(p.body.y).toBe(ring.y + 3);
  });

  it('misses a ring out of range or outside the aim', () => {
    const w = room([{ x: 300, y: 20 }]);
    const p = new Player(30, 214);
    p.loadout.hook = true;
    const ev = step(p, w, { hook: true, up: true });
    expect(ev.some((e) => e.type === 'hookMiss')).toBe(true);
    expect(p.state).toBe('ground');
  });

  it('pulls slower when heavy, and only dangles when overloaded', () => {
    const framesToHang = (stones: number) => {
      const w = room([ring]);
      const p = new Player(30, 214);
      p.loadout.hook = true;
      p.loadout.stones = stones;
      step(p, w, { hook: true, up: true, right: true });
      let n = 0;
      while (p.state === 'pull' && n < 300) {
        step(p, w, {});
        n++;
      }
      return { n, state: p.state, y: p.body.y };
    };
    expect(framesToHang(10).n).toBeGreaterThan(framesToHang(0).n);
    const over = framesToHang(13);
    expect(over.state).toBe('pull');
    expect(over.y).toBe(214);
  });

  it('a charged jump from the ring launches upward, and down drops', () => {
    const w = room([ring]);
    const p = new Player(30, 214);
    p.loadout.hook = true;
    step(p, w, { hook: true, up: true, right: true });
    for (let i = 0; i < 200 && p.state === 'pull'; i++) step(p, w, {});
    step(p, w, { jump: true }, TUNING.chargeFrames + 1);
    expect(p.charge).toBe(1);
    step(p, w, {});
    expect(p.state).toBe('air');
    expect(p.vy).toBeLessThan(-5);

    const q = new Player(30, 214);
    q.loadout.hook = true;
    step(q, w, { hook: true, up: true, right: true });
    for (let i = 0; i < 200 && q.state === 'pull'; i++) step(q, w, {});
    step(q, w, { down: true });
    expect(q.state).toBe('air');
  });
});
