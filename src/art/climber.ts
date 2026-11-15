import { PixelBuffer } from './buffer';
import { hex, type RGBA } from './color';
import { parseGrid } from './grid';

/**
 * The climber: a small hooded pilgrim with a red scarf (spec section 10).
 * Frames are composed from hand-placed parts (facing right), then leaned and packed per load tier,
 * then outlined. Everything is built once at load into one sheet.
 */

export const FRAME_W = 28;
export const FRAME_H = 30;
/** Feet sit on this row; the body is centered on FEET_X. */
export const FEET_Y = 29;
export const FEET_X = 15;

const PAL: Record<string, RGBA> = {
  k: hex('#262c48'), // cloak darkest
  c: hex('#3b4a74'), // cloak
  C: hex('#566ca0'), // cloak light
  h: hex('#7d97c8'), // cloak rim light
  s: hex('#f2c49c'), // skin
  S: hex('#c88c6c'), // skin shade
  e: hex('#1a1220'), // eye
  r: hex('#d6453b'), // scarf
  R: hex('#962838'), // scarf dark
  l: hex('#f78c5c'), // scarf light
  p: hex('#3a2e40'), // trousers
  P: hex('#4e4058'), // trousers light
  b: hex('#4a3024'), // boot
  B: hex('#70482e'), // boot light
  w: hex('#7a5532'), // strap leather
  W: hex('#a8783e'), // buckle
};
export const OUTLINE = hex('#120d18');

/** Pack colors. */
const PACK: Record<string, RGBA> = {
  d: hex('#4a3826'), // pack dark
  m: hex('#7a6040'), // pack canvas
  M: hex('#a08458'), // pack light
  L: hex('#c8ac78'), // pack highlight
  w: hex('#5a3c26'), // straps
  W: hex('#c89a4a'), // buckles
  g: hex('#3e4a34'), // bedroll green
  G: hex('#5a6a44'), // bedroll light
};

const part = (rows: string[], pal: Record<string, RGBA> = PAL) => parseGrid(rows, pal);

// ---------- heads (9 wide) ----------
const HEAD = part([
  '...kkk...',
  '..kChCk..',
  '.kChCCck.',
  'kcCCCCcck',
  'kcCCckSSS',
  'kcCcksses',
  'kccckssss',
  'kkcckkSs.',
]);
const HEAD_UP = part([
  '..kkk....',
  '.kChCkk..',
  'kChCCCck.',
  'kcCCCCcck',
  'kcCCCckSs',
  'kcCcksses',
  'kccckssss',
  'kkcckkkS.',
]);
const HEAD_DOWN = part([
  '...kkk...',
  '..kChCk..',
  '.kChCCck.',
  'kcCCCCcck',
  'kcCCCckSk',
  'kcCcckSSS',
  'kccckssse',
  'kkcckkSs.',
]);

// ---------- torsos (11 wide), scarf on top ----------
const TORSO = part([
  '..Rrrrrrl...',
  '.kRrrrrrrl..',
  'kcCRRrRCck..',
  'kcCcccccck..',
  'kcCccccCck..',
  'kwwwwwwwWk..',
  'kcCcccccCck.',
  'kcCccccccCk.',
  'kkkkkkkkkkk.',
]);
const TORSO_FLUTTER = part([
  '..Rrrrrrl...',
  '.kRrrrrrrl..',
  'kcCRRrRCck..',
  'kcCcccccck..',
  'kcCccccCck..',
  'kwwwwwwwWk..',
  'kcCcccccCcck',
  'kkCccccccCck',
  'k.kkkkkkkkk.',
]);
const TORSO_HANDS = part([
  '..Rrrrrrl...',
  '.kRrrrrrrl..',
  'kcCRRrRCck..',
  'kcCcccccck..',
  'kcCccccCcs..',
  'kwwwwwwwWss.',
  'kcCcccccCck.',
  'kcCccccccCk.',
  'kkkkkkkkkkk.',
]);

