# Heavy Crown — MVP Design

Date: 2026-11-15
Status: approved in chat, awaiting spec review

## 1. What we are building

Heavy Crown is a browser game: a vertical, one-jump-at-a-time tower climber in classic chunky pixel art. You climb an ancient tower with charged jumps and no air control; one bad jump can drop you far back down. Items you carry add weight, and weight shortens your jumps. You can drop any item anywhere and it stays there. At the top waits the crown, which needs three heavy relics on its altar, and the summit is built so you can only haul one relic at a time.

The MVP is a **miniature of the whole climb**: 5 levels, each with its own mood, from mossy ruins at the bottom to a frozen summit with the crown. The finished game will have 30 levels; the MVP proves every system and every mood, and its tools (art scripts, level format, climbability checker) are built so levels 6–30 can be added without new engine work.

All art, the character and the tower are original. The game shares its genre and core movement with Jump King but copies none of its assets, characters or layouts.

### Player-facing goals

- Every jump feels like a risk: precise, predictable physics, no air control, real falls.
- Every item is a temptation: weight is visible (backpack, lean, slower walk) and felt (shorter jumps).
- The tower is lonely, mysterious and beautiful: layered parallax, drifting pixel fog, lighting, particles, mood changes per level, ambient music.
- Reaching the top feels earned.

### Platforms

- Desktop browsers: latest Chrome, Edge, Firefox, Safari.
- Keyboard and gamepad (standard mapping). No touch controls in the MVP.
- English text.

## 2. Technology

- **TypeScript + HTML canvas 2D**, our own small engine. No runtime dependencies.
- **Vite** for dev server and build; **Vitest** for tests; **tsx** to run TypeScript tool scripts; **pngjs** (dev-only) to write PNGs from the art scripts.
- Output of `npm run build` is a static folder (`dist/`) that can be hosted anywhere (itch.io, GitHub Pages, Netlify) or published as a private claude.ai page.
- Performance target: steady 60 fps on a mid-range laptop. Game download under 5 MB excluding music (music about 1.5 MB per track).

## 3. Screen, grid and camera

- **Internal resolution 480×270.** Rendered to an offscreen canvas, then drawn to the visible canvas at the largest whole-number scale that fits the window (4× on 1080p), with nearest-neighbor scaling. Leftover space is letterboxed in the current level's darkest color.
- **Tile size 8 px.** One screen is **60×34 tiles (480×272 px)**. The view shows 270 rows, hiding one pixel row at the top and bottom of each screen.
- The tower is **one continuous stack of 18 screens** (screen 0 at the bottom). The left and right edges are solid outer walls. Falling from any height can carry you down through any number of screens and levels.
- **Camera:** shows exactly one screen. When the player's center crosses a screen boundary, the camera slides to the new screen in **11 frames (~0.18 s), ease-out**. Gameplay keeps running during the slide. Parallax layers move at their own rates during the slide, which is when depth reads most clearly.

## 4. Movement and physics

Fixed timestep **60 updates per second**. Units are pixels and pixels per frame. Positions use sub-pixel accumulators; movement resolves one pixel at a time per axis against the tile grid, so nothing tunnels through walls. The physics module is pure TypeScript with no DOM access, so the game and the climbability checker share it.

### Player body

- Sprite about 16×24 px; collision box **10×18 px**, feet at the bottom center.

### Constants (weight 0, before tuning)

| Quantity | Value |
|---|---|
| Gravity | 0.30 px/frame² |
| Terminal fall speed | 9 px/frame |
| Walk speed | 1.0 px/frame |
| Full-charge time | 36 frames (0.6 s) |
| Minimum jump height (tap) | 12 px |
| Maximum jump height (full charge) | 80 px (10 tiles) |
| Horizontal jump speed | 2.2 px/frame |
| Wall bounce | horizontal speed reversed and multiplied by 0.5 |
| Ceiling hit | vertical speed set to 0 (start falling) |
| Hard-landing threshold | fall of 136 px or more (half a screen) from the apex |
| Stumble duration | 40 frames, no input accepted |

All constants live in one tuning file and are expected to change during the jump-feel step.

### Rules

