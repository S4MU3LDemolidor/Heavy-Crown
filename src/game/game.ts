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
  /** Item id of the key that opens it ('' for plate-linked gates). */
  opens: string;
  /** Pressure plate link name, for gates held open by plates. */
  link?: string;
  open: boolean;
  /** 0 = shut, 40 = fully raised. */
  anim: number;
}

export interface Plank {
  id: string;
  tx0: number;
  tx1: number;
  ty: number;
  down: boolean;
  /** Frames left before swinging back up. */
  timer: number;
  /** Consecutive frames under a heavy load. */
  heavy: number;
}

export interface Plate {
  id: string;
  tx: number;
  ty: number;
  link: string;
  need: number;
  pressed: boolean;
}

export interface CrackedWall {
  id: string;
  cells: [number, number][];
  broken: boolean;
}

export interface Bell {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Frames of swing left after ringing. */
  swing: number;
}

export interface Altar {
  tx: number;
  ty: number;
  placed: ItemId[];
  crownTaken: boolean;
}

/** Load on a hinged plank that makes it swing down (spec section 4). */
export const PLANK_BREAK = 5;

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
  | { type: 'weight'; stones: number }
  | { type: 'plank'; down: boolean; x: number; y: number }
  | { type: 'plate'; pressed: boolean; x: number; y: number }
  | { type: 'gateMove'; open: boolean; x: number; y: number }
  | { type: 'break'; x: number; y: number }
  | { type: 'bell'; x: number; y: number; big: boolean }
  | { type: 'relic'; item: ItemId; x: number; y: number }
  | { type: 'crown'; x: number; y: number };

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
  cracked?: string[];
  altar?: ItemId[];
  levelsSeen?: number[];
}

const rectsOverlap = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
  ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah;

