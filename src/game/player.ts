import { makeBody, moveX, moveY, onGround, type Body } from './body';
import type { CollisionWorld } from './tiles';
import { TILE, TUNING } from './tuning';
import { chargeFramesFor, isOverloaded, jumpHeight, jumpHeightFactor, jumpSpeedXFactor, launchSpeed, walkFactor, type JumpMods } from './weight';

export type PlayerState = 'ground' | 'charge' | 'air' | 'stumble' | 'ladder' | 'cling' | 'pull' | 'hang';

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  up?: boolean;
  down?: boolean;
  /** Fire the Grappling Hook. */
  hook?: boolean;
}

/** A climbable ladder overlapping the body: its centre x and the world y of its top. */
export interface LadderHit {
  cx: number;
  top: number;
}

/** Collision plus the optional extras the player can use. */
export interface PlayerWorld extends CollisionWorld {
  ladderAt?(x: number, y: number, w: number, h: number): LadderHit | null;
  /** True if any water overlaps the rectangle. */
  waterAt?(x: number, y: number, w: number, h: number): boolean;
  /** True if the surface directly under the feet is ice. */
  iceUnder?(x: number, feetY: number, w: number): boolean;
  /** Horizontal wind acceleration (px/frame²) at a point, for airborne bodies. */
  windAt?(x: number, y: number): number;
  /** True if a climbable wall (ivy, rough stone) overlaps the rectangle. */
  climbableAt?(x: number, y: number, w: number, h: number): boolean;
  /** The ring the hook would reach from (cx, cy) aiming along (ax, ay), within `range`. */
  ringFor?(cx: number, cy: number, ax: number, ay: number, range: number): { x: number; y: number } | null;
}

/** Ice friction (spec section 4). */
const ICE_ACCEL = 0.04;
const ICE_DECEL = 0.03;
const WATER_WALK = 0.6;
const MAX_WIND_VX = 3.5;

/** Climbing Claws and Grappling Hook (full-game spec sections 3–4). */
const CLIMB_SPEED = 0.6;
const HEAVY_SLIDE = 1;
const CLING_MAX_STONES = 12;
const HEAVY_CLING = 9;
const WALL_JUMP_HEIGHT = 40;
const WALL_JUMP_SPEED = 1.6;
export const HOOK_RANGE = 96;
const HOOK_COOLDOWN = 20;

export type PlayerEvent =
  | { type: 'chargeStart' }
  | { type: 'jump'; charge: number }
  | { type: 'bonkWall' }
  | { type: 'bonkCeiling' }
  /** fall: pixels from the apex to the landing; drop: landing feet y minus takeoff feet y (positive = lower). */
  | { type: 'land'; fall: number; drop: number; hard: boolean }
  | { type: 'grab' }
  | { type: 'climbStep' }
  | { type: 'cling' }
  | { type: 'mantle' }
  | { type: 'wallJump' }
  | { type: 'hookFire'; x: number; y: number }
  | { type: 'hookMiss'; ax: number; ay: number }
  | { type: 'hang' };

export interface PlayerLoadout {
  stones: number;
  mods: JumpMods;
  /** Feather Charm: hard landings never stumble. */
  noStumble: boolean;
  /** Crampons: ice behaves like stone. */
  crampons?: boolean;
  /** Multiplier on wind push (Fur Cloak: 0.3). */
  windResist?: number;
  /** Climbing Claws: cling to and climb ivy and rough walls. */
  claws?: boolean;
  /** Grappling Hook: pull up to iron rings. */
  hook?: boolean;
}

/** Pixels trimmed from each side of the body while on a ladder. */
const LADDER_INSET = 2;

export class Player {
  readonly body: Body;
  vx = 0;
  vy = 0;
  state: PlayerState = 'ground';
  facing: -1 | 1 = 1;
  /** Charge in [0, 1]; keeps its last value after the jump (for drawing). */
  charge = 0;
  stumbleLeft = 0;
  loadout: PlayerLoadout = { stones: 0, mods: { springBoots: false }, noStumble: false };
  /** Events from the most recent update, for sound, effects and stats. */
  events: PlayerEvent[] = [];

  private chargeTime = 0;
  private apexY = 0;
  private takeoffFeetY = 0;
  private prevJump = false;
  private prevHook = false;
  private hookCooldown = 0;
  private hangCharging = false;
  private stuck = 0;
  /** Which side the wall is on while clinging. */
  wallDir: -1 | 1 = 1;
  /** The ring being pulled to or hung from. */
  ring: { x: number; y: number } | null = null;
  private climbDist = 0;