- **On the ground:** left/right walks. Holding jump crouches and charges; you cannot walk while charging. The charge rises linearly from 0 to 1 over the full-charge time and holds at 1.
- **Jump on release:** target height = min + (max − min) × charge, multiplied by the weight factor (section 5) and item modifiers. Initial vertical speed = √(2 × gravity × height). Horizontal speed is the horizontal jump speed toward the arrow held at release (none if no arrow is held).
- **In the air:** no steering. Walls bounce you; ceilings stop your rise.
- **Walking off a ledge:** you fall, keeping your walking speed horizontally.
- **Hard landing:** landing after falling the threshold distance or more triggers a stumble (faceplant, get up). The Feather Charm and landing in water prevent it.
- **Ladders** (rope ladders the player places, and the fixed ladder in the Bell shaft): press up while touching a ladder to grab it; up/down climb at 0.8 px/frame (scaled by the weight walk factor); pressing jump lets go and you drop; reaching the top steps you onto the ledge.

### Environment

| Surface or zone | Effect |
|---|---|
| Stone (default) | normal |
| Water (shallow pools over a solid floor) | landing in it never stumbles; walking speed × 0.6; charging works normally |
| Ice | very low friction: walking accelerates at 0.04 px/frame², landings keep horizontal speed and slide, decelerating at 0.03 px/frame². Crampons make ice behave like stone. |
| Wind zone | gust cycle: 180 frames calm, then 120 frames gust. During a gust, airborne players get 0.06 px/frame² horizontal acceleration in the zone's direction. Gusts are telegraphed 30 frames early by streaming snow particles and a rising wind sound. Fur Cloak multiplies the push by 0.3. |
| Hinged plank | solid. If the total weight resting on it (carried weight of a player standing on it, plus items lying on it) is 5 stones or more for 10 frames, it swings down and drops what is on it, then swings back up after 180 frames. This can never trap the player permanently. |

No slopes, no spikes and no death in the MVP. Falling is the only punishment.

## 5. Weight

Weight is measured in **stones (st)**, always whole numbers. The player's weight is the sum of carried items. The body itself weighs nothing.

| Effect | Formula (w = carried stones) |
|---|---|
| Jump height factor | 1 − 0.05 × w, for w ≤ 12 (0.40 at w = 12) |
| Overloaded (w ≥ 13) | maximum jump height 14 px (a hop) at any charge |
| Horizontal jump speed factor | 1 − 0.025 × w (minimum 0.70) |
| Walk and ladder speed factor | 1 − 0.03 × w (minimum 0.60) |
| Full-charge time | 36 × (1 + 0.04 × w) frames |
| Spring Boots | jump height × 1.25 after the weight factor |

### Load tiers (drive visuals and sound)

| Tier | Stones | Look |
|---|---|---|
| 0 Empty | 0 | small satchel, upright |
| 1 Light | 1–4 | small pack, upright |
| 2 Loaded | 5–8 | big pack, slight forward lean |
| 3 Heavy | 9–12 | huge pack stacked with gear, strong lean, slower |
| 4 Overloaded | 13+ | crushed under the pack, can only hop |

Footstep and landing sounds get deeper and louder with each tier; landing dust grows with tier.

## 6. Inventory and interaction

- **No pickup limit** other than weight. Carried items are an ordered list.
- **Pick up:** stand over an item and press Interact. Prompt shows above the item, for example `E  take Lantern (2 st)`. If several items lie on the same spot, the most recently dropped one is offered first. Nothing is picked up automatically.
- **Drop:** open the inventory (game pauses), pick an item, press Drop. Only possible while standing on the ground. The item is placed at the player's feet.
- **Items obey gravity:** a dropped item falls until it rests on something solid (including through water to the pool floor, or off a plank that swings down).
- **Interact** also: opens a door when carrying its key (the key is used up), breaks a cracked wall when carrying the Pickaxe (1 s swing), places a carried Rope Coil on a rope hook (interact again at the hook to roll it back up and take it), places carried relics on the altar, and lifts the crown.
- **Weight meter (HUD):** a small pack icon, the stone count and tier pips in the bottom-left. It appears for 3 seconds whenever weight changes and whenever the inventory is open; otherwise hidden, unless Options sets it to always show. There is no jump-charge meter.

