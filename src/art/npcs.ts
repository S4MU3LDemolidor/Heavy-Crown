import { PixelBuffer } from './buffer';
import { hex, type RGBA } from './color';
import { parseGrid } from './grid';
import { castSprites } from './cast';

/** NPC and scare sprites (full-game spec sections 5–6). Facing right; feet on the bottom row. */

const P: Record<string, RGBA> = {
  k: hex('#1e1a26'),
  K: hex('#3a3448'),
  Y: hex('#e0a030'),
  W: hex('#f0eef6'),
  s: hex('#f0c49c'),
  S: hex('#c48a6a'),
  g: hex('#9a96a6'),
  G: hex('#c8c4d4'),
  b: hex('#4a3024'),
  B: hex('#7a5232'),
  n: hex('#a87a48'),
  t: hex('#1e5a5a'),
  T: hex('#3a8a86'),
  u: hex('#2a3a6a'),
  r: hex('#b0283a'),
  R: hex('#e05a4a'),
  p: hex('#4a2a6a'),
  q: hex('#8a5ac0'),
  m: hex('#6a6a7a'),
  M: hex('#a0a0b0'),
  c: hex('#5a8ab0'),
  C: hex('#a8d8f0'),
  h: hex('#2a2632'),
  H: hex('#4a4656'),
  w: hex('#d8d4e4'),
  e: hex('#08060c'),
  o: hex('#8a6a3a'),
  O: hex('#c09a5a'),
  l: hex('#6a8a3a'),
};
const OUTLINE = hex('#120d18');

