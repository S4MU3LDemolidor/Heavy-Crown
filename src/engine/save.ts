import type { SaveData } from '../game/game';

const KEY = 'heavycrown.save.v1';

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
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as SaveData;
    return d && d.v === 1 ? d : null;
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