// ---------- legs (9 wide) ----------
const LEGS: Record<string, PixelBuffer> = {
  stand: part([
    '..pP.pP..',
    '..pP.pP..',
    '..pP.pP..',
    '.bbB.bbB.',
    '.bbbbbbbB',
  ].map((r) => r.padEnd(9, '.').slice(0, 9))),
  walk1: part([
    '..pP.pP..',
    '.pP...pP.',
    '.pP...pP.',
    'bbB...bbB',
    'bbb...bbb',
  ]),
  walk2: part([
    '...pPpP..',
    '..pP.pP..',
    '..pP..pP.',
    '.bbB..bbB',
    '.bbb...bb',
  ]),
  walk3: part([
    '...pPp...',
    '...pPp...',
    '...pPpP..',
    '..bbBbbB.',
    '..bbbbbbB',
  ]),
  crouch1: part([
    '.pP..pP..',
    '.pP..pP..',
    'bbB.bbB..',
    'bbbbbbbB.',
  ]),
  crouch2: part([
    'pPP..pPP.',
    'bbB.bbB..',
    'bbbbbbbB.',
  ]),
  tuck: part([
    '..pPpP...',
    '.pP..pP..',
    '.bbB.bbB.',
  ]),
  dangle: part([
    '..pP.pP..',
    '..pP.pP..',
    '..pP..pP.',
    '..bB..bB.',
    '.bb....bb',
  ]),
};

interface Pose {
  head: PixelBuffer;
  torso: PixelBuffer;
  legs: PixelBuffer;
  /** Vertical offset of head + torso (positive = lower). */
  bob: number;
  /** Extra head offset (x, y) relative to the torso. */
  headDx?: number;
  headDy?: number;
}

/** Body frame names, in sheet order. */
export const BODY_FRAMES = [
  'idle0',
  'idle1',
  'walk0',
  'walk1',
  'walk2',
  'walk3',
  'walk4',
  'walk5',
  'charge0',
  'charge1',
  'charge2',
  'rise',
  'apex',
  'fall0',
  'fall1',
  'land',
  'bonk',
  'stumble0',
  'stumble1',
  'stumble2',
  'stumble3',
  'ladder0',
  'ladder1',
  'pickup',
] as const;
export type BodyFrame = (typeof BODY_FRAMES)[number];

const LEG_H = (b: PixelBuffer) => b.h;

/** Composes head/torso/legs into a frame, feet on FEET_Y. Returns the frame and its neck point. */
function compose(p: Pose): { buf: PixelBuffer; neck: [number, number]; back: [number, number] } {
  // back = top-left of the torso (where the pack hangs from)
  const buf = new PixelBuffer(FRAME_W, FRAME_H);
  const legsY = FEET_Y + 1 - LEG_H(p.legs);
  const torsoY = legsY - p.torso.h + 1 + p.bob;
  const headY = torsoY - p.head.h + 1 + (p.headDy ?? 0);
  const torsoX = FEET_X - 6;
  const headX = torsoX + 1 + (p.headDx ?? 0);
  buf.blit(p.legs, FEET_X - 5, legsY);
  buf.blit(p.torso, torsoX, torsoY);
  buf.blit(p.head, headX, headY);
  return { buf, neck: [torsoX + 4, torsoY + 1], back: [torsoX, torsoY] };
}

/** Full-frame poses that don't fit the part system (lying, climbing). */
const SPECIAL: Partial<Record<BodyFrame, string[]>> = {
  stumble0: [
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '...bb...................',
    '..bBpP..kkkkkk...kkk....',
    '..bbpPPkcccCCCkkRrkCCk..',
    '....pPkccwccccRrrlkCCCk.',
    '.....kkcccwcccRRrkcCCsk.',
    '......kkkkkkkkkkkkkkkk..',
  ],
  stumble1: [
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '.bb......kkkkkk...kkk...',
    '.bBpP...kcccCCCkkRrkCCk.',
    '..bbpPPkccwccccRrrlkCCk.',
    '....pPkkcccwcccRRrkcCsk.',
    '.....kkkkkkkkkkkkkkkkkss',
  ],
  stumble2: [
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '...................kkk..',
    '..................kcCCk.',
    '.................kcCCCCk',
    '............kkkkkcCCkSSs',
    '..........kkcccRrrCkssse',
    '.........kcccccRrrlkssss',
    '........kccccccCRRkkSss.',
    '.......kcwwwwwwCCk......',
    '......kcccccccCCk.......',
    '.....bkccccccCCk.s......',
    '....bBpPkkkkkkk..ss.....',
    '...bbbpP.........ss.....',
    '..bbbbb................',
  ].map((r) => r.padEnd(24, '.').slice(0, 24)),
};

function specialFrame(rows: string[]): PixelBuffer {
  // drawn on a 24-wide grid with feet near x = 12; centre them on FEET_X
  const pad = '.'.repeat(FEET_X - 12);
  return parseGrid(rows.map((r) => (pad + r).padEnd(FRAME_W, '.').slice(0, FRAME_W)), PAL);
}

const STRAP = hex('#5a3c26');

