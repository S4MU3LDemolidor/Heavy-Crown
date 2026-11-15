import { makeBody, moveX, moveY, onGround, type Body } from './body';
import type { CollisionWorld } from './tiles';
import { TILE, TUNING } from './tuning';
import { chargeFramesFor, jumpHeight, jumpSpeedXFactor, launchSpeed, walkFactor, type JumpMods } from './weight';

export type PlayerState = 'ground' | 'charge' | 'air' | 'stumble' | 'ladder';

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  up?: boolean;
  down?: boolean;
}

/** A climbable ladder overlapping the body: its centre x and the world y of its top. */
export interface LadderHit {
  cx: number;
  top: number;
}

/** Collision plus the optional extras the player can use. */
export interface PlayerWorld extends CollisionWorld {
  ladderAt?(x: number, y: number, w: number, h: number): LadderHit | null;
}

export type PlayerEvent =
  | { type: 'chargeStart' }
  | { type: 'jump'; charge: number }
  | { type: 'bonkWall' }
  | { type: 'bonkCeiling' }
  /** fall: pixels from the apex to the landing; drop: landing feet y minus takeoff feet y (positive = lower). */
  | { type: 'land'; fall: number; drop: number; hard: boolean }
  | { type: 'grab' }
  | { type: 'climbStep' };

export interface PlayerLoadout {
  stones: number;
  mods: JumpMods;
  /** Feather Charm: hard landings never stumble. */
  noStumble: boolean;
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
  private climbDist = 0;

  constructor(x: number, y: number) {
    this.body = makeBody(x, y, TUNING.bodyW, TUNING.bodyH);
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
        this.updateAir(world);
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
      this.vx = 0;
      this.events.push({ type: 'chargeStart' });
      return;
    }
    const dir = this.dirOf(input);
    if (dir !== 0) this.facing = dir;
    this.vx = dir * TUNING.walkSpeed * walkFactor(this.loadout.stones);
    if (moveX(this.body, this.vx, world)) this.vx = 0;
    // Walked off a ledge: fall from the next frame on, keeping walking speed.
    if (!onGround(this.body, world)) this.leaveGround();
  }

  private updateCharge(input: PlayerInput, world: CollisionWorld): void {
    if (!onGround(this.body, world)) {
      this.leaveGround();
      this.vx = 0;
      this.updateAir(world);
      return;
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

  private updateAir(world: CollisionWorld): void {
    if (moveX(this.body, this.vx, world)) {
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
        this.land();
        return;
      }
    }
    if (this.body.y < this.apexY) this.apexY = this.body.y;
  }

  private land(): void {
    const fall = this.body.y - this.apexY;
    const drop = this.feetY - this.takeoffFeetY;
    const hard = fall >= TUNING.hardLandingFall && !this.loadout.noStumble;
    this.vx = 0;
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

  private updateStumble(world: CollisionWorld): void {
    if (!onGround(this.body, world)) {
      this.leaveGround();
      this.updateAir(world);
      return;
    }
    this.stumbleLeft--;
    if (this.stumbleLeft <= 0) this.state = 'ground';
  }
}
