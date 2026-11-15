# Heavy Crown — Full Game Stage 1: Climbing Claws and Grappling Hook

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two new ways to move, each an item with weight (spec `2026-11-15-heavy-crown-full-game-design.md` sections 3–4): Climbing Claws for ivy and rough walls, and a Grappling Hook for iron rings — with art, sounds, checker support and a test level (`?moves`).

**Architecture:** New solid tile types (Ivy `%`, Rough `&`) and a built-in ring object (`*`). The pure `Player` gains states `cling`, `pull`, `hang` and reads two new optional `PlayerWorld` queries (`climbableAt`, `ringFor`) implemented by `Game`, so the climbability checker gets the moves for free by running the same player code. New input action `hook` (F / RB).

**Tech Stack:** TypeScript, Vitest, Canvas 2D (unchanged).

**Map characters:** `%` ivy wall and `&` rough stone are built-in tiles; `*` is a built-in ring object. `v`, `r` and `o` are avoided because existing level legends already use them.

## Numbers (from the spec)

| | Value |
|---|---|
| Claws weight / Hook weight | 2 st / 3 st |
| Cling allowed | Claws carried and load ≤ 12 st; load 9–12 slides down 1 px/frame |
| Climb speed | 0.6 × weight walk factor px/frame |
| Wall jump | height 40 px × weight height factor (× 1.25 with Spring Boots), horizontal 1.6 × jump-speed factor away from the wall |
| Hook range / cone / cooldown | 96 px / ±45° / 20 frames after a miss |
| Pull speed | max(1.2, 4 × (1 − 0.04 × stones)) px/frame; 0 when overloaded (dangles) |
| Hang position | body centre x = ring x; body top = ring y + 3 |

## Tasks

1. **Tiles, ring object, items, input** — `Tile.Ivy`, `Tile.Rough` (solid), `%`/`&` chars, `*` → ring spawn; items `claws`, `hook` (table, sprites, pack minis); action `hook` (KeyF, pad button 5, labels). Tests: world builds the new tiles and rings; items' weights.
2. **Climbing Claws in the player** — `climbableAt` query; `cling` state: grab from air (on wall contact while holding toward it) or from the ground (toward + up); climb, mantle at the top, wall jump, let go, slide when heavy, no cling when overloaded or without Claws. Tests first in `tests/moves.test.ts`.
3. **Grappling Hook in the player** — `ringFor` query; fire on hook press (ground, air, hang, cling), aim cone from input, `pull` then `hang`, dangle when overloaded, charged jump from hang, drop with down, chain to another ring. Tests first.
4. **Game support** — `Game.climbableAt`, `Game.ringFor` (nearest ring in range and cone with a clear line), rings list, loadout flags; events to sounds and effects (claw scrape, hook fire/latch/miss/creak/strain, wall jump).
5. **Art** — ivy and rough faces in the terrain painter; ring sprite with bracket; rope line from hand to ring; cling/hang/pull frames (reuse ladder and rise frames); item sprites.
6. **Checker** — explore() learns cling-climb, wall jumps and grapple (rings as graph nodes, jumps from hang). Tests: a wall passable only with Claws; a gap crossable only with the Hook.
7. **Test level `?moves`** — a two-screen playground with ivy, rough walls and ring chains; verify by playing in the browser.
8. **Verify and commit** — all tests, level checks, build, browser check.
