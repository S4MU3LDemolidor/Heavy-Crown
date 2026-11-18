/** The story text (remake spec section 2). Wren is never gendered. */
export const INTRO_LINES = [
  'The sun has not risen in a hundred years.',
  'Ten years ago my mother, Maren, climbed the tower to bring it back.',
  '"When you hear the summit bell," she said, "I made it. I am coming home."',
  'The night she left, I told her not to come back.',
  'Tonight, the bell rang.',
]

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

/** The closing lines of the two endings (remake spec 2.4). */
export const ENDINGS: Record<'letGo' | 'holdOn', { title: string; lines: string[] }> = {
  letGo: {
    title: 'Let go',
    lines: ['I put the words down at last.', 'So did she.', 'The crown was light after that.', 'The sun came up, and we walked down into it together.'],
  },
  holdOn: {
    title: 'Hold on',
    lines: ['I kept the words. I kept the crown.', 'The sun came up, and she walked down into it.', 'Someone has to hold it.', 'Maybe one day someone will climb for me.'],
  },
};
