# Heavy Crown — Full Game Design (30 levels, NPCs, scares, new moves)

Date: 2026-11-15
Status: design approved in chat, awaiting spec review
Builds on: `2026-11-15-heavy-crown-design.md` (the MVP spec). Everything there still holds unless this document changes it.

## 1. Goal

Grow the 5-level MVP into the full game: **30 levels in 5 acts**, a cast of **NPCs** who tell the story and offer trades shaped by weight, a handful of **earned scares**, and **two new ways to move** (Climbing Claws and a Grappling Hook) that are items with weight like everything else. The game must stay provably climbable: the checker learns every new move, and each level declares what it expects.

## 2. Structure

| Act | Levels | Mood (existing theme) | Introduces | Ends with |
|---|---|---|---|---|
| I | 1–6 | Overgrown Base | keys, gates, ropes; ivy walls; **Climbing Claws** (free on level 4, or bought from Oskar on level 3) | the way into the cistern |
| II | 7–12 | Drowned Cistern | water, hinged planks, pressure plates; iron rings; **Grappling Hook** (level 10); bucket lifts | **the Orb** (level 12) |
| III | 13–18 | Bell Hall | bells, Pickaxe, cracked walls, the Bell shaft, the bell tune | **the Scepter** (18), Maren's lantern at its top |
| IV | 19–24 | Lightless Floors | darkness, lantern, ossuary, Hollow Ones | **the Seal** (24) |
| V | 25–30 | Frozen Spire | ice, wind, Crampons, Fur Cloak, Maren's Echo, the Old King | **the summit** (30): altar and crown |

- **Level size:** 3 screens each (a few set-piece levels may use 4). The tower is about 90–95 screens.
- **Existing levels become act openers:** current Level I → level 1, II → 7, III → 13, IV → 19, V → 25. Their relics, lantern, altar and crown move to the act ends listed above; the current Level V summit moves to level 30.
- **Weight rule (unchanged in spirit):** level 30 is climbable carrying one relic plus Crampons and Fur Cloak (7 st) and not with two relics (11 st). Earlier levels each declare the load they must support (section 9).
- **Ferrying across Act V** is the endgame test. It is made bearable, not trivial, by: bucket lift stations (section 5.3), rope hooks, grapple routes, and the Old King's one-time favour (section 5.6).

## 3. Climbing Claws (item, 2 st)

- **Climbable walls:** two new solid tiles, `v` ivy wall and `r` rough stone. Without the Claws they behave like any wall (you bounce off them).
- **Cling:** with Claws carried and load ≤ 8 st, holding toward a climbable wall while touching it (on the ground or in the air) grabs it. New player state `cling`. Gravity stops.
- **Climb:** up/down move at 0.6 × the weight walk factor px/frame. Moving off the climbable tiles lets go (fall). Reaching the wall's top edge where there is room to stand mantles onto it.
- **Wall jump:** pressing jump while clinging kicks away from the wall with a fixed jump (height 40 px × weight height factor, horizontal speed away from the wall). No charge.
- **Heavy (9–12 st):** you can cling but slide down at 1 px/frame. **Overloaded (13+):** you cannot cling.
- **Feel:** a claw-scrape sound on grab and on each climb step; small stone dust.

## 4. Grappling Hook (item, 3 st)

- **Rings:** new object `o` (iron ring) fixed in the world.
- **Fire:** new action **hook** — keyboard `F`, gamepad `RB` (button 5). Allowed on the ground, in the air (it can catch a fall), or while hanging.
- **Aim:** the held direction picks a cone: up, up-left, up-right, left (30° above horizontal) or right; no direction aims up toward the facing side. The target is the nearest ring within **96 px** inside a ±45° cone with a clear line (no solid tiles between body centre and ring). No target → the hook shoots out and falls back (short sound, 20-frame cooldown).
- **Pull:** the climber is pulled straight to the ring at 4 px/frame × (1 − 0.04 × stones), minimum 1.2. **Overloaded:** the rope only strains; the climber dangles where they are until releasing.
- **Hang:** at the ring the climber hangs below it (state `hang`). From hanging: hold jump to charge and release to jump (same rules as on the ground), press down to drop.
- **Feel:** rope line drawn from hand to ring, a metallic clank on latch, a creak while hanging.

