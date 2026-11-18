# Remake Plan 1: New Scale and Wren's First Look

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On a new `remake` branch, clear out the 30-level tower and its generator, scale the climber and its physics to 1.5×, and draw Wren's idle pose and portrait for the user to approve.

**Architecture:** Work happens in a git worktree, so the main checkout keeps today's game. The reach helpers that `check-levels` borrows from the generator move into `tools/reachLib.ts`; then the generator, the generated levels, the old hand-made levels and their story content are deleted, and one 2-screen placeholder level keeps the game and tests running. The physics scale is one constant (`SCALE`) that multiplies every distance and speed. Wren's art replaces the old climber in `src/art/climber.ts` behind the same `buildClimberSheet()` interface the renderer already uses, and a new `src/art/portraits.ts` holds the 64×64 portraits.

**Tech Stack:** TypeScript, Vite, Vitest, Canvas 2D, tsx scripts, pngjs previews.

**Spec:** `docs/superpowers/specs/2026-11-18-heavy-crown-remake-design.md` (sections 3, 5.1, 5.2, 5.7, 5.8; build stages 1–2 up to the review gate).

**Paths:** after Task 1, every path in this plan is relative to the worktree `/Users/samwelltech/Documents/Heavy Crown remake`, and every command runs there.

---

## File map

| File | Change | Responsibility |
|---|---|---|
| `tools/reachLib.ts` | create | Reach helpers for tools: `Move`, `cellPos`, `reachOpts`, `reaches` (moved out of the generator) |
| `tools/check-levels.ts` | modify | Uses `reachLib`; reads `requires` from each level |
| `src/game/level.ts` | modify | `LevelDef.requires` |
| `tools/levelgen/`, `tools/leveldraft/`, `src/content/levels/gen/`, `src/content/levels/l1-…l5-*.ts`, `src/content/levels/summit.ts` | delete | The old tower |
| `src/content/levels/blockout.ts` | create | `blockout()`: a 60×34 screen from rectangles (shared by the placeholder and the moves playground) |
| `src/content/levels/l01-foot-of-the-tower.ts` | create | Placeholder level 1 (2 screens), replaced by the real level in plan 4 |
| `src/content/levels/index.ts` | rewrite | `LEVELS`, `LEVELS_PER_ACT` |
| `src/content/levels/test-moves.ts` | modify | Uses `blockout()` |
| `src/content/story.ts` | modify | 15 level names; notes emptied (rewritten in plans 3–8) |
| `src/content/npcs.ts` | modify | Peddler removed; conversations emptied (rewritten in plans 3–8) |
| `src/main.ts`, `src/ui/screens.ts` | modify | Acts are `LEVELS_PER_ACT` levels long |
| `src/game/game.ts`, `src/engine/save.ts` | modify | Save version 4; wind and talk reach scaled |
| `src/game/tuning.ts` | modify | `SCALE`, scaled `TUNING` |
| `src/game/player.ts`, `src/game/reach.ts` | modify | Scaled movement constants |
| `src/art/buffer.ts` | modify | `selout()`: selective outline |
| `src/art/climber.ts` | rewrite | Wren's sheet: palette, idle frames, packs per load tier |
| `src/art/portraits.ts` | create | 64×64 portraits (Wren, neutral) |
| `tools/preview.ts` | modify | `art:preview wren` review sheet |
| `tests/tower.test.ts` | rewrite | The remake tower's structure |
| `tests/art.test.ts` | modify | Selective outline, Wren's sheet, the portrait |
| `tests/*.test.ts` | modify | Geometry updated for the new scale |
| `package.json`, `README.md` | modify | `levels:gen` removed; layout notes |

---

### Task 1: The `remake` worktree

**Files:** none (git setup)

- [ ] **Step 1: Create the worktree on a new branch**

```bash
git -C "/Users/samwelltech/Documents/Heavy Crown" worktree add "/Users/samwelltech/Documents/Heavy Crown remake" -b remake main
```

Expected: `Preparing worktree (new branch 'remake')` and `HEAD is now at …`.

- [ ] **Step 2: Install dependencies in the worktree**

```bash
cd "/Users/samwelltech/Documents/Heavy Crown remake" && npm install
```

Expected: `added … packages` with no errors.

- [ ] **Step 3: Confirm the baseline is green**

```bash
cd "/Users/samwelltech/Documents/Heavy Crown remake" && npx vitest run 2>&1 | grep -E "Test Files|Tests "
```

Expected: `Test Files  18 passed (18)` and `Tests  241 passed (241)`.

---

### Task 2: Move the reach helpers out of the generator

**Files:**
- Create: `tools/reachLib.ts`
- Modify: `tools/check-levels.ts:9-10,53-56`
- Modify: `src/game/level.ts` (the `LevelDef` interface)

- [ ] **Step 1: Create `tools/reachLib.ts`** (the code is moved unchanged from `tools/levelgen/gen.ts`, with `SR` spelled out)

```ts
/** Reachability helpers for the level tools: is one stand cell reachable from another, at a load, with given moves? */
import { Game } from '../src/game/game';
import { buildWorld, type LevelDef } from '../src/game/level';
import { explore, type ReachOptions } from '../src/game/reach';
import { SCREEN_ROWS, TILE, TUNING } from '../src/game/tuning';

export type Move = 'claws' | 'hook' | 'crampons';

/** Pixel position of a stand cell [screen, tx, ty] of level `li` in a world. */
export function cellPos(world: ReturnType<typeof buildWorld>, li: number, cell: [number, number, number]): { x: number; y: number; feetRow: number } {
  const band = world.bandLevel.indexOf(li) + cell[0];
  const wy = band * SCREEN_ROWS + cell[2];
  return { x: cell[1] * TILE - 1, y: (wy + 1) * TILE - TUNING.bodyH, feetRow: wy + 1 };
}

export function reachOpts(level: Pick<LevelDef, 'load' | 'needs'>, game: Game, moves?: Move[], cloak?: boolean): ReachOptions {
  const m = new Set(moves ?? level.needs ?? []);
  return { stones: level.load ?? 0, claws: m.has('claws'), hook: m.has('hook'), crampons: m.has('crampons'), rings: game.rings, world: game, ...(cloak ? { windResist: 0.3 } : {}) };
}

/** Is stand cell `to` of level `toLi` reachable from cell `from` of level `fromLi`? */
export function reaches(levels: LevelDef[], fromLi: number, from: [number, number, number], targets: { li: number; cell: [number, number, number] }[], opts: (g: Game) => ReachOptions): boolean[] {
  const world = buildWorld(levels, { requireStart: false });
  const game = new Game(world);
  for (const g of game.gates) g.open = true;
  for (const w of game.cracked) w.broken = true;
  const start = cellPos(world, fromLi, from);
  const r = explore(world.grid, start, opts(game));
  return targets.map(({ li, cell }) => {
    const t = cellPos(world, li, cell);
    const x = cell[1] * TILE;
    const hit = r.footholds.find((f) => f.ty === t.feetRow && x >= f.x0 - TUNING.bodyW && x <= f.x1 + TUNING.bodyW);
    return !!hit && r.reached.has(hit.id);
  });
}
```

