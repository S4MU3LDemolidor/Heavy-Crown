import type { ItemId } from '../content/items';

/**
 * Story data types (full-game spec section 5): NPC definitions, conversations as small graphs,
 * and the conditions and effects they use. The runtime lives in Game (npcs, lifts, scares) and
 * DialogueRunner below.
 */

export interface Cond {
  flag?: string;
  notFlag?: string;
  has?: ItemId;
  lacks?: ItemId;
  /** At least this much gold carried. */
  gold?: number;
  minStones?: number;
  maxStones?: number;
  /** Carrying at least one relic. */
  relic?: boolean;
}

export type Effect =
  | { set: string }
  | { give: ItemId }
  | { take: ItemId }
  | { pay: number }
  /** Open the item picker to send something up the bucket lift. */
  | { lift: 'send' }
  /** Open the relic picker for the Old King's favour. */
  | { favour: 'king' }
  /** The NPC walks off and is gone from this spot. */
  | { leave: true };

export interface Choice {
  label: string;
  if?: Cond;
  do?: Effect[];
  /** Node to go to; omitted ends the conversation. */
  next?: string;
}

export interface DNode {
  id: string;
  text: string;
  choices?: Choice[];
  do?: Effect[];
  next?: string;
}

export interface Conversation {
  id: string;
  /** Only at placements with this scene key. */
  at?: string;
  if?: Cond;
  /** Shown only once (remembered by flag `conv:<id>`). */
  once?: boolean;
  nodes: DNode[];
}

export type Behavior = 'static' | 'crow' | 'hollow' | 'echo' | 'king';

export interface NpcDef {
  id: string;
  name: string;
  /** Sprite key in the NPC art. */
  sprite: string;
  voice: { pitch: number; wave: OscillatorType; rate: number };
  behavior: Behavior;
  conversations: Conversation[];
}

export type ScareKind = 'hand' | 'figure' | 'face' | 'hollow' | 'breath' | 'echo' | 'eyes';
export type ScareCond = 'none' | 'lantern' | 'faceAway' | 'still';

/** A placed NPC. Feet at (x, y). */
export interface NpcInstance {
  key: string;
  id: string;
  scene: string;
  x: number;
  y: number;
  facing: 1 | -1;
  gone: boolean;
  /** Echo waypoint order, hollow step timer. */
  order: number;
  timer: number;
}

export interface LiftStation {
  key: string;
  net: string;
  order: number;
  x: number;
  y: number;
  bucket: { uid: number; id: ItemId }[];
}

export interface ScareInstance {
  id: string;
  kind: ScareKind;
  cond: ScareCond;
  x: number;
  y: number;
  w: number;
  h: number;
  fired: boolean;
}

/** What a conversation step shows: text, and choices with whether each is available. */
export interface DialogueView {
  name: string;
  text: string;
  choices: { label: string; enabled: boolean }[];
}

/** The minimal game surface the dialogue needs (Game implements it). */
export interface StoryHost {
  flags: Set<string>;
  check(c: Cond | undefined): boolean;
  apply(effects: Effect[] | undefined, npc: NpcInstance): void;
}

/** Steps through one conversation with one NPC. */
export class DialogueRunner {
  readonly npc: NpcInstance;
  readonly def: NpcDef;
  private readonly host: StoryHost;
  private readonly conv: Conversation;
  private node: DNode | null;

  constructor(host: StoryHost, def: NpcDef, npc: NpcInstance, conv: Conversation) {
    this.host = host;
    this.def = def;
    this.npc = npc;
    this.conv = conv;
    this.node = conv.nodes[0] ?? null;
    if (conv.once) host.flags.add(`conv:${conv.id}`);
    this.enter();
  }

  /** Picks the conversation for this NPC at this placement, or null if it has nothing to say. */
  static pick(host: StoryHost, def: NpcDef, npc: NpcInstance): Conversation | null {
    for (const c of def.conversations) {
      if (c.at && c.at !== npc.scene) continue;
      if (c.once && host.flags.has(`conv:${c.id}`)) continue;
      if (!host.check(c.if)) continue;
      return c;
    }
    return null;
  }

  private enter(): void {
    if (this.node?.do) this.host.apply(this.node.do, this.npc);
  }

  get done(): boolean {
    return this.node === null;
  }

  view(): DialogueView | null {
    if (!this.node) return null;
    return {
      name: this.def.name,
      text: this.node.text,
      choices: (this.node.choices ?? []).map((c) => ({ label: c.label, enabled: this.host.check(c.if) })),
    };
  }

  private goto(id: string | undefined): void {
    this.node = id ? (this.conv.nodes.find((n) => n.id === id) ?? null) : null;
    this.enter();
  }

  /** Continue a node without choices. */
  advance(): void {
    if (!this.node || this.node.choices?.length) return;
    this.goto(this.node.next);
  }

  /** Pick a choice; ignored if it is not available. */
  choose(i: number): void {
    const c = this.node?.choices?.[i];
    if (!c || !this.host.check(c.if)) return;
    this.host.apply(c.do, this.npc);
    this.goto(c.next);
  }
}
