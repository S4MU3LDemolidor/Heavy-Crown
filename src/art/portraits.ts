import { PixelBuffer } from './buffer';
import { hex } from './color';
import { CROW } from './sitters/crow';
import { NELL } from './sitters/nell';
import { OSKAR } from './sitters/oskar';
import { WREN } from './sitters/wren';

/**
 * Dialogue portraits (remake spec section 3.1): 64×64, one base bust per character plus an overlay per expression
 * (eyes, brows, mouth; tears when crying). Each character's grids live in src/art/sitters/.
 */
export const PORTRAIT_SIZE = 64;

/** A character's portrait: the featureless base and one overlay per face. */
export interface Sitter {
  base: PixelBuffer;
  faces: Record<string, PixelBuffer>;
}

export type WrenFace = 'neutral' | 'sad' | 'angry' | 'surprised' | 'determined' | 'crying';
export const WREN_FACES: readonly WrenFace[] = ['neutral', 'sad', 'angry', 'surprised', 'determined', 'crying'];

const SITTERS: Record<string, Sitter> = { wren: WREN, crow: CROW, oskar: OSKAR, nell: NELL };

export function hasPortrait(who: string): boolean {
  return who in SITTERS;
}

/** The faces a character has, in drawing order. */
export function facesOf(who: string): string[] {
  return Object.keys(SITTERS[who]?.faces ?? {});
}

/** The portrait of `who` with expression `face` (falling back to neutral), outlined. */
export function portrait(who: string, face: string): PixelBuffer {
  const s = SITTERS[who];
  if (!s) throw new Error(`no portrait for ${who}`);
  const out = new PixelBuffer(PORTRAIT_SIZE, PORTRAIT_SIZE);
  out.blit(s.base, 0, 0);
  const overlay = s.faces[face] ?? s.faces.neutral ?? Object.values(s.faces)[0];
  if (overlay) out.blit(overlay, 0, 0);
  out.selout(hex('#120d24'), 0.6);
  return out;
}