/** The whole simulated game: player, items, gates, ropes, notes. No DOM. */
export class Game implements PlayerWorld {
  readonly world: World;
  player: Player;
  items: WorldItem[] = [];
  carried: Carried[] = [];
  /** Index in `carried` of the item Q drops (the newest by default); -1 when the pack is empty. */
  selected = -1;
  gates: Gate[] = [];
  hooks: Hook[] = [];
  notes: NoteObj[] = [];
  planks: Plank[] = [];
  plates: Plate[] = [];
  cracked: CrackedWall[] = [];
  bells: Bell[] = [];
  altar: Altar | null = null;
  /** Iron rings for the Grappling Hook, centre points in world pixels. */
  rings: { x: number; y: number }[] = [];
  notesRead = new Set<string>();
  discovered = new Set<number>();
  /** Level ids whose title card has been shown. */
  levelsSeen = new Set<number>();
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
    const gateCells = new Map<string, { tx: number; ty: number; opens: string; link?: string }>();
    for (const s of this.world.spawns) {
      if (s.entry.kind !== 'object') continue;
      const props = s.entry.props ?? {};
      if (s.entry.object === 'gate') gateCells.set(`${s.tx},${s.ty}`, { tx: s.tx, ty: s.ty, opens: props.key ? String(props.key) : '', link: props.link ? String(props.link) : undefined });
      if (s.entry.object === 'rope_hook') {
        const leftOpen = !this.world.grid.isSolid(s.tx - 1, s.ty + 1);
        const ladderTx = leftOpen ? s.tx - 1 : s.tx + 1;
        let ty1 = s.ty;
        while (ty1 + 1 < this.world.grid.rows && !this.world.grid.isSolid(ladderTx, ty1 + 1)) ty1++;
        this.hooks.push({ id: `${s.tx},${s.ty}`, tx: s.tx, ty: s.ty, ropeUid: null, ladderTx, ladderTy0: s.ty, ladderTy1: ty1 });
      }
      if (s.entry.object === 'note') this.notes.push({ id: String(props.id), tx: s.tx, ty: s.ty });
      if (s.entry.object === 'plate') this.plates.push({ id: `${s.tx},${s.ty}`, tx: s.tx, ty: s.ty, link: String(props.link), need: Number(props.need ?? 3), pressed: false });
      if (s.entry.object === 'altar') this.altar = { tx: s.tx, ty: s.ty, placed: [], crownTaken: false };
      if (s.entry.object === 'ring') this.rings.push({ x: s.tx * TILE + TILE / 2, y: s.ty * TILE + TILE / 2 });
    }
    this.planks = this.groupRuns('plank').map(({ tx0, tx1, ty }) => ({ id: `${tx0},${ty}`, tx0, tx1, ty, down: false, timer: 0, heavy: 0 }));
    this.cracked = this.groupRegions('cracked').map((cells) => ({ id: `${cells[0][0]},${cells[0][1]}`, cells, broken: false }));
    this.bells = this.groupRegions('bell').map((cells) => {
      const xs = cells.map((c) => c[0]);
      const ys = cells.map((c) => c[1]);
      const x0 = Math.min(...xs);
      const y0 = Math.min(...ys);
      return { id: `${x0},${y0}`, x: x0 * TILE, y: y0 * TILE, w: (Math.max(...xs) - x0 + 1) * TILE, h: (Math.max(...ys) - y0 + 1) * TILE, swing: 0 };
    });
    // gates are vertical runs of gate cells
    for (const cell of gateCells.values()) {
      if (gateCells.has(`${cell.tx},${cell.ty - 1}`)) continue;
      let ty1 = cell.ty;
      while (gateCells.has(`${cell.tx},${ty1 + 1}`)) ty1++;
      this.gates.push({ id: `${cell.tx},${cell.ty}`, tx: cell.tx, ty0: cell.ty, ty1, opens: cell.opens, link: cell.link, open: false, anim: 0 });
    }
  }

  private cellsOf(object: string): Set<string> {
    const set = new Set<string>();
    for (const s of this.world.spawns) if (s.entry.kind === 'object' && s.entry.object === object) set.add(`${s.tx},${s.ty}`);
    return set;
  }

  /** Horizontal runs of an object's cells. */
  private groupRuns(object: string): { tx0: number; tx1: number; ty: number }[] {
    const cells = this.cellsOf(object);
    const out: { tx0: number; tx1: number; ty: number }[] = [];
    for (const key of cells) {
      const [tx, ty] = key.split(',').map(Number);
      if (cells.has(`${tx - 1},${ty}`)) continue;
      let tx1 = tx;
      while (cells.has(`${tx1 + 1},${ty}`)) tx1++;
      out.push({ tx0: tx, tx1, ty });
    }
    return out;
  }

  /** 4-connected regions of an object's cells. */
  private groupRegions(object: string): [number, number][][] {
    const cells = this.cellsOf(object);
    const seen = new Set<string>();
    const out: [number, number][][] = [];
    for (const key of cells) {
      if (seen.has(key)) continue;
      const region: [number, number][] = [];
      const stack = [key];
      seen.add(key);
      while (stack.length) {
        const k = stack.pop()!;
        const [tx, ty] = k.split(',').map(Number);
        region.push([tx, ty]);
        for (const n of [`${tx + 1},${ty}`, `${tx - 1},${ty}`, `${tx},${ty + 1}`, `${tx},${ty - 1}`]) {
          if (cells.has(n) && !seen.has(n)) {
            seen.add(n);
            stack.push(n);
          }
        }
      }
      out.push(region);
    }
    return out;
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
    for (const p of this.planks) {
      if (p.down) continue;
      if (rectsOverlap(x, y, w, h, p.tx0 * TILE, p.ty * TILE, (p.tx1 - p.tx0 + 1) * TILE, 3)) return true;
    }
    for (const c of this.cracked) {
      if (c.broken) continue;
      for (const [tx, ty] of c.cells) if (rectsOverlap(x, y, w, h, tx * TILE, ty * TILE, TILE, TILE)) return true;
    }
    for (const b of this.bells) if (rectsOverlap(x, y, w, h, b.x + 1, b.y, b.w - 2, b.h)) return true;
    return false;
  }

  climbableAt(x: number, y: number, w: number, h: number): boolean {
    return this.world.grid.climbableRect(x, y, w, h);
  }

  /** True if nothing solid lies on the straight line between two points (the ends excluded). */
  clearLine(x0: number, y0: number, x1: number, y1: number): boolean {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.ceil(d / 2);
    for (let i = 2; i < n - 2; i++) {
      const t = i / n;
      if (this.solidRect(Math.floor(x0 + (x1 - x0) * t), Math.floor(y0 + (y1 - y0) * t), 1, 1)) return false;
    }
    return true;
  }

  /** The nearest ring within `range` of (cx, cy), inside a ±45° cone around the aim, with a clear line. */
  ringFor(cx: number, cy: number, ax: number, ay: number, range: number): { x: number; y: number } | null {
    const al = Math.hypot(ax, ay) || 1;
    let best: { x: number; y: number } | null = null;
    let bestD = Infinity;
    for (const r of this.rings) {
      const dx = r.x - cx;
      const dy = r.y - cy;
      const d = Math.hypot(dx, dy);
      if (d > range || d < 1) continue;
      const cos = (dx * ax + dy * ay) / (d * al);
      if (cos < Math.SQRT1_2) continue;
      if (d < bestD && this.clearLine(cx, cy, r.x, r.y)) {
        best = r;
        bestD = d;
      }
    }
    return best;
  }

  waterAt(x: number, y: number, w: number, h: number): boolean {
    return this.world.grid.anyIn(x, y, w, h, Tile.Water);
  }

  iceUnder(x: number, feetY: number, w: number): boolean {
    return this.world.grid.anyIn(x, feetY, w, 1, Tile.Ice);
  }

  /** The gust cycle: 180 calm frames (the last 30 telegraph the gust), then 120 frames of gust. */
  gust(): { phase: 'calm' | 'telegraph' | 'gust'; t: number } {
    const t = this.stats.frames % 300;
    return { phase: t >= 180 ? 'gust' : t >= 150 ? 'telegraph' : 'calm', t };
  }

  windAt(_x: number, y: number): number {
    const dir = this.world.bandWind[Math.floor(y / SCREEN_H)] ?? 0;
    if (dir === 0 || this.gust().phase !== 'gust') return 0;
    return 0.06 * dir;
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

  /** Call after taking something: it becomes the selected item. */
  private selectNewest(): void {
    this.selected = this.carried.length - 1;
  }

  updateLoadout(): void {
    if (this.selected >= this.carried.length || (this.selected < 0 && this.carried.length)) this.selected = this.carried.length - 1;
    const l = this.player.loadout;
    const before = l.stones;
    l.stones = this.stones;
    l.mods.springBoots = this.has('spring_boots');
    l.noStumble = this.has('feather_charm');
    l.crampons = this.has('crampons');
    l.windResist = this.has('fur_cloak') ? 0.3 : 1;
    l.claws = this.has('claws');
    l.hook = this.has('hook');
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
    this.stepItems();
    this.stepPlanks();
    this.stepPlates();
    for (const g of this.gates) g.anim = g.open ? Math.min(40, g.anim + 1) : Math.max(0, g.anim - 3);
    for (const b of this.bells) if (b.swing > 0) b.swing--;
    for (const e of this.player.events) {
      if (e.type !== 'land' && e.type !== 'bonkWall' && e.type !== 'bonkCeiling') continue;
      const pb = this.player.body;
      for (const b of this.bells) {
        if (!rectsOverlap(pb.x - 2, pb.y - 2, pb.w + 4, pb.h + 4, b.x, b.y, b.w, b.h)) continue;
        b.swing = 40;
        this.events.push({ type: 'bell', x: b.x + b.w / 2, y: b.y + b.h / 2, big: e.type === 'land' && e.fall > 40 });
      }
    }
  }

  /** Stones resting on a strip of floor whose top is at y, from x0 to x1 (pixels). */
  private loadOn(x0: number, x1: number, topY: number): number {
    let load = 0;
    const p = this.player;
    const standing = p.state === 'ground' || p.state === 'charge' || p.state === 'stumble';
    if (standing && p.feetY === topY && p.body.x < x1 && p.body.x + p.body.w > x0) load += this.stones;
    for (const it of this.items) {
      const b = it.body;
      if (b.y + b.h === topY && b.x < x1 && b.x + b.w > x0) load += ITEMS[it.id].weight;
    }
    return load;
  }

  private stepPlanks(): void {
    for (const pl of this.planks) {
      const x0 = pl.tx0 * TILE;
      const x1 = (pl.tx1 + 1) * TILE;
      const y = pl.ty * TILE;
      if (!pl.down) {
        pl.heavy = this.loadOn(x0, x1, y) >= PLANK_BREAK ? pl.heavy + 1 : 0;
        if (pl.heavy >= 10) {
          pl.down = true;
          pl.timer = 180;
          pl.heavy = 0;
          this.events.push({ type: 'plank', down: true, x: (x0 + x1) / 2, y });
        }
      } else if (--pl.timer <= 0) {
        const pb = this.player.body;
        const blocked = rectsOverlap(pb.x, pb.y, pb.w, pb.h, x0, y, x1 - x0, 3) || this.items.some((it) => rectsOverlap(it.body.x, it.body.y, it.body.w, it.body.h, x0, y, x1 - x0, 3));
        if (blocked) pl.timer = 10;
        else {
          pl.down = false;
          this.events.push({ type: 'plank', down: false, x: (x0 + x1) / 2, y });
        }
      }
    }
  }

  private stepPlates(): void {
    for (const pl of this.plates) {
      const pressed = this.loadOn(pl.tx * TILE - 2, (pl.tx + 1) * TILE + 2, (pl.ty + 1) * TILE) >= pl.need;
      if (pressed !== pl.pressed) {
        pl.pressed = pressed;
        this.events.push({ type: 'plate', pressed, x: pl.tx * TILE + 4, y: (pl.ty + 1) * TILE });
      }
    }
    for (const g of this.gates) {
      if (!g.link) continue;
      const want = this.plates.some((p) => p.link === g.link && p.pressed);
      if (want === g.open) continue;
      const gx = g.tx * TILE;
      const gy = g.ty0 * TILE;
      const gh = (g.ty1 - g.ty0 + 1) * TILE;
      if (!want) {
        // never close onto the climber or an item
        const pb = this.player.body;
        if (rectsOverlap(pb.x, pb.y, pb.w, pb.h, gx, gy, TILE, gh)) continue;
        if (this.items.some((it) => rectsOverlap(it.body.x, it.body.y, it.body.w, it.body.h, gx, gy, TILE, gh))) continue;
      }
      g.open = want;
      this.events.push({ type: 'gateMove', open: want, x: gx + 4, y: gy });
    }
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
    for (const c of this.cracked) {
      if (c.broken) continue;
      const near = c.cells.find(([tx, ty]) => rectsOverlap(b.x - 6, b.y - 2, b.w + 12, b.h + 4, tx * TILE, ty * TILE, TILE, TILE));
      if (!near) continue;
      const x = near[0] * TILE + 4;
      const y = near[1] * TILE - 4;
      if (this.has('pickaxe') && p.state === 'ground') return { label: 'Break with Pickaxe', x, y, run: () => this.breakWall(c) };
      return { label: 'Cracked stone: needs a Pickaxe', x, y, run: () => this.events.push({ type: 'locked', x, y }) };
    }
    if (this.altar && p.state === 'ground') {
      const a = this.altar;
      const ax = a.tx * TILE - TILE;
      const ay = a.ty * TILE - TILE;
      if (rectsOverlap(b.x - 4, b.y, b.w + 8, b.h, ax, ay, TILE * 3, TILE * 2)) {
        const relic = this.carried.find((c) => ITEMS[c.id].kind === 'relic');
        const cx0 = ax + TILE * 1.5;
        if (relic) return { label: `Place ${ITEMS[relic.id].name}`, x: cx0, y: ay - 6, run: () => this.placeRelic(relic) };
        if (a.placed.length >= 3 && !a.crownTaken) return { label: 'Lift the crown', x: cx0, y: ay - 6, run: () => this.liftCrown() };
        if (!a.crownTaken) {
          const missing = 3 - a.placed.length;
          return { label: `The altar waits for ${missing} more relic${missing === 1 ? '' : 's'}`, x: cx0, y: ay - 6, run: () => undefined };
        }
      }
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
    this.selectNewest();
    this.updateLoadout();
    this.events.push({ type: 'rope', placed: false, x: hk.ladderTx * TILE + 4, y: hk.ty * TILE });
  }

  private breakWall(c: CrackedWall): void {
    c.broken = true;
    for (const [tx, ty] of c.cells) this.events.push({ type: 'break', x: tx * TILE + 4, y: ty * TILE + 4 });
  }

  private placeRelic(relic: Carried): void {
    if (!this.altar) return;
    this.altar.placed.push(relic.id);
    this.carried = this.carried.filter((c) => c !== relic);
    this.updateLoadout();
    this.events.push({ type: 'relic', item: relic.id, x: this.altar.tx * TILE + 4, y: this.altar.ty * TILE });
  }

  private liftCrown(): void {
    if (!this.altar) return;
    this.altar.crownTaken = true;
    this.carried.push({ uid: this.nextUid++, id: 'crown' });
    this.updateLoadout();
    this.events.push({ type: 'crown', x: this.altar.tx * TILE + 4, y: this.altar.ty * TILE });
  }

  pickUp(it: WorldItem): void {
    this.items = this.items.filter((x) => x !== it);
    this.carried.push({ uid: it.uid, id: it.id });
    this.selectNewest();
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
    this.selectNewest();
    const x = Math.round(p.body.x + p.body.w / 2 - ITEM_BOX / 2);
    const y = p.feetY - ITEM_BOX;
    this.items.push({ uid: c.uid, id: c.id, body: makeBody(x, y, ITEM_BOX, ITEM_BOX), vy: 0, order: ++this.order });
    this.updateLoadout();
    this.events.push({ type: 'drop', item: c.id, x: x + 4, y: y + 4 });
    return true;
  }

  /** Gold delivered to the summit: carried treasure plus treasure lying on the top screen. */
  goldDelivered(): number {
    let gold = this.gold;
    for (const it of this.items) if (it.body.y < SCREEN_H) gold += ITEMS[it.id].gold ?? 0;
    return gold;
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
      cracked: this.cracked.filter((c) => c.broken).map((c) => c.id),
      altar: this.altar ? [...this.altar.placed] : [],
      levelsSeen: [...this.levelsSeen],
    };
  }

  load(d: SaveData): void {
    this.player = new Player(d.player.x, d.player.y);
    this.player.facing = d.player.facing;
    this.carried = d.carried.map((c) => ({ ...c }));
    this.selected = this.carried.length - 1;
    this.items = d.items.map((i) => ({ uid: i.uid, id: i.id, body: makeBody(i.x, i.y, ITEM_BOX, ITEM_BOX), vy: 0, order: i.order }));
    for (const g of this.gates) {
      g.open = d.gatesOpen.includes(g.id);
      g.anim = g.open ? 40 : 0;
    }
    for (const h of this.hooks) h.ropeUid = d.hooks[h.id] ?? null;
    this.notesRead = new Set(d.notesRead);
    this.discovered = new Set(d.discovered);
    this.stats = { ...d.stats };
    this.nextUid = d.nextUid;
    this.order = d.order;
    for (const c of this.cracked) c.broken = (d.cracked ?? []).includes(c.id);
    if (this.altar) this.altar.placed = [...(d.altar ?? [])];
    this.levelsSeen = new Set(d.levelsSeen ?? []);
    this.updateLoadout();
    this.events = [];
  }
}