const POSES: Record<Exclude<BodyFrame, 'stumble0' | 'stumble1' | 'stumble2'>, Pose> = {
  idle0: { head: HEAD, torso: TORSO, legs: LEGS.stand, bob: 0 },
  idle1: { head: HEAD, torso: TORSO, legs: LEGS.stand, bob: 1 },
  walk0: { head: HEAD, torso: TORSO, legs: LEGS.walk1, bob: 0 },
  walk1: { head: HEAD, torso: TORSO, legs: LEGS.walk2, bob: -1 },
  walk2: { head: HEAD, torso: TORSO, legs: LEGS.walk3, bob: 0 },
  walk3: { head: HEAD, torso: TORSO, legs: LEGS.walk1, bob: 0 },
  walk4: { head: HEAD, torso: TORSO, legs: LEGS.walk2, bob: -1 },
  walk5: { head: HEAD, torso: TORSO, legs: LEGS.walk3, bob: 0 },
  charge0: { head: HEAD_DOWN, torso: TORSO_HANDS, legs: LEGS.stand, bob: 1 },
  charge1: { head: HEAD_DOWN, torso: TORSO_HANDS, legs: LEGS.crouch1, bob: 1 },
  charge2: { head: HEAD_DOWN, torso: TORSO_HANDS, legs: LEGS.crouch2, bob: 1, headDy: 1 },
  rise: { head: HEAD_UP, torso: TORSO, legs: LEGS.tuck, bob: -1 },
  apex: { head: HEAD_UP, torso: TORSO_FLUTTER, legs: LEGS.tuck, bob: -1 },
  fall0: { head: HEAD, torso: TORSO_FLUTTER, legs: LEGS.dangle, bob: 0 },
  fall1: { head: HEAD_UP, torso: TORSO_FLUTTER, legs: LEGS.dangle, bob: 0, headDy: -1 },
  land: { head: HEAD_DOWN, torso: TORSO, legs: LEGS.crouch1, bob: 1 },
  bonk: { head: HEAD_UP, torso: TORSO_FLUTTER, legs: LEGS.dangle, bob: 0, headDx: -1, headDy: 1 },
  stumble3: { head: HEAD_DOWN, torso: TORSO_HANDS, legs: LEGS.crouch2, bob: 2, headDy: 1 },
  ladder0: { head: HEAD_UP, torso: TORSO_HANDS, legs: LEGS.walk2, bob: 0 },
  ladder1: { head: HEAD_UP, torso: TORSO_HANDS, legs: LEGS.walk1, bob: 0 },
  pickup: { head: HEAD_DOWN, torso: TORSO_HANDS, legs: LEGS.crouch1, bob: 2, headDx: 1, headDy: 1 },
};

// ---------- packs per load tier (drawn behind the body, on the back = left side) ----------
const PACKS: (PixelBuffer | null)[] = [
  // tier 0: small satchel at the hip
  parseGrid(['.ww.', 'wMMw', 'mMLm', 'dmmd'], PACK),
  // tier 1: small pack
  parseGrid(['.wMMw.', 'dMLLMm', 'dmMMmm', 'dmWWmm', 'dmmmmm', '.dddd.'], PACK),
  // tier 2: big pack with a bedroll
  parseGrid(['.gGGGg..', 'ggGGGgg.', '.dMLLMm.', 'dmMLMMmm', 'dmmWWmmm', 'dmmmmmmm', 'dmmmmmMm', '.dddddd.'], PACK),
  // tier 3: huge stacked pack
  parseGrid(
    [
      '..dmMLm...',
      '.dmMLLMm..',
      '.ddmmmmd..',
      '.gGGGGGgg.',
      'ggGGGGGggg',
      '.dMLLMMmm.',
      'dmMLLMMmmm',
      'dmmmWWmmmm',
      'dmmmmmmmMm',
      'dmmmmmmMmm',
      'ddmmmmmmmd',
      '.dddddddd.',
    ],
    PACK,
  ),
  // tier 4: crushing load
  parseGrid(
    [
      '...dmMLMm...',
      '..dmMLLLMm..',
      '..dddmmmdd..',
      '.dmMLLMMmm..',
      'dmmMLLMMmmm.',
      'ddmmmmmmmmd.',
      '.gGGGGGGggg.',
      'ggGGGGGGgggg',
      '.dMLLLMMmmm.',
      'dmMLLLMMmmmm',
      'dmmmWWWmmmmm',
      'dmmmmmmmmMmm',
      'dmmmmmmmMmmm',
      'ddmmmmmmmmmd',
      '.dddddddddd.',
    ],
    PACK,
  ),
];

