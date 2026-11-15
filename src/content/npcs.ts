import type { Conversation, NpcDef } from '../game/story';

/**
 * The cast and every conversation (full-game spec sections 5 and 7). A conversation's `at` is the scene key
 * of a placement (set in the level legends, e.g. `l3`). The first matching conversation is used.
 */

/** The Crow's lines: heavy and light variants per level. */
function crow(level: number, light: string, heavy: string, extra?: Conversation): Conversation[] {
  const at = `l${level}`;
  return [
    ...(extra ? [extra] : []),
    { id: `crow-${level}-heavy`, at, if: { minStones: 9 }, nodes: [{ id: 'a', text: heavy }] },
    { id: `crow-${level}`, at, nodes: [{ id: 'a', text: light }] },
  ];
}

export const NPCS: Record<string, NpcDef> = {
  crow: {
    id: 'crow',
    name: 'The Crow',
    sprite: 'crow',
    voice: { pitch: 620, wave: 'square', rate: 2 },
    behavior: 'crow',
    conversations: [
      ...crow(1, 'Another pilgrim. They all come with packs. They all leave without them, one way or another.', 'Look at you. You climb like a cathedral would climb, if cathedrals were stupid.', {
        id: 'crow-1-first',
        at: 'l1',
        once: true,
        nodes: [
          { id: 'a', text: 'Caw. Another one. You have her scarf, you know. The cartographer. Same red.', next: 'b' },
          { id: 'b', text: 'She talked to me too. Nobody else up here talks. Well. Nobody nice.', choices: [{ label: 'Where did she go?', next: 'c' }, { label: 'Leave me alone.', next: 'd' }] },
          { id: 'c', text: 'Up. Everyone goes up. The question is what they carry when they get there.' },
          { id: 'd', text: 'As you like. I will be around. I am always around. It is my one talent.' },
        ],
      }),
      ...crow(2, 'Tip: the tower does not care what you meant to carry. Only what you carry.', 'Every stone in that bag is a ledge you will never reach. Think about it. Or do not. I am a bird.'),
      ...crow(5, 'The ivy holds anyone with claws and a light heart. You have one of those. Probably.', 'Heavy feet, heavy fall. I have watched a lot of falls. You would rank well.'),
      ...crow(8, 'Nell sends things up in buckets. Gold for rope, rope for climbing. Everything here is a trade.', 'You could send half of that up in her bucket. Or you could suffer. Suffering is free.'),
      ...crow(11, 'Water slows you down, but it never breaks your fall. Water is kinder than stone. Remember that.', 'If you fall into the deep pool with all that, you will sink like a good idea.'),
      ...crow(14, 'The bell woman cannot hear you, but she hears the bells. Land on one and she will know you came.', 'She will hear you coming. Everyone will hear you coming. The tower itself will hear you coming.'),
      ...crow(17, 'Someone up here rings the bells when nobody is on them. I would not look too closely.', 'Ring, ring. That was you landing. That was the whole hall shaking.'),
      ...crow(20, 'From here on, it is dark. Carry the light, not the gold. The gold cannot see.', 'In the dark, the heavy ones go first. I mean down. They go down first.'),
      ...crow(23, 'Do not stand still in the dark. Things notice the still ones.', 'You are very easy to find. You breathe like a bellows.'),
      ...crow(26, 'Cold up here. My feet hate it. She walked this stair too. I see her sometimes. You will too.', 'You will not make the summit like that. The wind will take your bag and then you.'),
      ...crow(29, 'One relic at a time. She knew that. She knew it and she was so tired.', 'Two relics? Three? You are not a climber. You are a landslide waiting for a slope.'),
    ],
  },

  oskar: {
    id: 'oskar',
    name: 'Oskar',
    sprite: 'oskar',
    voice: { pitch: 150, wave: 'sawtooth', rate: 2 },
    behavior: 'static',
    conversations: [
      {
        id: 'oskar-3-sale',
        at: 'l3',
        if: { notFlag: 'oskarClaws' },
        nodes: [
          { id: 'a', text: 'Do not touch the pile. Every piece is precious. Every piece is MINE. ...You want something? Everyone wants something.', next: 'b' },
          { id: 'b', text: 'Claws. Iron claws for the hands. The ivy above lets them climb like spiders. Forty gold. I do not make change.', choices: [{ label: 'Buy the Claws (40 gold)', if: { gold: 40 }, do: [{ pay: 40 }, { give: 'claws' }, { set: 'oskarClaws' }], next: 'c' }, { label: 'Why carry all that?', next: 'd' }, { label: 'Not now.' }] },
          { id: 'c', text: 'Yes. Yes! The pile grows. Go on, spider. Climb.' },
          { id: 'd', text: 'Because if I put it down, someone will take it. And then what would I be? A man with nothing. A light man. Disgusting.' },
        ],
      },
      { id: 'oskar-3-after', at: 'l3', nodes: [{ id: 'a', text: 'Go away. The pile is resting.' }] },
      {
        id: 'oskar-9',
        at: 'l9',
        nodes: [
          { id: 'a', text: 'You again. What? I have always been here. Always. I did not climb. I do not climb. I am simply... here.', next: 'b' },
          { id: 'b', text: 'Rope. Good rope. Thirty gold.', choices: [{ label: 'Buy a Rope Coil (30 gold)', if: { gold: 30 }, do: [{ pay: 30 }, { give: 'rope' }], next: 'c' }, { label: 'How did you get up here?', next: 'd' }, { label: 'No.' }] },
          { id: 'c', text: 'Gold for the pile. Rope for the climber. Everyone wins. Mostly me.' },
          { id: 'd', text: 'Do not ask me that. Do not ask the pile that either. The pile does not know.' },
        ],
      },
      {
        id: 'oskar-16',
        at: 'l16',
        nodes: [
          { id: 'a', text: 'Higher than you. Again. I do not know how. I closed my eyes in the cistern and opened them in a clock.', next: 'b' },
          { id: 'b', text: 'Maybe the pile carries me. Maybe I am part of the pile now. Do you think... do you think I could put one thing down?', choices: [{ label: 'Put one thing down, Oskar.', next: 'c' }, { label: 'Keep it all.', next: 'd' }] },
          { id: 'c', text: '...A spoon. I put down a spoon. I feel... a spoon lighter. Thank you, pilgrim.', do: [{ set: 'oskarSpoon' }] },
          { id: 'd', text: 'Yes. Yes, of course. It is all precious. Every crumb.' },
        ],
      },
    ],
  },

  nell: {
    id: 'nell',
    name: 'Nell',
    sprite: 'nell',
    voice: { pitch: 330, wave: 'triangle', rate: 2 },
    behavior: 'static',
    conversations: [
      {
        id: 'nell-8-first',
        at: 'l8',
        once: true,
        nodes: [
          { id: 'a', text: 'Mind the water. It is deeper than it looks and colder than it is deep. You are climbing, then.', next: 'b' },
          { id: 'b', text: 'My buckets run up the old shafts. Ten gold and I will send one thing up to the next landing, and you collect it there.', next: 'c' },
          { id: 'c', text: 'She used them too. Maren. Sent her books up, one by one. Then she sent nothing. Then she stopped coming down.' },
        ],
      },
      {
        id: 'nell-8',
        at: 'l8',
        nodes: [{ id: 'a', text: 'Something to send up?', choices: [{ label: 'Send something (10 gold)', if: { gold: 10 }, do: [{ lift: 'send' }] }, { label: 'Not now.' }] }],
      },
      {
        id: 'nell-12',
        at: 'l12',
        nodes: [
          { id: 'a', text: 'You found the Orb. It hums, does it not? Like a hive. It is heavy as a hive too.', next: 'b' },
          { id: 'b', text: 'The buckets go higher than you think. All the way to the bells. All the way to the cold, if you pay.', choices: [{ label: 'Send something (10 gold)', if: { gold: 10 }, do: [{ lift: 'send' }] }, { label: 'Thank you, Nell.' }] },
        ],
      },
    ],
  },

  bellringer: {
    id: 'bellringer',
    name: 'The Bellringer',
    sprite: 'bellringer',
    voice: { pitch: 240, wave: 'sine', rate: 2 },
    behavior: 'static',
    conversations: [
      {
        id: 'ringer-14',
        at: 'l14',
        nodes: [
          { id: 'a', text: 'I cannot hear you, child. I feel the bells. You landed on the low bell like a sack of nails. I knew you were coming.', next: 'b' },
          { id: 'b', text: 'Another came, years ago, in a red scarf like yours. She landed soft. She was light then. She carried maps, only maps.', next: 'c' },
          { id: 'c', text: 'Then she found the Scepter, and she was not light any more.' },
        ],
      },
      {
        id: 'ringer-17-open',
        at: 'l17',
        if: { notFlag: 'bellDoor' },
        nodes: [
          { id: 'a', text: 'You came to the high bells. Good. She never had anyone to open the way for her. I will not make the same mistake twice.', next: 'b' },
          { id: 'b', text: 'She pulls a rope with both hands. Somewhere above, a sealed door grinds open.', do: [{ set: 'bellDoor' }] },
        ],
      },
      { id: 'ringer-17', at: 'l17', nodes: [{ id: 'a', text: 'Go on. The bells will tell me if you fall. I will pretend I did not feel it.' }] },
    ],
  },

  peddler: {
    id: 'peddler',
    name: 'The Peddler',
    sprite: 'peddler',
    voice: { pitch: 200, wave: 'square', rate: 3 },
    behavior: 'static',
    conversations: [
      {
        id: 'peddler-6',
        at: 'l6',
        nodes: [
          { id: 'a', text: 'Wares! Wares for the weary! Everything I sell weighs something, friend. That is the honest truth of the tower.', choices: [{ label: 'Buy a Rope Coil (30 gold)', if: { gold: 30 }, do: [{ pay: 30 }, { give: 'rope' }], next: 'b' }, { label: 'Just looking.' }] },
          { id: 'b', text: 'Two stones of rope for thirty gold. A fair trade. All my trades are fair. Some are fairer than others.' },
        ],
      },
      {
        id: 'peddler-14',
        at: 'l14',
        nodes: [
          { id: 'a', text: 'That pickaxe looks heavy. Three stones! I could take it off your hands. For these lovely spring boots. Only two stones.', choices: [{ label: 'Trade the Pickaxe for Spring Boots', if: { has: 'pickaxe' }, do: [{ take: 'pickaxe' }, { give: 'spring_boots' }], next: 'b' }, { label: 'I need my pickaxe.' }] },
          { id: 'b', text: 'Done! You are a stone lighter and a spring bouncier. Cracked walls will just have to stay cracked.' },
        ],
      },
      {
        id: 'peddler-22',
        at: 'l22',
        if: { notFlag: 'lanternOil' },
        nodes: [
          { id: 'a', text: 'Dark down here, eh? I have oil. Good oil. Your lantern will burn half again as far. Fifty gold, and it weighs nothing once it is in the lamp.', choices: [{ label: 'Buy Lantern Oil (50 gold)', if: { gold: 50 }, do: [{ pay: 50 }, { set: 'lanternOil' }], next: 'b' }, { label: 'No thanks.' }] },
          { id: 'b', text: 'There. Brighter already. Try not to look at what you can see now.' },
        ],
      },
      { id: 'peddler-22-after', at: 'l22', nodes: [{ id: 'a', text: 'Sold out of oil. Sold out of nerve, too. I am leaving the dark at the next opportunity.' }] },
    ],
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
    conversations: [
      {
        id: 'king-favour',
        at: 'l28',
        if: { relic: true, notFlag: 'kingAsked' },
        nodes: [
          { id: 'a', text: 'You... carry them. I can feel them. The Orb. The Scepter. The Seal. Give them to me. They are mine. I was the king.', next: 'b' },
          { id: 'b', text: 'I carried all three at once, child. All three, and the crown on my head. I got this far. The ice got the rest of me.', choices: [{ label: 'Carry one up for me.', do: [{ set: 'kingAsked' }, { favour: 'king' }], next: 'c' }, { label: 'No. They are not yours any more.', do: [{ set: 'kingAsked' }], next: 'd' }] },
          { id: 'c', text: '...Yes. Yes. One. I can manage one. I should have only ever carried one.' },
          { id: 'd', text: 'No. No, they are not. Go, then. Go lighter than I did.' },
        ],
      },
      {
        id: 'king-empty',
        at: 'l28',
        if: { notFlag: 'kingAsked' },
        nodes: [{ id: 'a', text: 'Do you have them? The Orb, the Scepter, the Seal? Come back when you carry one. I will wait. I am good at waiting now.' }],
      },
      { id: 'king-after', at: 'l28', nodes: [{ id: 'a', text: 'The ice is warmer when you are near. Strange. Go on.' }] },
    ],
  },
};