  constructor(x: number, y: number) {
    this.body = makeBody(x, y, TUNING.bodyW, TUNING.bodyH);
  }

  /** A full copy, for simulations that branch (the climbability checker). */
  clone(): Player {
    const c = Object.assign(Object.create(Player.prototype) as Player, this);
    (c as { body: Body }).body = { ...this.body };
    c.loadout = { ...this.loadout, mods: { ...this.loadout.mods } };
    c.events = [];
    return c;
  }

    get feetY(): number {
    return this.body.y + this.body.h;
  }

  get centerX(): number {
    return this.body.x + this.body.w / 2;
  }

  get centerY(): number {
    return this.body.y + this.body.h / 2;
  }

  update(input: PlayerInput, world: PlayerWorld): void {
    this.events = [];
    const jumpPressed = input.jump && !this.prevJump;
    this.prevJump = input.jump;
    const hookPressed = !!input.hook && !this.prevHook;
    this.prevHook = !!input.hook;
    if (this.hookCooldown > 0) this.hookCooldown--;
    if (hookPressed && this.loadout.hook && this.state !== 'stumble' && this.state !== 'pull' && this.state !== 'ladder' && this.fireHook(input, world)) return;
    if (this.state === 'ground' && input.up && this.dirOf(input) !== 0 && this.canCling() && this.wallBeside(this.dirOf(input) as -1 | 1, world)) {
      this.enterCling(this.dirOf(input) as -1 | 1);
      return;
    }
    if ((this.state === 'ground' || this.state === 'air') && input.up && this.tryGrab(world)) return;
    if (this.state === 'ground' && input.down && this.tryGrabBelow(world)) return;
    switch (this.state) {
      case 'ladder':
        this.updateLadder(input, world, jumpPressed);
        break;
      case 'ground':
        this.updateGround(input, world);
        break;
      case 'charge':
        this.updateCharge(input, world);
        break;
      case 'air':
        this.updateAir(world, input);
        break;
      case 'cling':
        this.updateCling(input, world, jumpPressed);
        break;
      case 'pull':
        this.updatePull(world, jumpPressed);
        break;
      case 'hang':
        this.updateHang(input, world);
        break;
      case 'stumble':
        this.updateStumble(world);
        break;
    }
  }

  private dirOf(input: PlayerInput): -1 | 0 | 1 {
    if (input.left === input.right) return 0;
    return input.right ? 1 : -1;
  }

  private leaveGround(): void {
    this.state = 'air';
    this.apexY = this.body.y;
    this.takeoffFeetY = this.feetY;
  }

  private updateGround(input: PlayerInput, world: PlayerWorld): void {
    if (!onGround(this.body, world)) {
      this.leaveGround();
      this.updateAir(world);
      return;
    }
    if (input.jump) {
      this.state = 'charge';
      this.chargeTime = 0;
      this.charge = 0;
      if (!this.onIce(world)) this.vx = 0;
      this.events.push({ type: 'chargeStart' });
      return;
    }
    const dir = this.dirOf(input);
    if (dir !== 0) this.facing = dir;
    const wade = world.waterAt?.(this.body.x, this.body.y, this.body.w, this.body.h) ? WATER_WALK : 1;
    const target = dir * TUNING.walkSpeed * walkFactor(this.loadout.stones) * wade;
    if (this.onIce(world)) {
      if (dir !== 0) this.vx += Math.max(-ICE_ACCEL, Math.min(ICE_ACCEL, target - this.vx));
      else this.vx -= Math.sign(this.vx) * Math.min(Math.abs(this.vx), ICE_DECEL);
    } else this.vx = target;
    if (moveX(this.body, this.vx, world)) this.vx = 0;
    // Walked off a ledge: fall from the next frame on, keeping walking speed.
    if (!onGround(this.body, world)) this.leaveGround();
  }

  private updateCharge(input: PlayerInput, world: PlayerWorld): void {
    if (!onGround(this.body, world)) {
      this.leaveGround();
      this.vx = 0;
      this.updateAir(world);
      return;
    }
    if (this.vx !== 0) {
      // still sliding on ice while crouched
      this.vx -= Math.sign(this.vx) * Math.min(Math.abs(this.vx), ICE_DECEL);
      if (moveX(this.body, this.vx, world)) this.vx = 0;
    }
    const dir = this.dirOf(input);
    if (dir !== 0) this.facing = dir;
    if (input.jump) {
      this.chargeTime++;
      this.charge = Math.min(1, this.chargeTime / chargeFramesFor(this.loadout.stones));
      return;
    }
    const { stones, mods } = this.loadout;
    this.vy = -launchSpeed(jumpHeight(this.charge, stones, mods));
    this.vx = dir * TUNING.jumpSpeedX * jumpSpeedXFactor(stones);
    this.leaveGround();
    this.events.push({ type: 'jump', charge: this.charge });
  }

