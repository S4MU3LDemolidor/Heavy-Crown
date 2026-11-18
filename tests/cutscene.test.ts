import { describe, expect, it } from 'vitest';
import { SCENES } from '../src/content/cutscenes';
import { CutsceneRunner, type Scene } from '../src/game/cutscene';

/** A runner for `steps`, anchored at (100, 200), with Wren standing at x = 100. */
function run(steps: Scene['steps'], flags = new Set<string>()) {
  return new CutsceneRunner({ id: 't', steps }, { x: 100, y: 200 }, flags, { x: 100, y: 200, facing: 1 });
}

describe('cutscenes', () => {
  it('stops at each line until it is read', () => {
    const r = run([{ say: 'Hello.', who: 'crow', face: 'smug' }, { say: 'Go away.', who: 'wren' }]);
    r.update();
    expect(r.line).toEqual({ who: 'crow', face: 'smug', text: 'Hello.' });
    r.update();
    expect(r.line?.text).toBe('Hello.');
    r.advance();
    r.update();
    expect(r.line).toEqual({ who: 'wren', face: 'neutral', text: 'Go away.' });
    r.advance();
    r.update();
    expect(r.done).toBe(true);
  });

  it('waits the given frames', () => {
    const r = run([{ wait: 3 }, { set: 'after' }]);
    for (let i = 0; i < 3; i++) r.update();
    expect(r.flags.has('after')).toBe(false);
    r.update();
    expect(r.flags.has('after')).toBe(true);
  });

  it('walks actors to a tile column relative to the anchor, and spawns and removes them', () => {
    const r = run([{ spawn: 'memory', sprite: 'maren', at: [4, 0] }, { move: 'memory', to: 0 }, { move: 'wren', to: 2 }, { remove: 'memory' }]);
    r.update();
    expect(r.actors.get('memory')?.x).toBe(100 + 4 * 8);
    for (let i = 0; i < 200 && !r.done; i++) r.update();
    expect(r.actors.get('wren')?.x).toBe(100 + 2 * 8);
    expect(r.actors.has('memory')).toBe(false);
  });

  it('branches on a choice and remembers it as a flag', () => {
    const r = run([
      { choose: [{ label: 'Let go', set: 'end:letGo', goto: 'go' }, { label: 'Hold on', set: 'end:holdOn', goto: 'hold' }] },
      { label: 'go' },
      { ending: 'letGo' },
      { label: 'hold' },
      { ending: 'holdOn' },
    ]);
    r.update();
    expect(r.choices?.map((c) => c.label)).toEqual(['Let go', 'Hold on']);
    r.choose(1);
    for (let i = 0; i < 5; i++) r.update();
    expect(r.flags.has('end:holdOn')).toBe(true);
    expect(r.ending).toBe('holdOn');
  });

  it('goes to a label only when its flag is set', () => {
    const flags = new Set(['metCrow']);
    const r = run([{ goto: 'known', if: 'metCrow' }, { set: 'stranger' }, { label: 'known' }, { set: 'friend' }], flags);
    for (let i = 0; i < 5; i++) r.update();
    expect(flags.has('friend')).toBe(true);
    expect(flags.has('stranger')).toBe(false);
  });

  it('fades out and back in', () => {
    const r = run([{ fade: 'out' }, { fade: 'in' }]);
    let darkest = 0;
    for (let i = 0; i < 200 && !r.done; i++) {
      r.update();
      darkest = Math.max(darkest, r.fade);
    }
    expect(darkest).toBe(1);
    expect(r.fade).toBe(0);
  });

  it('skips to the next choice, keeping flags, spawns and where actors end up', () => {
    const r = run([
      { say: 'One.', who: 'crow' },
      { wait: 100 },
      { move: 'wren', to: 5 },
      { set: 'saw' },
      { choose: [{ label: 'A', set: 'a' }] },
      { set: 'after' },
    ]);
    r.update();
    r.skip();
    expect(r.flags.has('saw')).toBe(true);
    expect(r.actors.get('wren')?.x).toBe(100 + 5 * 8);
    expect(r.choices?.length).toBe(1);
    expect(r.flags.has('after')).toBe(false);
    r.choose(0);
    r.skip();
    expect(r.flags.has('after')).toBe(true);
    expect(r.done).toBe(true);
  });

  it('sets a pose for an actor', () => {
    const r = run([{ pose: 'wren', frame: 'sit' }]);
    r.update();
    expect(r.actors.get('wren')?.pose).toBe('sit');
  });
});


describe('the written scenes', () => {
  /** Plays a scene to its end, taking choice `pick` at every choice; returns the runner. */
  function play(id: string, pick = 0) {
    const r = new CutsceneRunner(SCENES[id], { x: 200, y: 200 }, new Set(), { x: 200, y: 200, facing: 1 });
    for (let i = 0; i < 20000 && !r.done; i++) {
      r.update();
      if (r.line) r.advance();
      else if (r.choices) r.choose(Math.min(pick, r.choices.length - 1));
    }
    return r;
  }

  it.each(Object.keys(SCENES))('%s plays to its end, and every label it jumps to exists', (id) => {
    const steps = SCENES[id].steps;
    const labels = new Set(steps.flatMap((s) => ('label' in s ? [s.label] : [])));
    for (const s of steps) {
      if ('goto' in s) expect(labels.has(s.goto), `${id} -> ${s.goto}`).toBe(true);
      if ('choose' in s) for (const c of s.choose) if (c.goto) expect(labels.has(c.goto), `${id} -> ${c.goto}`).toBe(true);
    }
    expect(play(id).done).toBe(true);
  });

  it('the summit ends in letting go or holding on', () => {
    expect(play('summit', 0).ending).toBe('letGo');
    expect(play('summit', 1).ending).toBe('holdOn');
  });
});
