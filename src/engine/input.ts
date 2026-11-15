export type Action = 'left' | 'right' | 'up' | 'down' | 'jump' | 'interact' | 'inventory' | 'drop' | 'pause';

const KEYS: Record<string, Action> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'jump',
  KeyE: 'interact',
  Tab: 'inventory',
  KeyI: 'inventory',
  KeyQ: 'drop',
  Escape: 'pause',
};

/** Standard-mapping gamepad buttons (spec section 12). */
const PAD_BUTTONS: Array<[number, Action]> = [
  [0, 'jump'],
  [1, 'drop'],
  [2, 'interact'],
  [3, 'inventory'],
  [9, 'pause'],
  [12, 'up'],
  [13, 'down'],
  [14, 'left'],
  [15, 'right'],
];

const STICK_DEADZONE = 0.5;

/** Keyboard + gamepad. Call `poll()` once per update step, then read. */
export class Input {
  private readonly codesDown = new Set<string>();
  private codesPressedQueue = new Set<string>();
  private codesPressed = new Set<string>();
  private now = new Set<Action>();
  private before = new Set<Action>();
  /** Which device was used last, for button labels in prompts. */
  lastDevice: 'keys' | 'pad' = 'keys';

  constructor(target: Window) {
    target.addEventListener('keydown', (e) => {
      if (KEYS[e.code]) e.preventDefault();
      if (!e.repeat) this.codesPressedQueue.add(e.code);
      this.lastDevice = 'keys';
      this.codesDown.add(e.code);
    });
    target.addEventListener('keyup', (e) => {
      this.codesDown.delete(e.code);
    });
    target.addEventListener('blur', () => {
      this.codesDown.clear();
    });
  }

  poll(): void {
    const swap = this.before;
    this.before = this.now;
    this.now = swap;
    this.now.clear();
    for (const code of this.codesDown) {
      const action = KEYS[code];
      if (action) this.now.add(action);
    }
    this.pollGamepads();
    this.codesPressed = this.codesPressedQueue;
    this.codesPressedQueue = new Set();
  }

  held(action: Action): boolean {
    return this.now.has(action);
  }

  pressed(action: Action): boolean {
    return this.now.has(action) && !this.before.has(action);
  }

  /** The label of the button for an action on the last-used device. */
  label(action: Action): string {
    const keys: Record<Action, string> = { left: 'Left', right: 'Right', up: 'Up', down: 'Down', jump: 'Space', interact: 'E', inventory: 'Tab', drop: 'Q', pause: 'Esc' };
    const pad: Record<Action, string> = { left: 'Left', right: 'Right', up: 'Up', down: 'Down', jump: 'A', interact: 'X', inventory: 'Y', drop: 'B', pause: 'Start' };
    return (this.lastDevice === 'pad' ? pad : keys)[action];
  }

  /** A raw key (KeyboardEvent.code) pressed this step, for debug shortcuts. */
  keyPressed(code: string): boolean {
    return this.codesPressed.has(code);
  }

  private pollGamepads(): void {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    for (const pad of navigator.getGamepads()) {
      if (!pad) continue;
      for (const [index, action] of PAD_BUTTONS) {
        if (pad.buttons[index]?.pressed) {
          this.now.add(action);
          this.lastDevice = 'pad';
        }
      }
      const ax = pad.axes[0] ?? 0;
      const ay = pad.axes[1] ?? 0;
      if (ax < -STICK_DEADZONE) this.now.add('left');
      if (ax > STICK_DEADZONE) this.now.add('right');
      if (ay < -STICK_DEADZONE) this.now.add('up');
      if (ay > STICK_DEADZONE) this.now.add('down');
    }
  }
}