  private onIce(world: PlayerWorld): boolean {
    return !this.loadout.crampons && !!world.iceUnder?.(this.body.x, this.feetY, this.body.w);
  }

  // ---------- Climbing Claws ----------

  private canCling(): boolean {
    return !!this.loadout.claws && this.loadout.stones <= CLING_MAX_STONES;
  }

  /** True if a climbable wall touches the body's side `dir`. */
  private wallBeside(dir: -1 | 1, world: PlayerWorld): boolean {
    if (!world.climbableAt) return false;
    const x = dir > 0 ? this.body.x + this.body.w : this.body.x - 1;
    return world.climbableAt(x, this.body.y + 3, 1, this.body.h - 6);
  }

  private enterCling(dir: -1 | 1): void {
    this.state = 'cling';
    this.wallDir = dir;
    this.facing = dir;
    this.vx = 0;
    this.vy = 0;
    this.body.remX = 0;
    this.body.remY = 0;
    this.climbDist = 0;
    this.events.push({ type: 'cling' });
  }

  private updateCling(input: PlayerInput, world: PlayerWorld, jumpPressed: boolean): void {
    const stones = this.loadout.stones;
    if (jumpPressed) {
      const h = WALL_JUMP_HEIGHT * jumpHeightFactor(stones) * (this.loadout.mods.springBoots ? 1.25 : 1);
      this.vy = -launchSpeed(h);
      this.vx = -this.wallDir * WALL_JUMP_SPEED * jumpSpeedXFactor(stones);
      this.facing = this.vx > 0 ? 1 : -1;
      this.leaveGround();
      this.events.push({ type: 'wallJump' });
      return;
    }
    if (this.dirOf(input) === -this.wallDir || !this.canCling() || !this.wallBeside(this.wallDir, world)) {
      this.vx = 0;
      this.leaveGround();
      return;
    }
    const sideX = this.wallDir > 0 ? this.body.x + this.body.w : this.body.x - 1;
    // feet level with the top of the wall: step up onto it
    if (input.up && stones < HEAVY_CLING && !world.solidRect(sideX, this.feetY - 6, 1, 1)) {
      let top = this.feetY - 6;
      while (top < this.feetY + TILE && !world.solidRect(sideX, top, 1, 1)) top++;
      const nx = this.body.x + this.wallDir * 6;
      const ny = top - this.body.h;
      if (!world.solidRect(nx, ny, this.body.w, this.body.h) && world.solidRect(nx, ny + this.body.h, this.body.w, 1)) {
        this.body.x = nx;
        this.body.y = ny;
        this.body.remY = 0;
        this.state = 'ground';
        this.events.push({ type: 'mantle' });
        return;
      }
    }
    const speed = CLIMB_SPEED * walkFactor(stones);
    const dy = stones >= HEAVY_CLING ? HEAVY_SLIDE : input.up ? -speed : input.down ? speed : 0;
    if (dy === 0) return;
    const hit = moveY(this.body, dy, world);
    this.climbDist += Math.abs(dy);
    if (this.climbDist >= 5) {
      this.climbDist = 0;
      this.events.push({ type: 'climbStep' });
    }
    if (hit && dy > 0) this.state = 'ground';
  }

  // ---------- Grappling Hook ----------

  private fireHook(input: PlayerInput, world: PlayerWorld): boolean {
    if (!world.ringFor || this.hookCooldown > 0) return false;
    const dir = this.dirOf(input);
    let ax: number;
    let ay: number;
    if (input.up) {
      ax = dir * Math.SQRT1_2;
      ay = dir ? -Math.SQRT1_2 : -1;
    } else if (dir !== 0) {
      ax = dir * 0.866;
      ay = -0.5;
    } else {
      ax = this.facing * Math.SQRT1_2;
      ay = -Math.SQRT1_2;
    }
    const ring = world.ringFor(this.body.x + this.body.w / 2, this.body.y + this.body.h / 2, ax, ay, HOOK_RANGE);
    if (!ring) {
      this.hookCooldown = HOOK_COOLDOWN;
      this.events.push({ type: 'hookMiss', ax, ay });
      return false;
    }
    this.ring = ring;
    this.state = 'pull';
    this.vx = 0;
    this.vy = 0;
    this.stuck = 0;
    this.hangCharging = false;
    if (ring.x !== this.body.x + this.body.w / 2) this.facing = ring.x > this.body.x ? 1 : -1;
    this.events.push({ type: 'hookFire', x: ring.x, y: ring.y });
    return true;
  }

