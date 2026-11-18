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
    conversations: [
      {
        id: 'crow-1-first',
        at: 'l1',
        once: true,
        nodes: [
          { id: 'a', text: 'Caw. Another one. A pack on the back and a face like a funeral.', face: 'smug', next: 'b' },
          { id: 'b', who: 'wren', text: 'Have you seen a woman climb through here? A red scarf, like mine.', next: 'c' },
          { id: 'c', text: 'Ten years ago. She talked to me. Nobody up here talks. Well. Nobody nice.', face: 'serious', next: 'd' },
          {
            id: 'd',
            text: 'She carried too much. They all do. What is that one you keep touching, at the bottom of the pack?',
            face: 'smug',
            choices: [
              { label: 'Nothing.', next: 'e' },
              { label: 'Something I said.', next: 'f' },
            ],
          },
          { id: 'e', text: 'Nothing weighs a stone, apparently. Climb on, then. I will be around. It is my one talent.', face: 'smug' },
          { id: 'f', text: 'Ah. Words. The heaviest kind, and the only kind you cannot put down by trying.', face: 'sad' },
        ],
      },
      { id: 'crow-1', at: 'l1', nodes: [{ id: 'a', text: 'Up. Everyone goes up. The question is what they carry when they get there.', face: 'serious' }] },
      {
        id: 'crow-2-first',
        at: 'l2',
        once: true,
        nodes: [
          { id: 'a', text: 'You hung a rope to fetch a key to open a door. Very climber of you.', face: 'smug', next: 'b' },
          { id: 'b', who: 'wren', text: 'Why are you following me?', face: 'angry', next: 'c' },
          { id: 'c', text: 'Following? I live here. You are the one tramping through my house in muddy boots.', face: 'smug' },
        ],
      },
      { id: 'crow-2', at: 'l2', nodes: [{ id: 'a', text: 'The tower does not care what you meant to carry. Only what you carry.', face: 'serious' }] },
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
          { id: 'a', text: 'Do not touch the pile. Every piece is precious. Every piece is MINE.', face: 'suspicious', next: 'b' },
          { id: 'b', who: 'wren', text: 'I only want to get past.', next: 'c' },
          {
            id: 'c',
            text: 'Past? Up, you mean. Then you want claws. Iron claws for the hands; the ivy is nothing with claws. Forty gold. I do not make change.',
            face: 'greedy',
            choices: [
              { label: 'Buy the Claws (40 gold)', if: { gold: 40 }, do: [{ pay: 40 }, { give: 'claws' }, { set: 'oskarClaws' }], next: 'd' },
              { label: 'Why carry all of this?', next: 'e' },
              { label: 'Not now.' },
            ],
          },
          { id: 'd', text: 'Yes. Yes! The pile grows. Go on, spider. Climb.', face: 'greedy' },
          { id: 'e', text: 'Because if I put it down, someone will take it. And then what would I be? A man with nothing. A light man.', face: 'scared', next: 'f' },
          { id: 'f', who: 'wren', text: 'Would that be so bad?', face: 'sad', next: 'g' },
          { id: 'g', text: 'Says the one with something heavy at the bottom of that pack. I can smell it. Guilt smells like wet paper.', face: 'suspicious' },
        ],
      },
      { id: 'oskar-3-after', at: 'l3', nodes: [{ id: 'a', text: 'Go away. The pile is resting.', face: 'suspicious' }] },
      {
        id: 'oskar-8',
        at: 'l8',
        nodes: [
          { id: 'a', text: 'What? I have always been here. Always. I did not climb. I do not climb. I am simply... here.', face: 'suspicious', next: 'b' },
          {
            id: 'b',
            text: 'Rope. Good rope. Thirty gold.',
            face: 'greedy',
            choices: [
              { label: 'Buy a Rope Coil (30 gold)', if: { gold: 30 }, do: [{ pay: 30 }, { give: 'rope' }], next: 'c' },
              { label: 'How did you get up here?', next: 'd' },
              { label: 'No.' },
            ],
          },
          { id: 'c', text: 'Gold for the pile. Rope for the climber. Everyone wins. Mostly me.', face: 'greedy' },
          { id: 'd', text: 'Do not ask me that. Do not ask the pile that either. The pile does not know.', face: 'scared' },
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
        id: 'nell-5-first',
        at: 'l5',
        once: true,
        nodes: [
          { id: 'a', text: 'Another climber. And that scarf. Oh. Oh, you have her face.', face: 'kind', next: 'b' },
          { id: 'b', who: 'wren', text: 'You knew my mother?', face: 'surprised', next: 'c' },
          { id: 'c', text: 'Maren. She sent things up my buckets for a whole season. Books. Her good boots. A drawing of a house with a lamp in the window.', face: 'tired', next: 'd' },
          { id: 'd', text: 'Then she sent nothing. I kept a bucket waiting for her for a year.', face: 'sad', next: 'e' },
          { id: 'e', who: 'wren', text: 'She sent the drawing away?', face: 'sad', next: 'f' },
          {
            id: 'f',
            text: 'She said it was the heaviest thing she owned. Ten gold a ride, love. The lift runs all the way to the summit, one station at a time.',
            face: 'kind',
            choices: [
              { label: 'Send something up (10 gold)', do: [{ lift: 'send' }] },
              { label: 'Not now.' },
            ],
          },
        ],
      },
      {
        id: 'nell-5',
        at: 'l5',
        nodes: [
          {
            id: 'a',
            text: 'Ten gold a ride. Anything but what you carry in your chest; the bucket cannot take that.',
            face: 'kind',
            choices: [
              { label: 'Send something up (10 gold)', do: [{ lift: 'send' }] },
              { label: 'Not now.' },
            ],
          },
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
        id: 'br-8-first',
        at: 'l8',
        once: true,
        nodes: [
          { id: 'a', text: 'Steps. Light ones, then heavier. You walk like her.', face: 'serene', next: 'b' },
          { id: 'b', who: 'wren', text: 'You can hear me?', face: 'surprised', next: 'c' },
          { id: 'c', text: 'I hear nothing. I feel the floor. The bells tell me who comes.', face: 'serene', next: 'd' },
          { id: 'd', who: 'wren', text: 'The summit bell rang three nights ago. Was that you?', next: 'e' },
          { id: 'e', text: 'It was.', face: 'guilty', next: 'f' },
          { id: 'f', who: 'wren', text: 'Then she never made it. She is not up there waiting. You rang it for nothing.', face: 'angry', next: 'g' },
          { id: 'g', text: 'Not for nothing. She asked me to. Ten years ago she stood where you stand and said, "When my child is grown, ring it. They will come."', face: 'sorrowful', next: 'h' },
          { id: 'h', who: 'wren', text: 'She called me. She called me up here.', face: 'crying', next: 'i' },
          { id: 'i', text: 'She did not know how to come down alone. Forgive me, or do not. The way up is shut until the loft is rung.', face: 'guilty', next: 'j' },
          { id: 'j', text: 'Start at the third bell from my rope. Back to the first. Out to the fourth. Home to the second. It is the way she climbed.', face: 'serene' },
        ],
      },
      { id: 'br-8', at: 'l8', nodes: [{ id: 'a', text: 'The third bell from my rope, then the first, then the fourth, then the second. Jump into them, child. They do not mind.', face: 'serene' }] },
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
    conversations: [],
  },
};
