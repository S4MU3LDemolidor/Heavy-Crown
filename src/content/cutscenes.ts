import type { Scene } from '../game/cutscene';

/**
 * The cutscenes (remake spec 2 and 5.4), by id. A level places a scene with a `scene` object
 * (`{ kind: 'object', object: 'scene', props: { id } }`); the altar starts `summit`. Positions in `move` and `spawn`
 * are tiles from the scene's anchor (the trigger's floor cell; the altar for the summit).
 * Faces: Wren neutral/sad/angry/surprised/determined/crying; Maren tired/loving/crying/smile.
 */
export const SCENES: Record<string, Scene> = {
  /** Level 1, the village: the bell rings after ten years. */
  intro: {
    id: 'intro',
    steps: [
      { wait: 40 },
      { say: 'The bell. After ten years, the bell.', who: 'wren', face: 'surprised' },
      { say: '"When you hear the summit bell, I made it. I am coming home."', who: 'wren', face: 'sad' },
      { say: 'She is not coming home. She is up there, and something is wrong.', who: 'wren', face: 'determined' },
      { say: 'Her old pack, her old map somewhere up in the tower. And the thing I said to her. I am taking all of it.', who: 'wren', face: 'sad' },
      { move: 'wren', to: 6 },
    ],
  },
  /** Level 3's campfire, the end of Act I: the Crow asks why Wren is really climbing. */
  fire1: {
    id: 'fire1',
    steps: [
      { move: 'wren', to: 3 },
      { pose: 'wren', frame: 'sit' },
      { wait: 40 },
      { spawn: 'crow', sprite: 'crow', at: [9, 0], dir: -1 },
      { say: 'Warm. The first warm thing in this whole tower.', who: 'wren', face: 'neutral' },
      { say: 'I have watched a hundred climbers sit at this fire. Most of them talk. It is the height. It loosens things.', who: 'crow', face: 'smug' },
      { say: 'So. Why are you really climbing?', who: 'crow', face: 'serious' },
      {
        choose: [
          { label: 'To bring back the dawn.', goto: 'dawn' },
          { label: 'To bring her home.', goto: 'home' },
        ],
      },
      { label: 'dawn' },
      { say: 'To bring back the dawn. Like she wanted.', who: 'wren', face: 'determined' },
      { say: 'Mm. The dawn. Very noble. You said it the way people say "fine" when they are not.', who: 'crow', face: 'smug' },
      { goto: 'end' },
      { label: 'home' },
      { say: 'To bring her home. Whatever is left of her.', who: 'wren', face: 'sad' },
      { say: 'Home. And when she asks why you came after ten years, what will you tell her?', who: 'crow', face: 'serious' },
      { say: '...', who: 'wren', face: 'sad' },
      { label: 'end' },
      { say: 'Sleep. It gets steeper from here, and the water below the bells is cold.', who: 'crow', face: 'sad' },
      { fade: 'out' },
      { pose: 'wren', frame: '' },
      { remove: 'crow' },
      { set: 'act1done' },
      { fade: 'in' },
    ],
  },
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