  private letGoOfRing(): void {
    this.ring = null;
    this.vx = 0;
    this.vy = 0;
    this.leaveGround();
  }

  private updatePull(world: PlayerWorld, jumpPressed: boolean): void {
    if (!this.ring || jumpPressed) {
      this.letGoOfRing();
      return;
    }
    const stones = this.loadout.stones;
    // overloaded: the rope only strains and the climber dangles where they are
    if (isOverloaded(stones)) return;
    const speed = Math.max(1.2, 4 * (1 - 0.04 * stones));
    const tx = this.ring.x - this.body.w / 2;
    const ty = this.ring.y + 3;
    const dx = tx - this.body.x;
    const dy = ty - this.body.y;
    const d = Math.hypot(dx, dy);
    if (d <= speed) {
      moveX(this.body, dx, world);
      moveY(this.body, dy, world);
      this.body.x = Math.round(tx);
      this.body.y = ty;
      this.body.remX = 0;
      this.body.remY = 0;
      this.state = 'hang';
      this.hangCharging = false;
      this.charge = 0;
      this.events.push({ type: 'hang' });
      return;
    }
    const hx = moveX(this.body, (dx / d) * speed, world);
    const hy = moveY(this.body, (dy / d) * speed, world);
    this.stuck = hx || hy ? this.stuck + 1 : 0;
    if (this.stuck > 10) this.letGoOfRing();
  }

  private updateHang(input: PlayerInput, world: PlayerWorld): void {
    if (!this.ring) {
      this.letGoOfRing();
      return;
    }
    if (input.down && !this.hangCharging) {
      this.letGoOfRing();
      return;
    }
    const dir = this.dirOf(input);
    if (dir !== 0) this.facing = dir;
    if (input.jump) {
      if (!this.hangCharging) {
        this.hangCharging = true;
        this.chargeTime = 0;
        this.charge = 0;
        this.events.push({ type: 'chargeStart' });
      } else {
        this.chargeTime++;
        this.charge = Math.min(1, this.chargeTime / chargeFramesFor(this.loadout.stones));
      }
      return;
    }
    if (this.hangCharging) {
      const { stones, mods } = this.loadout;
      this.vy = -launchSpeed(jumpHeight(this.charge, stones, mods));
      this.vx = dir * TUNING.jumpSpeedX * jumpSpeedXFactor(stones);
      this.ring = null;
      this.hangCharging = false;
      this.leaveGround();
      this.events.push({ type: 'jump', charge: this.charge });
    }
    void world;
  }

  private updateAir(world: PlayerWorld, input?: PlayerInput): void {
    const want = input ? this.dirOf(input) : 0;
    const wind = world.windAt?.(this.body.x + this.body.w / 2, this.body.y + this.body.h / 2) ?? 0;
    if (wind !== 0) {
      this.vx += wind * (this.loadout.windResist ?? 1);
      this.vx = Math.max(-MAX_WIND_VX, Math.min(MAX_WIND_VX, this.vx));
    }
    if (moveX(this.body, this.vx, world)) {
      const into = this.vx > 0 ? 1 : -1;
      if (want === into && this.canCling() && this.wallBeside(into, world)) {
        this.enterCling(into);
        return;
      }
      this.vx = -this.vx * TUNING.wallBounce;
      if (this.vx !== 0) this.facing = this.vx > 0 ? 1 : -1;
      this.events.push({ type: 'bonkWall' });
    }
    // Trapezoid integration: positions follow the exact jump parabola until terminal speed.
    const nextVy = Math.min(this.vy + TUNING.gravity, TUNING.maxFall);
    const dy = (this.vy + nextVy) / 2;
    this.vy = nextVy;
    if (moveY(this.body, dy, world)) {
      if (dy < 0) {
        this.vy = 0;
        this.events.push({ type: 'bonkCeiling' });
      } else {
        this.land(world);
        return;
      }
    }
    if (this.body.y < this.apexY) this.apexY = this.body.y;
    // falling alongside a climbable wall while holding toward it: grab it
    if (want !== 0 && this.vy > -1 && this.canCling() && this.wallBeside(want, world)) this.enterCling(want);
  }

