import { describe, expect, it } from 'vitest';
import { Game } from '../src/game/game';
import { buildWorld, type LevelDef } from '../src/game/level';
import type { PlayerInput } from '../src/game/player';
import { DialogueRunner, type NpcDef } from '../src/game/story';
import { blankScreen, put } from './helpers';

const NPCS: Record<string, NpcDef> = {
  oskar: {
    id: 'oskar',
    name: 'Oskar',
    sprite: 'oskar',
    voice: { pitch: 140, wave: 'square', rate: 2 },
    behavior: 'static',
    conversations: [
      {
        id: 'oskar-sale',
        at: 'l3',
        once: true,
        nodes: [
          { id: 'a', text: 'Claws? Forty gold.', choices: [{ label: 'Buy (40 gold)', if: { gold: 40 }, do: [{ pay: 40 }, { give: 'claws' }, { set: 'boughtClaws' }] }, { label: 'No', next: 'b' }] },
          { id: 'b', text: 'Suit yourself.' },
        ],
      },
      { id: 'oskar-later', at: 'l3', nodes: [{ id: 'a', text: 'Still here.' }] },
    ],
  },
  nell: { id: 'nell', name: 'Nell', sprite: 'nell', voice: { pitch: 300, wave: 'triangle', rate: 2 }, behavior: 'static', conversations: [{ id: 'nell', nodes: [{ id: 'a', text: 'Send something up?', choices: [{ label: 'Yes', do: [{ lift: 'send' }] }] }] }] },
  hollow: { id: 'hollow', name: 'Hollow One', sprite: 'hollow', voice: { pitch: 80, wave: 'sine', rate: 1 }, behavior: 'hollow', conversations: [] },
  echo: { id: 'echo', name: 'Maren', sprite: 'echo', voice: { pitch: 260, wave: 'sine', rate: 1 }, behavior: 'echo', conversations: [] },
};

/** One screen, floor on row 33: Oskar at col 10, a lift (net a) at col 20 and another at col 50, a hollow at col 35, two echo waypoints, a scare at col 45. */
function world(): Game {
  let s = blankScreen();
  s[33] = '#'.repeat(60);
  s = put(s, 4, 32, '@');
  s = put(s, 10, 32, 'O');
  s = put(s, 20, 32, 'L');
  s = put(s, 50, 32, 'M');
  s = put(s, 35, 32, 'h');
  s = put(s, 25, 32, '1');
  s = put(s, 28, 32, '2');
  s = put(s, 45, 32, 'S');
  const level: LevelDef = {
    id: 3,
    theme: 'overgrown',
    screens: [s],
    legend: {
      O: { kind: 'object', object: 'npc', props: { id: 'oskar', scene: 'l3' } },
      L: { kind: 'object', object: 'lift', props: { net: 'a', order: 1 } },
      M: { kind: 'object', object: 'lift', props: { net: 'a', order: 2 } },
      h: { kind: 'object', object: 'npc', props: { id: 'hollow', scene: 'x' } },
      '1': { kind: 'object', object: 'npc', props: { id: 'echo', scene: 'e', order: 1 } },
      '2': { kind: 'object', object: 'npc', props: { id: 'echo', scene: 'e', order: 2 } },
      S: { kind: 'object', object: 'scare', props: { id: 'hand', kind: 'hand', w: 4, h: 4 } },
    },
  };
  return new Game(buildWorld([level]), NPCS);
}

const NONE: PlayerInput = { left: false, right: false, jump: false };
const at = (g: Game, tx: number) => {
  g.player.body.x = tx * 8 - 1;
  g.player.body.y = 33 * 8 - 18;
  g.step(NONE);
};
const give = (g: Game, ...ids: Parameters<Game['has']>[0][]) => {
  for (const id of ids) g.carried.push({ uid: 900 + g.carried.length, id });
  g.updateLoadout();
};