/** Lean per tier: pixels the head moves forward. */
const LEAN = [0, 0, 1, 2, 4];
/** Extra crouch per tier (head/torso lowered). */
const SAG = [0, 0, 0, 1, 2];

/** Shears rows above `pivotY` forward (to the right) by up to `amount` px at the top. */
function lean(src: PixelBuffer, amount: number, pivotY: number): PixelBuffer {
  if (amount === 0) return src;
  const out = new PixelBuffer(src.w, src.h);
  for (let y = 0; y < src.h; y++) {
    const shift = y >= pivotY ? 0 : Math.round((amount * (pivotY - y)) / 14);
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c >>> 24) out.set(x + shift, y, c);
    }
  }
  return out;
}

/** Moves rows above `pivotY` down by `amount` (sagging under weight), overwriting below. */
function sag(src: PixelBuffer, amount: number, pivotY: number): PixelBuffer {
  if (amount === 0) return src;
  const out = new PixelBuffer(src.w, src.h);
  for (let y = src.h - 1; y >= 0; y--) {
    const dy = y < pivotY ? amount : 0;
    for (let x = 0; x < src.w; x++) {
      const c = src.get(x, y);
      if (c >>> 24 && !(out.get(x, y + dy) >>> 24)) out.set(x, y + dy, c);
    }
  }
  return out;
}

export interface FrameInfo {
  /** Top-left of the frame in the sheet. */
  sx: number;
  sy: number;
  /** Neck point (scarf attaches here), in frame coordinates, facing right. */
  neck: [number, number];
  /** Top-left of the pack in frame coordinates (facing right), and its size. */
  pack: [number, number, number, number];
}

export interface ClimberSheet {
  sheet: PixelBuffer;
  /** frames[tier][bodyFrame] */
  frames: Record<BodyFrame, FrameInfo>[];
}

export function buildClimberSheet(): ClimberSheet {
  const cols = BODY_FRAMES.length;
  const sheet = new PixelBuffer(cols * FRAME_W, 5 * FRAME_H);
  const frames: Record<BodyFrame, FrameInfo>[] = [];
  for (let tier = 0; tier < 5; tier++) {
    const row = {} as Record<BodyFrame, FrameInfo>;
    BODY_FRAMES.forEach((name, i) => {
      let body: PixelBuffer;
      let neck: [number, number];
      let back: [number, number];
      const special = SPECIAL[name];
      const lying = name === 'stumble0' || name === 'stumble1';
      if (special) {
        body = specialFrame(special);
        neck = [FEET_X + 3, 26];
        back = [FEET_X - 4, 21];
      } else {
        const c = compose(POSES[name as keyof typeof POSES]);
        body = c.buf;
        neck = c.neck;
        back = c.back;
      }
      if (tier >= 1 && !special) {
        // shoulder strap crossing the chest
        body = body.clone();
        body.set(back[0] + 2, back[1] + 2, STRAP);
        body.set(back[0] + 3, back[1] + 3, STRAP);
        body.set(back[0] + 3, back[1] + 4, STRAP);
      }
      const pivot = FEET_Y - 5;
      const leanPx = lying ? 0 : LEAN[tier];
      const sagPx = lying ? 0 : SAG[tier];
      body = sag(lean(body, leanPx, pivot), sagPx, pivot);
      const shiftAt = (y: number) => (y >= pivot ? 0 : Math.round((leanPx * (pivot - y)) / 14));
      neck = [neck[0] + shiftAt(neck[1]), neck[1] + sagPx];
      back = [back[0] + shiftAt(back[1]), back[1] + sagPx];

      const frame = new PixelBuffer(FRAME_W, FRAME_H);
      const pack = PACKS[tier]!;
      // the pack hangs on the back: bottom near the belt, overlapping the body's back by 3px
      let px = back[0] - pack.w + 3;
      let py = back[1] + 7 - pack.h;
      if (tier === 0) {
        px = back[0] - 2;
        py = back[1] + 5;
      }
      if (lying) {
        px = FEET_X - 6;
        py = FEET_Y - 3 - pack.h + 1;
      } else if (special) {
        px = back[0] - pack.w + 4;
        py = back[1] + 4 - pack.h;
      }
      frame.blit(pack, px, py);
      frame.blit(body, 0, 0);
      frame.outline(OUTLINE);
      const sx = i * FRAME_W;
      const sy = tier * FRAME_H;
      sheet.blit(frame, sx, sy);
      row[name] = { sx, sy, neck, pack: [px, py, pack.w, pack.h] };
    });
    frames.push(row);
  }
  return { sheet, frames };
}