  private land(world: PlayerWorld): void {
    const fall = this.body.y - this.apexY;
    const drop = this.feetY - this.takeoffFeetY;
    const inWater = !!world.waterAt?.(this.body.x, this.body.y, this.body.w, this.body.h + 1);
    const hard = fall >= TUNING.hardLandingFall && !this.loadout.noStumble && !inWater;
    // on ice the landing keeps its horizontal speed and slides
    if (hard || !this.onIce(world)) this.vx = 0;
    this.vy = 0;
    this.body.remX = 0;
    this.body.remY = 0;
    if (hard) {
      this.state = 'stumble';
      this.stumbleLeft = TUNING.stumbleFrames;
    } else {
      this.state = 'ground';
    }
    this.events.push({ type: 'land', fall, drop, hard });
  }

  private ladderUnder(world: PlayerWorld, y: number, h: number, reach = 1): LadderHit | null {
    if (!world.ladderAt) return null;
    const cx = this.body.x + (this.body.w >> 1);
    return world.ladderAt(cx - reach, y, reach * 2, h);
  }

  private enterLadder(hit: LadderHit): void {
    this.state = 'ladder';
    this.vx = 0;
    this.vy = 0;
    this.body.remX = 0;
    this.body.remY = 0;
    this.body.x = Math.round(hit.cx - this.body.w / 2);
    this.climbDist = 0;
    this.events.push({ type: 'grab' });
  }

  private tryGrab(world: PlayerWorld): boolean {
    const hit = this.ladderUnder(world, this.body.y, this.body.h, 4);
    // only grab if the ladder reaches above the feet (not when standing on top of it)
    if (!hit || hit.top >= this.feetY - 2) return false;
    const x = Math.round(hit.cx - this.body.w / 2);
    if (world.solidRect(x + LADDER_INSET, this.body.y, this.body.w - 2 * LADDER_INSET, this.body.h)) return false;
    this.enterLadder(hit);
    return true;
  }

  private tryGrabBelow(world: PlayerWorld): boolean {
    const hit = this.ladderUnder(world, this.feetY, 6, 7);
    if (!hit) return false;
    const x = Math.round(hit.cx - this.body.w / 2);
    if (world.solidRect(x + LADDER_INSET, this.body.y + 2, this.body.w - 2 * LADDER_INSET, this.body.h)) return false;
    this.enterLadder(hit);
    return true;
  }

  private updateLadder(input: PlayerInput, world: PlayerWorld, jumpPressed: boolean): void {
    if (jumpPressed) {
      this.leaveGround();
      return;
    }
    const dir = this.dirOf(input);
    if (dir !== 0) {
      // step off sideways: onto a ledge if one is there, otherwise let go
      this.facing = dir;
      moveX(this.body, dir * 2, world);
      if (onGround(this.body, world)) this.state = 'ground';
      else this.leaveGround();
      return;
    }
    const hit = this.ladderUnder(world, this.body.y, this.body.h);
    if (!hit) {
      this.leaveGround();
      return;
    }
    const speed = 0.8 * walkFactor(this.loadout.stones);
    let dy = input.up ? -speed : input.down ? speed : 0;
    // the climb stops when the feet reach the ledge at the ladder's top
    const topFeet = hit.top + TILE;
    if (dy < 0 && this.feetY + dy < topFeet) dy = topFeet - this.feetY;
    if (dy !== 0) {
      // on a ladder the body is narrower, so it fits a one-tile gap beside a ledge
      const slim = { ...this.body, x: this.body.x + LADDER_INSET, w: this.body.w - 2 * LADDER_INSET };
      const hitSolid = moveY(slim, dy, world);
      this.body.y = slim.y;
      this.body.remY = slim.remY;
      this.climbDist += Math.abs(dy);
      if (this.climbDist >= 4) {
        this.climbDist = 0;
        this.events.push({ type: 'climbStep' });
      }
      if (hitSolid && dy > 0) this.state = 'ground';
    }
    this.vy = dy;
  }

  private updateStumble(world: PlayerWorld): void {
    if (!onGround(this.body, world)) {
      this.leaveGround();
      this.updateAir(world);
      return;
    }
    this.stumbleLeft--;
    if (this.stumbleLeft <= 0) this.state = 'ground';
  }
}