## 5. NPCs

### 5.1 System

- **NPC objects** (`legend` entry `{ kind: 'object', object: 'npc', props: { id } }`) stand in the world with an idle animation and turn toward the climber when near.
- **Talk:** `E Talk` prompt. Dialogue box at the bottom: 2× portrait, name, text that types out with a per-character blip voice, and choices (↑/↓, confirm with E or Space).
- **Scripts** live in `src/content/npcs.ts`: per NPC, a list of conversations; each conversation is a small graph of nodes `{ text, choices?: [{ label, if?, do?, next }] }`. Conditions read flags, carried items and gold; effects set flags, give or take items, take gold, start a lift transfer, move the NPC.
- **Persistence:** flags and NPC positions are saved.
- **Gold payments:** prices are in gold. Paying removes carried treasure, cheapest first, until the price is met. No change is given ("Oskar doesn't make change"): overpaying is the catch.

### 5.2 Cast

| NPC | Where | Role |
|---|---|---|
| **The Crow** | appears on most levels | Sardonic guide. Lines depend on your load tier and what you carry; points out secrets once you have seen a mechanic. |
| **Oskar the Hoarder** (weird) | levels 3, 9, 16 | Buried under junk he will not put down. On level 3 he sells the **Climbing Claws** for 40 gold, early; players who cannot or will not pay find a pair free on level 4, where the first ivy walls block the way. Later sells a Rope Coil. Keeps appearing higher than he could have climbed and never explains how. |
| **Nell of the Cistern** | Act II, then her lift stations | Runs the **bucket lifts** (5.3). Knew Maren: "She sent books up. Then she sent nothing." |
| **The Bellringer** | Act III | Deaf, rings by feel. Tells Maren's story; teaches a four-bell tune that opens a sealed passage in level 17 when you land on the bells in order. |
| **The Peddler** | levels 6, 14, 22 | Swaps gear. Every offer trades weight or gold for weight (5.4). |
| **The Hollow Ones** (weird) | Act IV | Faceless standing figures. They move one step closer only while you face away from them, never while watched; when one reaches you it whispers a line and fades (a scare, section 6). They never harm or block. |
| **Maren's Echo** | Act V | A pale climber with a red scarf, always one ledge ahead; moves on when you get within 3 tiles. At the summit she turns, smiles, and is gone. |
| **The Old King** | level 28 | Frozen half into the ice, alive, gaunt. Begs for the relics. Offers a one-time favour (5.6). |

### 5.3 Bucket lifts (Nell)

- **Stations** (`L` objects with `props: { net, order }`) are paired by network; Act II has the first network, Acts III–V each have one more.
- **Send:** at a station, "Send something up (10 gold)" opens a picker of carried items; the chosen item is removed and waits in the next station up the network.
- **Collect:** at that station, "Take <item> from the bucket". Several items can wait in one bucket.
- **Why it matters:** it is how relics and heavy tools reach the top without ferrying them by hand, at a gold cost that competes with keeping treasure for the ending tally.

### 5.4 The Peddler's offers

