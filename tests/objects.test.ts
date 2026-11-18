import { describe, expect, it } from 'vitest';
import { Game } from '../src/game/game';
import { buildWorld, type LevelDef } from '../src/game/level';
import type { PlayerInput } from '../src/game/player';
import { TUNING } from '../src/game/tuning';
import { blankScreen, put } from './helpers';

/**
 * Floor on row 33. A hinged plank (row 28, cols 10–14), a pressure plate at col 30 linked to a gate at col 40,
 * cracked stone at col 50 (rows 29–32), a bell (cols 20–21, rows 22–23), an altar at col 56.
 */
function objWorld() {
  let s = blankScreen();
  s[33] = '#'.repeat(60);
  s = put(s, 2, 32, '@');
  for (let x = 10; x <= 14; x++) s = put(s, x, 28, '=');
  s = put(s, 30, 32, 'p');
  for (let y = 29; y <= 32; y++) s = put(s, 40, y, 'P');
  for (let y = 29; y <= 32; y++) s = put(s, 50, y, 'C');
  for (const [x, y] of [[20, 22], [21, 22], [20, 23], [21, 23]]) s = put(s, x, y, 'B');
  s = put(s, 56, 32, 'A');
  const level: LevelDef = {
    id: 9,
    theme: 'bells',
    screens: [s],
    legend: {
      p: { kind: 'object', object: 'plate', props: { link: 'A', need: 3 } },
      P: { kind: 'object', object: 'gate', props: { link: 'A' } },
      B: { kind: 'object', object: 'bell' },
      A: { kind: 'object', object: 'altar' },
    },
  };
  return new Game(buildWorld([level]));
}

const NONE: PlayerInput = { left: false, right: false, jump: false };
const run = (g: Game, input: Partial<PlayerInput>, n: number) => {
  for (let i = 0; i < n; i++) g.step({ ...NONE, ...input });
};
function carry(g: Game, ...ids: Parameters<Game['has']>[0][]) {
  for (const id of ids) g.carried.push({ uid: 900 + g.carried.length, id });
  g.updateLoadout();
}
function place(g: Game, x: number, feetY: number) {
  g.player.body.x = x;
  g.player.body.y = feetY - TUNING.bodyH;
  g.player.body.remY = 0;
}

describe('hinged planks', () => {
  it('hold a light climber', () => {
    const g = objWorld();
    place(g, 90, 28 * 8);
    run(g, {}, 30);
    expect(g.player.feetY).toBe(28 * 8);
    expect(g.planks[0].down).toBe(false);
  });

  it('swing down under 5 stones after 10 frames, then swing back up', () => {
    const g = objWorld();
    carry(g, 'idol');
    place(g, 90, 28 * 8);
    run(g, {}, 9);
    expect(g.planks[0].down).toBe(false);
    run(g, {}, 2);
    expect(g.planks[0].down).toBe(true);
    run(g, {}, 40);
    expect(g.player.feetY).toBe(33 * 8);
    run(g, {}, 180);
    expect(g.planks[0].down).toBe(false);
  });
});

describe('pressure plates', () => {
  it('open the linked gate while 3 stones rest on them, and close it again', () => {
    const g = objWorld();
    carry(g, 'stone');
    place(g, 30 * 8 - 1, 33 * 8);
    run(g, {}, 2);
    expect(g.plates[0].pressed).toBe(true);
    expect(g.gates[0].open).toBe(true);
    run(g, { left: true }, 30);
    expect(g.plates[0].pressed).toBe(false);
    expect(g.gates[0].open).toBe(false);
  });

  it('a dropped stone keeps the gate open', () => {
    const g = objWorld();
    carry(g, 'stone');
    place(g, 30 * 8 - 1, 33 * 8);
    run(g, {}, 2);
    expect(g.drop(0)).toBe(true);
    run(g, { left: true }, 30);
    expect(g.gates[0].open).toBe(true);
  });
});

describe('cracked walls', () => {
  it('need a Pickaxe and break as one region', () => {
    const g = objWorld();
    place(g, 50 * 8 - TUNING.bodyW - 1, 33 * 8);
    run(g, {}, 1);
    expect(g.interaction()?.label).toBe('Cracked stone: needs a Pickaxe');
    carry(g, 'pickaxe');
    expect(g.interaction()?.label).toBe('Break with Pickaxe');
    g.interact();
    expect(g.cracked[0].broken).toBe(true);
    run(g, { right: true }, 30);
    expect(g.player.body.x).toBeGreaterThan(50 * 8);
  });
});

describe('bells', () => {
  it('ring when the climber bonks into them', () => {
    const g = objWorld();
    place(g, 20 * 8, 33 * 8);
    g.step({ ...NONE, jump: true });
    run(g, { jump: true }, 36);
    g.step(NONE);
    const rang: string[] = [];
    for (let i = 0; i < 80; i++) {
      g.step(NONE);
      for (const e of g.events) rang.push(e.type);
    }
    expect(rang).toContain('bell');
  });
});

describe('the altar and the crown', () => {
  it('takes relics one at a time and gives up the crown when all three are placed', () => {
    const g = objWorld();
    place(g, 55 * 8, 33 * 8);
    run(g, {}, 1);
    expect(g.interaction()?.label).toBe('The altar waits for 3 more relics');
    carry(g, 'orb', 'scepter');
    expect(g.interaction()?.label).toBe('Place The Orb');
    g.interact();
    g.interact();
    expect(g.altar?.placed).toEqual(['orb', 'scepter']);
    expect(g.stones).toBe(0);
    expect(g.interaction()?.label).toBe('The altar waits for 1 more relic');
    carry(g, 'seal');
    g.interact();
    expect(g.interaction()?.label).toBe('Lift the crown');
    g.interact();
    expect(g.events.map((e) => e.type)).toContain('crown');
    expect(g.has('crown')).toBe(true);
  });
});
