/** The story text (spec section 1b). The pilgrim is never gendered. */
export const INTRO_LINES = [
  'The sun has not risen in a hundred years.',
  'Ten years ago, my mother climbed the tower to bring it back.',
  'She never came down.',
];

export const NOTES: Record<string, { title: string; text: string }> = {
  note1: { title: "Maren's note", text: 'I packed everything I own. Rope, books, bread, my good boots. The tower laughed at me on the first ledge.' },
  note6: { title: "Maren's note", text: 'Claws, found in the ivy, still on the hand of someone who did not need them any more. My hands bleed less now. I try not to think about whose they were.' },
  note2: { title: "Maren's note", text: 'Left my books by the water. Words are heavy when they are wet. I kept the map.' },
  note7: { title: "Maren's note", text: 'A hook, and rings set in the walls. Someone put these here expecting to come back. Nobody comes back.' },
  note8: { title: "Maren's note", text: 'The Orb. It hums like a hive. I can carry it, barely. Nell says the buckets go all the way to the bells. I will trust the buckets.' },
  note9: { title: "Maren's note", text: 'The old woman says the bells remember every climber. She says she heard me before I came. I believe her. I am very loud now.' },
  note3: { title: "Maren's note", text: 'The bells ring when you land on them, like someone counting. I found the Scepter. I am too heavy to bring it higher today.' },
  note4: { title: "Maren's note", text: 'I left my lantern burning at the edge of the dark, so I could find my way back down. I never came back for it.' },
  note10: { title: "Maren's note", text: 'Something stands in the dark when I look away. It asked what I carry. I did not answer. I think it knows anyway.' },
  note11: { title: "Maren's note", text: 'The Seal. Everything is so heavy. I sent the Orb up in the bucket and wept, because I did not know if I would ever see it again.' },
  note12: { title: "Maren's note", text: 'There is a man in the ice who says he was king. He begged me for the relics. I gave him nothing. I should have given him something.' },
  note5: { title: "Maren's note", text: 'The altar wants all three. I can carry only one at a time, and I am so tired. If you are reading this, climb lighter than I did.' },
  scarf: { title: "Maren's scarf", text: 'A red scarf, the twin of yours, tied to the altar. It is stiff with frost. She made it this far.' },
};

/** The thirty levels' names (full-game spec section 2). */
export const LEVEL_NAMES: Record<number, string> = {
  1: 'The Overgrown Base', 2: 'The Root Stair', 3: "The Hoarder's Hollow", 4: 'The Ivy Wall', 5: "Crow's Rest", 6: 'The Sunken Gate',
  7: 'The Drowned Cistern', 8: "Nell's Landing", 9: 'The Black Pool', 10: 'The Ring Vault', 11: 'The Weir', 12: "The Orb's Crown",
  13: 'The Bell Hall', 14: "The Ringer's Loft", 15: 'The Silent Bell', 16: 'The Broken Clock', 17: 'The Bell Tune', 18: 'The Last Light',
  19: 'The Lightless Floors', 20: 'The Standing Dark', 21: 'The Whispering Stair', 22: "The Peddler's Candle", 23: 'The Breathing Hall', 24: 'The Ossuary',
  25: 'The Frozen Spire', 26: 'The White Stair', 27: 'The Echo', 28: 'The King in the Ice', 29: 'The Last Climb', 30: 'The Summit',
};

export const ENDING_LINES = ['The crown was heavy.', 'But I did not carry it alone.'];