Fixed per meeting, each a weight decision:
- Level 6: **Rope Coil** for 30 gold.
- Level 14: **Spring Boots** for your **Pickaxe** (2 st for 3 st, but you lose the Pickaxe's walls).
- Level 22: **Lantern Oil** — your lantern's light radius ×1.4 for the rest of the game — for 50 gold.

### 5.5 Maren's notes

Expanded from 5 to 12 notes, at least two per act, continuing her story (what she carried, what she left, the Old King, the Echo). Every note must be readable from a foothold (existing reach test).

### 5.6 The Old King's favour

He asks for the relics. Choices:
- **Refuse:** he tells how he climbed with all three at once and froze here; no effect.
- **"Carry one up for me":** he takes one carried relic (your choice) and swears to bring it to the summit. It appears on the altar's first empty socket when you next reach level 30, with a note: "I kept my word. —K." One time only.

## 6. Scares

- **About seven in the whole game**, each fires once and is saved. Mostly in quiet places and Act IV.
- **Trigger objects** `S` with `props: { id }`, a trigger area, and conditions (for example: carrying the lantern, facing away, standing still for 2 s).
- **Effect:** a sprite appears suddenly (face, figure, hand), a one-frame white flash, a dissonant sound sting, a 12-frame screen shake, then the sprite is gone. Never blocks or harms.
- **Placements (draft):** a hand out of the cistern water (level 9); a figure sitting on a bell that rings by itself (15); a face at the edge of the lantern light (20); a Hollow One right behind you when you turn (22); breathing in the dark with no source (23, sound only); the Echo turning with Maren's face too close (27); the Old King's eyes opening (28).
- **Option:** "Scares: On / Off" in Options, default On.

## 7. Story arc (script outline)

- **Act I:** the pilgrim enters the ruins; the Crow mocks their pack; Oskar sells the Claws; Maren's notes 1–2.
- **Act II:** Nell and the lifts; the first scare; the Orb at the cistern's crown; notes 3–4.
- **Act III:** the Bellringer remembers Maren and the tune; the Scepter; the lantern left burning; notes 5–7.
- **Act IV:** the Hollow Ones ("what are you carrying?"); the Seal in the ossuary; notes 8–9.
- **Act V:** the Echo leads; the Old King's plea and favour; Maren's scarf at the altar; notes 10–12; the dawn ending unchanged.
The full line-by-line script is written in stage 3 (section 10) and lives in `src/content/story.ts` and `src/content/npcs.ts`.

## 8. Audio additions

Synthesized like the existing sounds: claw scrape, grapple fire/latch/creak/strain, NPC blip voices (pitch and timbre per character), Hollow whispers (filtered noise with formant sweeps), scare stings (dissonant stab plus noise burst), bucket lift pulley. Music stays the six tracks, one per act plus title.

## 9. Level production and checks

- **Generator-assisted:** `tools/leveldraft/gen.py` composes screens from blocks (ledge chains, chimneys, ivy walls, grapple gaps, mechanic set pieces) under per-level rules (allowed mechanics, step heights, weight target), then the climbability checker validates; story beats, NPCs, items and scares are placed and tuned by hand.
- **Checker:** learns cling/climb/wall-jump and grapple moves (simulated with the real player code), plus ladders as today.
- **Per-level expectations** in each level file: climbable from its entrance to its exit at its stated load with its stated items; the existing reach test extends to NPCs, lift stations and scare triggers; the level-30 weight rule stays.
- **Load targets:** Act I up to 5 st, Act II up to 7, Act III up to 7, Act IV up to 8 (lantern plus relic), Act V up to 7 with Crampons and Cloak.

## 10. Technical changes

- **Level art on demand:** sky and parallax canvases are built when a level is first shown and kept for the 3 most recent levels (30 levels at once would cost hundreds of MB).
- **Map:** scrolls through the ~90 screens; shows NPCs met, lift stations and dropped items.
- **Saves:** version 2; version-1 saves are replaced with a new climb.
- **Input:** new action `hook` (F / RB). Pause screen lists it.
- **Performance budget:** unchanged (60 fps on a mid-range laptop).

## 11. Build stages

Each ends playable:
1. Climbing Claws and Grappling Hook (player states, items, rings and climbable tiles, art, sounds, checker support, tests) — on a test level.
2. NPC, dialogue, trade, bucket lift and scare systems (UI, portraits, voices, saves, tests).
3. Story script: all NPC conversations and 12 notes.
4. Act I (levels 1–6).
5. Act II (7–12).
6. Act III (13–18).
7. Act IV (19–24).
8. Act V (25–30) and the summit.
9. Balance and polish pass over the whole tower.

## 12. Out of scope

Phone controls, voice acting, multiple endings, new music tracks, levels beyond 30.
