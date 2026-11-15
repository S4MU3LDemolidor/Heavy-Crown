import type { LevelDef } from '../../game/level';
import { L1 } from './l1-overgrown-base';
import { L2 } from './l2-drowned-cistern';
import { L3 } from './l3-bell-hall';
import { L4 } from './l4-lightless-floors';
import { L5 } from './l5-frozen-spire';

/** The tower's levels, bottom to top. */
export const LEVELS: LevelDef[] = [L1, L2, L3, L4, L5];
