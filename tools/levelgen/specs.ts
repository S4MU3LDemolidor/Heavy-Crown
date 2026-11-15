/**
 * The generated levels (full-game spec sections 2 and 5): what each one is made of and where the story goes.
 * Levels 1, 7, 13, 19 and 25 are the hand-made MVP levels and are not listed here.
 * Regenerate with `npm run levels:gen [ids...]`; then `npm run check:levels`.
 */
import type { LegendEntry } from '../../src/game/level';
import { SUMMIT_LEGEND, SUMMIT_SCREEN } from '../../src/content/levels/summit';
import type { GenSpec, Placement } from './gen';

const item = (id: string): LegendEntry => ({ kind: 'item', item: id });
const npc = (id: string, scene: string, order?: number): LegendEntry => ({ kind: 'object', object: 'npc', props: { id, scene, ...(order !== undefined ? { order } : {}) } });
const note = (id: string): LegendEntry => ({ kind: 'object', object: 'note', props: { id } });
const lift = (order: number): LegendEntry => ({ kind: 'object', object: 'lift', props: { net: 'nell', order } });
const scare = (id: string, kind: string, cond = 'none', w = 6, h = 5): LegendEntry => ({ kind: 'object', object: 'scare', props: { id, kind, cond, w, h } });

const coin = (at: number, char = 'c', alcove = false): Placement => ({ char, entry: item('coin_pouch'), at, alcove });
const crow = (level: number, at: number): Placement => ({ char: 'K', entry: npc('crow', `l${level}`), at, room: 3 });
const station = (order: number, at: number): Placement => ({ char: 'L', entry: lift(order), at, room: 3 });
/** Maren's Echo, one ledge ahead of the climber all through Act V. */
const echo = (order: number, at: number, char: string): Placement => ({ char, entry: npc('echo', 'echo', order), at, room: 2 });

/** The summit screen with Maren's Echo waiting by the altar. */
const SUMMIT = SUMMIT_SCREEN.map((row, y) => (y === 6 ? row.slice(0, 40) + 'Z' + row.slice(41) : row));

