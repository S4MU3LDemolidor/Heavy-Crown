import { PixelBuffer } from './buffer';
import { hex, type RGBA } from './color';
import { parseGrid } from './grid';

/**
 * Dialogue portraits (remake spec section 3.1): 64×64, one base bust per character plus an overlay per expression
 * (eyes, brows, mouth). Plan 1 draws Wren's neutral face; plan 2 adds Wren's other faces and the cast.
 */
export const PORTRAIT_SIZE = 64;

export type PortraitId = 'wren';
export type WrenFace = 'neutral';

/** Wren's portrait palette: the sprite's ramps with one extra step each, for the larger face. */
const WREN_PAL: Record<string, RGBA> = {
  a: hex('#1b1d3a'), b: hex('#2a3263'), c: hex('#3d4c86'), d: hex('#5a6fae'), e: hex('#8aa3d4'), f: hex('#b4c6e8'),
  s: hex('#6a3442'), t: hex('#a95f58'), u: hex('#d58c6e'), v: hex('#eeb48c'), V: hex('#fbdcb8'),
  q: hex('#5a1630'), r: hex('#9c2338'), R: hex('#d8463b'), l: hex('#f6905e'),
  h: hex('#3a2424'), H: hex('#5e3a30'), k: hex('#120c1c'), i: hex('#c9d4ee'), x: hex('#2a1a2e'),
};

