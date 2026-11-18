/** The story text (remake spec section 2). Wren is never gendered. */
export const INTRO_LINES = [
  'The sun has not risen in a hundred years.',
  'Ten years ago my mother, Maren, climbed the tower to bring it back.',
  '"When you hear the summit bell," she said, "I made it. I am coming home."',
  'The night she left, I told her not to come back.',
  'Tonight, the bell rang.',
]

/** Maren's notes, one per level (remake spec 2.5): what she carried, what she left, the night she left. */
export const NOTES: Record<string, { title: string; text: string }> = {
  // Act I
  note1: { title: "Maren's note", text: 'First night in the tower. I can still see our window from here, the lamp you leave on for me. I packed everything I own. The tower laughed at me on the first ledge.' },
  note2: { title: "Maren's note", text: 'The rope was the cleverest thing I carried and the thing I nearly left behind. I keep reaching into the pack for things that are not there. Your drawing. Your little shoes. I should not have brought those.' },
  note3: { title: "Maren's note", text: 'The hoarder sold me claws and asked what I would never put down. I said nothing. I meant you. I meant leaving you.' },
  // Act II
  note4: { title: "Maren's note", text: 'The water down here is cold enough to stop a heart. Something lives in it. It took hold of my ankle and let go again, as if it were only checking what I weighed.' },
  note5: { title: "Maren's note", text: "Sent my books up in Nell's bucket today, and your drawing with them, the house with the lamp in the window. I could not carry it any further. I told myself it was the paper that was heavy." },
  note6: { title: "Maren's note", text: 'The Orb. It hums like a hive. The altar wants three of these and I can barely carry one. I keep hearing what you said that night. You had every right to say it.' },
  // Act III
  note7: { title: "Maren's note", text: 'The bells ring when you land on them, like someone counting. I counted with them. One for each year old you would be by the time I came home.' },
  note8: { title: "Maren's note", text: 'I asked the ringer to call you if I never came back. It is the worst thing I have done in this tower, and I have done it twice: I left you, and then I called you after me.' },
  note9: { title: "Maren's note", text: 'The Scepter. Too heavy to carry higher today, so I sat beside it and cried until the great bell rang by itself. Something was sitting on it. It looked at me the way you did when I put my boots on.' },
};

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
