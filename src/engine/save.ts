import type { SaveData } from '../game/game';

const KEY = 'heavycrown.save.v3';
/** Older saves (the MVP's 5 levels, then the first 30-level layouts) hold positions in other layouts, so they are dropped. */
const OLD_KEYS = ['heavycrown.save.v1', 'heavycrown.save.v2'];

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
    return d && d.v === 3 ? d : null;
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