- [ ] **Step 2: Add `requires` to `LevelDef`** in `src/game/level.ts`, after the `needs` field:

```ts
  /** Moves the climb cannot be done without (the checker proves the route fails without each). */
  requires?: ('claws' | 'hook' | 'crampons')[];
```

- [ ] **Step 3: Point `tools/check-levels.ts` at the new module.** Replace lines 9–10:

```ts
import { reaches, reachOpts, type Move } from './reachLib';
```

and replace the `requires` loop (lines 53–56):

```ts
  for (const m of l.requires ?? []) {
    check(`level ${l.id}: cannot be climbed without the ${m}`, l.id, l.entry!, to, { moves: (l.needs ?? []).filter((x) => x !== m), cloak }, false);
  }
```

- [ ] **Step 4: Type-check and run the checker on two levels**

```bash
npx tsc --noEmit && npm run check:levels 1 7
```

Expected: no type errors, then `all … checks passed`.

- [ ] **Step 5: Commit**

```bash
git add tools/reachLib.ts tools/check-levels.ts src/game/level.ts
git commit -m "refactor: reach helpers out of the level generator; requires lives on the level"
```

---

### Task 3: Clear out the old tower

**Files:**
- Delete: `tools/levelgen/`, `tools/leveldraft/`, `src/content/levels/gen/`, `src/content/levels/l1-overgrown-base.ts`, `src/content/levels/l2-drowned-cistern.ts`, `src/content/levels/l3-bell-hall.ts`, `src/content/levels/l4-lightless-floors.ts`, `src/content/levels/l5-frozen-spire.ts`, `src/content/levels/summit.ts`
- Create: `src/content/levels/blockout.ts`, `src/content/levels/l01-foot-of-the-tower.ts`
- Rewrite: `src/content/levels/index.ts`, `tests/tower.test.ts`
- Modify: `src/content/levels/test-moves.ts`, `src/content/story.ts`, `src/content/npcs.ts`, `src/main.ts:415`, `src/ui/screens.ts:164`, `src/game/game.ts` (save version), `src/engine/save.ts`, `package.json`, `README.md`

- [ ] **Step 1: Delete the old tower**

```bash
git rm -r -q tools/levelgen tools/leveldraft src/content/levels/gen src/content/levels/l1-overgrown-base.ts src/content/levels/l2-drowned-cistern.ts src/content/levels/l3-bell-hall.ts src/content/levels/l4-lightless-floors.ts src/content/levels/l5-frozen-spire.ts src/content/levels/summit.ts
```

- [ ] **Step 2: Create `src/content/levels/blockout.ts`**

```ts
import { SCREEN_COLS, SCREEN_ROWS } from '../../game/tuning';

/** A rectangle of one map character, in tiles: x, y, width, height, character. */
export type Fill = [x: number, y: number, w: number, h: number, ch: string];

/** One 60×34 screen of interior space with outer walls, filled with rectangles of map characters. */
export function blockout(fills: Fill[]): string[] {
  const g = Array.from({ length: SCREEN_ROWS }, () => Array<string>(SCREEN_COLS).fill(' '));
  for (const row of g) {
    row[0] = '#';
    row[SCREEN_COLS - 1] = '#';
  }
  for (const [x, y, w, h, ch] of fills) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g[y + j][x + i] = ch;
  return g.map((r) => r.join(''));
}
```

- [ ] **Step 3: Use it in `src/content/levels/test-moves.ts`.** Delete the local `Fill` type and `screen()` function (lines 4–15), add `import { blockout } from './blockout';`, drop the now-unused `SCREEN_COLS, SCREEN_ROWS` import, and replace both `screen([` calls with `blockout([`.

- [ ] **Step 4: Create the placeholder `src/content/levels/l01-foot-of-the-tower.ts`.** Ledges sit 6 rows apart, staggered left and right, never in a screen's top 4 rows, so the climb works both before and after the scale change.

```ts
import type { LevelDef } from '../../game/level';
import { blockout } from './blockout';

/**
 * Placeholder for level 1 (remake plan 1): a plain two-screen stair so the game and the checks run while the
 * real hand-made levels are drawn. Plan 4 replaces it with The Foot of the Tower.
 */
export const L01: LevelDef = {
  id: 1,
  theme: 'overgrown',
  legend: {},
  entry: [1, 3, 30],
  exit: [0, 14, 8],
  load: 1,
  screens: [
    blockout([
      [10, 9, 10, 1, '#'], // the exit
      [24, 15, 8, 1, '#'],
      [38, 21, 8, 1, '#'],
      [24, 27, 8, 1, '#'],
      [10, 33, 8, 1, '#'],
    ]),
    blockout([
      [1, 31, 58, 3, '#'], // floor
      [3, 30, 1, 1, '@'],
      [24, 7, 8, 1, '#'],
      [38, 13, 8, 1, '#'],
      [24, 19, 8, 1, '#'],
      [10, 25, 8, 1, '#'],
    ]),
  ],
};
```

- [ ] **Step 5: Rewrite `src/content/levels/index.ts`**

```ts
import type { LevelDef } from '../../game/level';
import { L01 } from './l01-foot-of-the-tower';

/** The tower's levels, bottom to top (remake: 15 hand-made levels, 3 per act; filled in by plans 4–8). */
export const LEVELS: LevelDef[] = [L01];

/** Levels per act: Act n is levels (n-1)*3+1 .. n*3. */
export const LEVELS_PER_ACT = 3;
```

