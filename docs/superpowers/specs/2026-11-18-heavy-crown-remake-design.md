# Heavy Crown — the remake (15 hand-made levels, a real story, new characters)

Date: 2026-11-18. Replaces the 30-level tower of `2026-11-15-heavy-crown-full-game-design.md`; the weight core and every system from that spec stay unless this document says otherwise.

## 1. Goal

A shorter, better game: 15 hand-made levels (3 per setting), a personal story with a reason to climb from the first minute (inspired by how Celeste ties the climb to the climber's inner struggle), and a new hand-pixeled cast with portraits. Everything the current game does — weight, dropping anything anywhere, items, the Climbing Claws, the Grappling Hook, the relics and the altar, NPC trades, Nell's bucket lifts, scares — stays.

## 2. Story

### 2.1 The hook

A village at the foot of the tower, under a sky that has had no sun for a hundred years. Ten years ago **Maren**, a mapmaker and the pilgrim's mother, climbed the tower to bring back the dawn. She promised: "When you hear the summit bell, I made it, and I'm coming home." The night she left, her child, then 8, shouted: "If you go, don't ever come back." She never came back.

Tonight the summit bell rings for the first time. The pilgrim, **Wren** (18, never gendered; the name can be changed later), takes Maren's old pack and climbs to bring her home and say sorry.

### 2.2 The weight is the guilt

In this tower, what you carry becomes real. Every person in it is stuck because of something they carry. Wren's pack holds, from the first frame, an item that cannot be dropped: **The Words** (1 st). Trying to drop it shows "Not yet." It slows Wren a little for the whole climb. The ending is about whether Wren finally puts it down.

### 2.3 The five acts

Each act ends with a **fire scene**: Wren rests by a fire with the Crow, and the conversation moves the inner story one step.

| Act | Setting | People | Story beat | Fire scene |
|---|---|---|---|---|
| I | The Overgrown Base (levels 1–3) | the Crow, Oskar | Wren meets the Crow, a sarcastic bird who knew Maren. Oskar the Hoarder, who cannot put anything down, sells the Climbing Claws. | Wren lies about why they climb: "To bring back the dawn." |
| II | The Drowned Cistern (4–6) | Nell | Nell runs the bucket lifts. She remembers Maren sending things up, then nothing. The Orb. | Wren admits what they said that night. |
| III | The Bell Hall (7–9) | the Bellringer | The twist: the Bellringer rang the summit bell, not Maren. Ten years ago Maren asked her: "Ring it when my child is grown. They will come." Maren never made it, and she called Wren up. The Scepter. | Wren is angry at Maren: "She called me up here to carry her burden." |
| IV | The Lightless Floors (10–12) | the Hollow Ones | Climbers who put everything down, even themselves. They whisper Wren's own words back ("don't come back"). The worst scares. The Seal. | The lowest point. The Crow admits Maren sent it down ten years ago to watch over Wren. |
| V | The Frozen Spire (13–15) | the Old King, Maren | The Old King froze because he carried all three relics at once; he warns Wren and offers his favour. A memory of the night Maren left plays out in pieces during the climb. At the summit Maren is alive but frozen at the altar, kneeling for ten years, unable to put down her own guilt for leaving. | — (the summit) |

### 2.4 The two endings

When the three relics are on the altar, it asks for "the heaviest thing you carry". One choice:

- **Let go.** Wren lays down The Words: "I'm sorry. I didn't mean it." Maren lays down hers. The ice breaks, the crown lifts, the dawn comes, and they walk down together. The Words leaves the pack; the walk down is lighter.
- **Hold on.** Wren keeps The Words and takes the crown on themself so Maren can go free. The dawn comes; Maren walks down alone; Wren stays as the tower's new keeper, frozen like the King.

Both endings end on a final screen with the climb's stats. The title screen remembers which endings have been seen.

### 2.5 Notes

Fifteen of Maren's notes, one per level, written to follow the acts: what she carried, what she left, the night she left, the Bellringer's promise, the Old King, and the summit. Notes stay readable from a foothold (existing reach test) and collect in the Journal.

## 3. Characters and art

### 3.1 Rules for the whole cast

- Hand-pixeled, painted in code into pixel buffers like the current art (no AI-generated art).
- Each character has 12–16 colours in hue-shifted ramps: shadows lean cool (blue, purple), highlights lean warm (yellow).
- Outlines are a dark tone of the character's own colour (selective outline), never pure black.
- Every character has a silhouette that reads at game size.
- Lanterns and light sources rim-light the characters through the existing lighting.
- Every speaking character has a **64×64 portrait** with its own expressions.

### 3.2 Scale

Wren and the adult NPCs are about **18×30 px** on screen (1.5× the current climber), in sprite frames of about 40×44 px. Tiles stay 8 px; the view stays 480×270.

### 3.3 The cast

| Character | Silhouette | Animations | Portrait expressions |
|---|---|---|---|
| **Wren** | Hooded traveller, red scarf (Maren's twin), patched pack that grows in 3 stages with the load | idle (breathing, scarf drift), walk (8 frames), charge (3 squash stages), jump (stretch), rise / apex / fall, land, heavy-land stagger, hard-fall knock-down, ladder and rope climb, wall cling, hook fire and swing, sit at the fire, kneel | neutral, sad, angry, surprised, determined, crying |
| **The Crow** | Small and scruffy, one bright eye | perch, hop, fly, caw, head tilt | smug, serious, sad |
| **Oskar the Hoarder** | Hunched old man under a towering pile of junk; the pile is the silhouette | pile wobble, clutching hands, talk | greedy grin, suspicious, scared |
| **Nell of the Cistern** | Tall and wiry, oilskin coat, rope over the shoulder, hand on the pulley crank | idle, crank, wave | kind, tired, sad |
| **The Bellringer** | Old, eyes closed, cloth bound over the ears, hands on the bell rope | sways as she feels the bells, rings | serene, sorrowful, guilty |
| **The Hollow Ones** | Tall, thin, faceless, hanging cloth, darker than the walls | stand, step, fade | none (they only whisper) |
| **The Old King** | Frozen into the ice to the waist, gaunt, frost in the beard, eyes that open | breath clouds, eyes open | pleading, bitter |
| **Maren** | Kneeling at the altar, frost on her mapmaker's coat, red scarf, lantern | frozen breathing, stand up, walk (endings) | tired, loving, crying, smile |
| **Memories** | Young Maren and 8-year-old Wren, warm palette, slightly translucent | short scene animations for the Act V memory | none |

The **Peddler is cut**; his trades go to Oskar, who keeps turning up higher than he could have climbed.

### 3.4 Wren's scarf and pack

- The scarf is a short chain of points that follows the neck with a little lag, drawn on top of the sprite. It trails when Wren moves and flutters in the wind.
- The pack is an overlay per load tier (light, laden, heavy), so the silhouette shows the load.

### 3.5 Review gate

Wren's idle pose and portrait are drawn first and shown to the user before any animation. The rest of the cast follows the approved style.

### 3.6 Not in scope

Items and terrain keep their current art.

## 4. Levels

### 4.1 Rules

- 15 levels, all hand-made as tile maps in TypeScript (`src/content/levels/lNN-<name>.ts`), 3–4 screens each (about 50 screens in all).
- Every screen is built around one moment: a jump, a puzzle or a story scene. Each screen has one memorable jump. Optional side paths hold gold and some notes and carry the hardest jumps.
- Difficulty: Act I is fair; each act is harder than the one before. A fall can cost a screen or more.
- No ledge in a screen's top rows (the visibility rule; `MIN_STAND_ROW` follows the new body height, 4 rows).
- Each level is rendered to a PNG (`npm run art:preview level N`) for review.

### 4.2 The levels

| # | Name | Teaches | Items | Story |
|---|---|---|---|---|
| 1 | The Foot of the Tower | walking, charging a jump, falling | Tattered Map | the village intro and the bell; the Crow appears |
| 2 | The Root Stair | picking up and dropping, weight, iron key and gate, ropes | Iron Key, Rope Coil, Coin Pouch | Maren's first note |
| 3 | The Hoarder's Hollow | the Climbing Claws on ivy (bought from Oskar for gold, or found free higher up where the ivy first blocks the way) | Climbing Claws, Feather Charm (side path) | Oskar; fire scene 1 |
| 4 | The Sunken Gate | water (slows, breaks falls), pressure plates and stones | Counterweight Stone, Ruby | the first scare (a hand from the water) |
| 5 | Nell's Landing | bucket lifts | Spring Boots (behind a plate gate) | Nell remembers Maren |
| 6 | The Orb's Crown | carrying a heavy relic | the Orb, Silver Chalice | fire scene 2 |
| 7 | The Bell Hall | bells ring when landed on; hinged planks break under heavy loads; the Grappling Hook and iron rings | Grappling Hook | finding the Hook |
| 8 | The Ringer's Loft | the four-bell tune that opens a sealed passage | Bell Key | the twist (the Bellringer) |
| 9 | The Silent Bell | Act III combined | the Scepter, Gilded Idol (side path) | fire scene 3 |
| 10 | The Lightless Floors | darkness and the lantern's light | Lantern (Maren's, left burning at the edge of the dark) | the Hollow Ones appear |
| 11 | The Whispering Stair | cracked walls and the Pickaxe; light against weight | Pickaxe | scares; whispers |
| 12 | The Ossuary | a hard Act IV mix | Bone Key, the Seal | fire scene 4 (the Crow's secret) |
| 13 | The Frozen Spire | ice, wind, Crampons, the Fur Cloak | Crampons, Fur Cloak | the memory begins |
| 14 | The King in the Ice | hard climbing in the wind | — | the Old King's warning and favour |
| 15 | The Summit | the final climb with a relic | the Crown (on the altar) | the altar, Maren, the endings |

### 4.3 Relics and lifts

The Orb (level 6), the Scepter (9) and the Seal (12) must all reach the altar (15). Each weighs 4 st, so the player carries one at a time, sends them up in Nell's lifts (one network running from Act II to the summit), or accepts the Old King's favour (he carries one relic to the altar, once).

### 4.4 Trades (Oskar)

Oskar appears in levels 3, 8 and 11 (the exact levels can move during level design): the Climbing Claws (level 3, 40 gold), a Rope Coil (30 gold), Lantern Oil (50 gold, light radius ×1.4). Payments keep the current rule (cheapest treasure first, no change given).

### 4.5 Scares

About five, each once and saved, spread over the climb with the worst in Act IV: the hand from the water (4), a figure sitting on a bell that rings by itself (9), a face at the edge of the lantern light (10), a Hollow One right behind you when you turn (11), the Old King's eyes opening (14). The Scares option stays.

## 5. Technical changes

### 5.1 Bigger body, retuned physics

- `TUNING.bodyW` 10 → 14, `bodyH` 18 → 27 (final values settle in tuning).
- Jump physics retuned so the bigger climber feels the same and covers about 1.5× the tiles per jump. Tuned on the grey `?test` tower; the `?moves` playground is rebuilt for the new scale.
- `MIN_STAND_ROW` follows the body height automatically.
- The climbability checker simulates the real physics, so it follows the retune.

### 5.2 Sprites

- `src/art/climber.ts` is rewritten for Wren at the new scale: new frame size and feet anchor, the animation list in 3.3, the pack overlays and the scarf chain.
- `src/art/npcs.ts` is rewritten for the new cast.
- New `src/art/portraits.ts`: 64×64 portraits, each a base face plus expression overlays.

### 5.3 Dialogue with portraits

Conversation nodes gain a speaker and a face: `{ who: 'wren' | <npc id>, face: <expression>, text }`. The dialogue box shows the speaker's portrait (Wren on the left, the other speaker on the right). Choices stay as they are.

### 5.4 Cutscenes

A small scene player (`src/game/cutscene.ts`, pure logic; drawn by the existing render layer). A scene is a list of steps:

- `say` (who, face, text)
- `move` (an actor walks to a tile)
- `wait` (frames)
- `camera` (pan to a point)
- `fade` (in or out)
- `set` (a story flag)
- `choice` (labelled branches)
- `spawn` / `remove` (actors such as the memories)

Scenes are triggered by trigger objects in level legends and by story flags. Every scene can be skipped from the pause menu. Scenes: the village intro, fire scenes 1–4, the Bell Hall twist, the memory pieces in Act V, the summit, and both endings. Scripts live in `src/content/cutscenes.ts`.

### 5.5 The Words

A new item `words` (1 st, kind `burden`): cannot be dropped ("Not yet."), cannot be sent in a lift, cannot be traded. It is in the pack from the start and leaves only in the Let-go ending.

### 5.6 Endings

The altar, once it holds all three relics, starts the summit scene, which ends in the Let-go / Hold-on choice and plays that ending. The save records `endingsSeen`; the title screen marks the endings seen.

### 5.7 Removed

- The level generator (`tools/levelgen/`), the generated levels (`src/content/levels/gen/`) and the `levels:gen` script.
- The old hand-made levels (`l1`–`l5`), redrawn from scratch for the new scale.
- Levels 16–30, their names, notes and NPC lines; the Peddler.
- The checker's "cannot be climbed without X" rules move from `tools/levelgen/specs.ts` into the level definitions (`requires`).

### 5.8 Saves and content

- Save version 4; older saves start a new climb.
- `LEVELS` lists 15 levels; `LEVEL_NAMES` and `NOTES` are rewritten for 15.
- Music: the six existing tracks (title plus one per act).

### 5.9 Not in scope

New item or terrain art, new music, more than 15 levels, voice acting, translations.

## 6. Testing

- Unit tests:
  - the retuned physics (jump heights and distances per load)
  - The Words cannot be dropped, sent or traded
  - the cutscene player (step order, skip, flags, choices)
  - dialogue nodes resolve a portrait and face
  - both ending paths
- `npm run check:levels`: every level climbs into the next at its load; set pieces cannot be skipped (`requires`); the summit refuses two relics at once.
- `tests/levelReach.test.ts`: every note, item, NPC, lift and scare is reachable, and no ledge crosses a screen edge.
- `npm run art:preview`: character sheets, portraits and every level as PNGs for review.

## 7. Build order

The work happens on a separate branch, `remake`, so `main` keeps today's playable 30-level game until the remake is ready.

1. Bigger body and retuned physics (`?test` tower, physics tests).
2. Wren: idle pose and portrait, **shown to the user**; then the full animation set, the pack overlays and the scarf.
3. Story systems: portraits in dialogue, the cutscene player, The Words, the ending framework.
4. Act I playable end to end: levels 1–3, the Crow and Oskar, the intro and fire scene 1. **The user plays it before Act II starts.**
5. Act II.
6. Act III.
7. Act IV.
8. Act V and both endings; the full checks. Then ask the user about merging into `main`.