export const SPECS: GenSpec[] = [
  // ---------- Act I: the Overgrown Base (up to 5 st) ----------
  {
    id: 2, slug: 'root-stair', name: 'The Root Stair', theme: 'overgrown', seed: 200, load: 5,
    pieces: [{ kind: 'floor', at: 0.45 }],
    place: [crow(2, 0.12), { char: 'x', entry: item('chalice'), at: 0.6, alcove: true }, coin(0.85)],
  },
  {
    id: 3, slug: 'hoarders-hollow', name: "The Hoarder's Hollow", theme: 'overgrown', seed: 300, load: 5,
    style: { open: 0.35 },
    pieces: [{ kind: 'floor', at: 0.3 }, { kind: 'floor', at: 0.72 }],
    place: [{ char: 'O', entry: npc('oskar', 'l3'), at: 0.32, room: 4 }, coin(0.5, 'c', true), coin(0.9)],
  },
  {
    id: 4, slug: 'ivy-wall', name: 'The Ivy Wall', theme: 'overgrown', seed: 400, load: 5, needs: ['claws'], requires: ['claws'],
    pieces: [{ kind: 'ivy', at: 0.28, side: 'L' }, { kind: 'ivy', at: 0.66, side: 'R' }],
    place: [
      { char: 'w', entry: item('claws'), at: 0.08, reachWith: [] },
      { char: 'n', entry: note('note6'), at: 0.12, reachWith: [] },
      coin(0.55), coin(0.92, 'c', true),
    ],
  },
  {
    id: 5, slug: 'crows-rest', name: "Crow's Rest", theme: 'overgrown', seed: 500, load: 5, needs: ['claws'], requires: ['claws'],
    style: { open: 0.6 },
    pieces: [{ kind: 'pillar', at: 0.35 }, { kind: 'ivy', at: 0.7 }],
    place: [crow(5, 0.2), { char: 'r', entry: item('ruby'), at: 0.62, alcove: true }, coin(0.85)],
  },
  {
    id: 6, slug: 'sunken-gate', name: 'The Sunken Gate', theme: 'overgrown', seed: 600, load: 5, needs: ['claws'], requires: ['claws'],
    style: { open: 0.3 },
    pieces: [{ kind: 'ivy', at: 0.3 }, { kind: 'floor', at: 0.7 }],
    place: [{ char: 'P', entry: npc('peddler', 'l6'), at: 0.74, room: 4 }, coin(0.45), coin(0.9, 'c', true)],
  },

  // ---------- Act II: the Drowned Cistern (up to 7 st) ----------
  {
    id: 8, slug: 'nells-landing', name: "Nell's Landing", theme: 'cistern', seed: 800, load: 7, needs: ['claws'], requires: ['claws'],
    pieces: [{ kind: 'floor', at: 0.25, pool: true }, { kind: 'ivy', at: 0.6 }],
    place: [{ char: 'E', entry: npc('nell', 'l8'), at: 0.27, room: 4 }, station(0, 0.3), crow(8, 0.85), coin(0.5, 'c', true)],
  },
  {
    id: 9, slug: 'black-pool', name: 'The Black Pool', theme: 'cistern', seed: 900, load: 7, needs: ['claws'], requires: ['claws'],
    pieces: [{ kind: 'floor', at: 0.2, pool: true }, { kind: 'shaft', at: 0.45 }, { kind: 'floor', at: 0.8, pool: true }],
    place: [
      { char: 'S', entry: scare('hand9', 'hand', 'none', 5, 4), at: 0.21 },
      { char: 'O', entry: npc('oskar', 'l9'), at: 0.82, room: 4 },
      { char: 'x', entry: item('chalice'), at: 0.6, alcove: true }, coin(0.35),
    ],
  },
  {
    id: 10, slug: 'ring-vault', name: 'The Ring Vault', theme: 'cistern', seed: 1000, load: 7, needs: ['claws', 'hook'], requires: ['hook'],
    pieces: [{ kind: 'rings', at: 0.35 }, { kind: 'rings', at: 0.72, count: 2 }],
    place: [
      { char: 'j', entry: item('hook'), at: 0.12, reachWith: ['claws'] },
      { char: 'n', entry: note('note7'), at: 0.16, reachWith: ['claws'] },
      coin(0.55, 'c', true), coin(0.9),
    ],
  },
  {
    id: 11, slug: 'weir', name: 'The Weir', theme: 'cistern', seed: 1100, load: 7, needs: ['claws', 'hook'], requires: ['hook', 'claws'],
    pieces: [{ kind: 'floor', at: 0.2, pool: true }, { kind: 'rings', at: 0.42 }, { kind: 'ivy', at: 0.7 }],
    place: [crow(11, 0.15), { char: 'r', entry: item('ruby'), at: 0.6, alcove: true }, coin(0.88)],
  },
  {
    id: 12, slug: 'orbs-crown', name: "The Orb's Crown", theme: 'cistern', seed: 1200, load: 7, needs: ['claws', 'hook'], requires: ['hook'],
    pieces: [{ kind: 'pillar', at: 0.25, face: '&' }, { kind: 'rings', at: 0.6, count: 2 }],
    place: [
      { char: 'E', entry: npc('nell', 'l12'), at: 0.1, room: 4 }, station(1, 0.12),
      { char: 'o', entry: item('orb'), at: 1 }, { char: 'n', entry: note('note8'), at: 0.97 },
      coin(0.45, 'c', true),
    ],
  },

  // ---------- Act III: the Bell Hall (up to 7 st) ----------
  {
    id: 14, slug: 'ringers-loft', name: "The Ringer's Loft", theme: 'bells', seed: 1400, load: 7, needs: ['claws'], requires: ['claws'],
    pieces: [{ kind: 'bells', at: 0.15, count: 3 }, { kind: 'ivy', at: 0.55, face: '&' }],
    place: [
      { char: 'R', entry: npc('bellringer', 'l14'), at: 0.08, room: 4 }, { char: 'P', entry: npc('peddler', 'l14'), at: 0.72, room: 4 },
      crow(14, 0.88), { char: 'x', entry: item('chalice'), at: 0.45, alcove: true },
    ],
  },
  {
    id: 15, slug: 'silent-bell', name: 'The Silent Bell', theme: 'bells', seed: 1500, load: 7, needs: ['hook'], requires: ['hook'],
    pieces: [{ kind: 'bells', at: 0.2, count: 2 }, { kind: 'rings', at: 0.5 }, { kind: 'bells', at: 0.75, count: 2 }],
    place: [
      { char: 'S', entry: scare('figure15', 'figure', 'none', 6, 6), at: 0.3 },
      { char: 'n', entry: note('note9'), at: 0.65 }, station(2, 0.9), coin(0.4, 'c', true),
    ],
  },
  {
    id: 16, slug: 'broken-clock', name: 'The Broken Clock', theme: 'bells', seed: 1600, load: 7, needs: ['claws'], requires: ['claws'],
    pieces: [{ kind: 'shaft', at: 0.3 }, { kind: 'bells', at: 0.65, count: 3 }],
    place: [{ char: 'O', entry: npc('oskar', 'l16'), at: 0.15, room: 4 }, { char: 'r', entry: item('ruby'), at: 0.55, alcove: true }, coin(0.9)],
  },
  {
    id: 17, slug: 'bell-tune', name: 'The Bell Tune', theme: 'bells', seed: 1700, load: 7, needs: ['hook'], requires: ['hook'],
    pieces: [{ kind: 'bells', at: 0.15, count: 4 }, { kind: 'rings', at: 0.6, count: 2 }],
    place: [
      { char: 'R', entry: npc('bellringer', 'l17'), at: 0.3, room: 4 }, crow(17, 0.5),
      { char: 'g', entry: item('idol'), at: 0.85, alcove: true }, coin(0.95),
    ],
  },
  {
    id: 18, slug: 'last-light', name: 'The Last Light', theme: 'bells', seed: 1800, load: 7, needs: ['claws'], requires: ['claws'],
    pieces: [{ kind: 'ivy', at: 0.3, face: '&' }, { kind: 'pillar', at: 0.65, face: '&' }],
    place: [
      station(3, 0.12), { char: 's', entry: item('scepter'), at: 1 }, { char: 'l', entry: item('lantern'), at: 0.96 },
      { char: 'n', entry: note('note3'), at: 0.9 }, { char: 'N', entry: note('note4'), at: 0.98 }, coin(0.45, 'c', true),
    ],
  },

  // ---------- Act IV: the Lightless Floors (up to 8 st: lantern plus relic plus claws) ----------
  {
    id: 20, slug: 'standing-dark', name: 'The Standing Dark', theme: 'dark', seed: 2000, load: 8, needs: ['claws'], requires: ['claws'],
    pieces: [{ kind: 'floor', at: 0.25 }, { kind: 'ivy', at: 0.6 }],
    place: [crow(20, 0.1), { char: 'S', entry: scare('face20', 'face', 'lantern', 5, 5), at: 0.45 }, { char: 'Y', entry: npc('hollow', 'l20'), at: 0.8, room: 3 }, coin(0.7, 'c', true)],
  },
  {
    id: 21, slug: 'whispering-stair', name: 'The Whispering Stair', theme: 'dark', seed: 2100, load: 8, needs: ['claws'], requires: ['claws'],
    pieces: [{ kind: 'shaft', at: 0.3 }, { kind: 'floor', at: 0.7 }],
    place: [station(4, 0.08), { char: 'Y', entry: npc('hollow', 'l21'), at: 0.5, room: 3 }, { char: 'n', entry: note('note10'), at: 0.74 }, { char: 'x', entry: item('chalice'), at: 0.9, alcove: true }],
  },
  {
    id: 22, slug: 'peddlers-candle', name: "The Peddler's Candle", theme: 'dark', seed: 2200, load: 8, needs: ['claws'], requires: ['claws'],
    pieces: [{ kind: 'floor', at: 0.3 }, { kind: 'pillar', at: 0.6 }],
    place: [{ char: 'P', entry: npc('peddler', 'l22'), at: 0.32, room: 4 }, { char: 'S', entry: scare('hollow22', 'hollow', 'faceAway', 6, 5), at: 0.85 }, { char: 'r', entry: item('ruby'), at: 0.5, alcove: true }, coin(0.95)],
  },
  {
    id: 23, slug: 'breathing-hall', name: 'The Breathing Hall', theme: 'dark', seed: 2300, load: 8, needs: ['claws'], requires: ['claws'],
    pieces: [{ kind: 'ivy', at: 0.3 }, { kind: 'floor', at: 0.65 }],
    place: [crow(23, 0.1), { char: 'S', entry: scare('breath23', 'breath', 'still', 8, 5), at: 0.67 }, { char: 'Y', entry: npc('hollow', 'l23'), at: 0.85, room: 3 }, coin(0.5, 'c', true)],
  },
  {
    id: 24, slug: 'ossuary', name: 'The Ossuary', theme: 'dark', seed: 2400, load: 8, needs: ['claws'], requires: ['claws'],
    pieces: [{ kind: 'shaft', at: 0.25 }, { kind: 'ivy', at: 0.62 }],
    place: [station(5, 0.1), { char: 's', entry: item('seal'), at: 1 }, { char: 'n', entry: note('note11'), at: 0.96 }, coin(0.45, 'c', true), coin(0.8)],
  },

  // ---------- Act V: the Frozen Spire (up to 7 st with Crampons and Fur Cloak) ----------
  {
    id: 26, slug: 'white-stair', name: 'The White Stair', theme: 'frozen', seed: 2600, load: 7, needs: ['crampons'], cloak: true,
    wind: [{ screen: 1, dir: 1 }],
    pieces: [{ kind: 'ice', at: 0.2, count: 3 }, { kind: 'ice', at: 0.65, count: 3 }],
    place: [crow(26, 0.08), station(6, 0.1), echo(1, 0.3, 'Z'), echo(2, 0.6, 'z'), echo(3, 0.9, 'Q'), { char: 'g', entry: item('idol'), at: 0.5, alcove: true }],
  },
  {
    id: 27, slug: 'echo', name: 'The Echo', theme: 'frozen', seed: 2700, load: 7, needs: ['crampons'], cloak: true,
    wind: [{ screen: 0, dir: -1 }, { screen: 2, dir: 1 }],
    pieces: [{ kind: 'ice', at: 0.3, count: 4 }, { kind: 'floor', at: 0.7 }],
    place: [echo(4, 0.2, 'Z'), echo(5, 0.5, 'z'), { char: 'S', entry: scare('echo27', 'echo', 'none', 5, 5), at: 0.72 }, echo(6, 0.9, 'Q'), { char: 'r', entry: item('ruby'), at: 0.6, alcove: true }],
  },
  {
    id: 28, slug: 'king-in-the-ice', name: 'The King in the Ice', theme: 'frozen', seed: 2800, load: 7, needs: ['crampons'], cloak: true,
    wind: [{ screen: 1, dir: -1 }],
    pieces: [{ kind: 'floor', at: 0.4 }, { kind: 'ice', at: 0.7, count: 3 }],
    place: [
      echo(7, 0.15, 'Z'), { char: 'k', entry: npc('king', 'l28'), at: 0.43, room: 4 }, { char: 'S', entry: scare('eyes28', 'eyes', 'none', 4, 4), at: 0.43 },
      { char: 'n', entry: note('note12'), at: 0.5 }, station(7, 0.6), echo(8, 0.9, 'z'), coin(0.3, 'c', true),
    ],
  },
  {
    id: 29, slug: 'last-climb', name: 'The Last Climb', theme: 'frozen', seed: 2900, load: 7, needs: ['crampons'], cloak: true,
    wind: [{ screen: 0, dir: 1 }, { screen: 1, dir: -1 }],
    pieces: [{ kind: 'ice', at: 0.25, count: 3 }, { kind: 'ice', at: 0.7, count: 3 }],
    place: [crow(29, 0.1), echo(9, 0.4, 'Z'), echo(10, 0.75, 'z'), coin(0.55, 'c', true)],
  },
  {
    id: 30, slug: 'summit', name: 'The Summit', theme: 'frozen', seed: 3000, load: 7, needs: ['crampons'], cloak: true, failsAt: 11,
    wind: [{ screen: 2, dir: -1 }],
    fixedTop: [SUMMIT], fixedLegend: { ...SUMMIT_LEGEND, Z: npc('echo', 'echo', 99) }, topTarget: [0, 37, 31], exitCell: [0, 30, 6],
    pieces: [{ kind: 'ice', at: 0.4, count: 3 }],
    place: [echo(11, 0.3, 'z'), { char: 'N', entry: note('note5'), at: 0.9 }],
  },
];