- [ ] **Step 6: Use `LEVELS_PER_ACT` for acts.** In `src/main.ts:415` replace `/ 6)` with `/ LEVELS_PER_ACT)` and add `LEVELS_PER_ACT` to the existing `import { LEVELS } from './content/levels';`. In `src/ui/screens.ts:164` replace

```ts
  const ids = [1, 2, 3, 4, 5, 6].map((k) => (act - 1) * 6 + k);
```

with

```ts
  const ids = Array.from({ length: LEVELS_PER_ACT }, (_, k) => (act - 1) * LEVELS_PER_ACT + k + 1);
```

and add `import { LEVELS_PER_ACT } from '../content/levels';` at the top of `src/ui/screens.ts`.

- [ ] **Step 7: Rewrite the level names and empty the notes in `src/content/story.ts`.** Replace the whole `NOTES` object with `export const NOTES: Record<string, { title: string; text: string }> = {};` (Maren's 15 notes are written act by act in plans 4–8), and replace `LEVEL_NAMES` with:

```ts
/** The fifteen levels' names (remake spec section 4.2). */
export const LEVEL_NAMES: Record<number, string> = {
  1: 'The Foot of the Tower', 2: 'The Root Stair', 3: "The Hoarder's Hollow",
  4: 'The Sunken Gate', 5: "Nell's Landing", 6: "The Orb's Crown",
  7: 'The Bell Hall', 8: "The Ringer's Loft", 9: 'The Silent Bell',
  10: 'The Lightless Floors', 11: 'The Whispering Stair', 12: 'The Ossuary',
  13: 'The Frozen Spire', 14: 'The King in the Ice', 15: 'The Summit',
};
```

Leave `INTRO_LINES` and `ENDING_LINES` for now (plan 3 replaces them with cutscenes).

- [ ] **Step 8: Empty the NPC scripts in `src/content/npcs.ts`.** Delete the `crow()` helper function and the whole `peddler: { … },` entry. In every remaining entry (`crow`, `oskar`, `nell`, `bellringer`, `hollow`, `echo`, `king`) replace the `conversations: [ … ]` value with `conversations: []`, keeping `id`, `name`, `sprite`, `voice` and `behavior` as they are. Add above `export const NPCS`:

```ts
// Remake: the cast's conversations are rewritten act by act in plans 3–8 (remake spec section 2).
```

If `tsc` then reports an unused import in this file, delete that import.

- [ ] **Step 9: Save version 4.** In `src/game/game.ts` change the `SaveData` doc comment and type to

```ts
  /** Version 4: the remake's 15-level tower (older saves hold positions in other layouts and start a new climb). */
  v: 4;
```

and `v: 3,` in `save()` to `v: 4,`. In `src/engine/save.ts` set `const KEY = 'heavycrown.save.v4';`, add `'heavycrown.save.v3'` to `OLD_KEYS`, and change `d.v === 3` to `d.v === 4`.

- [ ] **Step 10: Remove the generator script** from `package.json`: delete the line `"levels:gen": "tsx tools/levelgen/build.ts"` and the trailing comma on the line before it.

- [ ] **Step 10b: Clear the checker's old hand-made rules.** The `RULES` array in `tools/check-levels.ts` names levels 1, 7, 13, 19 and 30 of the old tower. Replace its entries so it reads:

```ts
// the hand-made rules (remake: written with each act, plans 4–8)
const RULES: { id: number; run: () => void }[] = [];
```

and change the Fur Cloak rule in the main loop from `l.id > 25` to `l.id > 13` (in the remake the cloak is found in level 13):

```ts
  const cloak = l.theme === 'frozen' && l.id > 13;
```

- [ ] **Step 11: Rewrite `tests/tower.test.ts`** for the remake tower (relic, item and cast placement tests return as each act is built):

```ts
import { describe, expect, it } from 'vitest';
import { LEVELS, LEVELS_PER_ACT } from '../src/content/levels';
import { NPCS } from '../src/content/npcs';
import { LEVEL_NAMES, NOTES } from '../src/content/story';
import { Game } from '../src/game/game';
import { buildWorld } from '../src/game/level';

/** The remake tower's structure (remake spec section 4). */
describe('the tower', () => {
  const world = buildWorld(LEVELS);
  const game = new Game(world);

  it('numbers its levels from 1 and gives each act its setting', () => {
    expect(LEVELS.map((l) => l.id)).toEqual(LEVELS.map((_, i) => i + 1));
    const acts = ['overgrown', 'cistern', 'bells', 'dark', 'frozen'];
    for (const l of LEVELS) expect(l.theme, `level ${l.id}`).toBe(acts[Math.ceil(l.id / LEVELS_PER_ACT) - 1]);
  });

  it('names all fifteen levels', () => {
    expect(Object.keys(LEVEL_NAMES).map(Number)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it('every level says where its climb comes in and goes out, and what it carries', () => {
    for (const l of LEVELS) {
      expect(l.entry, `level ${l.id}`).toBeDefined();
      expect(l.exit, `level ${l.id}`).toBeDefined();
      expect(l.load, `level ${l.id}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("places each of Maren's notes exactly once", () => {
    expect(game.notes.map((n) => n.id).sort()).toEqual(Object.keys(NOTES).sort());
  });

  it('places every NPC a conversation is written for', () => {
    for (const def of Object.values(NPCS)) {
      for (const c of def.conversations) {
        if (!c.at) continue;
        expect(game.npcs.some((n) => n.id === def.id && n.scene === c.at), `${def.id} at ${c.at}`).toBe(true);
      }
    }
  });
});
```

- [ ] **Step 12: Update `README.md`.** In the intro paragraph replace "Thirty levels in five acts" with "Fifteen hand-made levels in five acts (the remake, in progress on the `remake` branch)". Delete the `npm run levels:gen` table row. In Layout, replace the `src/content/` line's level sentence with "The 15 levels are hand-made in `src/content/levels/lNN-*.ts`.", and delete the `tools/levelgen/` and `tools/leveldraft/` lines.

- [ ] **Step 13: Run everything**

```bash
npx tsc --noEmit && npx vitest run 2>&1 | grep -E "Test Files|Tests |FAIL" ; npm run check:levels; npm run build 2>&1 | tail -1
```

Expected: no type errors; all test files pass (the count drops from 241, since the old tower's per-level tests are gone); `level 1: climbs to the summit carrying 1 st` ✓ and `all 1 checks passed`; `✓ built`. If a test outside `tests/tower.test.ts` failed because it imported a deleted level file, delete only that test case (the content it checked no longer exists) and note it in the commit message.

- [ ] **Step 14: Commit**

```bash
git add -A src tools tests package.json README.md
git commit -m "chore: clear the 30-level tower for the remake (placeholder level 1, 15 level names, save v4)"
```

---

### Task 4: Scale the climber and its physics to 1.5×

**Files:**
- Modify: `src/game/tuning.ts`, `src/game/player.ts:40-53,87,369,538`, `src/game/game.ts:173,409`, `src/game/reach.ts:256`
- Test: the existing physics, moves and reach tests

- [ ] **Step 1: Write the scale test first.** Add to `tests/weight.test.ts` inside the `describe` block:

```ts
  it('the remake scale: a full jump at no load rises 120 px, the body is 14×27', () => {
    expect(jumpHeight(1, 0)).toBeCloseTo(120);
    expect(TUNING.bodyW).toBe(14);
    expect(TUNING.bodyH).toBe(27);
  });
