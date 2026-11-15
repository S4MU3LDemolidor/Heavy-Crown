# Full game — progress log

Spec: `docs/superpowers/specs/2026-11-15-heavy-crown-full-game-design.md`. Stage 1 plan: `2026-11-15-heavy-crown-08-claws-and-hook.md`.

## Status

| Stage | What | Status |
|---|---|---|
| 1 | Climbing Claws, Grappling Hook | done (7d165df) |
| 2 | NPCs, dialogue, trades, bucket lifts, scares | done |
| 3 | Story script (NPC conversations, 12 notes) | done |
| G | Level generator, per-level entry/exit checks | done |
| 4 | Act I (levels 1–6) | done |
| 5 | Act II (7–12) | done |
| 6 | Act III (13–18) | done |
| 7 | Act IV (19–24) | done |
| 8 | Act V (25–30), summit | done |
| 9 | Lazy level art, act-paged map, save v2, verification | done |

## Conventions

- Built-in map chars: `#` stone, ` ` interior, `.` open air, `~` water, `i` ice, `H` ladder, `@` start, `=` hinged plank, `C` cracked wall, `%` ivy wall, `&` rough stone, `*` grapple ring.
- Legend chars are per level; never reuse a built-in char.
- Level ids 1–30; act = ceil(id / 6). Existing MVP levels become 1, 7, 13, 19, 25.
- Relics: Orb at level 12, Scepter 18 (Maren's lantern at its top), Seal 24, altar and crown at 30.
- Levels carry `entry`, `exit` (stand cells), `load` and `needs`; `npm run check:levels` checks each level from its entry into the next level's entry at that load, plus each generated level's `requires` (the set piece cannot be skipped) and the summit rule.
- Generated levels: edit `tools/levelgen/specs.ts` and run `npm run levels:gen <ids>`; a level whose neighbours change must be regenerated too (its entry follows the exit below).
- Bucket lifts are one network, `nell`, orders 0–7 at levels 8, 12, 15, 18, 21, 24, 26, 28. Nothing lifts to the summit: levels 28–30 are carried by hand.
- Maren's Echo: NPCs with scene `echo`, orders 1–11 through Act V and 99 at the altar.
