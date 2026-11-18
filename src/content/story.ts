/** The story text (spec section 1b). The pilgrim is never gendered. */
export const INTRO_LINES = [
  'The sun has not risen in a hundred years.',
  'Ten years ago, my mother climbed the tower to bring it back.',
  'She never came down.',
];

/** Maren's notes (remake: 15, written act by act in plans 4–8). */
export const NOTES: Record<string, { title: string; text: string }> = {};

/** The fifteen levels' names (remake spec section 4.2). */
export const LEVEL_NAMES: Record<number, string> = {
  1: 'The Foot of the Tower', 2: 'The Root Stair', 3: "The Hoarder's Hollow",
  4: 'The Sunken Gate', 5: "Nell's Landing", 6: "The Orb's Crown",
  7: 'The Bell Hall', 8: "The Ringer's Loft", 9: 'The Silent Bell',
  10: 'The Lightless Floors', 11: 'The Whispering Stair', 12: 'The Ossuary',
  13: 'The Frozen Spire', 14: 'The King in the Ice', 15: 'The Summit',
};

export const ENDING_LINES = ['The crown was heavy.', 'But I did not carry it alone.'];
