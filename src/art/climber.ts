import { PixelBuffer } from './buffer';
import { hex, type RGBA } from './color';
import { parseGrid } from './grid';

/**
 * Wren, the pilgrim (remake spec section 3). Hand-pixeled full-figure frames, facing right, with a pack per
 * load tier and a selective outline. Plan 1 draws the idle pose; plan 2 draws the other poses, which show idle0
 * until then.
 */

export const FRAME_W = 40;
export const FRAME_H = 44;
/** Feet sit on this row; the body is centred on FEET_X. */
export const FEET_Y = 43;
export const FEET_X = 20;

/** Hue-shifted ramps: shadows lean blue-purple, highlights lean warm. Letters are the grid legend. */
const PAL: Record<string, RGBA> = {
  // cloak (blue-grey), darkest to rim light
  a: hex('#1b1d3a'), b: hex('#2a3263'), c: hex('#3d4c86'), d: hex('#5a6fae'), e: hex('#8aa3d4'),
  // skin, shadow to highlight
  s: hex('#7a3e48'), t: hex('#c27862'), u: hex('#e8a982'), v: hex('#f8d3ac'),
  // scarf (Maren's red), dark to light
  q: hex('#5a1630'), r: hex('#9c2338'), R: hex('#d8463b'), l: hex('#f6905e'),
  // trousers and boots
  p: hex('#2a2238'), P: hex('#433a5c'), o: hex('#38221e'), O: hex('#5f3c2b'),
  // leather strap and brass buckle
  w: hex('#5a3424'), W: hex('#e2b45c'),
  // eye and hair under the hood
  k: hex('#120c1c'), h: hex('#4a2e2a'),
};
/** Pack canvas, straps and bedroll. */
const PACK_PAL: Record<string, RGBA> = {
  m: hex('#3b2a24'), n: hex('#6b4f37'), N: hex('#9c7b52'), L: hex('#cdab76'),
  w: hex('#5a3424'), W: hex('#e2b45c'), g: hex('#33402e'), G: hex('#56683f'),
};
/** The colour every outline leans toward (a deep violet, never black). */
export const OUTLINE = hex('#120d24');
/** Every colour Wren is drawn with (the selective outline adds one darker tone of each). */
export const PALETTE: RGBA[] = [...Object.values(PAL), ...Object.values(PACK_PAL)];
/** How far each outline tone leans toward OUTLINE. */
export const OUTLINE_MIX = 0.6;

const part = (rows: string[], pal: Record<string, RGBA>) => parseGrid(rows, pal);

/** Breathing in: everything above row `from` moves up one row, and row `from` stretches to fill the gap. */
function breathe(pose: PixelBuffer, from: number): PixelBuffer {
  const out = new PixelBuffer(pose.w, pose.h);
  for (let y = 0; y < pose.h; y++) {
    const sy = y < from ? y + 1 : y;
    for (let x = 0; x < pose.w; x++) out.set(x, y, pose.get(x, sy));
  }
  return out;
}

// ---------- the idle pose: 24 wide × 34 tall, feet on the last row, body centred on column 12 ----------
const IDLE0 = part([
  '........................',
  '........................',
  '........................',
  '.........bb.............',
  '........bbbccd..........',
  '........abbcccdde.......',
  '.......abbccccddde......',
  '......abbbcccdddeee.....',
  '......abbbccahhhuve.....',
  '......abbbccahuvvv......',
  '......abbbccatkuvvu.....',
  '......abbbcbatkuuu......',
  '.......abbcbastts.......',
  '......qrrRRRRlllll......',
  '.....qrrrRRRRRRlRq......',
  '.....bqqrrrrrrrrqd......',
  '.....abbbbccccdwde......',
  '.....abbbbccccwdde......',
  '....abbbbccccwbddde.....',
  '....abbbbcccWcbddde.....',
  '....abbbbccwccbddde.....',
  '....abbbbcwcccbddde.....',
  '...abbbbbwcccccduvde....',
  '...abbbbwccccccdtude....',
  '...abbbbbccccccdddde....',
  '....ab.bbccppccd.de.....',
  '....ab..ppP..pPP.d......',
  '........ppP..pPP........',
  '........ppP..pPP........',
  '........ppP..pPP........',
  '.......oooO..ooOO.......',
  '.......ooOo..oooOO......',
  '......ooooo..oooooo.....',
  '......ooooo..oooooo.....',
], PAL);
/** Breathing in: the hood, head, scarf and shoulders rise one row; the cloak hem stays. */
const IDLE1 = breathe(IDLE0, 16);

