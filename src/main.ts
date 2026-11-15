import { LEVELS } from './content/levels';
import { TEST_TOWER } from './content/levels/test-tower';
import { Input } from './engine/input';
import { startLoop } from './engine/loop';
import { Renderer } from './engine/renderer';
import { clearSave, readSave, writeSave } from './engine/save';
import { Camera } from './game/camera';
import { Game } from './game/game';
import { buildWorld } from './game/level';
import { loadTier } from './game/weight';
import { drawDebugText } from './render/debugDraw';
import { Scene } from './render/scene';
import { drawInventory, drawNote, drawPrompt, drawWeightMeter } from './ui/hud';

const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');
const GREYBOX = params.has('test');
if (params.has('new')) clearSave();

const canvas = document.getElementById('screen') as HTMLCanvasElement;
const renderer = new Renderer(canvas);
const input = new Input(window);
const world = buildWorld(GREYBOX ? [TEST_TOWER] : LEVELS);
let game = new Game(world);
const saved = GREYBOX ? null : readSave();
if (saved) game.load(saved);
const camera = new Camera(world.screenCount);
const scene = new Scene(world);
camera.snapTo(game.player.centerY);
scene.warm(camera.band);

type Mode = { kind: 'play' } | { kind: 'inventory'; sel: number; message: string | null; messageT: number } | { kind: 'note'; id: string };
let mode: Mode = { kind: 'play' };
let meterT = 0;
let saveT = 0;
let showHitboxes = false;

function save(): void {
  if (!GREYBOX) writeSave(game.save());
}

function step(left: boolean, right: boolean, jump: boolean, up = false, down = false): void {
  game.step({ left, right, jump, up, down });
  for (const e of game.events) if (e.type === 'weight') meterT = 180;
  for (const e of game.player.events) if (e.type === 'land') save();
  const before = camera.band;
  camera.update(game.player.centerY);
  if (camera.band !== before) scene.warm(camera.band);
  game.discover(camera.band);
  scene.update(game.player);
  if (meterT > 0) meterT--;
  if (game.player.state === 'ground' && ++saveT >= 120) {
    saveT = 0;
    save();
  }
}

function update(): void {
  input.poll();
  if (DEBUG) {
    if (input.keyPressed('Digit2')) showHitboxes = !showHitboxes;
  }
  switch (mode.kind) {
    case 'play': {
      if (input.pressed('inventory')) {
        mode = { kind: 'inventory', sel: 0, message: null, messageT: 0 };
        meterT = 1;
        return;
      }
      if (input.pressed('interact')) {
        const it = game.interaction();
        if (it) {
          it.run();
          for (const e of game.events) if (e.type === 'read') mode = { kind: 'note', id: e.note };
          for (const e of game.events) if (e.type === 'weight') meterT = 180;
          save();
          if (mode.kind !== 'play') return;
        }
      }
      step(input.held('left'), input.held('right'), input.held('jump'), input.held('up'), input.held('down'));
      break;
    }
    case 'inventory': {
      const n = game.carried.length;
      if (input.pressed('left') && n) mode.sel = (mode.sel - 1 + n) % n;
      if (input.pressed('right') && n) mode.sel = (mode.sel + 1) % n;
      if (input.pressed('drop') && n) {
        if (game.drop(mode.sel)) {
          mode.sel = Math.max(0, Math.min(mode.sel, game.carried.length - 1));
          save();
        } else {
          mode.message = 'You can only put things down on solid ground.';
          mode.messageT = 120;
        }
      }
      if (mode.messageT > 0 && --mode.messageT === 0) mode.message = null;
      if (input.pressed('inventory') || input.pressed('pause')) {
        mode = { kind: 'play' };
        meterT = 120;
      }
      break;
    }
    case 'note':
      if (input.pressed('interact') || input.pressed('pause') || input.pressed('jump')) mode = { kind: 'play' };
      break;
  }
}

function render(): void {
  const ctx = renderer.view;
  scene.draw(ctx, camera, game);
  const camY = Math.round(camera.y);
  if (showHitboxes) {
    const b = game.player.body;
    ctx.strokeStyle = '#ff00ff';
    ctx.strokeRect(b.x + 0.5, b.y - camY + 0.5, b.w - 1, b.h - 1);
  }
  if (mode.kind === 'play') {
    const it = game.interaction();
    if (it) drawPrompt(ctx, it, camY, input);
    drawWeightMeter(ctx, game.stones, meterT / 30);
  }
  if (mode.kind === 'inventory') drawInventory(ctx, game, mode.sel, input, scene.objects, mode.message);
  if (mode.kind === 'note') {
    const n = game.noteText(mode.id);
    drawNote(ctx, n.title, n.text, input);
  }
  if (DEBUG) {
    const stones = game.stones;
    drawDebugText(ctx, [
      `weight ${stones} st  tier ${loadTier(stones)}  ${game.player.state}`,
      `screen ${camera.screenFromBottom + 1}/${world.screenCount}  jumps ${game.stats.jumps}  falls ${game.stats.falls}`,
    ]);
  }
  renderer.present();
}

addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save();
});

startLoop(update, render);

/** Dev-only hook for automated checks: advance frames with a fixed input, independent of animation timing. */
if (import.meta.env.DEV) {
  const w = window as unknown as Record<string, unknown>;
  w.__hc = {
    run(frames: number, inp: { left?: boolean; right?: boolean; jump?: boolean; up?: boolean; down?: boolean } = {}) {
      for (let i = 0; i < frames; i++) step(!!inp.left, !!inp.right, !!inp.jump, !!inp.up, !!inp.down);
      render();
      const p = game.player;
      return { x: p.body.x, y: p.body.y, state: p.state, screen: camera.screenFromBottom, stones: game.stones };
    },
    interact() {
      game.interact();
      render();
      return game.events;
    },
    teleport(x: number, y: number) {
      game.player.body.x = x;
      game.player.body.y = y;
      camera.snapTo(game.player.centerY);
      scene.warm(camera.band);
      render();
    },
    /** Puts the climber in a level-relative cell: level id, screen (0 = top of that level), tile x, tile y. */
    goto(L: number, sc: number, tx: number, ty: number) {
      const li = world.levels.findIndex((l) => l.id === L);
      const band = world.bandLevel.indexOf(li) + sc;
      const p = game.player;
      p.body.x = tx * 8 - 1;
      p.body.y = (band * 34 + ty + 1) * 8 - 18;
      p.body.remX = p.body.remY = 0;
      p.vx = p.vy = 0;
      p.state = 'ground';
      camera.snapTo(p.centerY);
      scene.warm(camera.band);
      render();
    },
    give(...ids: string[]) {
      for (const id of ids) game.carried.push({ uid: 5000 + game.carried.length, id: id as never });
      game.updateLoadout();
      render();
    },
    openInventory() {
      mode = { kind: 'inventory', sel: 0, message: null, messageT: 0 };
      render();
    },
    closeUi() {
      mode = { kind: 'play' };
      render();
    },
    newGame() {
      clearSave();
      game = new Game(world);
      camera.snapTo(game.player.centerY);
      render();
    },
    get game() {
      return game;
    },
  };
}