## 7. Items

| Id | Name | Weight | Function | Shows on pack |
|---|---|---|---|---|
| `iron_key` | Iron Key | 1 | opens iron gates; used up | no |
| `bell_key` | Bell Key | 1 | opens the Bell Door (an ascent shortcut below where it is found); used up | no |
| `bone_key` | Bone Key | 1 | opens the ossuary door; used up | no |
| `lantern` | Lantern | 2 | light radius ~70 px around the player, flickering; required in level 4 | yes, hangs lit |
| `rope` | Rope Coil (2 in the MVP) | 2 | placed on a rope hook, unrolls a ladder straight down until it hits something solid | yes, coiled |
| `pickaxe` | Pickaxe | 3 | breaks cracked walls and floors | yes, handle sticks out |
| `spring_boots` | Spring Boots | 2 | jump height × 1.25 | no (boots change color on the climber) |
| `crampons` | Crampons | 1 | ice behaves like stone | no |
| `fur_cloak` | Fur Cloak | 2 | wind push × 0.3 | yes, cloak over the pack |
| `feather_charm` | Feather Charm | 0 | hard landings never stumble; hidden secret | no |
| `map` | Tattered Map | 1 | enables the tower map in the pause menu, showing discovered screens, dropped items and the player | no |
| `stone` | Counterweight Stone | 3 | no use except weight; holds pressure plates down | no |
| `coin_pouch` | Coin Pouch (7 in the MVP) | 1 | 10 gold | no |
| `ruby` | Ruby (2) | 1 | 50 gold | no |
| `chalice` | Silver Chalice (2) | 2 | 30 gold | no |
| `idol` | Gilded Idol (1) | 5 | 100 gold | yes, strapped on top |
| `orb` | The Orb | 4 | sacred relic | yes, glowing |
| `scepter` | The Scepter | 4 | sacred relic | yes, glowing |
| `seal` | The Seal | 4 | sacred relic | yes, glowing |
| `crown` | The Crown | 6 | lifting it ends the game | — |

**Gold** counts only if delivered: the ending totals the gold carried on the player plus treasure lying on the summit screen when the crown is lifted.

Item definitions are data (one table in `src/content/items.ts`); adding items for later levels means adding rows plus, if needed, one behavior hook.

## 8. World objects

| Object | Behavior |
|---|---|
| Iron gate / Bell Door / Ossuary door | solid until opened with the matching key; stays open forever |
| Pressure plate | counts stones resting on it (items lying on it plus the carried weight of a player standing on it). At or above its threshold (default 3, shown as notches on the plate) its linked gate is open; below it, the gate closes. A gate never closes onto the player or an item. |
| Cracked wall / floor | solid until broken with the Pickaxe; stays broken |
| Rope hook | anchor on a ledge edge; holds one Rope Coil, which makes a climbable ladder hanging down |
| Hinged plank | see section 4 |
| Giant bell | solid platform; rings (sound plus a small shake) when landed on or bounced off |
| Altar | three sockets; relics placed there lock in with a holy glow and cannot be taken back |
| Crown pedestal | the crown can be lifted only when all three sockets are filled |
| Wind zone | see section 4 |
| Darkness | level-wide ambient light value; see section 10 |

## 9. The levels

| # | Screens | Name | Mood |
|---|---|---|---|
| I | 0–2 | The Overgrown Base | green-gold dusk, fireflies, ivy, mist pooling on the ground, a forest far below the tower's walls |
| II | 3–6 | The Drowned Cistern | teal, shimmering water reflections, drips, fog lying over the pools |
| III | 7–10 | The Bell Hall | warm amber light beams through tall broken windows, dust motes, giant bells, crows |
| IV | 11–13 | The Lightless Floors | near-total darkness, faintly glowing fungus outlining some ledges, drifting ghost lights |
| V | 14–17 | The Frozen Spire | cold blue night, stars, aurora, snowfall, mountains far below |

Entering a level for the first time shows a title card (for example `II · The Drowned Cistern`) that fades in and out over 3 seconds. Mood (palette, fog, particles, ambience, music) blends over the level boundary.

### Level beats