```

- [ ] **Step 2: Run it and see it fail**

```bash
npx vitest run tests/weight.test.ts
```

Expected: FAIL, `expected 80 to be close to 120`.

- [ ] **Step 3: Scale `TUNING`.** In `src/game/tuning.ts` replace the `TUNING` doc comment and object with:

```ts
/** The remake's scale: the climber and every distance and speed of movement are 1.5× the MVP's (remake spec 5.1). */
export const SCALE = 1.5;

/**
 * Movement constants at weight 0 (spec section 4, scaled by SCALE). Units: pixels, frames (60 per second).
 * Kept mutable so tuning and debug tools can change them live.
 */
export const TUNING = {
  gravity: 0.3 * SCALE,
  maxFall: 9 * SCALE,
  walkSpeed: 1.0 * SCALE,
  chargeFrames: 36,
  minJump: 12 * SCALE,
  maxJump: 80 * SCALE,
  jumpSpeedX: 2.2 * SCALE,
  wallBounce: 0.5,
  hardLandingFall: 136 * SCALE,
  stumbleFrames: 40,
  overloadedHop: 14 * SCALE,
  bodyW: 14,
  bodyH: 27,
  cameraSlideFrames: 11,
};
```

Scaling gravity and every speed by the same factor keeps the airtime and the shape of every arc, and makes every height and distance 1.5× longer.

- [ ] **Step 4: Scale the player's movement constants.** In `src/game/player.ts` add `SCALE` to the import from `./tuning`, and replace lines 40–53 with:

```ts
/** Ice friction (spec section 4). */
const ICE_ACCEL = 0.04 * SCALE;
const ICE_DECEL = 0.03 * SCALE;
const WATER_WALK = 0.6;
const MAX_WIND_VX = 3.5 * SCALE;

/** Climbing Claws and Grappling Hook (full-game spec sections 3–4). */
const CLIMB_SPEED = 0.6 * SCALE;
const HEAVY_SLIDE = 1 * SCALE;
const CLING_MAX_STONES = 12;
const HEAVY_CLING = 9;
const WALL_JUMP_HEIGHT = 40 * SCALE;
const WALL_JUMP_SPEED = 1.6 * SCALE;
export const HOOK_RANGE = 96 * SCALE;
const HOOK_COOLDOWN = 20;
```

Set `const LADDER_INSET = 3;` (line 87). In the hook pull (line 369) use

```ts
    const speed = Math.max(1.2 * SCALE, 4 * SCALE * (1 - 0.04 * stones));
```

and on the ladder (line 538)

```ts
    const speed = 0.8 * SCALE * walkFactor(this.loadout.stones);
```

- [ ] **Step 5: Scale the world's wind and talk reach.** In `src/game/game.ts` set `const TALK_REACH = 24;` and in `windAt` return `0.06 * SCALE * dir;` (add `SCALE` to the import from `./tuning`). In `src/game/reach.ts` (line 256) replace the ladder probe

```ts
        if (!world.ladderAt(cx - 7, feetY - TUNING.bodyH, 14, TUNING.bodyH + 6)) continue;
```

with

```ts
        if (!world.ladderAt(cx - LADDER_PROBE, feetY - TUNING.bodyH, 2 * LADDER_PROBE, TUNING.bodyH + 6)) continue;
```

and add near the top of `src/game/reach.ts`, after the imports (add `SCALE` to the import from `./tuning`):

```ts
/** Half-width of the probe that looks for a ladder under a foothold. */
const LADDER_PROBE = Math.round(7 * SCALE);
```

- [ ] **Step 6: Run the new test**

```bash
npx vitest run tests/weight.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run the whole suite and update test geometry for the new scale**

```bash
npx vitest run 2>&1 | grep -E "FAIL|✗|×|AssertionError" | head -40
```

Tests that build small worlds with fixed positions fail where they assumed the old body or jump size. Fix each one by keeping its meaning, using these rules:
- A standing body's y is `floorTopPx - TUNING.bodyH`. Replace literal standing positions (for example `214` for a floor top at 232) with that expression, and update the comment that names the old number.
- Where a test needs a ledge to be *out of* reach (or just *in* reach), multiply its vertical distance by 1.5 and round to whole tiles. Widen the test grid if the ledge no longer fits.
- Widths that must fit the body (gaps, ladder slots) grow from the old body width 10 to 14 px: one tile more where a gap was exactly the body width.
- Never loosen an assertion's meaning (for example, "cannot reach" must stay "cannot reach").

Re-run until the suite is green:

```bash
npx vitest run 2>&1 | grep -E "Test Files|Tests "
```

Expected: every test file passes.

- [ ] **Step 8: Check the playgrounds and the level**

```bash
npx tsx tools/check-moves.ts && npm run check:levels
```

Expected: in `check-moves`, the row reached with `nothing` is lower (a larger row number) than with `claws`, `hook` and `both`; then `all 1 checks passed`. If `nothing` reaches the top of the playground, lower the playground's bottom-screen floor-to-top climb by moving its top ledges up (smaller row numbers) until it does not, keeping every ledge at row 4 or lower.

