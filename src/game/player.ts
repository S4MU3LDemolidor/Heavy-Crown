import { makeBody, moveX, moveY, onGround, type Body } from './body';
import type { CollisionWorld } from './tiles';
import { TUNING } from './tuning';
import { chargeFramesFor, jumpHeight, jumpSpeedXFactor, launchSpeed, walkFactor, type JumpMods } from './weight';

export type PlayerState = 'ground' | 'charge' | 'air' | 'stumble';

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export type PlayerEvent =
  | { type: 'chargeStart' }
  | { type: 'jump'; charge: number }
  | { type: 'bonkWall' }
  | { type: 'bonkCeiling' }
  /** fall: pixels from the apex to the landing; drop: landing feet y minus takeoff feet y (positive = lower). */
  | { type: 'land'; fall: number; drop: number; hard: boolean };

export interface PlayerLoadout {
  stones: number;
  mods: JumpMods;
  /** Feather Charm: hard landings never stumble. */
  noStumble: boolean;
}

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

  update(input: PlayerInput, world: CollisionWorld): void {
    this.events = [];
    switch (this.state) {
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

  private updateGround(input: PlayerInput, world: CollisionWorld): void {
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
