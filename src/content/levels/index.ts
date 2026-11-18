import type { LevelDef } from '../../game/level';
import { L01 } from './l01-foot-of-the-tower';

/** The tower's levels, bottom to top (remake: 15 hand-made levels, 3 per act; filled in by plans 4–8). */
export const LEVELS: LevelDef[] = [L01];

/** Levels per act: Act n is levels (n-1)*3+1 .. n*3. */
export const LEVELS_PER_ACT = 3;