**I. The Overgrown Base (screens 0–2)**
- Screen 0: start in a ruined courtyard. Low ledges teach walking, tap jumps and full jumps; a tall chimney on one side teaches wall bounces. A Coin Pouch sits on a side ledge.
- Screen 1: the Iron Key on a high ledge; an iron gate blocks the narrow way up. Rope Coil #1 in an alcove; a rope hook above a deep drop, so a placed rope makes later re-climbs easier.
- Screen 2: a mossy collapsing arch and the first long gap where a miss drops you back to screen 0.

**II. The Drowned Cistern (screens 3–6)**
- Pools at the bottom of each screen give soft landings.
- Hinged planks: fine while light, fold under 5+ stones.
- Screen 4: the Counterweight Stone and a pressure plate (threshold 3) linked to a high gate; you must leave the Stone on the plate and climb through.
- Screen 5: Spring Boots behind that gate. The Feather Charm in a secret alcove reachable only by bouncing off one specific wall.
- Screen 6: the Orb on a shrine at the top. Carrying it (4 st) plus anything else folds the hinged planks, so the way onward needs a planned route.
- Treasure: 2 Coin Pouches, 1 Silver Chalice.

**III. The Bell Hall (screens 7–10)**
- Giant bells as ringing platforms.
- Screen 7: the Pickaxe. Screen 8: cracked walls that open a hidden chimney.
- Screen 9: the Bell Key. It opens the Bell Door on screen 8, revealing a ladder shaft from screen 7 to screen 9: a reason to go back down, and a fast lane for every later trip.
- Screen 9: the Gilded Idol in a tempting nook off the main path.
- Screen 10: the Scepter. The Lantern rests at the top of screen 10, in the last light before the dark.
- Ambient crows that fly off when the player comes near.
- Treasure: 2 Coin Pouches, 1 Ruby, 1 Silver Chalice, the Idol.

**IV. The Lightless Floors (screens 11–13)**
- Ambient light about 5%. Without the Lantern you see only glowing fungus on some ledge edges and the glint of items.
- Screen 11: the Tattered Map.
- Screen 12: the Bone Key; the ossuary door on screen 12 leads to a side chamber on screen 13 holding the Seal.
- Treasure: 1 Coin Pouch, 1 Ruby.

**V. The Frozen Spire (screens 14–17)**
- Screen 14: Crampons at the entrance. Screen 15: the Fur Cloak.
- Ice ledges and wind zones throughout. Rope Coil #2 at the base of screen 14, plus rope hooks in this level, so ropes can become ladders that make the relic ferrying easier — at 2 stones each, a real trade-off.
- Screen 17: the summit, with the altar and the crown pedestal under open sky.
- **Design rule:** the summit route (screens 14→17) is climbable at 7 stones (one relic + Crampons + Fur Cloak) and not climbable at 11 stones (two relics + Crampons + Fur Cloak). This is verified by the climbability checker (section 14).
- Treasure: 1 Coin Pouch.

### Ending

With all three relics on the altar, lifting the crown (6 st) plays a short scene: the climber staggers under it, steadies, and looks out; the camera rises into the sky. Then an end screen: time, jumps, falls, biggest fall (in screens), gold delivered. Then credits and back to the title.

### Stats definitions

- **Jumps:** every jump release.
- **Falls:** every landing at least one full screen (272 px) below the ground the player jumped from or walked off.
- **Biggest fall:** the largest such drop (takeoff ground height minus landing height), in screens, one decimal.
- **Time:** in-game time, paused in menus.

## 10. Look and feel

### Palette

Each level has its own palette of about 24–32 colors, picked to match its mood and sharing a few neutrals (outline, darkest shadow, highlight) across the whole tower so the climber and items read the same everywhere.

### Render layers, back to front

