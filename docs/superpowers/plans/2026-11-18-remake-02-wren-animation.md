# Remake Plan 2: Wren's Animations and Faces

> Compact stage plan (the user asked for every remaining stage to run without review gates). Spec sections 3.3–3.4.

**Goal:** every pose Wren needs in play, hand-pixeled in the approved style; Wren's six portrait faces; the scarf at the new scale.

**Architecture:** poses are composed from hand-drawn parts (hood/head, scarf, cloak, arms, legs) in the scratch drawing script and emitted as grids into `src/art/climber.ts`; each pose carries its own neck and back anchors. Heavy load tiers lean the upper body forward. Portrait faces become overlays computed as the difference between the featureless base and the base with that face drawn on.

## Tasks

1. **Pose table.** `src/art/climber.ts`: `BODY_FRAMES` gains `cling0`, `cling1`, `hang`; each pose is `{ grid, neck, back }`; tiers 3–4 lean the body above the hips forward 1 and 2 px. Test: every frame name has a drawn pose (no frame falls back to idle), the feet of standing poses sit on `FEET_Y`, and the lying stumble frames are wider than tall.
2. **The poses.** idle ×2, walk ×6 (contact, down, passing, up for each foot), charge ×3 (crouch deepening, cloak spreading), rise (stretched, cloak trailing), apex (knees up), fall ×2 (cloak billowing), land (squash), bonk (head knocked back), stumble ×4 (flat on the back, rolling, sitting up, getting up), ladder ×2 (back view, alternating hands), cling ×2 (side-on against the wall, alternating hands), hang (arms up on the rope, legs dangling), pickup (crouched, reaching down).
3. **Animator.** `src/render/scene.ts`: clinging uses `cling0/1`, hanging uses `hang` (and `apex` while charging a jump from the ring).
4. **Scarf.** `src/render/scarf.ts`: six links of 3.3 px (1.5× the MVP's).
5. **Portrait faces.** `src/art/portraits.ts`: `WrenFace` = neutral, sad, angry, surprised, determined, crying. Test: every face differs from neutral only inside the face area.
6. **Checks.** `npm run art:preview wren` shows every pose; tests, type-check and build pass; commit.
