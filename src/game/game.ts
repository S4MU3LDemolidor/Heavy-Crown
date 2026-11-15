import { ITEMS, totalGold, totalWeight, type ItemId } from '../content/items';
import { NOTES } from '../content/story';
import { makeBody, moveY, type Body } from './body';
import type { World } from './level';
import { Player, type LadderHit, type PlayerInput, type PlayerWorld } from './player';
import { Tile } from './tiles';
import { SCREEN_H, TILE } from './tuning';

/** Items lying in the world use an 8×8 box; x, y is its top-left. */
export const ITEM_BOX = 8;

export interface WorldItem {
  uid: number;
  id: ItemId;
  body: Body;
  vy: number;
  /** Higher = dropped more recently; offered first when several overlap. */
  order: number;
}

export interface Carried {
  uid: number;
  id: ItemId;
}

export interface Gate {
  id: string;
  tx: number;
  ty0: number;
  ty1: number;
  opens: string;
  open: boolean;
  /** Frames since opening, for the animation. */
  anim: number;
}

export interface Hook {
  id: string;
  tx: number;
  ty: number;
  ropeUid: number | null;
  /** Column the rope hangs in and the rows it covers once hung. */
  ladderTx: number;
  ladderTy0: number;
  ladderTy1: number;
}

export interface NoteObj {
  id: string;
  tx: number;
  ty: number;
}

export type GameEvent =
  | { type: 'pickup'; item: ItemId; x: number; y: number }
  | { type: 'drop'; item: ItemId; x: number; y: number }
  | { type: 'unlock'; x: number; y: number }
  | { type: 'locked'; x: number; y: number }
  | { type: 'rope'; placed: boolean; x: number; y: number }
  | { type: 'read'; note: string }
  | { type: 'weight'; stones: number };

export interface Interaction {
  label: string;
  x: number;
  y: number;
  run(): void;
}

export interface Stats {
  frames: number;
  jumps: number;
  falls: number;
  biggestFall: number;
}

export interface SaveData {
  v: 1;
  player: { x: number; y: number; facing: 1 | -1 };
  carried: Carried[];
  items: { uid: number; id: ItemId; x: number; y: number; order: number }[];
  gatesOpen: string[];
  hooks: Record<string, number | null>;
  notesRead: string[];
  discovered: number[];
  stats: Stats;
  nextUid: number;
  order: number;
}

const rectsOverlap = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
  ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;

/** The whole simulated game: player, items, gates, ropes, notes. No DOM. */
export class Game implements PlayerWorld {
  readonly world: World;
  player: Player;
  items: WorldItem[] = [];
  carried: Carried[] = [];
  gates: Gate[] = [];
  hooks: Hook[] = [];
  notes: NoteObj[] = [];
  notesRead = new Set<string>();
  discovered = new Set<number>();
  stats: Stats = { frames: 0, jumps: 0, falls: 0, biggestFall: 0 };
  events: GameEvent[] = [];
  private nextUid = 1;
  private order = 0;

  constructor(world: World) {
    this.world = world;
    this.player = new Player(world.start.x, world.start.y);
    this.buildObjects();
    for (const s of world.spawns) {
      if (s.entry.kind !== 'item') continue;
      this.spawnItem(s.entry.item as ItemId, s.tx * TILE, s.ty * TILE);
    }
    this.settleItems();
    this.updateLoadout();
  }

  private buildObjects(): void {
    const gateCells = new Map<string, { tx: number; ty: number; opens: string }>();
    for (const s of this.world.spawns) {
      if (s.entry.kind !== 'object') continue;
      const props = s.entry.props ?? {};
      if (s.entry.object === 'gate') gateCells.set(`${s.tx},${s.ty}`, { tx: s.tx, ty: s.ty, opens: String(props.key) });
      if (s.entry.object === 'rope_hook') {
        const leftOpen = !this.world.grid.isSolid(s.tx - 1, s.ty + 1);
        const ladderTx = leftOpen ? s.tx - 1 : s.tx + 1;
        let ty1 = s.ty;
        while (ty1 + 1 < this.world.grid.rows && !this.world.grid.isSolid(ladderTx, ty1 + 1)) ty1++;
        this.hooks.push({ id: `${s.tx},${s.ty}`, tx: s.tx, ty: s.ty, ropeUid: null, ladderTx, ladderTy0: s.ty, ladderTy1: ty1 });
      }
      if (s.entry.object === 'note') this.notes.push({ id: String(props.id), tx: s.tx, ty: s.ty });
    }
    // gates are vertical runs of gate cells
    for (const cell of gateCells.values()) {
      if (gateCells.has(`${cell.tx},${cell.ty - 1}`)) continue;
      let ty1 = cell.ty;
      while (gateCells.has(`${cell.tx},${ty1 + 1}`)) ty1++;
      this.gates.push({ id: `${cell.tx},${cell.ty}`, tx: cell.tx, ty0: cell.ty, ty1, opens: cell.opens, open: false, anim: 0 });
    }
  }