- [ ] **Step 9: Feel check on the grey tower.** Ask the user to run the dev server in the worktree (`npm run dev` in `/Users/samwelltech/Documents/Heavy Crown remake`) and open `/?test`, or ask permission to start it in the in-app browser. Charge and release a few jumps at no load and with items. The arcs should feel like the MVP's, only bigger. If the user reports the jump feels floaty or stiff, adjust `gravity` together with `maxJump` (keeping `maxJump / gravity` the same keeps airtime and changes only the feel of the rise), re-run Steps 6–8, and note the final values in the commit message. If the user doesn't want to try it now, record that in the commit message and continue: the arc shapes are the MVP's by construction.

- [ ] **Step 10: Type-check, build and commit**

```bash
npx tsc --noEmit && npm run build 2>&1 | tail -1
git add -A src tests tools
git commit -m "feat: the remake scale (climber 14x27, every distance and speed 1.5x)"
```

Expected before the commit: no type errors, `✓ built`.

---

### Task 5: Selective outlines

**Files:**
- Modify: `src/art/buffer.ts` (after `outline()`)
- Test: `tests/art.test.ts`

- [ ] **Step 1: Write the failing test** (append to `tests/art.test.ts`; add `import { PixelBuffer } from '../src/art/buffer';` and `import { hex } from '../src/art/color';` if they are not already imported)

```ts
describe('selective outline', () => {
  it('outlines each region in a dark tone of its own colour', () => {
    const b = new PixelBuffer(6, 3);
    b.set(1, 1, hex('#d6453b')); // red
    b.set(4, 1, hex('#3f4f8a')); // blue
    b.selout(hex('#120d24'), 0.6);
    const left = b.get(0, 1);
    const right = b.get(5, 1);
    expect(left).not.toBe(0);
    expect(right).not.toBe(0);
    expect(left).not.toBe(right);
    expect(left & 255).toBeGreaterThan((left >>> 16) & 255); // the red's outline stays reddish
    expect((right >>> 16) & 255).toBeGreaterThan(right & 255); // the blue's outline stays bluish
    expect(b.get(1, 1)).toBe(hex('#d6453b')); // the figure itself is untouched
  });
});
```

- [ ] **Step 2: Run it and see it fail**

```bash
npx vitest run tests/art.test.ts -t "selective outline"
```

Expected: FAIL, `b.selout is not a function`.

- [ ] **Step 3: Implement `selout()`** in `src/art/buffer.ts`, right after `outline()` (add `mix` to the import from `./color`):

```ts
  /**
   * Selective outline: every transparent pixel next to an opaque one (4-neighbour) becomes that neighbour's colour
   * mixed toward `dark` by `k`, so each region is outlined in a dark tone of its own colour (never flat black).
   */
  selout(dark: RGBA, k = 0.6): void {
    const src = this.clone();
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (src.get(x, y) >>> 24) continue;
        let n = 0;
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
          const c = src.inside(x + dx, y + dy) ? src.get(x + dx, y + dy) : 0;
          if (c >>> 24) {
            n = c;
            break;
          }
        }
        if (n) this.set(x, y, mix(n, dark, k));
      }
    }
  }
```

The neighbour order (below first) makes the outline under a figure take the colour of what it stands on (boots), and the outline above take the colour of the hood.

- [ ] **Step 4: Run the test**

```bash
npx vitest run tests/art.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/art/buffer.ts tests/art.test.ts
git commit -m "feat(art): selective outline"
```

---

### Task 6: Wren's sheet (idle pose and packs)

**Files:**
- Rewrite: `src/art/climber.ts`
- Test: `tests/art.test.ts`

The renderer (`src/render/scene.ts`), the pack gear (`src/render/packGear.ts`) and the preview tool use `FRAME_W`, `FRAME_H`, `FEET_X`, `FEET_Y`, `BODY_FRAMES`, `BodyFrame`, `FrameInfo`, `ClimberSheet`, `buildClimberSheet()` and `OUTLINE`. Keep every one of those names and shapes, so nothing else changes.

- [ ] **Step 1: Write the failing tests** (append to `tests/art.test.ts`)

```ts
import { BODY_FRAMES, buildClimberSheet, FEET_X, FEET_Y, FRAME_H, FRAME_W } from '../src/art/climber';

describe("Wren's sheet", () => {
  const { sheet, frames } = buildClimberSheet();
  /** Bounding box and colour count of one frame's opaque pixels. */
  const measure = (tier: number, name: (typeof BODY_FRAMES)[number]) => {
    const f = frames[tier][name];
    let x0 = FRAME_W, x1 = -1, y0 = FRAME_H, y1 = -1;
    const colours = new Set<number>();
    for (let y = 0; y < FRAME_H; y++)
      for (let x = 0; x < FRAME_W; x++) {
        const c = sheet.get(f.sx + x, f.sy + y);
        if (!(c >>> 24)) continue;
        colours.add(c);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
    return { w: x1 - x0 + 1, h: y1 - y0 + 1, bottom: y1, colours: colours.size };
  };

  it('is one row per load tier and one column per body frame, at the remake frame size', () => {
    expect([FRAME_W, FRAME_H]).toEqual([40, 44]);
    expect(sheet.w).toBe(BODY_FRAMES.length * FRAME_W);
    expect(sheet.h).toBe(5 * FRAME_H);
  });

  it('stands Wren about 30 px tall with the feet on FEET_Y', () => {
    const m = measure(0, 'idle0');
    expect(m.h).toBeGreaterThanOrEqual(29);
    expect(m.h).toBeLessThanOrEqual(33);
    expect(m.bottom).toBe(FEET_Y);
  });

  it('breathes: idle0 and idle1 differ', () => {
    const a = frames[0].idle0;
    const b = frames[0].idle1;
    let diff = 0;
    for (let y = 0; y < FRAME_H; y++) for (let x = 0; x < FRAME_W; x++) if (sheet.get(a.sx + x, a.sy + y) !== sheet.get(b.sx + x, b.sy + y)) diff++;
    expect(diff).toBeGreaterThan(4);
  });

  it('keeps to a small palette (selective outline tones included)', () => {
    expect(measure(2, 'idle0').colours).toBeLessThanOrEqual(36);
  });

  it('the pack grows with the load tier', () => {
    expect(frames[3].idle0.pack[3]).toBeGreaterThan(frames[1].idle0.pack[3]);
    expect(frames[1].idle0.pack[3]).toBeGreaterThan(frames[0].idle0.pack[3]);
  });

  it('puts the neck inside the frame, near the top of the body', () => {
    const [nx, ny] = frames[0].idle0.neck;
    expect(nx).toBeGreaterThan(FEET_X - 8);
    expect(nx).toBeLessThan(FEET_X + 8);
    expect(ny).toBeLessThan(FEET_Y - 15);
  });
});
```

