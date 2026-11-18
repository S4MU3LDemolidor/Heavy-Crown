/** Every item in the MVP (spec section 7). Weight in stones; gold only counts if delivered to the summit. */
export const ITEM_IDS = [
  'iron_key',
  'bell_key',
  'bone_key',
  'lantern',
  'rope',
  'pickaxe',
  'spring_boots',
  'crampons',
  'fur_cloak',
  'feather_charm',
  'map',
  'stone',
  'coin_pouch',
  'ruby',
  'chalice',
  'idol',
  'orb',
  'scepter',
  'seal',
  'crown',
  'claws',
  'hook',
  'words',
] as const;

export type ItemId = (typeof ITEM_IDS)[number];
export type ItemKind = 'key' | 'tool' | 'treasure' | 'relic' | 'charm' | 'crown' | 'burden';

export interface ItemDef {
  id: ItemId;
  name: string;
  weight: number;
  kind: ItemKind;
  gold?: number;
  desc: string;
  /** Opens objects whose `key` prop matches this id. */
  opens?: string;
  /** Drawn on the backpack while carried. */
  onPack?: boolean;
  /** Light radius in pixels when lying in the world or carried. */
  light?: number;
  /**
   * How to use it. Words in braces are actions, replaced with the player's keys or buttons
   * ({interact}, {drop}, {jump}, {hook}, {pause}, {up}, {down}, {left}, {right}).
   */
  use?: string;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  iron_key: { id: 'iron_key', name: 'Iron Key', weight: 1, kind: 'key', opens: 'iron_key', desc: 'A heavy iron key, red with rust. It opens the iron gates of the lower tower.', use: 'Walk up to an iron gate and press {interact}. The key is used up.' },
  bell_key: { id: 'bell_key', name: 'Bell Key', weight: 1, kind: 'key', opens: 'bell_key', desc: 'Cast from bell bronze. It hums when you hold it. It opens the Bell Door, somewhere below.', use: 'Walk up to the bronze Bell Door and press {interact}. The key is used up.' },
  bone_key: { id: 'bone_key', name: 'Bone Key', weight: 1, kind: 'key', opens: 'bone_key', desc: "Carved from something's bone. It opens the ossuary.", use: 'Walk up to the ossuary door and press {interact}. The key is used up.' },
  lantern: { id: 'lantern', name: 'Lantern', weight: 2, kind: 'tool', onPack: true, light: 72, desc: "Maren's lantern. Her initials are scratched into the brass. It still burns.", use: 'Just carry it: it lights the dark around you.' },
  rope: { id: 'rope', name: 'Rope Coil', weight: 2, kind: 'tool', onPack: true, desc: 'Hang it from a rope hook and it becomes a ladder you can climb again and again.', use: 'Stand at a rope hook and press {interact} to hang it. Climb with {up} and {down}, step off with {left} or {right}, let go with {jump}. Press {interact} at the hook to take it back.' },
  pickaxe: { id: 'pickaxe', name: 'Pickaxe', weight: 3, kind: 'tool', onPack: true, desc: 'A miner\'s pick. It breaks cracked stone.', use: 'Stand next to cracked stone and press {interact} to break it.' },
  spring_boots: { id: 'spring_boots', name: 'Spring Boots', weight: 2, kind: 'tool', desc: 'Coiled bronze springs in the heels. Your jumps go a quarter higher.', use: 'Just carry them: every jump goes higher.' },
  crampons: { id: 'crampons', name: 'Crampons', weight: 1, kind: 'tool', desc: 'Iron spikes that strap to your boots. Ice stops being ice.', use: 'Just carry them: you stop sliding on ice.' },
  fur_cloak: { id: 'fur_cloak', name: 'Fur Cloak', weight: 2, kind: 'tool', onPack: true, desc: 'A thick fur cloak. The wind can barely push you.', use: 'Just carry it: gusts barely push you.' },
  feather_charm: { id: 'feather_charm', name: 'Feather Charm', weight: 0, kind: 'charm', desc: 'A white feather on a string. It weighs nothing, and falls stop hurting.', use: 'Just carry it: long falls never knock you down.' },
  map: { id: 'map', name: 'Tattered Map', weight: 1, kind: 'tool', desc: "Maren's map of the tower, water-stained and unfinished. It shows where you have been and what you left behind.", use: 'Carry it, press {pause} and choose Map.' },
  stone: { id: 'stone', name: 'Counterweight Stone', weight: 3, kind: 'tool', desc: 'A heavy stone. Good for nothing but holding something down.', use: 'Stand on a pressure plate and press {drop} to leave the stone there.' },
  coin_pouch: { id: 'coin_pouch', name: 'Coin Pouch', weight: 1, kind: 'treasure', gold: 10, desc: 'A pouch of old coins. 10 gold.', use: 'Gold only counts if you carry it to the top.' },
  ruby: { id: 'ruby', name: 'Ruby', weight: 1, kind: 'treasure', gold: 50, light: 14, desc: 'A ruby the size of a thumb. 50 gold.', use: 'Gold only counts if you carry it to the top.' },
  chalice: { id: 'chalice', name: 'Silver Chalice', weight: 2, kind: 'treasure', gold: 30, desc: 'A silver chalice, black with age. 30 gold.', use: 'Gold only counts if you carry it to the top.' },
  idol: { id: 'idol', name: 'Gilded Idol', weight: 5, kind: 'treasure', gold: 100, onPack: true, desc: 'A gilded idol of a forgotten king. 100 gold, and it weighs as much as a child.', use: 'Gold only counts if you carry it to the top.' },
  orb: { id: 'orb', name: 'The Orb', weight: 4, kind: 'relic', onPack: true, light: 28, desc: 'The Orb of the old regalia. It is warm to the touch, and very heavy.', use: 'Carry it to the altar at the summit and press {interact} to lay it down.' },
  scepter: { id: 'scepter', name: 'The Scepter', weight: 4, kind: 'relic', onPack: true, light: 28, desc: 'The Scepter of the old regalia. Maren held this once. She could not carry it higher.', use: 'Carry it to the altar at the summit and press {interact} to lay it down.' },
  seal: { id: 'seal', name: 'The Seal', weight: 4, kind: 'relic', onPack: true, light: 28, desc: 'The Seal of the old regalia, a disc of dark gold. It is heavier than it looks.', use: 'Carry it to the altar at the summit and press {interact} to lay it down.' },
  crown: { id: 'crown', name: 'The Crown', weight: 6, kind: 'crown', light: 40, desc: 'The crown.' },
  claws: { id: 'claws', name: 'Climbing Claws', weight: 2, kind: 'tool', onPack: true, desc: 'Iron hooks for the hands. Hold toward ivy or rough stone to cling to it and climb. They will not hold more than twelve stones.', use: 'Jump at ivy or rough stone and hold {left} or {right} toward it to cling. Climb with {up} and {down}; press {jump} to leap off.' },
  hook: { id: 'hook', name: 'Grappling Hook', weight: 3, kind: 'tool', onPack: true, desc: 'A hook on a long rope. Fire it at an iron ring to be pulled up to it. Heavier loads pull slower.', use: 'Press {hook} to fire it at an iron ring above you. Hold {up}, {left} or {right} to aim.' },
  words: { id: 'words', name: 'The Words', weight: 1, kind: 'burden', desc: 'What you shouted the night she left: "If you go, don\'t ever come back." You have carried it for ten years.', use: 'You cannot put this down. Not yet.' },
};

export const RELICS: ItemId[] = ['orb', 'scepter', 'seal'];

export function totalWeight(ids: readonly ItemId[]): number {
  return ids.reduce((s, id) => s + ITEMS[id].weight, 0);
}

export function totalGold(ids: readonly ItemId[]): number {
  return ids.reduce((s, id) => s + (ITEMS[id].gold ?? 0), 0);
}
