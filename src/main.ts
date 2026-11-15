import { TEST_TOWER } from './content/levels/test-tower';
import { Input } from './engine/input';
import { startLoop } from './engine/loop';
import { Renderer } from './engine/renderer';
import { Camera } from './game/camera';
import { buildWorld } from './game/level';
import { Player } from './game/player';
import { SCREEN_H } from './game/tuning';
import { loadTier } from './game/weight';
import { drawDebugText, drawPlayer, drawWorld } from './render/debugDraw';

const canvas = document.getElementById('screen') as HTMLCanvasElement;
const renderer = new Renderer(canvas);
const input = new Input(window);
const tower = buildWorld([TEST_TOWER]);
const camera = new Camera(tower.screenCount);
let player = new Player(tower.start.x, tower.start.y);
camera.snapTo(player.centerY);

const stats = { jumps: 0, falls: 0, lastFall: 0 };

function resetPlayer(): void {
  const stones = player.loadout.stones;
  player = new Player(tower.start.x, tower.start.y);
  player.loadout.stones = stones;
  camera.snapTo(player.centerY);
}

function update(): void {
  input.poll();
  if (input.keyPressed('BracketRight')) player.loadout.stones = Math.min(16, player.loadout.stones + 1);
  if (input.keyPressed('BracketLeft')) player.loadout.stones = Math.max(0, player.loadout.stones - 1);
  if (input.keyPressed('KeyR')) resetPlayer();

  player.update({ left: input.held('left'), right: input.held('right'), jump: input.held('jump') }, tower.grid);
  for (const e of player.events) {
    if (e.type === 'jump') stats.jumps++;
    if (e.type === 'land') {
      stats.lastFall = e.fall;
      if (e.drop >= SCREEN_H) stats.falls++;
    }
  }
  camera.update(player.centerY);
}

function render(): void {
  const ctx = renderer.view;
  drawWorld(ctx, tower.grid, camera);
  drawPlayer(ctx, player, camera);
  const stones = player.loadout.stones;
  drawDebugText(ctx, [
    `weight ${stones} st  tier ${loadTier(stones)}  ${player.state}  charge ${player.charge.toFixed(2)}`,
    `screen ${camera.screenFromBottom + 1}/${tower.screenCount}  jumps ${stats.jumps}  falls ${stats.falls}  last fall ${stats.lastFall}px`,
    '[ ] weight   R reset   hold Space, release to jump',
  ]);
  renderer.present();
}

startLoop(update, render);

/** Dev-only hook for automated checks: advance frames with a fixed input, independent of animation timing. */
if (import.meta.env.DEV) {
  const w = window as unknown as Record<string, unknown>;
  w.__hc = {
    run(frames: number, input: { left?: boolean; right?: boolean; jump?: boolean } = {}) {
      for (let i = 0; i < frames; i++) {
        player.update({ left: !!input.left, right: !!input.right, jump: !!input.jump }, tower.grid);
        camera.update(player.centerY);
      }
      render();
      return { x: player.body.x, y: player.body.y, state: player.state, screen: camera.screenFromBottom };
    },
    setStones(n: number) {
      player.loadout.stones = n;
    },
    reset: resetPlayer,
  };
}
