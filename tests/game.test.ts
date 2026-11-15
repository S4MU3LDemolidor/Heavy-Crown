import { describe, expect, it } from 'vitest';
import { Game } from '../src/game/game';
import { buildWorld, type LevelDef } from '../src/game/level';
import type { PlayerInput } from '../src/game/player';
import { blankScreen, put } from './helpers';

/**
 * One screen: floor on row 33, start at col 2, a note at col 4, the iron key at col 6, a rope at col 8,
 * an iron gate at col 20 (rows 29–32), and a ledge on row 20 (cols 30–40) with a rope hook at col 30.
 */
function testWorld() {
  let s = blankScreen();
  s[33] = '#'.repeat(60);
  s = put(s, 2, 32, '@');
  s = put(s, 4, 31, 'n');
  s = put(s, 6, 32, 'k');
  s = put(s, 8, 32, 'r');
  for (let y = 29; y <= 32; y++) s = put(s, 20, y, 'G');
  s[20] = s[20].slice(0, 30) + '#'.repeat(11) + s[20].slice(41);
  s = put(s, 30, 19, 'h');
  const level: LevelDef = {
    id: 1,
    theme: 'overgrown',
    screens: [s],
    legend: {
      n: { kind: 'object', object: 'note', props: { id: 'note1' } },
      k: { kind: 'item', item: 'iron_key' },
      r: { kind: 'item', item: 'rope' },
      G: { kind: 'object', object: 'gate', props: { key: 'iron_key' } },
      h: { kind: 'object', object: 'rope_hook' },
    },
  };
  return new Game(buildWorld([level]));
}

const NONE: PlayerInput = { left: false, right: false, jump: false };
function run(g: Game, input: Partial<PlayerInput>, frames: number) {
  for (let i = 0; i < frames; i++) g.step({ ...NONE, ...input });
}
/** Walks right until the body's x reaches `x` (or 400 frames pass). */
function walkTo(g: Game, x: number) {
  for (let i = 0; i < 400 && Math.abs(g.player.body.x - x) > 1; i++) g.step({ ...NONE, right: g.player.body.x < x, left: g.player.body.x > x });
}

describe('game: items and weight', () => {
  it('starts with items resting on the floor and nothing carried', () => {
    const g = testWorld();
    expect(g.items.map((i) => i.id).sort()).toEqual(['iron_key', 'rope']);
    for (const it of g.items) expect(it.body.y + it.body.h).toBe(33 * 8);
    expect(g.stones).toBe(0);
  });

  it('picks up an item with interact and gets heavier', () => {
    const g = testWorld();
    walkTo(g, 6 * 8 - 1);
    expect(g.interaction()?.label).toBe('Take Iron Key (1 st)');
    g.interact();
    expect(g.carried.map((c) => c.id)).toEqual(['iron_key']);
    expect(g.player.loadout.stones).toBe(1);
    expect(g.events).toContainEqual(expect.objectContaining({ type: 'pickup', item: 'iron_key' }));
  });

  it('drops an item at the feet where it stays; the latest drop is offered first', () => {
    const g = testWorld();
    walkTo(g, 6 * 8 - 1);
    g.interact();
    walkTo(g, 8 * 8 - 1);
    g.interact(); // rope
    expect(g.stones).toBe(3);
    expect(g.drop(0)).toBe(true); // drop the key on top of where the rope was
    expect(g.stones).toBe(2);
    run(g, {}, 5);
    expect(g.interaction()?.label).toBe('Take Iron Key (1 st)');
  });

  it('cannot drop in the air', () => {
    const g = testWorld();
    walkTo(g, 6 * 8 - 1);
    g.interact();
    g.step({ ...NONE, jump: true });
    g.step(NONE);
    run(g, {}, 3);
    expect(g.player.state).toBe('air');
    expect(g.drop(0)).toBe(false);
  });
});