1. **Sky:** dithered vertical gradient per level (dusk, cistern gloom, amber afternoon, void, night with stars and aurora).
2. **Far parallax** (moves at 0.10× camera): distant forest and hills (I), cistern vaults (II), sunset beyond window arches (III), faint pillars (IV), snowy peaks far *below* (V).
3. **Mid parallax** (0.25×): tower arches, buttresses, hanging chains, bells.
4. **Near back parallax** (0.50×): closer columns and broken stairs, darker and desaturated.
5. **Back wall:** a dark masonry tile layer behind the playfield wherever the map marks interior; open-air cells show the parallax behind them.
6. **Light beams:** additive dithered shafts from windows, slowly pulsing (III strongest).
7. **Play layer:** tiles with automatic edge tiles and decoration (moss on top edges in I, wet sheen and drips in II, dust and cobwebs in III, glowing fungus in IV, snow caps and icicles in V), world objects, items with a periodic glint, the climber.
8. **Foreground** (1.20×): silhouettes of vines, chains and broken beams that pass in front.
9. **Fog:** two or three tileable noise textures, quantized to 3 alpha steps with ordered (Bayer) dithering so it stays pixel-crisp, drifting sideways at different speeds, tinted per level, with density set per screen.
10. **Lighting:** a light buffer filled with the level's ambient darkness, with light sprites (torches, windows, fungus, lantern, relics, wisps) drawn into it as banded, dithered radial gradients, multiplied over the scene.
11. **Particles:** fireflies (I), drips and splash rings (II), dust motes and feathers (III), wisps and spores (IV), snow and gust streaks (V).
12. **Post:** dithered vignette and a per-level color grade.
13. **UI:** HUD, prompts, title cards, menus, in a custom bitmap pixel font.

Static parts of each screen (tiles, back wall, static decoration) are baked once into a 480×272 canvas per screen for speed.

### The climber

- A small hooded pilgrim with a long scarf. About 16×24 px.
- Animations: idle (breathing, looks around), walk (6 frames), charge (3 crouch depths plus a tremble at full charge), jump rise, apex, fall, land, stumble (faceplant then get up, 6 frames), bonk, pick up, drop, climb ladder (4 frames).
- Two body sets: **upright** (tiers 0–1) and **hunched** (tiers 2–4, deeper lean per tier via offset frames).
- **Pack overlay** per tier (5 sizes), anchored per body frame, plus overlays for the items that show on the pack (Lantern, Rope, Pickaxe, Fur Cloak, Idol, relics).
- **Scarf:** a short procedural pixel chain (4 segments) that trails behind and streams during falls.

### Effects

Made with the pixelfx library and exported as sprite sheets: jump dust, landing dust (sized by tier), wall-bonk spark, stumble stars, pickup sparkle, drop puff, key unlock, gate opening dust, pickaxe rubble, water splash, snow puff, bell ring shimmer, relic placement holy glow, crown lift burst, ambient critters (crows, fireflies).

### Art production

All art is generated by Node scripts in `tools/art/` that draw from the palettes: hand-placed pixel sprites written as palette-letter grids (climber, items, objects), procedural tile sets with automatic edge variants, procedural parallax backgrounds, the bitmap font and UI frames. `npm run art` writes PNG sprite sheets and atlas JSON to `public/assets/` plus a contact sheet `art-preview.png` for review. Every art piece goes through render → look → refine.

## 11. Audio

- **Music:** 6 ambient tracks made with Higgsfield: title/ending plus one per level. Before generating, the credit cost is shown to the user for approval. Tracks are converted with ffmpeg to MP3 and given a seamless loop (2 s crossfade from the end into the start). Changing levels crossfades music over 2 s.
- **Sound effects:** synthesized at runtime with Web Audio from small parameter presets: charge (rising tone), jump, land (deeper with tier), bonk, stumble, footsteps (heavier with tier), pickup, drop, key unlock, gate, pickaxe hit, rubble, rope unroll, splash, bell ring, wind gust, altar chime, crown.
- **Ambience** (also synthesized): wind bed (strength per level, strongest in V), drips (II), distant crow calls (III), low drone (IV).
- Audio starts on the first key or button press (browser autoplay rules).
- Music and effects volume sliders in Options.

## 12. Controls

| Action | Keyboard | Gamepad |
|---|---|---|
| Walk / aim | ← → or A D | D-pad or left stick |
| Climb ladder | ↑ ↓ or W S | D-pad or left stick |
| Charge / jump | Space (hold, release) | A |
| Interact / pick up | E | X |
| Inventory | Tab or I | Y |
| Drop (in inventory) | Q | B |
| Pause | Esc | Start |

## 13. Screens, saving and options

