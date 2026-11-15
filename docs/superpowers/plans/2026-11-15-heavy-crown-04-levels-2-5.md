# Heavy Crown — Plan 4 of 7: Levels II–V

**Goal:** Every remaining mechanic from spec sections 4 and 8, and the four upper levels built with them, each verified by the climbability checker — ending with the full 18-screen tower climbable from the courtyard to the crown.

**Architecture:** Surface and zone effects (water, ice, wind) reach the player through optional `PlayerWorld` queries implemented by `Game`, so the pure player keeps no level knowledge. Dynamic solids (hinged planks, cracked walls, bells, plate-linked gates) live in `Game` and are merged into `Game.solidRect`. Built-in map characters `=` (plank) and `C` (cracked wall) spawn objects automatically. The checker gets a configurable world (keys used, walls broken, planks by weight, calm wind) so each level can declare weight expectations.

## Change from the spec

- The lighting pass (ambient darkness, light sources, lantern radius) moves here from Plan 5, because Level IV is unplayable without it. Plan 5 keeps fog, particles, effects and polish.

## Tasks

1. **Water** — `~` tiles: no stumble when landing in water, walk speed × 0.6. Tests.
2. **Ice** — `i` tiles: low-friction walking, sliding landings, Crampons cancel it. Tests.
3. **Wind** — per-level wind screens with a global gust cycle (180 calm / 120 gust / 30-frame telegraph), 0.06 px/frame² airborne push, Fur Cloak × 0.3. Tests.
4. **Hinged planks** — `=` runs swing down under 5+ stones resting for 10 frames, return after 180 frames when clear. Tests.
5. **Pressure plates and linked gates** — plates count resting stones (items + a standing player's load) against a threshold; linked gates open and close, never onto a body. Tests.
6. **Cracked walls** — `C` regions break with the Pickaxe (flood fill). Tests.
7. **Bells** — solid bronze bells that ring when landed on or bonked.
8. **Altar and crown** — relics placed on the altar lock in; with all three, the crown can be lifted, which ends the climb. Maren's scarf note at the altar. Tests.
9. **Lighting** — ambient darkness per theme, light sources (lantern, fungus, relics, ruby, crown, torches), banded dithered falloff, multiplied over the scene.
10. **Renderers** — planks, plates, cracked walls, bells, altar, crown, bronze/bone doors, wind streaks.
11. **Checker world and expectations** — per-level expectations in the level files; `npm run check:levels` runs them all and fails on any miss; Level V rule (reachable at 7 st, not at 11 st).
12. **Levels II–V** — maps following spec section 9 beats, iterated with the checker; notes 2–5 placed.
