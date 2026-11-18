import type { NpcDef } from '../game/story';

/**
 * The cast and every conversation (remake spec sections 2 and 3). A conversation's `at` is the scene key
 * of a placement (set in the level legends, e.g. `l3`). The first matching conversation is used.
 */

// Remake: the cast's conversations are rewritten act by act in plans 3–8 (remake spec section 2).
export const NPCS: Record<string, NpcDef> = {
  crow: {
    id: 'crow',
    name: 'The Crow',
    sprite: 'crow',
    voice: { pitch: 620, wave: 'square', rate: 2 },
    behavior: 'crow',
    conversations: [],
  },
  oskar: {
    id: 'oskar',
    name: 'Oskar',
    sprite: 'oskar',
    voice: { pitch: 150, wave: 'sawtooth', rate: 2 },
    behavior: 'static',
    conversations: [],
  },
  nell: {
    id: 'nell',
    name: 'Nell',
    sprite: 'nell',
    voice: { pitch: 330, wave: 'triangle', rate: 2 },
    behavior: 'static',
    conversations: [],
  },
  bellringer: {
    id: 'bellringer',
    name: 'The Bellringer',
    sprite: 'bellringer',
    voice: { pitch: 240, wave: 'sine', rate: 2 },
    behavior: 'static',
    conversations: [],
  },
  hollow: {
    id: 'hollow',
    name: 'A Hollow One',
    sprite: 'hollow',
    voice: { pitch: 90, wave: 'sine', rate: 1 },
    behavior: 'hollow',
    conversations: [],
  },
  echo: {
    id: 'echo',
    name: 'Maren',
    sprite: 'echo',
    voice: { pitch: 280, wave: 'sine', rate: 1 },
    behavior: 'echo',
    conversations: [],
  },
  king: {
    id: 'king',
    name: 'The Old King',
    sprite: 'king',
    voice: { pitch: 110, wave: 'triangle', rate: 1 },
    behavior: 'king',
    conversations: [],
  },
};