- [ ] **Step 2: Run them and see them fail**

```bash
npx vitest run tests/art.test.ts -t "Wren"
```

Expected: FAIL (the frame size is still 28×30).

- [ ] **Step 3: Rewrite `src/art/climber.ts`** with this structure. The constants, palette, types and the builder are given in full. The pixel grids (`IDLE0`, `IDLE1` and the five `PACK_ROWS` entries) are drawn by hand in this step, to the art rules below.

```ts
import { PixelBuffer } from './buffer';
import { hex, type RGBA } from './color';
import { parseGrid } from './grid';

/**
 * Wren, the pilgrim (remake spec section 3). Hand-pixeled full-figure frames, facing right, with a pack per
 * load tier and a selective outline. Plan 1 draws the idle pose; plan 2 draws the other poses, which show idle0
 * until then.
 */

export const FRAME_W = 40;
export const FRAME_H = 44;
/** Feet sit on this row; the body is centred on FEET_X. */
export const FEET_Y = 43;
export const FEET_X = 20;

/** Hue-shifted ramps: shadows lean blue-purple, highlights lean warm. Letters are the grid legend. */
const PAL: Record<string, RGBA> = {
  // cloak (blue-grey), darkest to rim light
  a: hex('#1b1d3a'), b: hex('#2a3263'), c: hex('#3d4c86'), d: hex('#5a6fae'), e: hex('#8aa3d4'),
  // skin, shadow to highlight
  s: hex('#7a3e48'), t: hex('#c27862'), u: hex('#e8a982'), v: hex('#f8d3ac'),
  // scarf (Maren's red), dark to light
  q: hex('#5a1630'), r: hex('#9c2338'), R: hex('#d8463b'), l: hex('#f6905e'),
  // trousers and boots
  p: hex('#2a2238'), P: hex('#433a5c'), o: hex('#38221e'), O: hex('#5f3c2b'),
  // leather strap and brass buckle
  w: hex('#5a3424'), W: hex('#e2b45c'),
  // eye and hair under the hood
  k: hex('#120c1c'), h: hex('#4a2e2a'),
};
/** Pack canvas, straps and bedroll. */
const PACK_PAL: Record<string, RGBA> = {
  m: hex('#3b2a24'), n: hex('#6b4f37'), N: hex('#9c7b52'), L: hex('#cdab76'),
  w: hex('#5a3424'), W: hex('#e2b45c'), g: hex('#33402e'), G: hex('#56683f'),
};
/** The colour every outline leans toward (a deep violet, never black). */
export const OUTLINE = hex('#120d24');

const part = (rows: string[], pal: Record<string, RGBA>) => parseGrid(rows, pal);

// ---------- the idle pose: 24 wide × 34 tall, feet on the last row, body centred on column 12 ----------
const IDLE0 = part([/* drawn in this step */], PAL);
const IDLE1 = part([/* drawn in this step: IDLE0 breathing in */], PAL);

// ---------- packs per load tier (0 light satchel, 1–2 laden pack, 3–4 towering load) ----------
const PACK_ROWS: string[][] = [/* five grids drawn in this step */];
const PACKS = PACK_ROWS.map((rows) => part(rows, PACK_PAL));

/** Where the pose's neck (scarf root) and the top of its back (pack anchor) are, in pose-grid coordinates. */
const NECK: [number, number] = [/* measured from IDLE0 */];
const BACK: [number, number] = [/* measured from IDLE0 */];

/** Body frame names, in sheet order (unchanged from the MVP, so the renderer's state machine still works). */
export const BODY_FRAMES = [
  'idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'charge0', 'charge1', 'charge2',
  'rise', 'apex', 'fall0', 'fall1', 'land', 'bonk', 'stumble0', 'stumble1', 'stumble2', 'stumble3', 'ladder0', 'ladder1', 'pickup',
] as const;
export type BodyFrame = (typeof BODY_FRAMES)[number];

/** Poses drawn so far; every other frame shows idle0 until plan 2. */
const POSES: Partial<Record<BodyFrame, PixelBuffer>> = { idle0: IDLE0, idle1: IDLE1 };

export interface FrameInfo {
  /** Top-left of the frame in the sheet. */
  sx: number;
  sy: number;
  /** Neck point (scarf attaches here), in frame coordinates, facing right. */
  neck: [number, number];
  /** Top-left of the pack in frame coordinates (facing right), and its size. */
  pack: [number, number, number, number];
}

export interface ClimberSheet {
  sheet: PixelBuffer;
  /** frames[tier][bodyFrame] */
  frames: Record<BodyFrame, FrameInfo>[];
}

export function buildClimberSheet(): ClimberSheet {
  const sheet = new PixelBuffer(BODY_FRAMES.length * FRAME_W, 5 * FRAME_H);
  const frames: Record<BodyFrame, FrameInfo>[] = [];
  for (let tier = 0; tier < 5; tier++) {
    const row = {} as Record<BodyFrame, FrameInfo>;
    BODY_FRAMES.forEach((name, i) => {
      const pose = POSES[name] ?? IDLE0;
      // the pose grid sits on the frame's feet row, centred on FEET_X
      const ox = FEET_X - Math.floor(pose.w / 2);
      const oy = FEET_Y + 1 - pose.h;
      const pack = PACKS[tier];
      // the pack hangs on the back: its right edge overlaps the back by 3 px, its bottom near the belt
      const px = ox + BACK[0] - pack.w + 3;
      const py = oy + BACK[1] + 12 - pack.h;
      const frame = new PixelBuffer(FRAME_W, FRAME_H);
      frame.blit(pack, px, py);
      frame.blit(pose, ox, oy);
      frame.selout(OUTLINE, 0.6);
      const sx = i * FRAME_W;
      const sy = tier * FRAME_H;
      sheet.blit(frame, sx, sy);
      row[name] = { sx, sy, neck: [ox + NECK[0], oy + NECK[1]], pack: [px, py, pack.w, pack.h] };
    });
    frames.push(row);
  }
  return { sheet, frames };
}
```