  private spawnItem(id: ItemId, x: number, y: number): WorldItem {
    const it: WorldItem = { uid: this.nextUid++, id, body: makeBody(x, y, ITEM_BOX, ITEM_BOX), vy: 0, order: 0 };
    this.items.push(it);
    return it;
  }

  /** Lets every item fall to rest (used at start and after loading). */
  private settleItems(): void {
    for (let i = 0; i < 600; i++) if (!this.stepItems()) break;
  }

  // ---------- collision world ----------

  solidRect(x: number, y: number, w: number, h: number): boolean {
    if (this.world.grid.solidRect(x, y, w, h)) return true;
    for (const g of this.gates) {
      if (g.open) continue;
      if (rectsOverlap(x, y, w, h, g.tx * TILE + 1, g.ty0 * TILE, TILE - 2, (g.ty1 - g.ty0 + 1) * TILE)) return true;
    }
    return false;
  }

  ladderAt(x: number, y: number, w: number, h: number): LadderHit | null {
    const grid = this.world.grid;
    const tx0 = Math.floor(x / TILE);
    const tx1 = Math.floor((x + w - 1) / TILE);
    const ty0 = Math.floor(y / TILE);
    const ty1 = Math.floor((y + h - 1) / TILE);
    for (let tx = tx0; tx <= tx1; tx++) {
      for (let ty = ty0; ty <= ty1; ty++) {
        if (grid.get(tx, ty) === Tile.Ladder) {
          let top = ty;
          while (grid.get(tx, top - 1) === Tile.Ladder) top--;
          return { cx: tx * TILE + TILE / 2, top: top * TILE };
        }
      }
      for (const hk of this.hooks) {
        if (hk.ropeUid === null || hk.ladderTx !== tx) continue;
        if (ty1 >= hk.ladderTy0 && ty0 <= hk.ladderTy1) return { cx: tx * TILE + TILE / 2, top: hk.ladderTy0 * TILE };
      }
    }
    return null;
  }

  // ---------- state ----------

  get stones(): number {
    return totalWeight(this.carried.map((c) => c.id));
  }

  has(id: ItemId): boolean {
    return this.carried.some((c) => c.id === id);
  }

  get gold(): number {
    return totalGold(this.carried.map((c) => c.id));
  }

  private updateLoadout(): void {
    const l = this.player.loadout;
    const before = l.stones;
    l.stones = this.stones;
    l.mods.springBoots = this.has('spring_boots');
    l.noStumble = this.has('feather_charm');
    if (l.stones !== before) this.events.push({ type: 'weight', stones: l.stones });
  }

  /** Advances one frame. */
  step(input: PlayerInput): void {
    this.events = [];
    this.stats.frames++;
    this.player.update(input, this);
    for (const e of this.player.events) {
      if (e.type === 'jump') this.stats.jumps++;
      if (e.type === 'land' && e.drop >= SCREEN_H) {
        this.stats.falls++;
        this.stats.biggestFall = Math.max(this.stats.biggestFall, Math.round((e.drop / SCREEN_H) * 10) / 10);
      }
    }
    for (const g of this.gates) if (g.open) g.anim++;
    this.stepItems();
  }

  /** Item gravity; returns true if anything moved. */
  private stepItems(): boolean {
    let moved = false;
    for (const it of this.items) {
      const b = it.body;
      if (this.solidRect(b.x, b.y + b.h, b.w, 1)) {
        it.vy = 0;
        continue;
      }
      it.vy = Math.min(it.vy + 0.3, 7);
      if (moveY(b, it.vy, this)) it.vy = 0;
      moved = true;
    }
    return moved;
  }

  discover(band: number): void {
    this.discovered.add(band);
  }

  // ---------- interaction ----------

  /** What pressing Interact would do right now, if anything. */
  interaction(): Interaction | null {
    const p = this.player;
    if (p.state !== 'ground' && p.state !== 'ladder') return null;
    const b = p.body;
    const cx = b.x + b.w / 2;

    for (const n of this.notes) {
      if (rectsOverlap(b.x - 3, b.y, b.w + 6, b.h, n.tx * TILE, n.ty * TILE, TILE, TILE + 2)) {
        return { label: 'Read', x: n.tx * TILE + 4, y: n.ty * TILE - 4, run: () => this.readNote(n.id) };
      }
    }
    for (const g of this.gates) {
      if (g.open) continue;
      const gx = g.tx * TILE;
      if (!rectsOverlap(b.x - 6, b.y, b.w + 12, b.h, gx, g.ty0 * TILE, TILE, (g.ty1 - g.ty0 + 1) * TILE)) continue;
      const key = this.carried.find((c) => ITEMS[c.id].opens === g.opens);
      const top = g.ty0 * TILE - 4;
      if (key) return { label: `Open with ${ITEMS[key.id].name}`, x: gx + 4, y: top, run: () => this.openGate(g, key) };
      const keyName = ITEMS[g.opens as ItemId]?.name ?? 'a key';
      return { label: `Locked: needs ${keyName}`, x: gx + 4, y: top, run: () => this.events.push({ type: 'locked', x: gx + 4, y: top }) };
    }
    for (const hk of this.hooks) {
      const hx = hk.tx * TILE + 4;
      const hy = hk.ty * TILE + 4;
      if (Math.abs(cx - hx) > 14 || Math.abs(b.y + b.h - 4 - hy) > 14) continue;
      if (hk.ropeUid === null) {
        const rope = this.carried.find((c) => c.id === 'rope');
        if (rope && p.state === 'ground') return { label: 'Hang rope', x: hx, y: hy - 10, run: () => this.hangRope(hk, rope) };
      } else if (p.state === 'ground') {
        return { label: 'Take back rope (2 st)', x: hx, y: hy - 10, run: () => this.takeRope(hk) };
      }
    }
    if (p.state === 'ground') {
      let best: WorldItem | null = null;
      for (const it of this.items) {
        const ib = it.body;
        if (!rectsOverlap(b.x - 3, b.y, b.w + 6, b.h + 1, ib.x, ib.y, ib.w, ib.h)) continue;
        if (!best || it.order > best.order) best = it;
      }
      if (best) {
        const it = best;
        const def = ITEMS[it.id];
        return { label: `Take ${def.name} (${def.weight} st)`, x: it.body.x + 4, y: it.body.y - 6, run: () => this.pickUp(it) };
      }
    }
    return null;
  }

