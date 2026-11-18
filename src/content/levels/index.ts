import type { LevelDef } from '../../game/level';
import { L01 } from './l01-foot-of-the-tower';
import { L02 } from './l02-root-stair';
import { L03 } from './l03-hoarders-hollow';
import { L04 } from './l04-sunken-gate';
import { L05 } from './l05-nells-landing';
import { L06 } from './l06-orbs-crown';

/** The tower's levels, bottom to top (remake: 15 hand-made levels, 3 per act; filled in by plans 4–8). */
export const LEVELS: LevelDef[] = [L01, L02, L03, L04, L05, L06];

/** Levels per act: Act n is levels (n-1)*3+1 .. n*3. */
export const LEVELS_PER_ACT = 3;