**Art rules for the grids** (from the remake spec, section 3):
- **Proportions:** the figure is about 18 px wide and 30 px tall inside its 24×34 grid. Hood and head are 10 rows; torso and cloak 11; legs and boots 9. Big head, short legs: readable, not chibi.
- **Pose:** standing, weight on the back foot, facing right. The face is in 3/4 view under the hood: one dark eye (`k`) with a 1-px highlight (`v`), the nose and cheek lit (`u`, `v`), the jaw in shadow (`t`, `s`). A tuft of hair (`h`) shows under the hood's front.
- **Hood and cloak:** the hood comes to a soft point at the back. Light comes from the upper front (right), so the right edges get the rim colour `e` and the back side falls into `b` and `a`. The cloak hem is ragged: 2–3 notches of 1–2 px.
- **Scarf:** Maren's red (`R`) wraps the neck twice, with `l` on the top edge and `r`/`q` underneath. Its tails are **not** drawn here; the renderer's `Scarf` chain draws them from `NECK`.
- **Strap and belt:** one leather strap (`w`) crosses the chest from the right shoulder to the left hip, with a brass buckle (`W`). This is the strap the pack hangs from.
- **Boots:** `o` with an `O` toe highlight; trousers `p`/`P` show only between the cloak hem and the boots.
- **Breathing:** `IDLE1` is `IDLE0` with the hood, head and shoulders one row higher and the cloak hem unchanged (so the torso stretches by one row), and the scarf's top edge one row higher.
- **Packs:** tier 0 is a small satchel (about 8×7) at the hip; tiers 1–2 are a canvas pack (about 12×14 and 13×16) with a rolled green bedroll (`g`, `G`) on top; tiers 3–4 are a towering load (about 15×20 and 16×23) with bundles strapped on. Canvas highlights `L` face up and right, like the cloak.
- **No pure black and no pure white anywhere.** The darkest colour is `a`/`k`, the lightest is `v`/`L`.
- Set `NECK` to the pose-grid pixel where the scarf meets the back of the neck, and `BACK` to the top of the back at the shoulder blade.

- [ ] **Step 4: Run the tests**

```bash
npx vitest run tests/art.test.ts
```

Expected: PASS. If the palette test fails, merge near-duplicate colours in the grids (the selective outline adds one tone per neighbouring colour, so fewer colours touching the edge means fewer outline tones).

- [ ] **Step 5: Type-check and run the full suite**

```bash
npx tsc --noEmit && npx vitest run 2>&1 | grep -E "Test Files|Tests "
```

Expected: no type errors; every test file passes.

- [ ] **Step 6: Commit**

```bash
git add src/art/climber.ts tests/art.test.ts
git commit -m "feat(art): Wren's sheet (idle pose, packs per load tier, selective outline)"
```

---

### Task 7: Wren's portrait

**Files:**
- Create: `src/art/portraits.ts`
- Test: `tests/art.test.ts`

- [ ] **Step 1: Write the failing test** (append to `tests/art.test.ts`)

```ts
import { PORTRAIT_SIZE, portrait } from '../src/art/portraits';

describe('portraits', () => {
  it("draws Wren's neutral face at 64×64, mostly opaque, in a small palette", () => {
    const p = portrait('wren', 'neutral');
    expect([p.w, p.h]).toEqual([PORTRAIT_SIZE, PORTRAIT_SIZE]);
    let opaque = 0;
    const colours = new Set<number>();
    for (let y = 0; y < p.h; y++)
      for (let x = 0; x < p.w; x++) {
        const c = p.get(x, y);
        if (c >>> 24) {
          opaque++;
          colours.add(c);
        }
      }
    expect(opaque / (p.w * p.h)).toBeGreaterThan(0.45);
    expect(colours.size).toBeLessThanOrEqual(40);
  });
});
```

- [ ] **Step 2: Run it and see it fail**

```bash
npx vitest run tests/art.test.ts -t "portraits"
```

Expected: FAIL, `Cannot find module '../src/art/portraits'`.

- [ ] **Step 3: Create `src/art/portraits.ts`.** The module, the types and the composition are given in full. `WREN_BASE` (64 rows of 64 letters) and the `neutral` overlay are drawn by hand in this step, to the rules below.

```ts
import { PixelBuffer } from './buffer';
import { hex, type RGBA } from './color';
import { parseGrid } from './grid';

/**
 * Dialogue portraits (remake spec section 3.1): 64×64, one base bust per character plus an overlay per expression
 * (eyes, brows, mouth). Plan 1 draws Wren's neutral face; plan 2 adds Wren's other faces and the cast.
 */
export const PORTRAIT_SIZE = 64;

export type PortraitId = 'wren';
export type WrenFace = 'neutral';

/** Wren's portrait palette: the sprite's ramps with one extra step each, for the larger face. */
const WREN_PAL: Record<string, RGBA> = {
  a: hex('#1b1d3a'), b: hex('#2a3263'), c: hex('#3d4c86'), d: hex('#5a6fae'), e: hex('#8aa3d4'), f: hex('#b4c6e8'),
  s: hex('#6a3442'), t: hex('#a95f58'), u: hex('#d58c6e'), v: hex('#eeb48c'), V: hex('#fbdcb8'),
  q: hex('#5a1630'), r: hex('#9c2338'), R: hex('#d8463b'), l: hex('#f6905e'),
  h: hex('#3a2424'), H: hex('#5e3a30'), k: hex('#120c1c'), i: hex('#c9d4ee'), x: hex('#2a1a2e'),
};

const WREN_BASE = parseGrid([/* 64 rows × 64, drawn in this step */], WREN_PAL);
const WREN_FACES: Record<WrenFace, PixelBuffer> = {
  neutral: parseGrid([/* 64 rows × 64: eyes, brows and mouth only, everything else '.' */], WREN_PAL),
};

/** The portrait of `who` with expression `face`: the base bust with the face overlay on top, outlined. */
export function portrait(who: PortraitId, face: WrenFace): PixelBuffer {
  const out = new PixelBuffer(PORTRAIT_SIZE, PORTRAIT_SIZE);
  if (who === 'wren') {
    out.blit(WREN_BASE, 0, 0);
    out.blit(WREN_FACES[face], 0, 0);
  }
  out.selout(hex('#120d24'), 0.6);
  return out;
}
```

