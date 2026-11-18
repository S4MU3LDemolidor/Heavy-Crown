import type { SaveData } from '../game/game';

const KEY = 'heavycrown.save.v4';
/** Older saves (the MVP's 5 levels, then the first 30-level layouts) hold positions in other layouts, so they are dropped. */
const OLD_KEYS = ['heavycrown.save.v1', 'heavycrown.save.v2', 'heavycrown.save.v3'];

/** Browser storage can be missing or throw (private windows, blocked storage); saving is best-effort. */
export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

export function readSave(): SaveData | null {
  try {
    for (const k of OLD_KEYS) localStorage.removeItem(k);
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as SaveData;
    return d && d.v === 4 ? d : null;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

const ENDINGS_KEY = 'heavycrown.endings';

/** The endings the player has seen, across climbs (remake spec 2.4). */
export function readEndings(): string[] {
  try {
    const d = JSON.parse(localStorage.getItem(ENDINGS_KEY) ?? '[]');
    return Array.isArray(d) ? d.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function addEnding(id: string): void {
  try {
    const seen = new Set(readEndings());
    seen.add(id);
    localStorage.setItem(ENDINGS_KEY, JSON.stringify([...seen]));
  } catch {
    /* storage unavailable */
  }
}
