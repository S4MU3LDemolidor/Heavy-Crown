import { TILE } from './tuning';

/**
 * Cutscenes (remake spec 5.4): a scene is a list of steps run in order. Lines and choices wait for the player;
 * walks, waits and fades take time; everything else is instant. Pure logic: the render layer draws the actors,
 * the line, the choices and the fade from the runner's state.
 */
export type Step =
  /** A line of dialogue; waits until advanced. `who` is 'wren' or an NPC id. */
  | { say: string; who: string; face?: string }
  /** Waits for one of the choices; each may set a flag and jump to a label. */
  | { choose: { label: string; set?: string; goto?: string }[] }
  /** An actor walks to tile column `to`, counted from the scene's anchor. */
  | { move: string; to: number }
  | { turn: string; dir: 1 | -1 }
  | { wait: number }
  | { fade: 'out' | 'in' }
  | { set: string }
  /** Places an actor `at` [tiles right, tiles down] from the anchor (its feet on that cell's floor). */
  | { spawn: string; sprite: string; at: [number, number]; dir?: 1 | -1; ghost?: boolean }
  | { remove: string }
  /** Shows an actor in a held pose (for Wren: a body frame name, e.g. 'sit'); '' clears it. */
  | { pose: string; frame: string }
  | { label: string }
  /** Jumps to a label (only when flag `if` is set, if given). */
  | { goto: string; if?: string }
  /** Ends the game with one of the two endings. */
  | { ending: Ending };

export type Ending = 'letGo' | 'holdOn';

export interface Scene {
  id: string;
  steps: Step[];
}

export interface Actor {
  id: string;
  sprite: string;
  /** Feet position in world pixels. */
  x: number;
  y: number;
  facing: 1 | -1;
  ghost?: boolean;
  pose?: string;
  /** Walking target, while walking. */
  to?: number;
}

/** Walking speed in a scene (pixels per frame). */
const WALK = 1.2;
/** Frames a fade takes. */
const FADE_FRAMES = 40;

export class CutsceneRunner {
  readonly scene: Scene;
  readonly flags: Set<string>;
  readonly actors = new Map<string, Actor>();
  /** The line being shown, if any. */
  line: { who: string; face: string; text: string } | null = null;
  /** The choices being offered, if any. */
  choices: { label: string; set?: string; goto?: string }[] | null = null;
  /** 0 = clear, 1 = black. */
  fade = 0;
  ending: Ending | null = null;
  done = false;
  private pc = 0;
  private waitLeft = 0;
  private fadeTo: number | null = null;
  private readonly anchor: { x: number; y: number };

  constructor(scene: Scene, anchor: { x: number; y: number }, flags: Set<string>, wren: { x: number; y: number; facing: 1 | -1 }) {
    this.scene = scene;
    this.anchor = anchor;
    this.flags = flags;
    this.actors.set('wren', { id: 'wren', sprite: 'wren', x: wren.x, y: wren.y, facing: wren.facing });
  }

  /** True while walking actors, a wait or a fade hold the scene. */
  private get busy(): boolean {
    if (this.waitLeft > 0 || this.fadeTo !== null) return true;
    for (const a of this.actors.values()) if (a.to !== undefined) return true;
    return false;
  }

  /** Advances one frame: moves walkers, counts waits, eases fades, and runs instant steps until one waits. */
  update(): void {
    if (this.done) return;
    for (const a of this.actors.values()) {
      if (a.to === undefined) continue;
      const d = a.to - a.x;
      if (Math.abs(d) <= WALK) {
        a.x = a.to;
        a.to = undefined;
      } else {
        a.facing = d > 0 ? 1 : -1;
        a.x += Math.sign(d) * WALK;
      }
    }
    if (this.waitLeft > 0) this.waitLeft--;
    if (this.fadeTo !== null) {
      const step = 1 / FADE_FRAMES;
      this.fade = this.fadeTo > this.fade ? Math.min(this.fadeTo, this.fade + step) : Math.max(this.fadeTo, this.fade - step);
      if (this.fade === this.fadeTo) this.fadeTo = null;
    }
    if (this.line || this.choices || this.busy) return;
    this.runInstant();
  }

  /** Runs steps until one has to wait (a line, a choice, a walk, a wait or a fade) or the scene ends. */
  private runInstant(): void {
    while (!this.done && !this.line && !this.choices && !this.busy) {
      const s = this.scene.steps[this.pc++];
      if (!s) {
        this.done = true;
        return;
      }
      this.exec(s);
    }
  }

  private exec(s: Step): void {
    if ('say' in s) this.line = { who: s.who, face: s.face ?? 'neutral', text: s.say };
    else if ('choose' in s) this.choices = s.choose;
    else if ('move' in s) {
      const a = this.actors.get(s.move);
      if (a) a.to = this.anchor.x + s.to * TILE;
    } else if ('turn' in s) {
      const a = this.actors.get(s.turn);
      if (a) a.facing = s.dir;
    } else if ('wait' in s) this.waitLeft = s.wait;
    else if ('fade' in s) this.fadeTo = s.fade === 'out' ? 1 : 0;
    else if ('set' in s) this.flags.add(s.set);
    else if ('spawn' in s) this.actors.set(s.spawn, { id: s.spawn, sprite: s.sprite, x: this.anchor.x + s.at[0] * TILE, y: this.anchor.y + s.at[1] * TILE, facing: s.dir ?? -1, ghost: s.ghost });
    else if ('remove' in s) this.actors.delete(s.remove);
    else if ('pose' in s) {
      const a = this.actors.get(s.pose);
      if (a) a.pose = s.frame || undefined;
    } else if ('goto' in s) {
      if (!s.if || this.flags.has(s.if)) this.jump(s.goto);
    } else if ('ending' in s) {
      this.ending = s.ending;
      this.done = true;
    }
  }

  private jump(label: string): void {
    const i = this.scene.steps.findIndex((s) => 'label' in s && s.label === label);
    if (i >= 0) this.pc = i + 1;
  }

  /** The current line has been read. */
  advance(): void {
    if (!this.line) return;
    this.line = null;
    this.runInstant();
  }

  /** Picks choice `i`. */
  choose(i: number): void {
    const c = this.choices?.[i];
    if (!c) return;
    this.choices = null;
    if (c.set) this.flags.add(c.set);
    if (c.goto) this.jump(c.goto);
    this.runInstant();
  }

  /** Skips ahead to the next choice (or the end): walks finish at once, waits and lines are dropped, fades clear. */
  skip(): void {
    while (!this.done && !this.choices) {
      this.line = null;
      this.waitLeft = 0;
      this.fadeTo = null;
      this.fade = 0;
      for (const a of this.actors.values()) {
        if (a.to !== undefined) a.x = a.to;
        a.to = undefined;
      }
      this.runInstant();
    }
    this.fade = 0;
  }
}
