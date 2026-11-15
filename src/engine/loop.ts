export const STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;

/** Runs `update` at a fixed 60 Hz and `render` once per animation frame. */
export function startLoop(update: () => void, render: () => void): void {
  let last = performance.now();
  let acc = 0;
  const frame = (now: number) => {
    acc += Math.min(250, now - last);
    last = now;
    let steps = 0;
    while (acc >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
      update();
      acc -= STEP_MS;
      steps++;
    }
    if (steps === MAX_STEPS_PER_FRAME) acc = 0;
    render();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