describe('game: gates, notes, ropes', () => {
  it('a locked gate blocks the way and says which key it needs', () => {
    const g = testWorld();
    walkTo(g, 200);
    expect(g.player.body.x).toBeLessThan(20 * 8);
    expect(g.interaction()?.label).toBe('Locked: needs Iron Key');
  });

  it('the matching key opens the gate and is used up', () => {
    const g = testWorld();
    walkTo(g, 6 * 8 - 1);
    g.interact();
    walkTo(g, 200);
    expect(g.interaction()?.label).toBe('Open with Iron Key');
    g.interact();
    expect(g.has('iron_key')).toBe(false);
    expect(g.stones).toBe(0);
    walkTo(g, 200);
    expect(g.player.body.x).toBeGreaterThan(20 * 8);
  });

  it('reads a note', () => {
    const g = testWorld();
    walkTo(g, 4 * 8 - 1);
    expect(g.interaction()?.label).toBe('Read');
    g.interact();
    expect(g.notesRead.has('note1')).toBe(true);
  });

  it('hangs a rope from a hook, climbs down and back up it, and takes it back', () => {
    const g = testWorld();
    walkTo(g, 8 * 8 - 1);
    g.interact(); // rope
    // stand on the ledge next to the hook
    g.player.body.x = 30 * 8;
    g.player.body.y = 20 * 8 - 18;
    run(g, {}, 2);
    expect(g.interaction()?.label).toBe('Hang rope');
    g.interact();
    expect(g.stones).toBe(0);
    expect(g.ladderAt(29 * 8, 25 * 8, 8, 8)).not.toBeNull();
    // step to the edge and climb down
    walkTo(g, 29 * 8 - 1);
    g.step({ ...NONE, down: true });
    expect(g.player.state).toBe('ladder');
    run(g, { down: true }, 200);
    expect(g.player.state).toBe('ground');
    expect(g.player.feetY).toBe(33 * 8);
    // climb back up: the climb stops with the feet level with the ledge, then step onto it
    g.step({ ...NONE, up: true });
    expect(g.player.state).toBe('ladder');
    run(g, { up: true }, 300);
    expect(g.player.feetY).toBe(20 * 8);
    g.step({ ...NONE, right: true });
    expect(g.player.state).toBe('ground');
    run(g, { right: true }, 3);
    run(g, {}, 2);
    expect(g.interaction()?.label).toBe('Take back rope (2 st)');
    g.interact();
    expect(g.stones).toBe(2);
    expect(g.ladderAt(29 * 8, 25 * 8, 8, 8)).toBeNull();
  });

  it('save and load restore carried items, world items, gates, ropes and notes', () => {
    const g = testWorld();
    walkTo(g, 4 * 8 - 1);
    g.interact();
    walkTo(g, 6 * 8 - 1);
    g.interact();
    walkTo(g, 200);
    g.interact();
    const data = JSON.parse(JSON.stringify(g.save()));
    const h = testWorld();
    h.load(data);
    expect(h.player.body.x).toBe(g.player.body.x);
    expect(h.carried).toEqual(g.carried);
    expect(h.items.map((i) => i.id)).toEqual(['rope']);
    expect(h.gates[0].open).toBe(true);
    expect(h.notesRead.has('note1')).toBe(true);
  });
});

describe('game: the selected item', () => {
  it('selects what you just picked up, and dropping it selects the next newest', () => {
    const g = testWorld();
    walkTo(g, 6 * 8 - 1);
    g.interact(); // key
    walkTo(g, 8 * 8 - 1);
    g.interact(); // rope
    expect(g.carried[g.selected].id).toBe('rope');
    expect(g.drop(g.selected)).toBe(true);
    expect(g.carried[g.selected].id).toBe('iron_key');
  });

  it('keeps the selection inside the pack when it shrinks, and -1 when empty', () => {
    const g = testWorld();
    walkTo(g, 6 * 8 - 1);
    g.interact();
    expect(g.selected).toBe(0);
    expect(g.drop(g.selected)).toBe(true);
    expect(g.selected).toBe(-1);
  });
});