**Art rules for the portrait:**
- **Framing:** head and shoulders in 3/4 view facing right (Wren speaks from the left of the dialogue box). The head fills about 60% of the height. The bottom 1–2 rows are cut by the frame (no outline there), and there is at least a 1-px margin elsewhere.
- **Hood:** raised, the same blue-grey cloak ramp as the sprite, rim-lit `e`/`f` on the right edge, the inside of the hood in `a`/`b` shadow around the face.
- **Face:** 18 years old, ungendered, tired but determined. Large readable eyes, 4–5 px tall: `k` pupil, `i` white with a `x` shadow under the lid, a 1-px `V` catchlight. Brows are 1–2 px of hair colour `h`. The nose is a shape made of light and shadow (`u`/`t`), not a line. The mouth is a small `s` line.
- **Skin:** a hue-shifted ramp `s`→`V`: cooler and redder in the shadows (under the jaw, eye sockets, inside the hood), warm on the cheek and nose bridge. Add a few freckles in `t`.
- **Hair:** messy dark brown `h`/`H` strands falling from under the hood over the forehead.
- **Scarf:** Maren's red wrapped high around the neck and chin, folds lit `l` on top and `r`/`q` in the creases, two loose ends falling over the right shoulder.
- **Light:** from the upper right, matching the sprite. No pure black, no pure white.
- **Overlay discipline:** the `neutral` grid holds only the eyes, brows and mouth, so the faces added in plan 2 swap only those.

- [ ] **Step 4: Run the test**

```bash
npx vitest run tests/art.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/art/portraits.ts tests/art.test.ts
git commit -m "feat(art): Wren's portrait (neutral)"
```

---

### Task 8: The review sheet

**Files:**
- Modify: `tools/preview.ts` (a new `wren` mode, before the `screens` mode)

- [ ] **Step 1: Add the `wren` preview mode** to `tools/preview.ts`, after the `climber` block:

```ts
if (which === 'all' || which === 'wren') {
  const { sheet, frames } = buildClimberSheet();
  const { portrait, PORTRAIT_SIZE } = await import('../src/art/portraits');
  // top row: idle0 and idle1 at tiers 0, 1 and 3; then the portrait; each on a dark and a light panel
  const picks: [number, BodyFrame][] = [[0, 'idle0'], [0, 'idle1'], [1, 'idle0'], [3, 'idle0']];
  const pad = 4;
  const cellW = FRAME_W + pad;
  const out = new PixelBuffer(picks.length * cellW + PORTRAIT_SIZE + 3 * pad, Math.max(FRAME_H, PORTRAIT_SIZE) * 2 + 3 * pad);
  const panels = [hex('#2b2d3c'), hex('#8c97a8')];
  panels.forEach((bg, row) => {
    const y = pad + row * (Math.max(FRAME_H, PORTRAIT_SIZE) + pad);
    out.fillRect(0, y - pad / 2, out.w, Math.max(FRAME_H, PORTRAIT_SIZE) + pad, bg);
    picks.forEach(([t, f], i) => {
      const info = frames[t][f];
      out.blit(sheet, pad + i * cellW, y + PORTRAIT_SIZE - FRAME_H, false, info.sx, info.sy, FRAME_W, FRAME_H);
    });
    out.blit(portrait('wren', 'neutral'), picks.length * cellW + 2 * pad, y);
  });
  savePng(out, 'previews/wren.png', 6);
  console.log('previews/wren.png');

  // Wren at game size on the placeholder level's floor, so the scale can be judged against the tiles
  const world = buildWorld(LEVELS);
  const theme = THEMES[world.levels[0].theme];
  const band = world.screenCount - 1;
  const camY = band * SCREEN_H + VIEW_CROP;
  const view = new PixelBuffer(VIEW_W, VIEW_H);
  view.blit(paintSky(theme), 0, 0);
  view.blit(paintScreen(world, band, theme).buf, 0, -VIEW_CROP);
  const s = world.start;
  const f = frames[1].idle0;
  view.blit(sheet, s.x + Math.floor(TUNING.bodyW / 2) - FEET_X, s.y + TUNING.bodyH - 1 - FEET_Y - camY + 1, false, f.sx, f.sy, FRAME_W, FRAME_H);
  savePng(view, 'previews/wren-in-scene.png', 2);
  console.log('previews/wren-in-scene.png');
}
```

Add `import { hex } from '../src/art/color';` to the imports at the top of `tools/preview.ts`.

- [ ] **Step 2: Render it**

```bash
npm run art:preview wren
```

Expected: `previews/wren.png` and `previews/wren-in-scene.png`.

- [ ] **Step 3: Look at both images** (open them with the Read tool). Check against the art rules in Tasks 6 and 7: the silhouette reads at 1× in the scene image; the face reads in the portrait; the outlines are coloured, not black; the light comes from the upper right on both. Fix the grids and re-render until they hold.

- [ ] **Step 4: Commit**

```bash
git add tools/preview.ts
git commit -m "tools: art:preview wren review sheet"
```

---

### Task 9: Review gate (the user approves Wren)

**Files:** none

- [ ] **Step 1: Send both images to the user** (`SendUserFile` with `previews/wren.png` and `previews/wren-in-scene.png`, `display: "render"`).

- [ ] **Step 2: Ask the user whether Wren's look is approved,** and collect the changes they want (colours, proportions, face, pack). Apply them in `src/art/climber.ts` and `src/art/portraits.ts`, re-render with `npm run art:preview wren`, re-run `npx vitest run tests/art.test.ts`, commit, and ask again.

- [ ] **Step 3: Once approved, record it** in `docs/superpowers/plans/2026-11-18-remake-progress.md` (stage 2 "look approved") and commit. Plan 2 (Wren's animations, the rest of Wren's faces) starts from the approved style.
