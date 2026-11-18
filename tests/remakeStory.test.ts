import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/content/items';
import { Game } from '../src/game/game';
import { buildWorld, type LevelDef } from '../src/game/level';
import { DialogueRunner, type NpcDef } from '../src/game/story';
import { TUNING } from '../src/game/tuning';
import { blankScreen, put } from './helpers';

/** One screen, floor on row 33: a scene trigger at col 20, an altar at col 40, two lift stations, an NPC. */
function world(): Game {
  let s = blankScreen();
  s[33] = '#'.repeat(60);
  s = put(s, 4, 32, '@');
  s = put(s, 20, 32, 's');
  s = put(s, 40, 32, 'A');
  s = put(s, 8, 32, 'L');
  s = put(s, 52, 32, 'M');
  s = put(s, 12, 32, 'O');
  const level: LevelDef = {
    id: 1,
    theme: 'overgrown',
    screens: [s],
    legend: {
      s: { kind: 'object', object: 'scene', props: { id: 'fire1', w: 4, h: 4 } },
      A: { kind: 'object', object: 'altar' },
      L: { kind: 'object', object: 'lift', props: { net: 'a', order: 1 } },
      M: { kind: 'object', object: 'lift', props: { net: 'a', order: 2 } },
      O: { kind: 'object', object: 'npc', props: { id: 'oskar', scene: 'l1' } },
    },
  };
  return new Game(buildWorld([level]), { oskar: OSKAR });
}

const OSKAR: NpcDef = {
  id: 'oskar',
  name: 'Oskar',
  sprite: 'oskar',
  voice: { pitch: 150, wave: 'sawtooth', rate: 2 },
  behavior: 'static',
  conversations: [
    {
      id: 'o',
      nodes: [
        { id: 'a', text: 'Mine.', face: 'greedy', next: 'b' },
        { id: 'b', text: 'I only wanted to look.', who: 'wren', face: 'sad' },
      ],
    },
  ],
};

function place(g: Game, tx: number) {
  g.player.body.x = tx * 8;
  g.player.body.y = 33 * 8 - TUNING.bodyH;
  g.player.body.remY = 0;
  g.player.state = 'ground';
}

function carry(g: Game, ...ids: Parameters<Game['has']>[0][]) {
  for (const id of ids) g.carried.push({ uid: 900 + g.carried.length, id });
  g.updateLoadout();
}

describe('the remake story systems', () => {
  it('dialogue lines name their speaker and face (the NPC and neutral unless a line says otherwise)', () => {
    const g = world();
    const npc = g.npcs[0];
    const r = new DialogueRunner(g, OSKAR, npc, OSKAR.conversations[0]);
    expect(r.view()).toMatchObject({ who: 'oskar', face: 'greedy', name: 'Oskar', text: 'Mine.' });
    r.advance();
    expect(r.view()).toMatchObject({ who: 'wren', face: 'sad', name: 'Wren' });
  });

  it('The Words weigh 1 stone and cannot be put down, sent up a lift or paid with', () => {
    const g = world();
    place(g, 8);
    carry(g, 'words', 'coin_pouch', 'coin_pouch');
    expect(ITEMS.words.weight).toBe(1);
    expect(g.stones).toBe(3);
    expect(g.drop(0)).toBe(false);
    expect(g.events).toContainEqual({ type: 'notYet' });
    expect(g.has('words')).toBe(true);
    expect(g.liftSend(g.lifts[0].key, 0)).toBe(false);
    expect(g.has('words')).toBe(true);
    expect(g.liftSend(g.lifts[0].key, 1)).toBe(true); // a coin pouch can go
    expect(g.has('words')).toBe(true);
  });

  it('a scene trigger starts its scene once', () => {
    const g = world();
    place(g, 19);
    g.step({ left: false, right: false, jump: false });
    expect(g.events).toContainEqual(expect.objectContaining({ type: 'cutscene', id: 'fire1' }));
    g.step({ left: false, right: false, jump: false });
    expect(g.events.some((e) => e.type === 'cutscene')).toBe(false);
    expect(g.flags.has('scene:fire1')).toBe(true);
  });

  it('the altar, once it holds the three relics, starts the summit scene instead of giving up the crown', () => {
    const g = world();
    place(g, 39);
    carry(g, 'orb', 'scepter', 'seal');
    for (let i = 0; i < 3; i++) g.interact();
    expect(g.altar?.placed).toEqual(['orb', 'scepter', 'seal']);
    expect(g.interaction()?.label).toBe('Kneel beside her');
    g.interact();
    expect(g.events).toContainEqual(expect.objectContaining({ type: 'cutscene', id: 'summit' }));
    expect(g.has('crown')).toBe(false);
  });

  it('letting go takes The Words out of the pack; holding on keeps them', () => {
    const a = world();
    carry(a, 'words');
    a.endWith('letGo');
    expect(a.has('words')).toBe(false);
    expect(a.flags.has('ending:letGo')).toBe(true);
    const b = world();
    carry(b, 'words');
    b.endWith('holdOn');
    expect(b.has('words')).toBe(true);
    expect(b.flags.has('ending:holdOn')).toBe(true);
  });
});