const WREN_BASE = parseGrid([
  '................................................................',
  '................................................................',
  '................................................................',
  '................deeeee..........................................',
  '..............ddeeeefffe........................................',
  '.............cddeeeefffff.......................................',
  '............cdddeeeefffffeeeeeeee...............................',
  '...........bcdddeeeeefdeeeeeeeeeeeee............................',
  '...........ccdddeeedddeeeeeeeeefffffffe.........................',
  '...........cccdddeddddeeeeeeeeefffffffff........................',
  '..........bbccdddddddeeeeeeeeefffffffffff.......................',
  '..........bbccdcdddddeeeeeeeeefffffffffffff.....................',
  '..........bbccccdddddeeeeeeeeeffffffffffffff....................',
  '..........abbccddddddeeeeeeeeeffffffffffffffe...................',
  '..........abbccddddddeeeeeeeeeffffffbbbbbbfff...................',
  '..........aacccddddddeeeeeeeeeeffhhHhhhHhHhhhf..................',
  '...........bcccddddddeeeeeeeeeehHhhHhhhHhHhhhHh.................',
  '...........ccccdddddddeeeeeeeehHhhhHhhhHhHhhhHhH................',
  '..........bccccdddddddeeeeeeehhHhhhHhhHhhHhhHVhHb...............',
  '..........bccccdddddddeeeeeeahhHbhHvhhHVHVhhHVhhbb..............',
  '.........bbcccccdddddddeeeeeahhHbhHvhhHVHVhhHVVVbb..............',
  '.........bbcccccdddddddeeeeaaaHabhHvhhHVhVhhHVVVVbb.............',
  '.........bbcccccddddddddeeaaaahauhHvhhHVhVVHVVVVVVbb............',
  '.........bbccccccdddddddeeaaaahauhHvvHVVVVVhVVVVVVbb............',
  '........abbccccccddddddddeaaaaatuhHvvhvVVVVhVVVVVVVb............',
  '........abbbccccccdddddddaaaaaauuhHvvhvVVVVVVVVVVVVbb...........',
  '........abbbccccccdddddddaaaaaauuhhhhvvvVVVVVVVVVVVbb...........',
  '........abbbcccccccddddddaaaaasthhuvvhvvVVVVhhhVVVVVb...........',
  '........abbbbccccccddddddaaaaastuuuvvvvvvVVVVVVhVVVVb...........',
  '........abbbbcccccccdddddaaaaastkkkkkkkvvvVkkkkkVVVVb...........',
  '........abbbbbcccccccddddaaaaastuxxkkxvvvvvVxkkVVVVVb...........',
  '........aabbbbcccccccddddaaaaasttiikVivvvvvvikVVVVVVb...........',
  '........aabbbbbcccccccdddaaaaasttiikkivvvvtvikkVVVVvb...........',
  '........aaabbbbbcccccccddaaaaasttiikkivvvvtvvkkVVVvvb...........',
  '.........aabbbbbccccccccdaaaaastttuuuuuvvvvtvvvvtvvvb...........',
  '.........aaabbbbbccccccccaaaaaastttutuuuvvvtVvvvvvvbb...........',
  '.........aaabbbbbbcccccccaaaaaasttttuutuuvvvttvvvvvba...........',
  '.........aaaabbbbbbcccccccaaaaassttttuuuuuuvvvvvvvva............',
  '..........aaaabbbbbbccccccaaaaaasttttuuuuuuutvvvvuaa............',
  '..........aaaabbbbbbbcccccaaaaaasstttttussssuuuuuuaa............',
  '...........aaaabbbbbbbcccccaaaaaasstttttuvvuuuuuuaa.............',
  '...........aaaaabbbbbbbcccRRRllllllllllllllllluuaa..............',
  '............aaaaabbbbbbRRRRRRlllllllllllllllllllla..............',
  '.............aaaaabbbrrRRRRRRRRRlllllllllllllllllll.............',
  '.............aaaaaaqrrrrrrRRRRRRRRRRRRRllllllllllllll...........',
  '..............aaaaqqqqqqrrrrrrrrrRRRRRRRRRRRRRRRRRRRRR..........',
  '...............aaaqqqqqqqqqqqqqqrrrrrrrrrrrrrrllllllll..........',
  '...............ccaqqqqqqqqqqqqqqrrrrrrrrrrrrrrllllllll..........',
  '..............ccccrrrrRRRRRRRlllllllllllllllllllllllll..........',
  '............cccccccrrrRRRRRRRRRllllllllllllllllllllll...........',
  '...........ccccccccccrrrRRRRRRRRRRRllllllllllqrrRRR.............',
  '.........bbccccccccccccrrrrrRRRRRRRRRRRRRRRllqrrRRR.............',
  '........bbccccccccccccccccrrrrrrrrrRRRRRRRRRRqrrRRRd............',
  '.......bbbccccccccccccccccddddddddddddddddddddqrrRRRd...........',
  '......bbbcccccccccccccccccddddddddddddddddddddqqqqqRdd..........',
  '......bbbcccccccccccccccccddddddddddddddddddddqrrRRRdd..........',
  '.....bbbbccccccccccccccccccddddddddddddddddddddqrrRRRdd.........',
  '....bbbbbccccccccccccccccccddddddddddddddddddddqrrRRdddd........',
  '...bbbbbbcccccccccccccccccccdddddddddddddddddddqrrRRddddd.......',
  '...bbbbbbcccccccccccccccccccddddddddddddddddddddqqqqqdddd.......',
  '..bbbbbbbccccccccccccccccccccdddddddddddddddddddqrrRRddddd......',
  '..bbbbbbbccccccccccccccccccccdddddddddddddddddddqrrRRddddd......',
  '.bbbbbbbbcccccccccccccccccccccdddddddddddddddddddqrrRRddddd.....',
  '.bbbbbbbbbcccccccccccccccccccccddddddddddddddddddqrrRRddddd.....',
], WREN_PAL);
const WREN_FACES: Record<WrenFace, PixelBuffer> = {
  neutral: parseGrid([
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '.................................h...h.VVVVVVVVVV...............',
  '.................................hhhh...VVVVVVVVV...............',
  '................................hh...h..VVVVhhhVV...............',
  '.........................................VVVVVVhV...............',
  '................................kkkkkkk...VkkkkkV...............',
  '.................................xxkkx.....VxkkVV...............',
  '.................................iikVi......ikVVV...............',
  '.................................iikki......ikkVV...............',
  '.................................iikki.......kkVV...............',
  '................................................................',
  '............................................V...................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................ss......ssss....................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
  '................................................................',
], WREN_PAL),
};

/** The portrait of `who` with expression `face`: the base bust with the face overlay on top, outlined. */
export function portrait(who: PortraitId, face: WrenFace): PixelBuffer {
  const out = new PixelBuffer(PORTRAIT_SIZE, PORTRAIT_SIZE);
  if (who === 'wren') {
    out.blit(WREN_BASE, 0, 0);
    out.blit(WREN_FACES[face], 0, 0);
  }
  out.selout(hex('#120d24'), 0.6);
  return out;
}
