# Remake Plan 3: Story Systems

> Compact stage plan (the user asked for every remaining stage to run without review gates). Spec sections 2.4, 5.3–5.6.

**Goal:** the systems the story runs on: portraits in conversations, cutscenes, The Words, the two endings.

## Tasks (done)

1. **Cutscene player** `src/game/cutscene.ts` (pure logic): steps say / choose / move / turn / wait / fade / set / spawn / remove / pose / label / goto / ending; lines and choices wait for the player; skip runs to the next choice. Tests: `tests/cutscene.test.ts`.
2. **Speakers and faces**: conversation nodes take `who` and `face`; the dialogue box (`src/ui/dialogue.ts`) shows the speaker's 64×64 portrait on their side (Wren left, everyone else right, mirrored to face Wren). Portraits are a registry (`src/art/portraits.ts`) of per-character sitters (`src/art/sitters/`); speakers without one show their sprite.
3. **The Words** (1 st, kind `burden`): in the pack from the first frame of a new climb; dropping it says "Not yet."; lifts refuse it; it is never spent.
4. **Scene triggers**: a level's `scene` object fires its cutscene once (flag `scene:<id>`); the full altar's "Kneel beside her" starts `summit`.
5. **Endings**: the summit scene ends in the Let go / Hold on choice; `Game.endWith()` lifts the crown (and takes The Words when letting go); each ending has its own closing lines; the endings seen are kept apart from the climb's save and listed on the title screen.
6. **Main loop**: a `scene` mode drives the runner, moves the climber as the scene's Wren (walk animation, held poses), draws the actors and the fade; the pause menu offers "Skip scene".