const GRIDS: Record<string, string[][]> = {
  // two idle frames each
  crow: [
    ['...kkk....', '..kKkkk...', '.kkWkkkYY.', 'kkkkkkkYY.', '.kKkkkkk..', '..kkkkk...', '...Y.Y....'],
    ['...kkk....', '..kKkkk...', '.kkekkkYY.', 'kkkkkkkYY.', '.kKkkkkk..', '..kkkkk...', '...Y.Y....'],
  ],
  oskar: [
    ['....OoBn..........', '...MmOBnr.........', '..lBMmoOrR........', '.cClBnOMmrq.......', '.CcbBnoMmqp.......', 'oOnBlbmMOnB.......', 'nObBbBlMoOBn......', 'bnOoBbnbBmMs......', '.bBnObBnOBsSs.....', '..bBnBObnsSeSs....', '...bBnBbnSsss.....', '....bBnbnGgGs.....', '.....bbnbgGGG.....', '......kkbbgGG.....', '......kKkkbb......', '.....kKkkkkb......', '.....kkk.kkk......', '.....bb...bb......'],
    ['...OoBn...........', '..MmOBnr..........', '..lBMmoOrR........', '.cClBnOMmrq.......', '.CcbBnoMmqp.......', 'oOnBlbmMOnB.......', 'nObBbBlMoOBn......', 'bnOoBbnbBmMs......', '.bBnObBnOBsSs.....', '..bBnBObnsSeSs....', '...bBnBbnSsss.....', '....bBnbnGgGs.....', '.....bbnbgGGG.....', '......kkbbgGG.....', '......kKkkbb......', '.....kKkkkkb......', '.....kkk.kkk......', '.....bb...bb......'],
  ],
  nell: [
    ['...bbbbbb...', '..bBBBBBBb..', 'bbbbbbbbbbbb', '...sSeSs....', '...ssss.....', '..tTTTTt....', '.tTTttTTt.o.', '.tTtTTtTt.o.', '.ttTTTTtt.o.', '.ttTtTTttso.', '..tTTTTt..o.', '..tTTTTt..o.', '..ttTTtt..o.', '...tttt...o.', '...bb.bb..o.', '...bb.bb..o.'],
    ['...bbbbbb...', '..bBBBBBBb..', 'bbbbbbbbbbbb', '...sSeSs....', '...ssss.....', '..tTTTTt....', '.tTTttTTt.o.', '.tTtTTtTt.o.', '.ttTTTTtt.o.', '.ttTtTTttso.', '..tTTTTt..o.', '..tTTTTt..o.', '..ttTTtt..o.', '...tttt...o.', '...bb.bb..o.', '...bb.bb..o.'],
  ],
  bellringer: [
    ['....bbb......', '...bBBBb.....', '..bBBBBBb....', '..bBsSSBb....', '..bBseSsb....', '...bssSb.....', '..bBBBBBb....', '.bBBnBBBBb...', '.bBBBnBBBb.o.', 'bBBBBBnsBb.o.', 'bBBBBBBBBb.o.', '.bBBBBBBb..o.', '.bBBBBBBb..O.', '..bBBBBb...o.', '..bb..bb.....'],
    ['....bbb......', '...bBBBb.....', '..bBBBBBb....', '..bBsSSBb....', '..bBseSsb....', '...bssSb.....', '..bBBBBBb....', '.bBBnBBBBb...', '.bBBBnBBBb.o.', 'bBBBBBnsBb.O.', 'bBBBBBBBBb.o.', '.bBBBBBBb..o.', '.bBBBBBBb..o.', '..bBBBBb...o.', '..bb..bb.....'],
  ],
  peddler: [
    ['..MmM.Mm.........', '.MmMmMmMm........', '.oOomMmOo........', 'oOOoOoOoO........', 'oOMmOoOMo.kkk....', 'oOmMOoOmokkKkk...', 'oOOoOoOookkssk...', '.oOOooOook.sek...', '..oooooo.kpqqk...', '........kpqqqqk..', '........kpqpqqk..', '........kppqqpk..', '........kpqqqpk..', '.........kpppk...', '.........kk.kk...', '.........bb.bb...'],
    ['..MmM.Mm.........', '.MmMmMmMm........', '.oOomMmOo........', 'oOOoOoOoO........', 'oOMmOoOMo.kkk....', 'oOmMOoOmokkKkk...', 'oOOoOoOookkssk...', '.oOOooOook.sSk...', '..oooooo.kpqqk...', '........kpqqqqk..', '........kpqpqqk..', '........kppqqpk..', '........kpqqqpk..', '.........kpppk...', '.........kk.kk...', '.........bb.bb...'],
  ],
  hollow: [
    ['...hhh...', '..hHHHh..', '.hHHHHHh.', '.hHHHHHh.', '.hHHHHHh.', '..hHHHh..', '...hHh...', '..hhhhh..', '.hHhhhHh.', 'hHhhhhhHh', 'hHhhhhhHh', 'hhhhhhhhh', 'hHhhhhhHh', 'hHhhhhhhh', '.hhhhhhh.', '.hhhhhhh.', '.hhhhhhh.', '.hhhhhhh.', '..hhhhh..', '..hhhhh..', '..hh.hh..', '..hh.hh..', '..hh.hh..', '..hh.hh..'],
    ['...hhh...', '..hHHHh..', '.hHHHHHh.', '.hHHHHHh.', '.hHHHHHh.', '..hHHHh..', '...hHh...', '..hhhhh..', '.hHhhhHh.', 'hHhhhhhHh', 'hHhhhhhHh', 'hhhhhhhhh', 'hHhhhhhHh', 'hHhhhhhhh', '.hhhhhhh.', '.hhhhhhh.', '.hhhhhhh.', '.hhhhhhh.', '..hhhhh..', '..hhhhh..', '..hh.hh..', '..hh.hh..', '..hh.hh..', '..hh.hh..'],
  ],
  king: [
    ['..CCCCCCCCCCCC..', '.CcccccccccccC..', 'CcccgGGGgccccccC', 'CccgGsSSGgcccccC', 'CccgseSeSgcccccC', 'CccgsSSSsgcccccC', 'CccgGwwwGgcccccC', 'CcccgwwwgcccccC.', 'CccpqqqqqqpccccC', 'CcpqqpqqpqqpcccC', 'CcpqqqpqqqqpcccC', 'CcpqqqqqqqqpcccC', 'CcpqqqqqqqqpcccC', 'CcpqpqqqqpqpcccC', 'CccpqqqqqqpccccC', 'CccpqqqqqqpccccC', 'CccpqqqqqqpccccC', 'CcccpqqqqpcccccC', 'CcccpppppppccccC', '.CcccccccccccccC', '..CCCCCCCCCCCCC.'],
    ['..CCCCCCCCCCCC..', '.CcccccccccccC..', 'CcccgGGGgccccccC', 'CccgGsSSGgcccccC', 'CccgsSsSSgcccccC', 'CccgsSSSsgcccccC', 'CccgGwwwGgcccccC', 'CcccgwwwgcccccC.', 'CccpqqqqqqpccccC', 'CcpqqpqqpqqpcccC', 'CcpqqqpqqqqpcccC', 'CcpqqqqqqqqpcccC', 'CcpqqqqqqqqpcccC', 'CcpqpqqqqpqpcccC', 'CccpqqqqqqpccccC', 'CccpqqqqqqpccccC', 'CccpqqqqqqpccccC', 'CcccpqqqqpcccccC', 'CcccpppppppccccC', '.CcccccccccccccC', '..CCCCCCCCCCCCC.'],
  ],
};

