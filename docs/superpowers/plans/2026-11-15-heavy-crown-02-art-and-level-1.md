# Heavy Crown — Plan 2 of 7: Art and Level I

**Goal:** Replace the grey boxes with real pixel art: the climber's animated sprite sheet (with backpack tiers and lean), procedurally painted stone, back walls and decoration, a dusk sky with three parallax layers, and the real level format — ending with Level I (The Overgrown Base, 3 screens) playable and good to look at.

**Architecture:** All art is pure TypeScript that paints into RGBA pixel buffers (`src/art/`), with no DOM access. The game converts buffers to canvases at load; a Node preview tool (`tools/preview.ts`, run with tsx) writes the same buffers to upscaled PNGs for visual review. Terrain is painted per screen from the tile map with deterministic noise, so no two bricks repeat. This replaces the spec's "PNG sprite sheets in public/assets" with runtime generation from the same code: no asset loading, and identical results in the preview tool and the game.

**Tech Stack:** TypeScript, Canvas 2D, tsx + pngjs (dev only, preview tool).

## Change from the spec

- Art is generated at runtime from code instead of loaded from PNG files; `npm run preview` writes PNG contact sheets for review. Spec section 10 "Art production" and section 14 file map are updated to match.

## Tasks

1. **Pixel toolkit** — `src/art/buffer.ts` (PixelBuffer: get/set/blend/fillRect/blit with flip, outline), `src/art/color.ts` (hex ↔ RGBA, mix, ramps), `src/art/noise.ts` (hash, value noise, fbm, 4×4 Bayer), `src/art/grid.ts` (palette-letter grids → buffers). Unit tests for buffer ops, hashing determinism and grid parsing.
2. **Preview tool** — `tools/preview.ts` + `npm run preview`: writes `previews/*.png` (gitignored) at 4× for sprites and 2× for screens.
3. **Themes** — `src/content/themes.ts`: palette ramps, sky stops, fog, ambient light and particle style for all five levels (only Level I is used now; the rest are tuned in Plan 4).
4. **Climber** — `src/art/climber.ts`: hand-placed frames (idle ×2, walk ×6, charge ×3, rise, apex, fall ×2, land, stumble ×4, bonk, ladder ×2, pickup) as palette grids; build-time lean (shear of the upper body) and pack overlays per load tier composed into one sheet with per-frame pack anchors. Review in previews, refine at least three rounds.
5. **Level format** — `src/game/level.ts`: `LevelDef` (name, theme, screens top-first, legend), tile chars (`#` stone, ` ` interior, `.` open air, `~` water, `i` ice, `=` plank, `C` cracked, `H` ladder, `@` start), tower assembly from levels bottom-to-top, `World` with tile grid, open-air flags, per-screen level index. Tests for assembly and legends.
6. **Terrain painter** — `src/art/terrain.ts`: per-screen bake of bricks with per-brick variation, exposure-based highlights and rims, depth darkening inside masses, cracks, theme accents (moss, grass, ivy, roots, flowers for Level I), back wall bricks with ragged broken edges where interior meets open air.
7. **Sky and parallax** — `src/art/sky.ts`, `src/art/parallax.ts`: dithered dusk gradient with sun, far mountains, mid forest and ruins, near tower arches; drawn with vertical parallax factors 0.10 / 0.25 / 0.50 relative to the level.
8. **Scene renderer** — `src/render/scene.ts`: sky → parallax → baked screen → player (sprite + procedural scarf) → foreground; replaces debug drawing (debug draw stays behind `?debug`).
9. **Level I map** — `src/content/levels/l1-overgrown-base.ts`: 3 screens following spec section 9 beats (items/objects become legend entries that render as placeholders until Plan 3). Verify every intended jump with the dev hook.
10. **Review** — render all three screens, judge like a picky pixel artist, fix the worst thing, three rounds minimum. Commit.
