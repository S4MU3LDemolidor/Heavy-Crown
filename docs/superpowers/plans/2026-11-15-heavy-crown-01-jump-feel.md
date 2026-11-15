# Heavy Crown — Plan 1 of 7: Jump Feel

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A playable grey two-screen test tower in the browser with the full Heavy Crown movement: walking, hold-to-charge jumps, no air control, wall bounces, ceiling bonks, hard-landing stumbles, weight that shortens jumps, and the sliding one-screen camera — tuned until it feels right.

**Architecture:** TypeScript on an HTML canvas, no runtime dependencies. Pure game logic (`src/game/`: tuning constants, weight formulas, tile grid, pixel-stepped body movement, player state machine, camera) has no DOM access and is unit-tested with Vitest; the climbability checker in a later plan reuses it. A thin engine layer (`src/engine/`: fixed 60 Hz loop, keyboard + gamepad input, integer-scaled renderer) and a debug renderer (`src/render/debugDraw.ts`) draw grey boxes until Plan 2 adds the art.

**Tech Stack:** TypeScript, Vite (dev server and build), Vitest (tests), Canvas 2D.

**Spec:** `docs/superpowers/specs/2026-11-15-heavy-crown-design.md` (sections 3, 4, 5, 12, 16 step 1).

---

## Roadmap (one plan per build stage, each ends playable)

1. **Jump feel** — this plan.
2. **Art and level I** — art scripts, climber sprite sheets, level I tiles/backgrounds/decoration, real level format with legends, level I playable.
3. **Items and weight** — item table, inventory, pickup/drop, weight meter, backpack tiers and lean, keys and gates, ropes and ladders, saving.
4. **Levels II–V** — water, hinged planks, pressure plates, cracked walls, bells, darkness, ice, wind, altar, crown; climbability checker passing.
5. **Atmosphere polish** — fog, lighting, parallax, particles, pixelfx effects, post-processing.
6. **Audio** — Higgsfield music (after credit approval) and synthesized sound.
7. **Menus and ending** — title, pause, map, options, title cards, ending and stats; final play-through.

Plans 2–7 are written when their stage starts, using what earlier stages taught us.

## File map for this plan

| File | Responsibility |
|---|---|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore` | project setup |
| `src/game/tuning.ts` | grid/screen sizes and all movement constants |
| `src/game/weight.ts` | weight formulas: jump height, speed factors, charge time, load tiers |
| `src/game/tiles.ts` | tile ids, `CollisionWorld` interface, `TileGrid` |
| `src/game/mapParse.ts` | turns text screens into a `TileGrid` and a start position |
| `src/game/body.ts` | pixel-stepped movement with sub-pixel remainders |
| `src/game/player.ts` | player state machine (ground, charge, air, stumble) and events |
| `src/game/camera.ts` | one-screen camera with an 11-frame ease-out slide |
| `src/engine/loop.ts` | fixed 60 Hz update loop |
| `src/engine/input.ts` | keyboard + gamepad → actions |
| `src/engine/renderer.ts` | 480×270 offscreen view, integer scaling to the window |
| `src/render/debugDraw.ts` | grey-box drawing of tiles, player and debug text |
| `src/content/levels/test-tower.ts` | the two-screen test playground |
| `src/main.ts` | wiring: input → player → camera → draw |
| `tests/helpers.ts` | `gridFrom()` for small test worlds |
| `tests/*.test.ts` | unit tests |

---

### Task 1: Project setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/main.ts`

- [ ] **Step 1: Initialize git and npm**

Run from the project root:

```bash
git init
npm init -y
npm install -D typescript vite vitest
```

Expected: `node_modules/` exists; `package.json` lists the three dev dependencies.

- [ ] **Step 2: Replace `package.json` scripts and metadata**

Edit `package.json` so it contains (keep the `devDependencies` versions npm wrote):

```json
{
  "name": "heavy-crown",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 4: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Heavy Crown</title>
    <style>
      html,
      body {
        margin: 0;
        height: 100%;
        background: #0b0a10;
        overflow: hidden;
      }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      canvas {
        display: block;
        image-rendering: pixelated;
        max-width: 100vw;
        max-height: 100vh;
      }
    </style>
  </head>
  <body>
    <canvas id="screen"></canvas>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: Write a placeholder `src/main.ts`**

```ts
const canvas = document.getElementById('screen') as HTMLCanvasElement;
canvas.width = 480;
canvas.height = 270;
const ctx = canvas.getContext('2d');
if (ctx) {
  ctx.fillStyle = '#1b1a24';
  ctx.fillRect(0, 0, 480, 270);
}
```

- [ ] **Step 7: Write `.gitignore`**

```
node_modules/
dist/
.DS_Store
```

- [ ] **Step 8: Verify it type-checks and serves**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

Run: `npm run dev`, open `http://localhost:5173`.
Expected: a dark rectangle in the middle of the page. Stop the server.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "chore: set up Heavy Crown project (Vite, TypeScript, Vitest)"
```

---

### Task 2: Tuning constants and weight formulas

**Files:**
- Create: `src/game/tuning.ts`, `src/game/weight.ts`
- Test: `tests/weight.test.ts`

- [ ] **Step 1: Write `src/game/tuning.ts`** (constants only; nothing to test on its own)

```ts
/** Size of one tile in pixels. */
export const TILE = 8;
/** One screen is 60×34 tiles (480×272 px). */
export const SCREEN_COLS = 60;
export const SCREEN_ROWS = 34;
export const SCREEN_W = TILE * SCREEN_COLS;
export const SCREEN_H = TILE * SCREEN_ROWS;
/** The view is 480×270: one pixel row of each screen is hidden at the top and bottom. */
export const VIEW_W = 480;
export const VIEW_H = 270;
export const VIEW_CROP = 1;

/**
 * Movement constants at weight 0 (spec section 4). Units: pixels, frames (60 per second).
 * Kept mutable so tuning and debug tools can change them live.
 */
