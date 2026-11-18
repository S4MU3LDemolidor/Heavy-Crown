import type { Scene } from '../game/cutscene';

/**
 * The cutscenes (remake spec 2 and 5.4), by id. A level places a scene with a `scene` object
 * (`{ kind: 'object', object: 'scene', props: { id } }`); the altar starts `summit`. Positions in `move` and `spawn`
 * are tiles from the scene's anchor (the trigger's floor cell; the altar for the summit).
 * Faces: Wren neutral/sad/angry/surprised/determined/crying; Maren tired/loving/crying/smile.
 */
export const SCENES: Record<string, Scene> = {
  summit: {
    id: 'summit',
    steps: [
      { say: 'Three. That is all of them.', who: 'wren', face: 'neutral' },
      { move: 'wren', to: -3 },
      { pose: 'wren', frame: 'kneel' },
      { wait: 30 },
      { say: '...Wren?', who: 'maren', face: 'tired' },
      { say: 'You came. I rang for you, and I hated myself for it.', who: 'maren', face: 'crying' },
      { say: 'Ten years I have knelt here. The altar wants the heaviest thing I carry, and I cannot put it down.', who: 'maren', face: 'tired' },
      { say: 'I left you. You were eight years old.', who: 'maren', face: 'crying' },
      { say: 'And I told you not to come back.', who: 'wren', face: 'crying' },
      { say: 'I have carried that every day since.', who: 'wren', face: 'sad' },
      { say: 'It is asking you too, love. What is the heaviest thing you carry?', who: 'maren', face: 'loving' },
      {
        choose: [
          { label: 'Put the words down.', goto: 'letGo' },
          { label: 'Keep them. Take the crown so she can go.', goto: 'holdOn' },
        ],
      },
      { label: 'letGo' },
      { say: "I'm sorry. I didn't mean it. I never meant it.", who: 'wren', face: 'crying' },
      { say: 'I know. I am sorry I went.', who: 'maren', face: 'crying' },
      { say: 'Then we put it down together.', who: 'maren', face: 'smile' },
      { pose: 'wren', frame: '' },
      { wait: 40 },
      { fade: 'out' },
      { ending: 'letGo' },
      { label: 'holdOn' },
      { say: 'Go home, Mom. I will hold it.', who: 'wren', face: 'determined' },
      { say: 'Wren, no. That is what I did. That is how I ended up here.', who: 'maren', face: 'crying' },
      { say: 'Someone has to. Go. The sun is coming.', who: 'wren', face: 'sad' },
      { wait: 40 },
      { fade: 'out' },
      { ending: 'holdOn' },
    ],
  },
};