// ---------- packs per load tier (0 light satchel, 1–2 laden pack, 3–4 towering load) ----------
const PACK_ROWS: string[][] = [
  [
    '..wwww..',
    '.nNNLLn.',
    'mnNNLLNm',
    'mnnWNNNm',
    'mnnnnnnm',
    'mmnnnnmm',
    '.mmmmmm.',
  ],
  [
    '..gwggggwg..',
    '.gGwGGGGwGG.',
    '..gwggggwg..',
    '..mnnNNLLL..',
    '.mnnnNNLLLL.',
    'mnnnnNNLLLLL',
    'mmmmnNNNmmmN',
    'mnnnmmmmNNNN',
    'mnnnnNNWNNNN',
    'mmnmnNNwNNNN',
    'mmnmnNNwNNNN',
    'mmnmnNNwNNNN',
    'mnnnnnnnnnnn',
    '.mmmmmmmmmm.',
  ],
  [
    '..gwgggggwg..',
    '.gGwGGGGGwGG.',
    '..gwgggggwg..',
    '..mnnnNNLLL..',
    '.mnnnnNNLLLL.',
    'mnnnnnNNLLLLL',
    'mnnnnnNNLLLLL',
    'mmmmnnNNNmmmN',
    'mnnnmmmmmNNNN',
    'mnnnnnNWNNNNN',
    'mmnmnnNwNNNNN',
    'mmnmnnNwNNNNN',
    'mmnmnnNwNNNNN',
    'mmnmnnnwnnnnn',
    'mnnnnnnnnnnnn',
    '.mmmmmmmmmmm.',
  ],
  [
    '.....mnNN......',
    '...mnnnNLLL....',
    '..mnnnnNNLLL...',
    '..mnnnnnNNNNN..',
    '..mnnnnnnnnnn..',
    '..mwwwwwwwwwn..',
    '...mnnnnnnnn...',
    '...mmmmmmmmm...',
    '..gwgggggggwg..',
    '.gGwGGGGGGGwGG.',
    '..gwgggggggwg..',
    '..mnnnNNNLLLL..',
    '.mnnnnNNNLLLLL.',
    'mnnnnnNNNLLLLLL',
    'mmmmmnNNNNmmmmN',
    'mnnnnmmmmmNNNNN',
    'mnnnnnNNWNNNNNN',
    'mmnmnnNNwNNNNNN',
    'mnnnnnnnnnnnnnn',
    '.mmmmmmmmmmmmm.',
  ],
  [
    '.....mnNN.......',
    '...mnnnNLLL.....',
    '..mnnnnNNLLL....',
    '..mnnnnnNNNNN...',
    '..mnnnnnnnnnn...',
    '..mwwwwwwwwwn...',
    '...mnnnnnnnn....',
    '...mmmmmmmmm....',
    '..gwggggggggwg..',
    '.gGwGGGGGGGGwGG.',
    '..gwggggggggwg..',
    '..mnnnnNNNLLLL..',
    '.mnnnnnNNNLLLLL.',
    'mnnnnnnNNNLLLLLL',
    'mnnnnnnNNNLLLLLL',
    'mmmmmnnNNNNmmmmN',
    'mnnnnmmmmmmNNNNN',
    'mnnnnnnNNWNNNNNN',
    'mmnmnnnNNwNNNNNN',
    'mmnmnnnNNwNNNNNN',
    'mmnmnnnnnwnnnnnn',
    'mnnnnnnnnnnnnnnn',
    '.mmmmmmmmmmmmmm.',
  ],
];
const PACKS = PACK_ROWS.map((rows) => part(rows, PACK_PAL));

/** Where the pose's neck (scarf root) and the top of its back (pack anchor) are, in pose-grid coordinates. */
const NECK: [number, number] = [8, 14];
const BACK: [number, number] = [5, 15];
/** Rows from the top of the back down to the bottom of the pack. */
const PACK_DROP = 9;

/** Body frame names, in sheet order (unchanged from the MVP, so the renderer's state machine still works). */
export const BODY_FRAMES = [
  'idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'charge0', 'charge1', 'charge2',
  'rise', 'apex', 'fall0', 'fall1', 'land', 'bonk', 'stumble0', 'stumble1', 'stumble2', 'stumble3', 'ladder0', 'ladder1', 'pickup',
] as const;
export type BodyFrame = (typeof BODY_FRAMES)[number];

/** Poses drawn so far; every other frame shows idle0 until plan 2. */
const POSES: Partial<Record<BodyFrame, PixelBuffer>> = { idle0: IDLE0, idle1: IDLE1 };

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
  const sheet = new PixelBuffer(BODY_FRAMES.length * FRAME_W, 5 * FRAME_H);
  const frames: Record<BodyFrame, FrameInfo>[] = [];
  for (let tier = 0; tier < 5; tier++) {
    const row = {} as Record<BodyFrame, FrameInfo>;
    BODY_FRAMES.forEach((name, i) => {
      const pose = POSES[name] ?? IDLE0;
      // the pose grid sits on the frame's feet row, centred on FEET_X
      const ox = FEET_X - Math.floor(pose.w / 2);
      const oy = FEET_Y + 1 - pose.h;
      const pack = PACKS[tier];
      // the pack hangs on the back: its right edge overlaps the back by 3 px, its bottom near the belt
      const px = ox + BACK[0] - pack.w + 3;
      const py = oy + BACK[1] + PACK_DROP - pack.h;
      const frame = new PixelBuffer(FRAME_W, FRAME_H);
      frame.blit(pack, px, py);
      frame.blit(pose, ox, oy);
      frame.selout(OUTLINE, OUTLINE_MIX);
      const sx = i * FRAME_W;
      const sy = tier * FRAME_H;
      sheet.blit(frame, sx, sy);
      row[name] = { sx, sy, neck: [ox + NECK[0], oy + NECK[1]], pack: [px, py, pack.w, pack.h] };
    });
    frames.push(row);
  }
  return { sheet, frames };
}
