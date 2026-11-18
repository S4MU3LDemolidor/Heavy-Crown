import type { ItemId } from '../content/items';
import { PixelBuffer } from './buffer';
import { hex, type RGBA } from './color';
import { parseGrid } from './grid';

/** Item icons, 12×12, resting on the bottom row; drawn outlined. */
export const ITEM_SIZE = 12;

const P: Record<string, RGBA> = {
  k: hex('#3a3a48'),
  K: hex('#6a6a7a'),
  I: hex('#a0a0b0'),
  g: hex('#8a5a1a'),
  G: hex('#d8a030'),
  Y: hex('#f8e070'),
  W: hex('#fff8e0'),
  r: hex('#b0283a'),
  R: hex('#ff7080'),
  d: hex('#6a1428'),
  b: hex('#4a3024'),
  B: hex('#7a5232'),
  n: hex('#a87a48'),
  c: hex('#d8c498'),
  C: hex('#9a8458'),
  s: hex('#5a6270'),
  S: hex('#a8b0c0'),
  w: hex('#eef2f8'),
  f: hex('#e6dcc8'),
  F: hex('#a89c88'),
  x: hex('#ece0c4'),
  X: hex('#a89c80'),
  e: hex('#f8a030'),
  E: hex('#fff0a0'),
  u: hex('#3a5ab0'),
  U: hex('#8ab0f0'),
  h: hex('#f6f6fc'),
  H: hex('#b0b0c8'),
  t: hex('#1e7a7a'),
  T: hex('#7ae8d8'),
  p: hex('#4a2a6a'),
  q: hex('#8a5ac0'),
};

const GRIDS: Record<ItemId, string[]> = {
  iron_key: ['', '', '', '', '', '', '.KKK........', 'K...K.......', 'K.I.KKKKKKKK', 'K...K....k.k', '.KkK.....k.k'],
  bell_key: ['', '', '', '', '', '', '..gGg.......', '.gYYGg......', '.gYGGgGGGGGG', 'gGGGGGg..g.g', '.........g.g'],
  bone_key: ['', '', '', '', '', '', '.xx.........', 'xXXx........', '.xxxxxxxxxx.', 'xXXx....X.X.', '.xx.....x.x.'],
  lantern: ['....kkkk....', '...k....k...', '....kKKk....', '...gGGGGg...', '...gUEEUg...', '...gEEeEg...', '...geEEeg...', '...gUeeUg...', '...gGGGGg...', '....gggg....', '...gGGGGg...'],
  rope: ['', '', '', '....nnnn....', '..nnBBBBnn..', '.nB.nnnn.Bn.', '.nBn....nBn.', '.nBn....nBn.', '.nB.nnnn.Bn.', '..nnBBBBnn..', '....nnnn..bb'],
  pickaxe: ['', '..kKKKKKk...', '.k..IIn..k..', 'k....Bn...k.', '.....Bn.....', '....Bn......', '....Bn......', '...Bn.......', '...Bn.......', '..Bn........', '..b.........'],
  spring_boots: ['', '', '', '..BBB.......', '..BnB.......', '..BnB.......', '..BnBB......', '.bBnnBBBB...', '.bBBBBBBBB..', '.bbbbbbbbb..', '..gYg.gYg...'],
  crampons: ['', '', '', '', '', '...B...B....', '..KKKKKKK...', '.KIIIIIIIK..', '.KKKKKKKKK..', '.k.k.k.k.k..', '.k.k.k.k.k..'],
  fur_cloak: ['', '', '', '', '...FFFFF....', '..FffffFF...', '.FfffffffF..', '.FffFFfffF..', '.FfffffFfF..', '.FFffffffF..', '..FFFFFFF...'],
  feather_charm: ['', '........b...', '.......b....', '......hh....', '.....hhH....', '....hhHh....', '...hhHh.....', '...hHh......', '..hHh.......', '..hh........', '.H..........'],
  map: ['', '', '', '', '', '.CccccccC...', 'CcccccccccC.', 'Cc.r..c.ccC.', 'Ccccr.cr.cC.', 'CcccccccccC.', '.CCCCCCCCC..'],
  stone: ['', '', '', '....KKK.....', '..KKIIKKk...', '.KIIKKKKkk..', '.KIKKKKKkk..', 'KKKKKKKkkk..', 'KKKKKKkkkkk.', 'KkKKkkkkkkk.', '.kkkkkkkkk..'],
  coin_pouch: ['', '', '', '....B.B.....', '.....B......', '...BnnnB....', '..BnnnnnB...', '.BnnnGnnnB..', '.BnnnnnnnB..', '.BBnnnnnBB..', '..BBBBBBB.GY'],
  ruby: ['', '', '', '', '', '....RRR.....', '...RRrRR....', '..rRRrrrr...', '...rrrrd....', '....rdd.....', '.....d......'],
  chalice: ['', '', '.wSSSSSSs...', '.SwwSSSSs...', '..SwSSSs....', '...SSSs.....', '....Ss......', '....Ss......', '...SSSs.....', '..SSSSSs....', '..sssssss...'],
  idol: ['...Y.Y.Y....', '...GGGGG....', '...gYYGg....', '...gYrGg....', '....GGG.....', '..GYYGGGg...', '.gGYGGGGgg..', '.g.YGGGG.g..', '...GGGGg....', '..GGgGGgg...', '.ggggggggg..'],
  orb: ['', '.....Y......', '....YYY.....', '.....G......', '...gGGGg....', '..gGYYGGg...', '.gGYTTGGgg..', '.gGYTtGGgg..', '.gGGGGGGgg..', '..gGGGGgg...', '...ggggg....'],
  scepter: ['.........YY.', '........YqqY', '........YqqY', '.........YY.', '........G...', '.......G....', '......Gg....', '.....Gg.....', '....Gg......', '...Gg.......', '..gg........'],
  seal: ['', '', '....gggg....', '..ggGGGGgg..', '.gGGYYYYGGg.', '.gGYGrrGYGg.', 'gGGYrRRrYGGg', 'gGGYrrrrYGGg', '.gGYGrrGYGg.', '.gGGYYYYGGg.', '..ggGGGGgg..'],
  claws: ['', '', '.k.k.k......', '.K.K.K......', '.KIKIK......', '.BBBBB.k.k.k', '.BnnnB.K.K.K', '..BBB..KIKIK', '.......BBBBB', '.......BnnnB', '........BBB.'],
  hook: ['....k.......', '...kIk......', '.k..K..k....', '.Kk.K.kK....', '..KKKKK.....', '....K.......', '....n.......', '...nBn.nnn..', '..nB.Bn...n.', '..nB.Bn..n..', '...nnn..n...'],
  crown: ['', '', '.Y...Y...Y..', '.YY.YYY.YY..', '.GYYGRGYYG..', '.GGYGGGYGG..', '.GrGGTGGrG..', '.GGGGGGGGG..', '.gggggggggg.', '', ''],
  words: ['', '', '', '...cccccc...', '..cxxxxxxc..', '.cxCxxxxCxc.', '.cxxrrrrxxc.', '.cxxxrrxxxc.', '.cCxxxxxxCc.', '..cCCCCCCc..', '...cccccc...'],
};