export const TUNING = {
  gravity: 0.3,
  maxFall: 9,
  walkSpeed: 1.0,
  chargeFrames: 36,
  minJump: 12,
  maxJump: 80,
  jumpSpeedX: 2.2,
  wallBounce: 0.5,
  hardLandingFall: 136,
  stumbleFrames: 40,
  overloadedHop: 14,
  bodyW: 10,
  bodyH: 18,
  cameraSlideFrames: 11,
};
```

- [ ] **Step 2: Write the failing test `tests/weight.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { TUNING } from '../src/game/tuning';
import {
  chargeFramesFor,
  isOverloaded,
  jumpHeight,
  jumpHeightFactor,
  jumpSpeedXFactor,
  launchSpeed,
  loadTier,
  walkFactor,
} from '../src/game/weight';

describe('weight formulas (spec section 5)', () => {
  it('jump height factor drops 5% per stone, to 0.40 at 12 stones', () => {
    expect(jumpHeightFactor(0)).toBe(1);
    expect(jumpHeightFactor(5)).toBeCloseTo(0.75);
    expect(jumpHeightFactor(12)).toBeCloseTo(0.4);
  });

  it('horizontal jump and walk factors have floors', () => {
    expect(jumpSpeedXFactor(4)).toBeCloseTo(0.9);
    expect(jumpSpeedXFactor(20)).toBe(0.7);
    expect(walkFactor(5)).toBeCloseTo(0.85);
    expect(walkFactor(20)).toBe(0.6);
  });

  it('charging takes 4% longer per stone', () => {
    expect(chargeFramesFor(0)).toBe(TUNING.chargeFrames);
    expect(chargeFramesFor(12)).toBe(Math.round(TUNING.chargeFrames * 1.48));
  });

  it('load tiers match the spec table', () => {
    expect([0, 1, 4, 5, 8, 9, 12, 13, 20].map(loadTier)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it('is overloaded from 13 stones', () => {
    expect(isOverloaded(12)).toBe(false);
    expect(isOverloaded(13)).toBe(true);
  });

  it('jump height spans min..max with charge and scales with weight', () => {
    const { minJump, maxJump } = TUNING;
    expect(jumpHeight(0, 0)).toBe(minJump);
    expect(jumpHeight(1, 0)).toBe(maxJump);
    expect(jumpHeight(0.5, 0)).toBeCloseTo((minJump + maxJump) / 2);
    expect(jumpHeight(1, 10)).toBeCloseTo(maxJump * 0.5);
    expect(jumpHeight(2, 0)).toBe(maxJump);
    expect(jumpHeight(-1, 0)).toBe(minJump);
  });

  it('overloaded jumps are a fixed hop', () => {
    expect(jumpHeight(1, 13)).toBe(TUNING.overloadedHop);
    expect(jumpHeight(0, 15)).toBe(TUNING.overloadedHop);
  });

  it('spring boots multiply the height by 1.25 after the weight factor', () => {
    expect(jumpHeight(1, 2, { springBoots: true })).toBeCloseTo(TUNING.maxJump * 0.9 * 1.25);
  });

  it('launch speed reaches the requested height under gravity', () => {
    const v = launchSpeed(80);
    expect((v * v) / (2 * TUNING.gravity)).toBeCloseTo(80);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/weight.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/weight"`.

- [ ] **Step 4: Write `src/game/weight.ts`**

```ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run tests/weight.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 6: Commit**

```bash
git add src/game/tuning.ts src/game/weight.ts tests/weight.test.ts
git commit -m "feat: add movement tuning and weight formulas"
```

---

### Task 3: Tile grid and text map parsing

**Files:**
- Create: `src/game/tiles.ts`, `src/game/mapParse.ts`, `tests/helpers.ts`
- Test: `tests/mapParse.test.ts`

- [ ] **Step 1: Write `src/game/tiles.ts`**

```ts
import { TILE } from './tuning';

export const Tile = {
  Empty: 0,
  Solid: 1,
} as const;

export type TileId = (typeof Tile)[keyof typeof Tile];

/** Anything bodies can collide with. */
export interface CollisionWorld {
  /** True if any solid tile overlaps the rectangle (pixels; top-left corner and size). */
  solidRect(x: number, y: number, w: number, h: number): boolean;
}

/** The tower's tiles, row-major, row 0 at the top of the tower. */
export class TileGrid implements CollisionWorld {
  readonly cols: number;
  readonly rows: number;
  private readonly cells: Uint8Array;

  constructor(cols: number, rows: number, cells: Uint8Array) {
    if (cells.length !== cols * rows) {
      throw new Error(`TileGrid: expected ${cols * rows} cells, got ${cells.length}`);
    }
    this.cols = cols;
    this.rows = rows;
    this.cells = cells;
  }

  /** Left, right and below the tower are solid; above the top is open sky. */
  get(tx: number, ty: number): TileId {
    if (tx < 0 || tx >= this.cols || ty >= this.rows) return Tile.Solid;
    if (ty < 0) return Tile.Empty;
    return this.cells[ty * this.cols + tx] as TileId;
  }

  isSolid(tx: number, ty: number): boolean {
    return this.get(tx, ty) === Tile.Solid;
  }

  solidRect(x: number, y: number, w: number, h: number): boolean {
    const x0 = Math.floor(x / TILE);
    const x1 = Math.floor((x + w - 1) / TILE);
    const y0 = Math.floor(y / TILE);
    const y1 = Math.floor((y + h - 1) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (this.isSolid(tx, ty)) return true;
      }
    }
    return false;
  }
}
```

- [ ] **Step 2: Write `tests/helpers.ts`**

```ts
import { Tile, TileGrid } from '../src/game/tiles';

/** Builds a small grid from strings: '#' is solid, anything else is empty. */
export function gridFrom(lines: string[]): TileGrid {
  const cols = lines[0].length;
  const rows = lines.length;
  const cells = new Uint8Array(cols * rows);
  lines.forEach((line, y) => {
    if (line.length !== cols) throw new Error(`gridFrom: row ${y} has ${line.length} columns, expected ${cols}`);
    for (let x = 0; x < cols; x++) cells[y * cols + x] = line[x] === '#' ? Tile.Solid : Tile.Empty;
  });
  return new TileGrid(cols, rows, cells);
}

/** A blank 60×34 screen of interior space. */
export function blankScreen(): string[] {
  return Array.from({ length: 34 }, () => ' '.repeat(60));
}

/** Returns a copy of `screen` with one character replaced. */
export function put(screen: string[], x: number, y: number, ch: string): string[] {
  return screen.map((row, i) => (i === y ? row.slice(0, x) + ch + row.slice(x + 1) : row));
}
```

- [ ] **Step 3: Write the failing test `tests/mapParse.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { parseTower } from '../src/game/mapParse';
import { Tile } from '../src/game/tiles';
import { TILE, TUNING } from '../src/game/tuning';
import { blankScreen, put } from './helpers';

describe('parseTower', () => {
  it('stacks screens top first and reads solids and the start marker', () => {
    const top = put(blankScreen(), 0, 0, '#');
    let bottom = put(blankScreen(), 5, 33, '#');
    bottom = put(bottom, 5, 32, '@');
    const tower = parseTower([top, bottom]);

    expect(tower.screenCount).toBe(2);
    expect(tower.grid.cols).toBe(60);
    expect(tower.grid.rows).toBe(68);
    expect(tower.grid.isSolid(0, 0)).toBe(true);
    expect(tower.grid.isSolid(5, 67)).toBe(true);
    expect(tower.grid.isSolid(5, 66)).toBe(false);
    // body centered on the '@' tile, feet on the bottom of that tile
    expect(tower.start).toEqual({
      x: 5 * TILE + Math.floor((TILE - TUNING.bodyW) / 2),
      y: 67 * TILE - TUNING.bodyH,
    });
  });

  it("treats ' ' and '.' as empty", () => {
    let s = put(blankScreen(), 1, 1, '.');
    s = put(s, 2, 2, '@');
    const tower = parseTower([s]);
    expect(tower.grid.get(1, 1)).toBe(Tile.Empty);
  });

  it('treats outside the sides and bottom as solid and above the top as sky', () => {
    const tower = parseTower([put(blankScreen(), 2, 2, '@')]);
    expect(tower.grid.isSolid(-1, 5)).toBe(true);
    expect(tower.grid.isSolid(60, 5)).toBe(true);
    expect(tower.grid.isSolid(5, 34)).toBe(true);
    expect(tower.grid.isSolid(5, -1)).toBe(false);
  });

  it('rejects wrong sizes, unknown characters and bad start markers', () => {
    const ok = put(blankScreen(), 2, 2, '@');
    expect(() => parseTower([ok.slice(1)])).toThrow(/expected 34 rows/);
    expect(() => parseTower([put(ok, 0, 0, 'Z')])).toThrow(/unknown character 'Z'/);
    expect(() => parseTower([ok.map((r, i) => (i === 3 ? r + ' ' : r))])).toThrow(/expected 60 columns/);
    expect(() => parseTower([blankScreen()])).toThrow(/no @ start marker/);
    expect(() => parseTower([put(ok, 4, 4, '@')])).toThrow(/more than one @/);
  });
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npx vitest run tests/mapParse.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/mapParse"`.

- [ ] **Step 5: Write `src/game/mapParse.ts`**

```ts
import { SCREEN_COLS, SCREEN_ROWS, TILE, TUNING } from './tuning';
import { Tile, TileGrid } from './tiles';

export interface ParsedTower {
  grid: TileGrid;
  screenCount: number;
  /** Player start: top-left of the body in pixels, from the '@' marker. */
  start: { x: number; y: number };
}

const CHAR_TILES: Record<string, number> = {
  '#': Tile.Solid,
  ' ': Tile.Empty,
  '.': Tile.Empty,
  '@': Tile.Empty,
};

/** `screens` is ordered from the top of the tower down; each is 34 rows of 60 characters. */
export function parseTower(screens: string[][]): ParsedTower {
  const cols = SCREEN_COLS;
  const rows = screens.length * SCREEN_ROWS;
  const cells = new Uint8Array(cols * rows);
  let start: { x: number; y: number } | null = null;

  for (let si = 0; si < screens.length; si++) {
    const screen = screens[si];
    if (screen.length !== SCREEN_ROWS) {
      throw new Error(`screen ${si}: expected ${SCREEN_ROWS} rows, got ${screen.length}`);
    }
    for (let ry = 0; ry < SCREEN_ROWS; ry++) {
      const line = screen[ry];
      if (line.length !== cols) {
        throw new Error(`screen ${si} row ${ry}: expected ${cols} columns, got ${line.length}`);
      }
      const ty = si * SCREEN_ROWS + ry;
      for (let tx = 0; tx < cols; tx++) {
        const ch = line[tx];
        const tile = CHAR_TILES[ch];
        if (tile === undefined) {
          throw new Error(`screen ${si} row ${ry} col ${tx}: unknown character '${ch}'`);
        }
        cells[ty * cols + tx] = tile;
        if (ch === '@') {
          if (start) throw new Error('more than one @ start marker');
          start = {
            x: tx * TILE + Math.floor((TILE - TUNING.bodyW) / 2),
            y: (ty + 1) * TILE - TUNING.bodyH,
          };
        }
      }
    }
  }

  if (!start) throw new Error('no @ start marker');
  return { grid: new TileGrid(cols, rows, cells), screenCount: screens.length, start };
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run tests/mapParse.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 7: Commit**

```bash
git add src/game/tiles.ts src/game/mapParse.ts tests/helpers.ts tests/mapParse.test.ts
git commit -m "feat: add tile grid and text map parsing"
```

---

### Task 4: Pixel-stepped body movement

**Files:**
- Create: `src/game/body.ts`
- Test: `tests/body.test.ts`

- [ ] **Step 1: Write the failing test `tests/body.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { makeBody, moveX, moveY, onGround } from '../src/game/body';
import { gridFrom } from './helpers';

// Interior spans x 8..39 and y 0..23; the floor's top is at y = 24.
const box = () => gridFrom(['#....#', '#....#', '#....#', '######']);

describe('body movement', () => {
  it('moveX stops flush against a wall and reports the hit', () => {
    const b = makeBody(8, 6, 10, 18);
    expect(moveX(b, 100, box())).toBe(true);
    expect(b.x).toBe(30);
    expect(b.remX).toBe(0);
    expect(moveX(b, -100, box())).toBe(true);
    expect(b.x).toBe(8);
  });

  it('moveX accumulates sub-pixel movement', () => {
    const b = makeBody(8, 6, 10, 18);
    expect(moveX(b, 0.4, box())).toBe(false);
    expect(b.x).toBe(8);
    moveX(b, 0.4, box());
    expect(b.x).toBe(9);
    expect(b.remX).toBeCloseTo(-0.2);
  });

  it('moveY lands on the floor and onGround sees it', () => {
    const b = makeBody(8, 0, 10, 18);
    expect(onGround(b, box())).toBe(false);
    expect(moveY(b, 50, box())).toBe(true);
    expect(b.y).toBe(6);
    expect(onGround(b, box())).toBe(true);
  });

  it('moveY returns false when nothing is in the way', () => {
    const b = makeBody(8, 6, 10, 18);
    expect(moveY(b, -3, box())).toBe(false);
    expect(b.y).toBe(3);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/body.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/body"`.

- [ ] **Step 3: Write `src/game/body.ts`**

```ts
import type { CollisionWorld } from './tiles';

/** An axis-aligned box at whole-pixel coordinates, with sub-pixel remainders. */
export interface Body {
  x: number;
  y: number;
  w: number;
  h: number;
  remX: number;
  remY: number;
}

export function makeBody(x: number, y: number, w: number, h: number): Body {
  return { x, y, w, h, remX: 0, remY: 0 };
}

/** Moves horizontally one pixel at a time. Returns true if a wall stopped the move. */
export function moveX(body: Body, amount: number, world: CollisionWorld): boolean {
  body.remX += amount;
  let move = Math.round(body.remX);
  if (move === 0) return false;
  body.remX -= move;
  const step = Math.sign(move);
  while (move !== 0) {
    if (world.solidRect(body.x + step, body.y, body.w, body.h)) {
      body.remX = 0;
      return true;
    }
    body.x += step;
    move -= step;
  }
  return false;
}

/** Moves vertically one pixel at a time. Returns true if a floor or ceiling stopped the move. */
export function moveY(body: Body, amount: number, world: CollisionWorld): boolean {
  body.remY += amount;
  let move = Math.round(body.remY);
  if (move === 0) return false;
  body.remY -= move;
  const step = Math.sign(move);
  while (move !== 0) {
    if (world.solidRect(body.x, body.y + step, body.w, body.h)) {
      body.remY = 0;
      return true;
    }
    body.y += step;
    move -= step;
  }
  return false;
}

/** True if something solid is directly under the body's feet. */
export function onGround(body: Body, world: CollisionWorld): boolean {
  return world.solidRect(body.x, body.y + body.h, body.w, 1);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/body.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/game/body.ts tests/body.test.ts
git commit -m "feat: add pixel-stepped body movement"
```

---

### Task 5: Player — walking, charging and jumping

**Files:**
- Create: `src/game/player.ts`
- Test: `tests/player.test.ts`

- [ ] **Step 1: Write the failing test `tests/player.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { Player, type PlayerEvent, type PlayerInput } from '../src/game/player';
import type { TileGrid } from '../src/game/tiles';
import { TUNING } from '../src/game/tuning';
import { gridFrom } from './helpers';

const NONE: PlayerInput = { left: false, right: false, jump: false };

/** Runs `frames` updates with the same input and collects all events. */
function step(p: Player, world: TileGrid, input: Partial<PlayerInput>, frames = 1): PlayerEvent[] {
  const events: PlayerEvent[] = [];
  for (let i = 0; i < frames; i++) {
    p.update({ ...NONE, ...input }, world);
    events.push(...p.events);
  }
  return events;
}

/** Runs with no input until the player is no longer airborne. Returns the highest body y reached and the events. */
function untilLanded(p: Player, world: TileGrid): { top: number; events: PlayerEvent[] } {
  let top = p.body.y;
  const events: PlayerEvent[] = [];
  for (let i = 0; i < 1000 && p.state === 'air'; i++) {
    events.push(...step(p, world, {}));
    top = Math.min(top, p.body.y);
  }
  return { top, events };
}

/** 12×30 tile room. Floor top at y = 232, so a standing body has y = 214. Inner walls at x = 8 and x = 88. */
function room(): TileGrid {
  return gridFrom([...Array.from({ length: 29 }, () => '#..........#'), '############']);
}

describe('player: walking, charging, jumping', () => {
  it('walks at walk speed, slower when heavy', () => {
    const w = room();
    const p = new Player(40, 214);
    step(p, w, { right: true });
    expect(p.vx).toBeCloseTo(TUNING.walkSpeed);
    expect(p.facing).toBe(1);
    p.loadout.stones = 10;
    step(p, w, { left: true });
    expect(p.vx).toBeCloseTo(-TUNING.walkSpeed * 0.7);
    expect(p.facing).toBe(-1);
  });

  it('charges while jump is held and a full-charge jump rises maxJump pixels', () => {
    const w = room();
    const p = new Player(40, 214);
    const startEvents = step(p, w, { jump: true });
    expect(startEvents).toContainEqual({ type: 'chargeStart' });
    step(p, w, { jump: true }, TUNING.chargeFrames);
    expect(p.state).toBe('charge');
    expect(p.charge).toBe(1);

    const jumpEvents = step(p, w, {});
    expect(jumpEvents).toContainEqual({ type: 'jump', charge: 1 });
    expect(p.state).toBe('air');

    const { top } = untilLanded(p, w);
    const rise = 214 - top;
    expect(rise).toBeGreaterThanOrEqual(TUNING.maxJump - 1);
    expect(rise).toBeLessThanOrEqual(TUNING.maxJump + 1);
    expect(p.state).toBe('ground');
    expect(p.body.y).toBe(214);
  });

  it('a tap jump rises minJump pixels', () => {
    const w = room();
    const p = new Player(40, 214);
    step(p, w, { jump: true });
    step(p, w, {});
    const { top } = untilLanded(p, w);
    const rise = 214 - top;
    expect(rise).toBeGreaterThanOrEqual(TUNING.minJump - 1);
    expect(rise).toBeLessThanOrEqual(TUNING.minJump + 1);
  });

  it('weight shortens the jump (10 stones = half height)', () => {
    const w = room();
    const p = new Player(40, 214);
    p.loadout.stones = 10;
    step(p, w, { jump: true }, 80);
    step(p, w, {});
    const { top } = untilLanded(p, w);
    const rise = 214 - top;
    expect(rise).toBeGreaterThanOrEqual(TUNING.maxJump * 0.5 - 1);
    expect(rise).toBeLessThanOrEqual(TUNING.maxJump * 0.5 + 1);
  });

  it('cannot walk while charging and jumps toward the arrow held at release', () => {
    const w = room();
    const p = new Player(40, 214);
    step(p, w, { jump: true, right: true }, 20);
    expect(p.body.x).toBe(40);
    step(p, w, { right: true });
    expect(p.state).toBe('air');
    expect(p.vx).toBeCloseTo(TUNING.jumpSpeedX);
  });

  it('a jump with no arrow held goes straight up', () => {
    const w = room();
    const p = new Player(40, 214);
    step(p, w, { jump: true }, 10);
    step(p, w, {});
    expect(p.vx).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/player.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/player"`.

- [ ] **Step 3: Write `src/game/player.ts`**

This is the complete player, including air movement and stumbling (tested in Task 6).

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/player.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/game/player.ts tests/player.test.ts
git commit -m "feat: add player walking, charging and jumping"
```

---

### Task 6: Player — wall bounces, ceilings, falls and stumbles

**Files:**
- Modify: `tests/player.test.ts` (append a second `describe` block)

The behavior was written in Task 5; this task proves it.

- [ ] **Step 1: Append these tests to `tests/player.test.ts`**

```ts
/** 12×10 room with a ceiling. Floor top at y = 72 (standing body y = 54); ceiling bottom at y = 8. */
function lowRoom(): TileGrid {
  return gridFrom(['############', ...Array.from({ length: 8 }, () => '#..........#'), '############']);
}

/** 12×30 room with a ledge (cols 1–4, row 5). Standing on the ledge: body y = 22; on the floor: 214. */
function ledgeRoom(): TileGrid {
  return gridFrom([
    ...Array.from({ length: 5 }, () => '#..........#'),
    '#####......#',
    ...Array.from({ length: 23 }, () => '#..........#'),
    '############',
  ]);
}

/** Walks right off the ledge in ledgeRoom and returns once airborne. */
function walkOffLedge(p: Player, w: TileGrid): void {
  for (let i = 0; i < 100 && p.state !== 'air'; i++) step(p, w, { right: true });
}

describe('player: walls, ceilings, falls', () => {
  it('bounces off walls at wallBounce times the speed', () => {
    const w = room();
    const p = new Player(40, 214);
    step(p, w, { jump: true, right: true }, TUNING.chargeFrames + 1);
    step(p, w, { right: true });
    let bonked = false;
    for (let i = 0; i < 200 && !bonked; i++) {
      bonked = step(p, w, {}).some((e) => e.type === 'bonkWall');
    }
    expect(bonked).toBe(true);
    expect(p.vx).toBeCloseTo(-TUNING.jumpSpeedX * TUNING.wallBounce);
    expect(p.facing).toBe(-1);
  });

  it('a ceiling stops the rise and the player falls back down', () => {
    const w = lowRoom();
    const p = new Player(40, 54);
    step(p, w, { jump: true }, TUNING.chargeFrames + 1);
    step(p, w, {});
    const { top, events } = untilLanded(p, w);
    expect(events.some((e) => e.type === 'bonkCeiling')).toBe(true);
    expect(top).toBe(8);
    expect(p.state).toBe('ground');
  });

  it('walking off a ledge keeps walking speed', () => {
    const w = ledgeRoom();
    const p = new Player(16, 22);
    walkOffLedge(p, w);
    expect(p.state).toBe('air');
    expect(p.vx).toBeCloseTo(TUNING.walkSpeed);
  });

  it('a long fall stumbles for stumbleFrames and ignores input meanwhile', () => {
    const w = ledgeRoom();
    const p = new Player(16, 22);
    walkOffLedge(p, w);
    const { events } = untilLanded(p, w);
    expect(events.find((e) => e.type === 'land')).toEqual({ type: 'land', fall: 192, drop: 192, hard: true });
    expect(p.state).toBe('stumble');

    const x = p.body.x;
    step(p, w, { right: true, jump: true }, TUNING.stumbleFrames - 1);
    expect(p.state).toBe('stumble');
    expect(p.body.x).toBe(x);
    step(p, w, {});
    expect(p.state).toBe('ground');
  });

  it('the Feather Charm prevents the stumble', () => {
    const w = ledgeRoom();
    const p = new Player(16, 22);
    p.loadout.noStumble = true;
    walkOffLedge(p, w);
    const { events } = untilLanded(p, w);
    expect(events.find((e) => e.type === 'land')).toMatchObject({ hard: false });
    expect(p.state).toBe('ground');
  });

  it('a normal jump landing does not stumble', () => {
    const w = room();
    const p = new Player(40, 214);
    step(p, w, { jump: true }, TUNING.chargeFrames + 1);
    step(p, w, {});
    const { events } = untilLanded(p, w);
    expect(events.find((e) => e.type === 'land')).toMatchObject({ hard: false, drop: 0 });
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `npx vitest run tests/player.test.ts`
Expected: PASS, 12 tests. If a number is off by a pixel, check the room geometry comments before touching `player.ts`.

- [ ] **Step 3: Commit**

```bash
git add tests/player.test.ts
git commit -m "test: cover wall bounces, ceilings, falls and stumbles"
```

---

### Task 7: Camera

**Files:**
- Create: `src/game/camera.ts`
- Test: `tests/camera.test.ts`

- [ ] **Step 1: Write the failing test `tests/camera.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { Camera } from '../src/game/camera';
import { SCREEN_H, TUNING, VIEW_CROP } from '../src/game/tuning';

describe('camera', () => {
  it('starts on the bottom screen', () => {
    const c = new Camera(3);
    expect(c.band).toBe(2);
    expect(c.y).toBe(2 * SCREEN_H + VIEW_CROP);
    expect(c.screenFromBottom).toBe(0);
  });

  it('slides to a new screen over cameraSlideFrames frames', () => {
    const c = new Camera(3);
    const focus = SCREEN_H + 20; // inside band 1
    c.update(focus);
    expect(c.band).toBe(1);
    expect(c.y).toBeLessThan(2 * SCREEN_H + VIEW_CROP);
    expect(c.y).toBeGreaterThan(SCREEN_H + VIEW_CROP);
    for (let i = 1; i < TUNING.cameraSlideFrames; i++) c.update(focus);
    expect(c.y).toBe(SCREEN_H + VIEW_CROP);
    expect(c.screenFromBottom).toBe(1);
  });

  it('snapTo jumps without sliding', () => {
    const c = new Camera(3);
    c.snapTo(10);
    expect(c.band).toBe(0);
    expect(c.y).toBe(VIEW_CROP);
  });

  it('clamps to the tower', () => {
    const c = new Camera(3);
    expect(c.bandAt(-50)).toBe(0);
    expect(c.bandAt(99999)).toBe(2);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/camera.test.ts`
Expected: FAIL — `Failed to resolve import "../src/game/camera"`.

- [ ] **Step 3: Write `src/game/camera.ts`**

```ts
import { SCREEN_H, TUNING, VIEW_CROP } from './tuning';

/** Shows one screen at a time and slides between screens. Bands are counted from the top of the tower. */
export class Camera {
  readonly bandCount: number;
  band: number;
  /** World y of the top of the view in pixels (fractional during a slide). */
  y: number;
  private fromY = 0;
  private toY = 0;
  private slideFrame = 0;
  private slideTotal = 0;

  constructor(bandCount: number, startBand = bandCount - 1) {
    this.bandCount = bandCount;
    this.band = startBand;
    this.y = this.bandTop(startBand);
  }

  bandTop(band: number): number {
    return band * SCREEN_H + VIEW_CROP;
  }

  bandAt(worldY: number): number {
    return Math.min(this.bandCount - 1, Math.max(0, Math.floor(worldY / SCREEN_H)));
  }

  /** Screen number counted from the bottom of the tower, starting at 0. */
  get screenFromBottom(): number {
    return this.bandCount - 1 - this.band;
  }

  snapTo(worldY: number): void {
    this.band = this.bandAt(worldY);
    this.y = this.bandTop(this.band);
    this.slideFrame = this.slideTotal;
  }

  update(focusY: number): void {
    const target = this.bandAt(focusY);
    if (target !== this.band) {
      this.band = target;
      this.fromY = this.y;
      this.toY = this.bandTop(target);
      this.slideFrame = 0;
      this.slideTotal = TUNING.cameraSlideFrames;
    }
    if (this.slideFrame < this.slideTotal) {
      this.slideFrame++;
      const t = this.slideFrame / this.slideTotal;
      const eased = 1 - Math.pow(1 - t, 3);
      this.y = this.fromY + (this.toY - this.fromY) * eased;
    }
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/camera.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/game/camera.ts tests/camera.test.ts
git commit -m "feat: add sliding one-screen camera"
```

---

### Task 8: Engine — loop, input, renderer

**Files:**
- Create: `src/engine/loop.ts`, `src/engine/input.ts`, `src/engine/renderer.ts`

These touch the browser and are checked by playing in Task 9.

- [ ] **Step 1: Write `src/engine/loop.ts`**

```ts
export const STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;

/** Runs `update` at a fixed 60 Hz and `render` once per animation frame. */
export function startLoop(update: () => void, render: () => void): void {
  let last = performance.now();
  let acc = 0;
  const frame = (now: number) => {
    acc += Math.min(250, now - last);
    last = now;
    let steps = 0;
    while (acc >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
      update();
      acc -= STEP_MS;
      steps++;
    }
    if (steps === MAX_STEPS_PER_FRAME) acc = 0;
    render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
```

- [ ] **Step 2: Write `src/engine/input.ts`**

```ts
export type Action = 'left' | 'right' | 'up' | 'down' | 'jump' | 'interact' | 'inventory' | 'drop' | 'pause';

const KEYS: Record<string, Action> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'jump',
  KeyE: 'interact',
  Tab: 'inventory',
  KeyI: 'inventory',
  KeyQ: 'drop',
  Escape: 'pause',
};

/** Standard-mapping gamepad buttons (spec section 12). */
const PAD_BUTTONS: Array<[number, Action]> = [
  [0, 'jump'],
  [1, 'drop'],
  [2, 'interact'],
  [3, 'inventory'],
  [9, 'pause'],
  [12, 'up'],
  [13, 'down'],
  [14, 'left'],
  [15, 'right'],
];

const STICK_DEADZONE = 0.5;

/** Keyboard + gamepad. Call `poll()` once per update step, then read. */
export class Input {
  private readonly codesDown = new Set<string>();
  private codesPressedQueue = new Set<string>();
  private codesPressed = new Set<string>();
  private now = new Set<Action>();
  private before = new Set<Action>();

  constructor(target: Window) {
    target.addEventListener('keydown', (e) => {
      if (KEYS[e.code]) e.preventDefault();
      if (!e.repeat) this.codesPressedQueue.add(e.code);
      this.codesDown.add(e.code);
    });
    target.addEventListener('keyup', (e) => {
      this.codesDown.delete(e.code);
    });
    target.addEventListener('blur', () => {
      this.codesDown.clear();
    });
  }

  poll(): void {
    const swap = this.before;
    this.before = this.now;
    this.now = swap;
    this.now.clear();
    for (const code of this.codesDown) {
      const action = KEYS[code];
      if (action) this.now.add(action);
    }
    this.pollGamepads();
    this.codesPressed = this.codesPressedQueue;
    this.codesPressedQueue = new Set();
  }

  held(action: Action): boolean {
    return this.now.has(action);
  }

  pressed(action: Action): boolean {
    return this.now.has(action) && !this.before.has(action);
  }

  /** A raw key (KeyboardEvent.code) pressed this step, for debug shortcuts. */
  keyPressed(code: string): boolean {
    return this.codesPressed.has(code);
  }

  private pollGamepads(): void {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    for (const pad of navigator.getGamepads()) {
      if (!pad) continue;
      for (const [index, action] of PAD_BUTTONS) {
        if (pad.buttons[index]?.pressed) this.now.add(action);
      }
      const ax = pad.axes[0] ?? 0;
      const ay = pad.axes[1] ?? 0;
      if (ax < -STICK_DEADZONE) this.now.add('left');
      if (ax > STICK_DEADZONE) this.now.add('right');
      if (ay < -STICK_DEADZONE) this.now.add('up');
      if (ay > STICK_DEADZONE) this.now.add('down');
    }
  }
}
```

- [ ] **Step 3: Write `src/engine/renderer.ts`**

```ts
import { VIEW_H, VIEW_W } from '../game/tuning';

/** Draws into a 480×270 view, then copies it to the page canvas at the largest whole-number scale. */
export class Renderer {
  readonly view: CanvasRenderingContext2D;
  scale = 1;
  private readonly canvas: HTMLCanvasElement;
  private readonly viewCanvas: HTMLCanvasElement;
  private readonly out: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.viewCanvas = document.createElement('canvas');
    this.viewCanvas.width = VIEW_W;
    this.viewCanvas.height = VIEW_H;
    const view = this.viewCanvas.getContext('2d');
    const out = canvas.getContext('2d');
    if (!view || !out) throw new Error('Canvas 2D is not available');
    this.view = view;
    this.out = out;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const fit = Math.min((window.innerWidth * dpr) / VIEW_W, (window.innerHeight * dpr) / VIEW_H);
    this.scale = Math.max(1, Math.floor(fit));
    this.canvas.width = VIEW_W * this.scale;
    this.canvas.height = VIEW_H * this.scale;
    this.canvas.style.width = `${(VIEW_W * this.scale) / dpr}px`;
    this.canvas.style.height = `${(VIEW_H * this.scale) / dpr}px`;
  }

  present(): void {
    this.out.imageSmoothingEnabled = false;
    this.out.drawImage(this.viewCanvas, 0, 0, this.canvas.width, this.canvas.height);
  }
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add src/engine
git commit -m "feat: add fixed-step loop, keyboard/gamepad input and integer-scaled renderer"
```

---

### Task 9: Test tower, debug drawing and wiring

**Files:**
- Create: `src/content/levels/test-tower.ts`, `src/render/debugDraw.ts`
- Modify: `src/main.ts` (replace the placeholder entirely)
- Test: `tests/testTower.test.ts`

- [ ] **Step 1: Write the failing test `tests/testTower.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { TEST_TOWER } from '../src/content/levels/test-tower';
import { parseTower } from '../src/game/mapParse';

describe('test tower', () => {
  it('parses into two screens with a start position on the bottom screen', () => {
    const tower = parseTower(TEST_TOWER);
    expect(tower.screenCount).toBe(2);
    expect(tower.start.y).toBeGreaterThan(272);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/testTower.test.ts`
Expected: FAIL — `Failed to resolve import "../src/content/levels/test-tower"`.

- [ ] **Step 3: Write `src/content/levels/test-tower.ts`**

```ts
import { SCREEN_COLS, SCREEN_ROWS } from '../../game/tuning';

type Rect = [x: number, y: number, w: number, h: number];

/** Builds one 60×34 screen: outer walls, solid rectangles (in tiles) and an optional '@' start. */
function buildScreen(solids: Rect[], start?: [x: number, y: number]): string[] {
  const g = Array.from({ length: SCREEN_ROWS }, () => Array<string>(SCREEN_COLS).fill(' '));
  for (const row of g) {
    row[0] = '#';
    row[SCREEN_COLS - 1] = '#';
  }
  for (const [x, y, w, h] of solids) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) g[y + j][x + i] = '#';
  }
  if (start) g[start[1]][start[0]] = '@';
  return g.map((row) => row.join(''));
}

/**
 * Grey two-screen playground for tuning the jump (top screen first).
 * Bottom screen: a staircase of ledges 4–7 tiles apart, a low ceiling block to bonk,
 * and a pillar to bounce off. Top screen: ledges zig-zagging left, then a long shelf at the top.
 * The top screen has no floor, so a miss there falls back to the bottom screen.
 */
export const TEST_TOWER: string[][] = [
  buildScreen([
    [40, 30, 8, 1],
    [26, 25, 8, 1],
    [12, 20, 8, 1],
    [2, 14, 6, 1],
    [14, 8, 10, 1],
    [30, 3, 28, 1],
  ]),
  buildScreen(
    [
      [1, 31, 58, 3], // floor
      [6, 27, 6, 1],
      [15, 22, 6, 1],
      [26, 16, 6, 1],
      [38, 9, 6, 1],
      [50, 3, 8, 1],
      [4, 19, 8, 2], // low ceiling block
      [33, 23, 2, 8], // pillar
    ],
    [3, 30],
  ),
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/testTower.test.ts`
Expected: PASS, 1 test.

- [ ] **Step 5: Write `src/render/debugDraw.ts`**

```ts
import type { Camera } from '../game/camera';
import type { Player, PlayerState } from '../game/player';
import type { TileGrid } from '../game/tiles';
import { TILE, VIEW_H, VIEW_W } from '../game/tuning';

const BG = '#1b1a24';
const SOLID = '#4a4858';
const EDGE = '#6e6a80';
const TEXT = '#e8e4f0';
const STATE_COLORS: Record<PlayerState, string> = {
  ground: '#e8d8a0',
  charge: '#f0a040',
  air: '#a0d0f0',
  stumble: '#f06060',
};

export function drawWorld(ctx: CanvasRenderingContext2D, grid: TileGrid, camera: Camera): void {
  const camY = Math.round(camera.y);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const ty0 = Math.max(0, Math.floor(camY / TILE));
  const ty1 = Math.min(grid.rows - 1, Math.floor((camY + VIEW_H - 1) / TILE));
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = 0; tx < grid.cols; tx++) {
      if (!grid.isSolid(tx, ty)) continue;
      const x = tx * TILE;
      const y = ty * TILE - camY;
      ctx.fillStyle = SOLID;
      ctx.fillRect(x, y, TILE, TILE);
      if (!grid.isSolid(tx, ty - 1)) {
        ctx.fillStyle = EDGE;
        ctx.fillRect(x, y, TILE, 1);
      }
    }
  }
}

export function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, camera: Camera): void {
  const camY = Math.round(camera.y);
  const { x, w, h } = player.body;
  const y = player.body.y - camY;
  const squash = player.state === 'charge' ? Math.round(player.charge * 4) : player.state === 'stumble' ? 8 : 0;
  ctx.fillStyle = STATE_COLORS[player.state];
  ctx.fillRect(x, y + squash, w, h - squash);
  ctx.fillStyle = BG;
  ctx.fillRect(player.facing > 0 ? x + w - 3 : x + 1, y + squash + 3, 2, 2);
  if (player.state === 'charge') {
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 2, y - 6, w + 4, 3);
    ctx.fillStyle = STATE_COLORS.charge;
    ctx.fillRect(x - 1, y - 5, Math.round((w + 2) * player.charge), 1);
  }
}

export function drawDebugText(ctx: CanvasRenderingContext2D, lines: string[]): void {
  ctx.font = '8px monospace';
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    ctx.fillStyle = '#000';
    ctx.fillText(line, 5, 5 + i * 10);
    ctx.fillStyle = TEXT;
    ctx.fillText(line, 4, 4 + i * 10);
  });
}
```

- [ ] **Step 6: Replace `src/main.ts`**

```ts
import { TEST_TOWER } from './content/levels/test-tower';
import { Input } from './engine/input';
import { startLoop } from './engine/loop';
import { Renderer } from './engine/renderer';
import { Camera } from './game/camera';
import { parseTower } from './game/mapParse';
import { Player } from './game/player';
import { SCREEN_H } from './game/tuning';
import { loadTier } from './game/weight';
import { drawDebugText, drawPlayer, drawWorld } from './render/debugDraw';

const canvas = document.getElementById('screen') as HTMLCanvasElement;
const renderer = new Renderer(canvas);
const input = new Input(window);
const tower = parseTower(TEST_TOWER);
const camera = new Camera(tower.screenCount);
let player = new Player(tower.start.x, tower.start.y);
camera.snapTo(player.centerY);

const stats = { jumps: 0, falls: 0, lastFall: 0 };

function resetPlayer(): void {
  const stones = player.loadout.stones;
  player = new Player(tower.start.x, tower.start.y);
  player.loadout.stones = stones;
  camera.snapTo(player.centerY);
}

function update(): void {
  input.poll();
  if (input.keyPressed('BracketRight')) player.loadout.stones = Math.min(16, player.loadout.stones + 1);
  if (input.keyPressed('BracketLeft')) player.loadout.stones = Math.max(0, player.loadout.stones - 1);
  if (input.keyPressed('KeyR')) resetPlayer();

  player.update({ left: input.held('left'), right: input.held('right'), jump: input.held('jump') }, tower.grid);
  for (const e of player.events) {
    if (e.type === 'jump') stats.jumps++;
    if (e.type === 'land') {
      stats.lastFall = e.fall;
      if (e.drop >= SCREEN_H) stats.falls++;
    }
  }
  camera.update(player.centerY);
}

function render(): void {
  const ctx = renderer.view;
  drawWorld(ctx, tower.grid, camera);
  drawPlayer(ctx, player, camera);
  const stones = player.loadout.stones;
  drawDebugText(ctx, [
    `weight ${stones} st  tier ${loadTier(stones)}  ${player.state}  charge ${player.charge.toFixed(2)}`,
    `screen ${camera.screenFromBottom + 1}/${tower.screenCount}  jumps ${stats.jumps}  falls ${stats.falls}  last fall ${stats.lastFall}px`,
    '[ ] weight   R reset   hold Space, release to jump',
  ]);
  renderer.present();
}

startLoop(update, render);
```

- [ ] **Step 7: Run all tests and the type-check**

Run: `npm test`
Expected: PASS, 34 tests across 6 files (weight 9, mapParse 4, body 4, player 12, camera 4, test tower 1).

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 8: Play it**

Run: `npm run dev`, open `http://localhost:5173`.

Check each of these:
- The view fills the window at a whole-number scale with crisp pixels.
- Arrow keys / A D walk; holding Space squashes the box and fills the charge bar; releasing jumps; the arrow held at release sets the direction.
- No steering in the air; bouncing off the pillar and outer walls; bonking under the ceiling block.
- Jumping above the bottom screen slides the camera up in about 0.2 s; falling back slides it down.
- Missing a jump on the top screen drops you to the floor of the bottom screen with a red stumble.
- `]` raises the weight and jumps get visibly shorter; at 13 the climber only hops.
- A gamepad (if available) walks with the stick/D-pad and jumps with A.

- [ ] **Step 9: Commit**

```bash
git add src/content src/render src/main.ts tests/testTower.test.ts
git commit -m "feat: playable grey test tower with debug drawing"
```

---

### Task 10: Tune the jump feel with the user

**Files:**
- Modify: `src/game/tuning.ts` (values only), and `tests/` only if a value the tests hard-code (the 192 px ledge fall) is affected

- [ ] **Step 1: Hand the build to the user**

Start `npm run dev` and ask the user to play the test tower for a few minutes at weights 0, 4, 8 and 12, and report: is the full jump too high or low, too floaty or too snappy, is the charge too slow or fast, is walking too slow, does the wall bounce feel fair, does the stumble last too long.

- [ ] **Step 2: Apply the feedback as constant changes**

Map feedback to `TUNING` fields:

| Feedback | Change |
|---|---|
| "too floaty" | raise `gravity` (try 0.34) and keep `maxJump` |
| "too snappy / heavy" | lower `gravity` (try 0.26) |
| "jumps too high / low" | change `maxJump` (and `minJump` for taps) |
| "jumps too short sideways" | raise `jumpSpeedX` |
| "charge too slow / fast" | change `chargeFrames` |
| "stumble too long" | lower `stumbleFrames` |
| "weight hurts too much / too little" | note it for Plan 3; the 5%-per-stone rule lives in `weight.ts` |

- [ ] **Step 3: Re-run tests after every change**

Run: `npm test`
Expected: PASS. Tests read `TUNING`, so only the fixed ledge-fall numbers in `tests/player.test.ts` (192 px, against `hardLandingFall`) can need attention if `hardLandingFall` goes above 192.

- [ ] **Step 4: Record the final values in the spec**

Update the constants table in `docs/superpowers/specs/2026-11-15-heavy-crown-design.md` section 4 to the tuned values.

- [ ] **Step 5: Commit**

```bash
git add src/game/tuning.ts docs/superpowers/specs/2026-11-15-heavy-crown-design.md tests
git commit -m "tune: jump feel after play-testing"
```