- **Title:** the tower in fog, the logo, Continue (if a save exists), New Climb (asks to confirm if a save exists), Options.
- **Pause:** Resume, Map (only with the Tattered Map), Options, Quit to Title.
- **Map:** the 18 screens as a vertical strip of small thumbnails (discovered screens only), dots for dropped items, a marker for the player.
- **Options:** music volume, effects volume, fullscreen, "always show weight meter".
- **Saving:** automatic, to `localStorage` key `heavycrown.save.v1`, whenever the player lands, every 2 seconds while standing, and when the page is hidden or closed. Saved: player position and facing, carried items, every world item's position, opened doors, broken walls, placed ropes, placed relics, discovered screens, stats, options. A save with a different version number offers a new climb instead of loading.

## 14. Code structure

```
index.html
package.json  tsconfig.json  vite.config.ts
src/
  main.ts                      boot, scene switching
  engine/                      loop (fixed 60 Hz), input (keyboard + gamepad), renderer (scaling, layers), assets, save, audio/
  game/                        physics (pure), tuning, player (state machine), weight, inventory, world (tower, screens, tiles), entities/, camera
  render/                      screen baking, parallax, fog, lighting, particles, climber + scarf, effects playback, post
  content/                     items, themes (palette, fog, particles, ambience, music per level), levels/ (one file per level)
  ui/                          bitmap font, HUD, prompts, title card, title, pause, inventory, map, options, ending
  debug/                       debug tools
tools/
  art/                         art generation scripts and the contact sheet
  check-levels.ts              climbability checker
public/assets/  public/audio/  generated art and music
tests/                         Vitest tests
```

### Level format

Each level is a TypeScript file exporting its screens as 60×34 text grids (bottom screen last within a level, matching how it reads on the page top to bottom) and a legend mapping single characters to tiles, world objects, items and decorations. Space means interior (back wall shown); `.` means open air (parallax shown); `#` stone; `~` water; `i` ice; `=` hinged plank; `C` cracked wall; `H` fixed ladder; other characters are defined per level in the legend (for example `k` iron key, `G` iron gate, `h` rope hook).

### Debug mode

Enabled with `?debug` in the URL. Number keys, which no browser reserves: free flight (1), hitboxes (2), warp-to-screen menu (3), give-item menu (4), plus a frame-rate counter.

## 15. Testing

- **Unit tests (Vitest):** jump height at each weight and charge matches the formulas; wall bounce and ceiling behavior; ice and wind; weight tiers; inventory pick-up/drop/order; plate and plank thresholds; key, door, pickaxe, rope, altar rules; save round-trip.
- **Climbability checker (`npm run check:levels`):** uses the same physics code to simulate jumps from every standable position (charge sampled in 24 steps × left / up / right, plus walking off ledges) and builds a graph of reachable footholds. Each level declares expectations, for example "screens 14→17 reachable at 7 st with Crampons and Fur Cloak" and "not reachable at 11 st". Wind is simulated as calm for "reachable" checks (players can time their jumps) and both calm and gusting for "not reachable" checks. The build fails if any expectation fails.
- **Visual review:** a script captures a screenshot of every screen through the debug warp; each screen is reviewed for readability and mood.
- **Manual play-through** of the full MVP before calling it done.

## 16. Build order

Each step ends with a playable build to try.

1. Project setup, engine loop, input, renderer scaling; jump physics on a grey test screen; tune the jump feel.
2. Art tools; the climber's sprite sheets; level I tiles, backgrounds and decoration; level format; level I playable.
3. Items, weight, inventory, pickup/drop prompts, weight meter, backpack tiers and lean; keys and gates; ropes; saving.
4. Levels II–V with their mechanics (water, planks, plates, cracked walls, bells, darkness, ice, wind, altar, crown); climbability checker passing.
5. Fog, lighting, parallax, particles, effects, post-processing polish on every screen.
6. Music (after credit approval) and synthesized sound.
7. Title, pause, map, options, title cards, ending and stats; final play-through.

## 17. Out of scope for the MVP

Levels 6–30, touch/phone controls, slopes, key remapping, languages other than English, achievements, cloud saves, speedrun splits, and items planned for later (for example a grappling hook and climbing claws).
