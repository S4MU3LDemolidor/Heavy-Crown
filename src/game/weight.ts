import { TUNING } from './tuning';

/** At this many stones the climber is overloaded and can only hop. */
export const OVERLOAD_AT = 13;

export type LoadTier = 0 | 1 | 2 | 3 | 4;

export interface JumpMods {
  springBoots: boolean;
}

export const NO_MODS: JumpMods = { springBoots: false };

export function isOverloaded(stones: number): boolean {
  return stones >= OVERLOAD_AT;
}

/** Multiplier on jump height: 1 − 0.05 per stone (0.40 at 12 stones). */
export function jumpHeightFactor(stones: number): number {
  return 1 - 0.05 * Math.min(stones, OVERLOAD_AT - 1);
}

export function jumpSpeedXFactor(stones: number): number {
  return Math.max(0.7, 1 - 0.025 * stones);
}

/** Multiplier on walking and ladder speed. */
export function walkFactor(stones: number): number {
  return Math.max(0.6, 1 - 0.03 * stones);
}

/** Frames needed to reach full charge. */
export function chargeFramesFor(stones: number): number {
  return Math.round(TUNING.chargeFrames * (1 + 0.04 * stones));
}

export function loadTier(stones: number): LoadTier {
  if (stones <= 0) return 0;
  if (stones <= 4) return 1;
  if (stones <= 8) return 2;
  if (stones < OVERLOAD_AT) return 3;
  return 4;
}

/** Jump height in pixels for a charge in [0, 1] (values outside are clamped). */
export function jumpHeight(charge: number, stones: number, mods: JumpMods = NO_MODS): number {
  const c = Math.min(1, Math.max(0, charge));
  const base = isOverloaded(stones)
    ? TUNING.overloadedHop
    : (TUNING.minJump + (TUNING.maxJump - TUNING.minJump) * c) * jumpHeightFactor(stones);
  return mods.springBoots ? base * 1.25 : base;
}

/** Initial upward speed (px/frame) that reaches `height` under TUNING.gravity. */
export function launchSpeed(height: number): number {
  return Math.sqrt(2 * TUNING.gravity * height);
}
