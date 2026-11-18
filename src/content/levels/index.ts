import type { LevelDef } from '../../game/level';
import { L01 } from './l01-foot-of-the-tower';
import { L02 } from './l02-root-stair';
import { L03 } from './l03-hoarders-hollow';
import { L04 } from './l04-sunken-gate';
import { L05 } from './l05-nells-landing';
import { L06 } from './l06-orbs-crown';
import { L07 } from './l07-bell-hall';
import { L08 } from './l08-ringers-loft';
import { L09 } from './l09-silent-bell';
import { L10 } from './l10-lightless-floors';
import { L11 } from './l11-whispering-stair';
import { L12 } from './l12-ossuary';
import { L13 } from './l13-frozen-spire';
import { L14 } from './l14-king-in-the-ice';
import { L15 } from './l15-summit';

/** The tower's levels, bottom to top (remake: 15 hand-made levels, 3 per act; filled in by plans 4–8). */
export const LEVELS: LevelDef[] = [L01, L02, L03, L04, L05, L06, L07, L08, L09, L10, L11, L12, L13, L14, L15];

/** Levels per act: Act n is levels (n-1)*3+1 .. n*3. */
export const LEVELS_PER_ACT = 3;
