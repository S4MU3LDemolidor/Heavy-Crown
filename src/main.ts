import { LEVELS } from './content/levels';
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
import { Scene } from './render/scene';

const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');
const GREYBOX = params.has('test');

const canvas = document.getElementById('screen') as HTMLCanvasElement;
const renderer = new Renderer(canvas);
const input = new Input(window);
const world = buildWorld(GREYBOX ? [TEST_TOWER] : LEVELS);
const camera = new Camera(world.screenCount);
const scene = new Scene(world);
let player = new Player(world.start.x, world.start.y);
camera.snapTo(player.centerY);
scene.warm(camera.band);

const stats = { jumps: 0, falls: 0, lastFall: 0 };
let showHitboxes = false;

function resetPlayer(): void {
  const stones = player.loadout.stones;
  player = new Player(world.start.x, world.start.y);
  player.loadout.stones = stones;
  camera.snapTo(player.centerY);
}

function step(left: boolean, right: boolean, jump: boolean): void {
  player.update({ left, right, jump }, world.grid);
  for (const e of player.events) {
    if (e.type === 'jump') stats.jumps++;
    if (e.type === 'land') {
      stats.lastFall = e.fall;
      if (e.drop >= SCREEN_H) stats.falls++;
    }
  }
  const before = camera.band;
  camera.update(player.centerY);
  if (camera.band !== before) scene.warm(camera.band);
  scene.update(player);
}

function update(): void {
  input.poll();
  if (DEBUG) {
    if (input.keyPressed('BracketRight')) player.loadout.stones = Math.min(16, player.loadout.stones + 1);
    if (input.keyPressed('BracketLeft')) player.loadout.stones = Math.max(0, player.loadout.stones - 1);
    if (input.keyPressed('KeyR')) resetPlayer();
    if (input.keyPressed('Digit2')) showHitboxes = !showHitboxes;
  }
  step(input.held('left'), input.held('right'), input.held('jump'));
}

function render(): void {
  const ctx = renderer.view;
  if (GREYBOX) {
    drawWorld(ctx, world.grid, camera);
    drawPlayer(ctx, player, camera);
  } else {
    scene.draw(ctx, camera, player);
    if (showHitboxes) {
      ctx.strokeStyle = '#ff00ff';
      ctx.strokeRect(player.body.x + 0.5, player.body.y - Math.round(camera.y) + 0.5, player.body.w - 1, player.body.h - 1);
    }
  }
  if (DEBUG) {
    const stones = player.loadout.stones;
    drawDebugText(ctx, [
      `weight ${stones} st  tier ${loadTier(stones)}  ${player.state}  charge ${player.charge.toFixed(2)}`,
      `screen ${camera.screenFromBottom + 1}/${world.screenCount}  jumps ${stats.jumps}  falls ${stats.falls}  last fall ${stats.lastFall}px`,
      '[ ] weight   R reset   2 hitboxes',
    ]);
  }
  renderer.present();
}

startLoop(update, render);

/** Dev-only hook for automated checks: advance frames with a fixed input, independent of animation timing. */
if (import.meta.env.DEV) {
  const w = window as unknown as Record<string, unknown>;
  w.__hc = {
    run(frames: number, inp: { left?: boolean; right?: boolean; jump?: boolean } = {}) {
      for (let i = 0; i < frames; i++) step(!!inp.left, !!inp.right, !!inp.jump);
      render();
      return { x: player.body.x, y: player.body.y, state: player.state, screen: camera.screenFromBottom };
    },
    setStones(n: number) {
      player.loadout.stones = n;
    },
    teleport(x: number, y: number) {
      player.body.x = x;
      player.body.y = y;
      camera.snapTo(player.centerY);
      scene.warm(camera.band);
    },
    reset: resetPlayer,
  };
}
