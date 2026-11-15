# Heavy Crown

A browser tower climber about weight. Climb an ancient tower one charged jump at a time; everything you carry makes your jumps shorter, and anything you put down stays where you left it. Bring the Orb, the Scepter and the Seal to the summit altar to lift the crown and bring back the dawn.

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
| Pack (inventory) | Tab or I | Y |
| Drop (in the pack) | Q | B |
| Pause | Esc | Start |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | type-check and build the static game into `dist/` |
| `npm test` | unit tests (physics, weight, items, objects, levels) |
| `npm run check:levels` | climbability checker: proves every route and weight rule in the level design |
| `npm run art:preview` | writes PNG previews of the art to `previews/` |
| `npx tsx tools/reach.ts` | prints the tower with reachable ledges (flags are listed at the top of the file) |

URL flags: `?new` clears the save, `?play` skips the title, `?debug` shows debug text (`2` toggles hitboxes), `?test` loads the grey jump-tuning tower.

## Music

The game plays `public/audio/<theme>.mp3` when present (`title`, `overgrown`, `cistern`, `bells`, `dark`, `frozen`); otherwise it generates an ambient score in each level's key.

## Layout

- `src/game/` — pure game logic (no DOM): physics, player, weight, items, world objects, levels, climbability search.
- `src/art/` — all art, painted in code into pixel buffers: climber, items, terrain, sky and parallax, font.
- `src/render/` — scene, lighting, fog, particles, foliage, pixelfx effects.
- `src/ui/` — HUD, inventory, notes, menus, map, journal, ending.
- `src/content/` — themes, items, story, the five levels.
- `tools/leveldraft/` — the Python drafts the level files are generated from.
- `docs/superpowers/` — design spec and build plans.

Pixel effects for the aurora, light beams and holy moments come from [pixelfx](https://github.com/patch-gg/pixelfx) (MIT), vendored in `src/vendor/pixelfx`.