const OUTLINE = hex('#120d18');

function build(rows: string[]): PixelBuffer {
  const full = Array.from({ length: ITEM_SIZE - 1 }, (_, i) => (rows[i] ?? '').padEnd(ITEM_SIZE, '.').slice(0, ITEM_SIZE));
  full.push('.'.repeat(ITEM_SIZE));
  // shift content down so its lowest pixel sits on row 10 (the outline then touches row 11)
  let last = -1;
  full.forEach((r, i) => {
    if (/[^.]/.test(r)) last = i;
  });
  const shift = Math.max(0, 10 - last);
  const shifted = [...Array(shift).fill('.'.repeat(ITEM_SIZE)), ...full].slice(0, ITEM_SIZE);
  const buf = parseGrid(shifted, P);
  buf.outline(OUTLINE);
  return buf;
}

let cache: Record<ItemId, PixelBuffer> | null = null;

export function itemSprites(): Record<ItemId, PixelBuffer> {
  if (!cache) {
    cache = {} as Record<ItemId, PixelBuffer>;
    for (const id of Object.keys(GRIDS) as ItemId[]) cache[id] = build(GRIDS[id]);
  }
  return cache;
}

// ---------- world objects ----------

/** One tile of an iron gate (top, middle or bottom part). */
export function gateTile(part: 'top' | 'mid' | 'bottom', tint: 'iron' | 'bronze' | 'bone' = 'iron'): PixelBuffer {
  const pal = tint === 'iron' ? [P.k, P.K, P.I] : tint === 'bronze' ? [P.g, P.G, P.Y] : [P.X, P.x, P.W];
  const b = new PixelBuffer(8, 8);
  for (const bx of [1, 4, 7]) {
    for (let y = 0; y < 8; y++) {
      b.set(bx - 1, y, pal[0]);
      b.set(bx, y, y % 4 === 0 ? pal[2] : pal[1]);
    }
  }
  if (part === 'top') {
    for (let x = 0; x < 8; x++) b.set(x, 1, pal[1]);
    for (let x = 0; x < 8; x++) b.set(x, 2, pal[0]);
    for (const bx of [1, 4, 7]) b.set(bx, 0, pal[2]);
  }
  if (part === 'bottom') {
    for (let x = 0; x < 8; x++) b.set(x, 5, pal[1]);
    for (let x = 0; x < 8; x++) b.set(x, 6, pal[0]);
  }
  return b;
}

export const ROPE_HOOK = parseGrid(['..kKk...', '.k...k..', '.k...k..', '..kKkK..', '....K...', '...KKK..', '..KIIIK.', '.kKKKKKk'], P);

/** One 8×8 tile of rope ladder. */
export function ladderTile(rope: boolean): PixelBuffer {
  const b = new PixelBuffer(8, 8);
  const side = rope ? P.n : P.B;
  const dark = rope ? P.B : P.b;
  for (let y = 0; y < 8; y++) {
    b.set(1, y, side);
    b.set(6, y, side);
    b.set(0, y, dark);
    b.set(7, y, dark);
  }
  for (const y of [2, 6]) for (let x = 1; x < 7; x++) b.set(x, y, rope ? P.B : P.n);
  return b;
}

/** Maren's note pinned to the wall. */
export const NOTE = parseGrid(['...r....', '.cccccc.', '.cCCCCc.', '.cccccc.', '.cCCCc..', '.cccccc.', '.cCCCCc.', '.cccccc.', '.cCCc.c.', '..ccccc.'], P);

/** An iron ring for the Grappling Hook, on a bolt in the wall (8×10). */
export const RING = parseGrid(['...kk...', '...KK...', '..kKKk..', '.k.II.k.', 'K......K', 'K......K', 'K......k', '.k....k.', '..kKKk..', '........'], P);

export const PALETTE = P;