  interact(): void {
    this.interaction()?.run();
  }

  private readNote(id: string): void {
    this.notesRead.add(id);
    this.events.push({ type: 'read', note: id });
  }

  private openGate(g: Gate, key: Carried): void {
    g.open = true;
    this.carried = this.carried.filter((c) => c !== key);
    this.updateLoadout();
    this.events.push({ type: 'unlock', x: g.tx * TILE + 4, y: g.ty0 * TILE });
  }

  private hangRope(hk: Hook, rope: Carried): void {
    hk.ropeUid = rope.uid;
    this.carried = this.carried.filter((c) => c !== rope);
    this.updateLoadout();
    this.events.push({ type: 'rope', placed: true, x: hk.ladderTx * TILE + 4, y: hk.ty * TILE });
  }

  private takeRope(hk: Hook): void {
    if (hk.ropeUid === null) return;
    this.carried.push({ uid: hk.ropeUid, id: 'rope' });
    hk.ropeUid = null;
    this.updateLoadout();
    this.events.push({ type: 'rope', placed: false, x: hk.ladderTx * TILE + 4, y: hk.ty * TILE });
  }

  pickUp(it: WorldItem): void {
    this.items = this.items.filter((x) => x !== it);
    this.carried.push({ uid: it.uid, id: it.id });
    this.updateLoadout();
    this.events.push({ type: 'pickup', item: it.id, x: it.body.x + 4, y: it.body.y + 4 });
  }

  /** Drops a carried item at the player's feet. Only possible on the ground. */
  drop(index: number): boolean {
    const p = this.player;
    if (p.state !== 'ground') return false;
    const c = this.carried[index];
    if (!c) return false;
    this.carried.splice(index, 1);
    const x = Math.round(p.body.x + p.body.w / 2 - ITEM_BOX / 2);
    const y = p.feetY - ITEM_BOX;
    this.items.push({ uid: c.uid, id: c.id, body: makeBody(x, y, ITEM_BOX, ITEM_BOX), vy: 0, order: ++this.order });
    this.updateLoadout();
    this.events.push({ type: 'drop', item: c.id, x: x + 4, y: y + 4 });
    return true;
  }

  noteText(id: string): { title: string; text: string } {
    return NOTES[id] ?? { title: 'A note', text: '' };
  }

  // ---------- saving ----------

  save(): SaveData {
    return {
      v: 1,
      player: { x: this.player.body.x, y: this.player.body.y, facing: this.player.facing },
      carried: this.carried.map((c) => ({ ...c })),
      items: this.items.map((it) => ({ uid: it.uid, id: it.id, x: it.body.x, y: it.body.y, order: it.order })),
      gatesOpen: this.gates.filter((g) => g.open).map((g) => g.id),
      hooks: Object.fromEntries(this.hooks.map((h) => [h.id, h.ropeUid])),
      notesRead: [...this.notesRead],
      discovered: [...this.discovered],
      stats: { ...this.stats },
      nextUid: this.nextUid,
      order: this.order,
    };
  }

  load(d: SaveData): void {
    this.player = new Player(d.player.x, d.player.y);
    this.player.facing = d.player.facing;
    this.carried = d.carried.map((c) => ({ ...c }));
    this.items = d.items.map((i) => ({ uid: i.uid, id: i.id, body: makeBody(i.x, i.y, ITEM_BOX, ITEM_BOX), vy: 0, order: i.order }));
    for (const g of this.gates) {
      g.open = d.gatesOpen.includes(g.id);
      g.anim = g.open ? 999 : 0;
    }
    for (const h of this.hooks) h.ropeUid = d.hooks[h.id] ?? null;
    this.notesRead = new Set(d.notesRead);
    this.discovered = new Set(d.discovered);
    this.stats = { ...d.stats };
    this.nextUid = d.nextUid;
    this.order = d.order;
    this.updateLoadout();
    this.events = [];
  }
}
