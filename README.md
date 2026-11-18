# Heavy Crown

A browser tower climber about weight, and about what you carry. Ten years ago Maren climbed the tower to bring back the dawn and never came home; the night she left, her child Wren told her not to come back. Tonight the summit bell rings, and Wren climbs with her old pack and the words they cannot put down. Every item makes your jumps shorter, and anything you put down stays where you left it. Bring the Orb, the Scepter and the Seal to the altar at the summit, and choose what to let go of.

Fifteen hand-made levels in five acts (the Overgrown Base, the Drowned Cistern, the Bell Hall, the Lightless Floors, the Frozen Spire): Maren's fifteen notes, a cast with portraits and their own troubles (the Crow, Oskar the Hoarder, Nell of the Cistern, the Bellringer, the Hollow Ones, the Old King), campfire talks at the end of each act, a memory of the night Maren left, a few earned scares, the Climbing Claws and the Grappling Hook, a four-bell tune, and two endings.

## Play

```bash
npm install
npm run dev
```

Open http://localhost:5173.

| Action | Keyboard | Gamepad |
|---|---|---|
| Walk / aim | ← → or A D | D-pad / left stick |
| Climb ladders | ↑ ↓ or W S | D-pad / left stick |
| Charge and jump | hold and release Space | A |
| Interact / pick up | E | X |
| Pack (choose an item, read about it) | Tab or I | Y |
| Drop the selected item | Q | B |
| Fire the Grappling Hook (aim with the arrows) | F | RB |
| Cling to ivy or rough walls (with the Climbing Claws) | hold toward the wall (+ Up from the ground) | same |
| Pause | Esc | Start |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | type-check and build the static game into `dist/` |
| `npm test` | unit tests (physics, weight, items, objects, levels) |
| `npm run check:levels [ids]` | climbability checker: every level climbs into the next at its load, set pieces cannot be skipped, the summit refuses two relics |
| `npm run art:preview` | writes PNG previews of the art to `previews/`; `art:preview level 4 10` renders whole levels with their objects marked |
| `npx tsx tools/reach.ts` | prints the tower with reachable ledges (flags are listed at the top of the file) |

URL flags: `?new` clears the save, `?play` skips the title, `?debug` shows debug text (`2` toggles hitboxes), `?test` loads the grey jump-tuning tower, `?moves` loads a playground for the Climbing Claws and the Grappling Hook.

## Music

Each level has its own ambient track in `public/audio/<theme>.mp3` (`title`, `overgrown`, `cistern`, `bells`, `dark`, `frozen`), made with Higgsfield (ElevenLabs Music v2.5, instrumental). Each one is trimmed before its fade-out, crossfaded into its own start so it loops without a seam, and normalized to about −18 LUFS. If a file is missing, the game generates an ambient score in that level's key instead.

## Layout

- `src/game/` — pure game logic (no DOM): physics, player, weight, items, world objects, levels, climbability search.
- `src/art/` — all art, hand-pixeled in code into pixel buffers: Wren (`climber.ts`), the cast (`cast.ts`), dialogue portraits (`portraits.ts`, `sitters/`), story props (`props.ts`), items, terrain, sky and parallax, font.
- `src/render/` — scene, lighting, fog, particles, foliage, pixelfx effects.
- `src/ui/` — HUD, inventory, notes, menus, map, journal, ending.
- `src/content/` — themes, items, story (notes, whispers, endings), NPC scripts, cutscenes (`cutscenes.ts`), the levels. The 15 levels are hand-made in `src/content/levels/lNN-*.ts` from `blockout()` rectangles.
- `docs/superpowers/` — design spec and build plans.

Pixel effects for the aurora, light beams and holy moments come from [pixelfx](https://github.com/patch-gg/pixelfx) (MIT), vendored in `src/vendor/pixelfx`.