describe('dialogue and trades', () => {
  it('offers Talk, picks the conversation for the scene, and greys out what you cannot afford', () => {
    const g = world();
    at(g, 10);
    expect(g.interaction()?.label).toBe('Talk to Oskar');
    const n = g.npcs.find((x) => x.id === 'oskar')!;
    const conv = DialogueRunner.pick(g, NPCS.oskar, n)!;
    const d = new DialogueRunner(g, NPCS.oskar, n, conv);
    expect(d.view()!.choices.map((c) => c.enabled)).toEqual([false, true]);
  });

  it('pays cheapest treasure first without change, gives the item, and the conversation happens once', () => {
    const g = world();
    give(g, 'ruby', 'coin_pouch', 'coin_pouch', 'chalice');
    at(g, 10);
    const n = g.npcs.find((x) => x.id === 'oskar')!;
    const d = new DialogueRunner(g, NPCS.oskar, n, DialogueRunner.pick(g, NPCS.oskar, n)!);
    d.choose(0);
    expect(d.done).toBe(true);
    // 10 + 10 + 30 = 50 >= 40: both pouches and the chalice are gone (no change), the ruby stays
    expect(g.carried.map((c) => c.id).sort()).toEqual(['claws', 'ruby']);
    expect(g.flags.has('boughtClaws')).toBe(true);
    expect(DialogueRunner.pick(g, NPCS.oskar, n)!.id).toBe('oskar-later');
  });
});

describe('bucket lifts', () => {
  it('sends an item up for 10 gold and it waits in the next station', () => {
    const g = world();
    give(g, 'stone', 'coin_pouch');
    at(g, 20);
    expect(g.interaction()?.label).toBe('Send something up (10 gold)');
    expect(g.liftSend('20,32', 0)).toBe(true);
    expect(g.carried).toEqual([]);
    at(g, 50);
    expect(g.interaction()?.label).toBe('Take Counterweight Stone from the bucket');
    g.interact();
    expect(g.carried.map((c) => c.id)).toEqual(['stone']);
  });

  it('cannot send without 10 gold', () => {
    const g = world();
    give(g, 'stone');
    at(g, 20);
    expect(g.interaction()?.label).toBe('Bucket lift: 10 gold to send something up');
    expect(g.liftSend('20,32', 0)).toBe(false);
    expect(g.carried.map((c) => c.id)).toEqual(['stone']);
  });
});

describe('NPC behaviours and scares', () => {
  it('a Hollow One creeps closer only while you look away, then whispers and is gone', () => {
    const g = world();
    at(g, 30);
    const h = g.npcs.find((x) => x.id === 'hollow')!;
    const x0 = h.x;
    g.player.facing = 1; // looking at it
    for (let i = 0; i < 90; i++) g.step(NONE);
    expect(h.x).toBe(x0);
    g.player.facing = -1; // looking away
    const events: string[] = [];
    for (let i = 0; i < 1500 && !h.gone; i++) {
      g.player.facing = -1;
      g.step(NONE);
      events.push(...g.events.map((e) => e.type));
    }
    expect(h.gone).toBe(true);
    expect(events).toContain('whisper');
  });

  it("Maren's Echo moves on to the next waypoint as you reach her", () => {
    const g = world();
    const [e1, e2] = g.npcs.filter((x) => x.id === 'echo').sort((a, b) => a.order - b.order);
    at(g, 24);
    expect(e1.gone).toBe(true);
    expect(e2.gone).toBe(false);
  });

  it('a scare fires once, and never when scares are off', () => {
    const g = world();
    at(g, 45);
    expect(g.events.some((e) => e.type === 'scare')).toBe(true);
    g.step(NONE);
    expect(g.events.some((e) => e.type === 'scare')).toBe(false);
    const quiet = world();
    quiet.scaresEnabled = false;
    at(quiet, 45);
    expect(quiet.events.some((e) => e.type === 'scare')).toBe(false);
  });

  it('save and load keep flags, NPCs, lifts and scares', () => {
    const g = world();
    give(g, 'stone', 'coin_pouch');
    at(g, 20);
    g.liftSend('20,32', 0);
    at(g, 45);
    g.flags.add('metOskar');
    const h = world();
    h.load(JSON.parse(JSON.stringify(g.save())));
    expect(h.flags.has('metOskar')).toBe(true);
    expect(h.lifts.find((l) => l.order === 2)!.bucket.map((b) => b.id)).toEqual(['stone']);
    expect(h.scares[0].fired).toBe(true);
  });
});
