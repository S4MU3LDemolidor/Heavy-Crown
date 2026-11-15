# Full game — progress log

Spec: `docs/superpowers/specs/2026-11-15-heavy-crown-full-game-design.md`. Stage 1 plan: `2026-11-15-heavy-crown-08-claws-and-hook.md`.

## Status

| Stage | What | Status |
|---|---|---|
| 1 | Climbing Claws, Grappling Hook | done (7d165df) |
| 2 | NPCs, dialogue, trades, bucket lifts, scares | done |
| 3 | Story script (NPC conversations, 12 notes) | in progress |
| G | Level generator, per-level entry/exit checks | — |
| 4 | Act I (levels 1–6) | — |
| 5 | Act II (7–12) | — |
| 6 | Act III (13–18) | — |
| 7 | Act IV (19–24) | — |
| 8 | Act V (25–30), summit | — |
| 9 | Balance, polish, verification | — |

## Conventions

- Built-in map chars: `#` stone, ` ` interior, `.` open air, `~` water, `i` ice, `H` ladder, `@` start, `=` hinged plank, `C` cracked wall, `%` ivy wall, `&` rough stone, `*` grapple ring.
- Legend chars are per level; never reuse a built-in char.
- Level ids 1–30; act = ceil(id / 6). Existing MVP levels become 1, 7, 13, 19, 25.
- Relics: Orb at level 12, Scepter 18 (Maren's lantern at its top), Seal 24, altar and crown at 30.