const SCARE_GRIDS: Record<string, string[]> = {
  hand: ['..g.g.g...', '..g.g.g.g.', '..G.G.G.g.', '.gGgGgGgG.', '.gGGGGGGg.', 'g.gGGGGGg.', 'gGgGGGGGg.', '.gGGGGGg..', '..gGGGGg..', '..gGGGg...', '..gGGGg...', '..gGGGg...', '..gGGGg...', '..ggggg...'],
  face: ['......wwwwwwwwww......', '....wwGGGGGGGGGGww....', '...wGGGGGGGGGGGGGGw...', '..wGGGGGGGGGGGGGGGGw..', '.wGGGGGGGGGGGGGGGGGGw.', '.wGGeeeeGGGGGGeeeeGGw.', 'wGGeeeeeeGGGGeeeeeeGGw', 'wGGeeeeeeGGGGeeeeeeGGw', 'wGGGeeeeGGGGGGeeeeGGGw', 'wGGGGGGGGGGGGGGGGGGGGw', 'wGGGGGGGGgggGGGGGGGGGw', 'wGGGGGGGGGgGGGGGGGGGGw', 'wGGGGGGGGGGGGGGGGGGGGw', '.wGGGGGGeeeeeeGGGGGGw.', '.wGGGGGeeeeeeeeGGGGGw.', '..wGGGGeeeeeeeeGGGGw..', '..wGGGGGeeeeeeGGGGGw..', '...wGGGGGGGGGGGGGGw...', '....wwGGGGGGGGGGww....', '......wwwwwwwwww......'],
  figure: ['...hhhh...', '..hhhhhh..', '..hWhhWh..', '..hhhhhh..', '...hhhh...', '..hhhhhh..', '.hhhhhhhh.', 'hhhhhhhhhh', 'hhhhhhhhhh', 'hh.hhhh.hh', 'hh.hhhh.hh', 'hh.hhhh.hh', '...hhhh...', '...hhhh...', '...hhhh...', '...hh.hh..', '...hh.hh..', '...hh.hh..', '...hh.hh..', '..hhh.hhh.'],
  eyes: ['WW...WW', 'We...eW', 'WW...WW'],
};

export interface NpcArt {
  frames: PixelBuffer[];
  w: number;
  h: number;
}

function outlined(rows: string[]): PixelBuffer {
  const w = Math.max(...rows.map((r) => r.length));
  const grid = parseGrid(rows.map((r) => r.padEnd(w, '.')), P);
  const pad = new PixelBuffer(grid.w + 2, grid.h + 2);
  pad.blit(grid, 1, 1);
  pad.outline(OUTLINE);
  return pad;
}

let npcCache: Record<string, NpcArt> | null = null;
let scareCache: Record<string, PixelBuffer> | null = null;

export function npcSprites(): Record<string, NpcArt> {
  if (!npcCache) {
    npcCache = {};
    for (const [k, frames] of Object.entries(GRIDS)) {
      const bufs = frames.map(outlined);
      npcCache[k] = { frames: bufs, w: bufs[0].w, h: bufs[0].h };
    }
    // the remake's redrawn cast replaces the MVP sprites of the same name
    Object.assign(npcCache, castSprites());
  }
  return npcCache;
}

export function scareSprites(): Record<string, PixelBuffer> {
  if (!scareCache) {
    scareCache = {};
    for (const [k, rows] of Object.entries(SCARE_GRIDS)) scareCache[k] = outlined(rows);
    // the remake's scares show a Hollow One at the new scale, not the MVP's small figure
    scareCache.figure = castSprites().hollow.frames[0];
  }
  return scareCache;
}

/** A bucket on a rope under a pulley wheel, for lift stations (12×28). */
export function liftSprite(): PixelBuffer {
  return outlined([
    '...MMMMM....',
    '..MmmmmmM...',
    '..Mm.k.mM...',
    '..MmmmmmM...',
    '...MMMMM....',
    '.....n......',
    '.....n......',
    '.....n......',
    '.....n......',
    '.....n......',
    '.....n......',
    '.....n......',
    '.....n......',
    '.....n......',
    '.....n......',
    '.....n......',
    '.....n......',
    '.....n......',
    '..kkkkkkk...',
    '.kBnnnnnBk..',
    '.kbBnnnBbk..',
    '..kbBBBbk...',
    '..kbbbbbk...',
    '...kkkkk....',
  ]);
}
