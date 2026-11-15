import { LEVELS } from './content/levels';
import { TEST_MOVES } from './content/levels/test-moves';
import { TEST_TOWER } from './content/levels/test-tower';
import { Audio } from './engine/audio';
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
import { drawInventory, drawNote, drawPackBar, drawPrompt, drawToast, drawWeightMeter } from './ui/hud';
import { CREDITS, drawJournal, drawLogo, drawMap, drawMenu, drawOptions, drawStats, drawStoryLines, drawTitleCard, formatTime, type EndStats, type Options } from './ui/screens';
import { dimScreen, drawTextCentered, UI } from './ui/draw';
import { drawDialogue, drawPicker } from './ui/dialogue';
import { DialogueRunner } from './game/story';
import { ITEMS } from './content/items';
import { ENDING_LINES, INTRO_LINES, LEVEL_NAMES } from './content/story';
import { THEMES } from './content/themes';

const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');
const GREYBOX = params.has('test');
const MOVES = params.has('moves');
if (params.has('new')) clearSave();

const canvas = document.getElementById('screen') as HTMLCanvasElement;
const audio = new Audio();
for (const ev of ['keydown', 'pointerdown', 'gamepadconnected']) addEventListener(ev, () => audio.unlock());
const renderer = new Renderer(canvas);
const input = new Input(window);
const world = buildWorld(GREYBOX ? [TEST_TOWER] : MOVES ? [TEST_MOVES] : LEVELS);
let game = new Game(world);
game.scaresEnabled = loadOptions().scares;
const saved = GREYBOX || MOVES || !params.has('play') ? null : readSave();
if (saved) game.load(saved);
const camera = new Camera(world.screenCount);
const scene = new Scene(world);
camera.snapTo(game.player.centerY);
scene.warm(camera.band);

type Mode =
  | { kind: 'title'; sel: number }
  | { kind: 'confirmNew'; sel: number }
  | { kind: 'intro'; t: number }
  | { kind: 'play' }
  | { kind: 'inventory'; sel: number; message: string | null; messageT: number }
  | { kind: 'note'; id: string }
  | { kind: 'pause'; sel: number }
  | { kind: 'options'; sel: number; back: 'pause' | 'title' }
  | { kind: 'map' }
  | { kind: 'journal'; page: number }
  | { kind: 'ending'; t: number; stats: EndStats; baseY: number }
  | { kind: 'credits'; t: number }
  | { kind: 'talk'; runner: DialogueRunner; typed: number; sel: number }
  | { kind: 'pick'; what: 'lift' | 'favour'; station: string; sel: number };
let mode: Mode = GREYBOX || MOVES || params.has('play') ? { kind: 'play' } : { kind: 'title', sel: 0 };
let meterT = 0;
let saveT = 0;
let showHitboxes = false;
let card: { numeral: string; title: string; t: number } | null = null;
let toast: { text: string; t: number } | null = null;
let uiT = 0;
let options: Options = loadOptions();
audio.setVolumes(options.music, options.sfx);

function loadOptions(): Options {
  try {
    const o = JSON.parse(localStorage.getItem('heavycrown.options') ?? 'null');
    if (o) return { music: o.music ?? 0.7, sfx: o.sfx ?? 0.8, alwaysMeter: o.alwaysMeter ?? true, scares: o.scares ?? true };
  } catch {
    /* storage unavailable */
  }
  return { music: 0.7, sfx: 0.8, alwaysMeter: true, scares: true };
}

function saveOptions(): void {
  try {
    localStorage.setItem('heavycrown.options', JSON.stringify(options));
  } catch {
    /* storage unavailable */
  }
  audio.setVolumes(options.music, options.sfx);
  game.scaresEnabled = options.scares;
}

function save(): void {
  if (!GREYBOX && !MOVES && mode.kind !== 'title' && mode.kind !== 'ending' && mode.kind !== 'credits' && mode.kind !== 'intro') writeSave(game.save());
}

function startNewClimb(): void {
  clearSave();
  game = new Game(world);
  game.scaresEnabled = options.scares;
  camera.snapTo(game.player.centerY);
  scene.warm(camera.band);
  mode = { kind: 'intro', t: 0 };
}

function continueClimb(): void {
  const d = readSave();
  game = new Game(world);
  game.scaresEnabled = options.scares;
  if (d) game.load(d);
  camera.snapTo(game.player.centerY);
  scene.warm(camera.band);
  mode = { kind: 'play' };
}

function startEnding(): void {
  audio.chargeStop();
  mode = {
    kind: 'ending',
    t: 0,
    baseY: camera.y,
    stats: { time: formatTime(game.stats.frames), jumps: game.stats.jumps, falls: game.stats.falls, biggestFall: game.stats.biggestFall, gold: game.goldDelivered() },
  };
  clearSave();
}

/** Shows a level's title card the first time the climber enters it. */
function checkTitleCard(): void {
  const level = world.levels[world.bandLevel[camera.band]];
  if (game.levelsSeen.has(level.id)) return;
  game.levelsSeen.add(level.id);
  const th = THEMES[level.theme];
  card = { numeral: `${th.numeral} · ${level.id}`, title: LEVEL_NAMES[level.id] ?? th.title, t: 0 };
}

let walked = 0;
let lastGust = 'calm';

/** Turns this step's events into sound. */
function playSounds(): void {
  const p = game.player;
  const tier = loadTier(game.stones);
  for (const e of p.events) {
    if (e.type === 'chargeStart') audio.chargeStart();
    if (e.type === 'jump') audio.jump(e.charge);
    if (e.type === 'land') {
      if (game.waterAt(p.body.x, p.body.y, p.body.w, p.body.h + 1)) audio.splash();
      else audio.land(tier, e.hard);
    }
    if (e.type === 'bonkWall' || e.type === 'bonkCeiling') audio.bonk();
    if (e.type === 'grab' || (e.type === 'climbStep' && p.state === 'ladder')) audio.creak();
    if (e.type === 'cling' || (e.type === 'climbStep' && p.state === 'cling')) audio.clawScrape();
    if (e.type === 'mantle') audio.step(tier);
    if (e.type === 'wallJump') audio.jump(0.4);
    if (e.type === 'hookFire') audio.hookFire();
    if (e.type === 'hookMiss') audio.hookMiss();
    if (e.type === 'hang') audio.hookLatch();
  }
  if (p.state !== 'charge') audio.chargeStop();
  if (p.state === 'ground' && p.vx !== 0) {
    walked += Math.abs(p.vx);
    if (walked > 11 - tier) {
      walked = 0;
      audio.step(tier);
    }
  }
  for (const e of game.events) {
    switch (e.type) {
      case 'pickup': audio.pickup(); break;
      case 'drop': audio.drop(); break;
      case 'unlock': audio.keyTurn(); break;
      case 'locked': audio.locked(); break;
      case 'gateMove': audio.gate(); break;
      case 'break': audio.breakStone(); break;
      case 'rope': audio.rope(); break;
      case 'read': audio.paper(); break;
      case 'bell': audio.bell(e.big); break;
      case 'plank': audio.plank(e.down); break;
      case 'plate': audio.plate(e.pressed); break;
      case 'relic': audio.relic(); break;
      case 'crown': audio.crown(); break;
      case 'scare': audio.sting(); break;
      case 'whisper': audio.whisper(); break;
      case 'liftSent': case 'liftTaken': audio.rope(); break;
      case 'paid': audio.pickup(); break;
      case 'echoMove': audio.echo(); break;
      case 'kingDelivered': audio.relic(); break;
    }
  }
  const windHere = world.bandWind[camera.band] ?? 0;
  const g = game.gust().phase;
  if (windHere !== 0 && g !== lastGust && g !== 'calm') audio.gust(g === 'gust');
  lastGust = g;
  const theme = world.levels[world.bandLevel[camera.band]].theme;
  audio.setMusic(theme);
  audio.setAmbience(theme);
  audio.tick();
}

function step(left: boolean, right: boolean, jump: boolean, up = false, down = false, hook = false): void {
  game.step({ left, right, jump, up, down, hook });
  playSounds();
  for (const e of game.events) if (e.type === 'weight') meterT = 180;
  for (const e of game.player.events) if (e.type === 'land') save();
  const before = camera.band;
  camera.update(game.player.centerY);
  if (camera.band !== before) scene.warm(camera.band);
  game.discover(camera.band);
  checkTitleCard();
  scene.onStep(game);
  scene.update(game.player);
  if (meterT > 0) meterT--;
  if (game.player.state === 'ground' && ++saveT >= 120) {
    saveT = 0;
    save();
  }
}

function update(): void {
  input.poll();
  uiT++;
  if (card && ++card.t > 180) card = null;
  if (toast && --toast.t <= 0) toast = null;
  if (DEBUG && input.keyPressed('Digit2')) showHitboxes = !showHitboxes;
  const back = input.pressed('pause') || input.pressed('inventory');
  const ok = input.pressed('jump') || input.pressed('interact');
  const nav = (sel: number, n: number) => {
    if (input.pressed('up')) {
      audio.ui();
      return (sel - 1 + n) % n;
    }
    if (input.pressed('down')) {
      audio.ui();
      return (sel + 1) % n;
    }
    return sel;
  };
  switch (mode.kind) {
    case 'title': {
      audio.setMusic('title');
      const items = titleItems();
      mode.sel = nav(mode.sel, items.length);
      if (ok) {
        audio.ui();
        const pick = items[mode.sel];
        if (pick === 'Continue') continueClimb();
        else if (pick === 'New Climb') mode = readSave() ? { kind: 'confirmNew', sel: 0 } : (startNewClimb(), mode);
        else mode = { kind: 'options', sel: 0, back: 'title' };
      }
      scene.update(game.player);
      break;
    }
    case 'confirmNew':
      if (input.pressed('left') || input.pressed('right') || input.pressed('up') || input.pressed('down')) mode.sel = 1 - mode.sel;
      if (ok) mode.sel === 1 ? startNewClimb() : (mode = { kind: 'title', sel: 0 });
      else if (back) mode = { kind: 'title', sel: 0 };
      break;
    case 'intro':
      mode.t++;
      scene.update(game.player);
      if (ok || back || mode.t > INTRO_LINES.length * 150 + 140) {
        mode = { kind: 'play' };
        checkTitleCard();
      }
      break;
    case 'play': {
      if (input.pressed('pause')) {
        mode = { kind: 'pause', sel: 0 };
        audio.chargeStop();
        return;
      }
      if (input.pressed('inventory')) {
        mode = { kind: 'inventory', sel: Math.max(0, game.selected), message: null, messageT: 0 };
        audio.chargeStop();
        return;
      }
      if (input.pressed('drop') && game.carried.length) {
        if (game.drop(game.selected)) {
          scene.onStep(game);
          playSounds();
          save();
        } else toast = { text: 'You can only put things down on solid ground.', t: 120 };
      }
      if (input.pressed('interact')) {
        const it = game.interaction();
        if (it) {
          it.run();
          scene.onStep(game);
          playSounds();
          for (const e of game.events) if (e.type === 'read') mode = { kind: 'note', id: e.note };
          for (const e of game.events) if (e.type === 'liftMenu') mode = { kind: 'pick', what: 'lift', station: e.station, sel: Math.max(0, game.selected) };
          for (const e of game.events) {
            if (e.type !== 'talk') continue;
            const npc = game.npcAt(e.npc);
            const def = npc && game.npcDefs[npc.id];
            const conv = npc && def && DialogueRunner.pick(game, def, npc);
            if (npc && def && conv) {
              mode = { kind: 'talk', runner: new DialogueRunner(game, def, npc, conv), typed: 0, sel: 0 };
              audio.chargeStop();
            }
          }
          for (const e of game.events) if (e.type === 'weight') meterT = 180;
          if (game.events.some((e) => e.type === 'crown')) {
            startEnding();
            return;
          }
          save();
          if (mode.kind !== 'play') return;
        }
      }
      step(input.held('left'), input.held('right'), input.held('jump'), input.held('up'), input.held('down'), input.held('hook'));
      break;
    }
    case 'inventory': {
      const n = game.carried.length;
      if (input.pressed('left') && n) mode.sel = (mode.sel - 1 + n) % n;
      if (input.pressed('right') && n) mode.sel = (mode.sel + 1) % n;
      if (n) game.selected = Math.min(mode.sel, n - 1);
      if (input.pressed('drop') && n) {
        if (game.drop(mode.sel)) {
          mode.sel = Math.max(0, Math.min(mode.sel, game.carried.length - 1));
          if (game.carried.length) game.selected = mode.sel;
          scene.onStep(game);
          playSounds();
          save();
        } else {
          mode.message = 'You can only put things down on solid ground.';
          mode.messageT = 120;
        }
      }
      if (mode.messageT > 0 && --mode.messageT === 0) mode.message = null;
      if (back) {
        mode = { kind: 'play' };
        meterT = 120;
      }
      break;
    }
    case 'note':
      if (ok || back) mode = { kind: 'play' };
      break;
    case 'talk': {
      const view = mode.runner.view();
      if (!view) {
        mode = { kind: 'play' };
        break;
      }
      const before = Math.floor(mode.typed);
      mode.typed = Math.min(view.text.length, mode.typed + 1.4);
      if (Math.floor(mode.typed) !== before && Math.floor(mode.typed) % 3 === 0 && view.text[Math.floor(mode.typed)] !== ' ') audio.blip(mode.runner.def.voice.pitch, mode.runner.def.voice.wave);
      const n = view.choices.length;
      if (n && mode.typed >= view.text.length) {
        if (input.pressed('up')) mode.sel = (mode.sel - 1 + n) % n;
        if (input.pressed('down')) mode.sel = (mode.sel + 1) % n;
      }
      if (ok) {
        if (mode.typed < view.text.length) mode.typed = view.text.length;
        else {
          game.events = [];
          if (n) {
            if (!view.choices[mode.sel].enabled) {
              toast = { text: 'You cannot do that right now.', t: 90 };
              break;
            }
            mode.runner.choose(mode.sel);
          } else mode.runner.advance();
          scene.onStep(game);
          playSounds();
          save();
          mode.typed = 0;
          mode.sel = 0;
          const pending = game.pendingMenu;
          game.pendingMenu = null;
          if (pending?.kind === 'lift') mode = { kind: 'pick', what: 'lift', station: pending.station, sel: Math.max(0, game.selected) };
          else if (pending?.kind === 'favour') mode = { kind: 'pick', what: 'favour', station: '', sel: 0 };
          else if (mode.runner.done) mode = { kind: 'play' };
        }
      }
      if (back && mode.kind === 'talk') mode = { kind: 'play' };
      break;
    }
    case 'pick': {
      const options = pickOptions(mode.what);
      const n = options.length;
      if (n && (input.pressed('left') || input.pressed('up'))) mode.sel = (mode.sel - 1 + n) % n;
      if (n && (input.pressed('right') || input.pressed('down'))) mode.sel = (mode.sel + 1) % n;
      if (ok && n) {
        game.events = [];
        const idx = options[Math.min(mode.sel, n - 1)];
        const done = mode.what === 'lift' ? game.liftSend(mode.station, idx) : game.kingFavour(idx);
        if (!done) toast = { text: mode.what === 'lift' ? 'You need 10 gold to pay for the lift.' : 'He cannot take that.', t: 120 };
        else if (mode.what === 'favour') toast = { text: 'He takes it in his frozen hands. "To the top. I swear it."', t: 200 };
        scene.onStep(game);
        playSounds();
        save();
        mode = { kind: 'play' };
      } else if (back) mode = { kind: 'play' };
      break;
    }
    case 'pause': {
      const items = pauseItems();
      if (input.pressed('pause')) {
        mode = { kind: 'play' };
        break;
      }
      mode.sel = nav(mode.sel, items.length);
      if (ok) {
        audio.ui();
        const pick = items[mode.sel];
        if (pick === 'Resume') mode = { kind: 'play' };
        else if (pick === 'Journal') mode = { kind: 'journal', page: Math.max(0, game.notesRead.size - 1) };
        else if (pick === 'Map') mode = { kind: 'map' };
        else if (pick === 'Options') mode = { kind: 'options', sel: 0, back: 'pause' };
        else {
          save();
          mode = { kind: 'title', sel: 0 };
          game = new Game(world);
          camera.snapTo(game.player.centerY);
        }
      }
      break;
    }
    case 'options': {
      mode.sel = nav(mode.sel, 6);
      const dir = input.pressed('right') ? 1 : input.pressed('left') ? -1 : 0;
      if (mode.sel === 0 && dir) options.music = Math.max(0, Math.min(1, Math.round((options.music + dir * 0.1) * 10) / 10));
      if (mode.sel === 1 && dir) {
        options.sfx = Math.max(0, Math.min(1, Math.round((options.sfx + dir * 0.1) * 10) / 10));
        audio.ui();
      }
      if (dir || ok) saveOptions();
      if (ok && mode.sel === 2) {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.();
      }
      if (ok && mode.sel === 3) options.alwaysMeter = !options.alwaysMeter;
      if (ok && mode.sel === 4) {
        options.scares = !options.scares;
        saveOptions();
      }
      if ((ok && mode.sel === 5) || back) mode = mode.back === 'pause' ? { kind: 'pause', sel: 0 } : { kind: 'title', sel: 0 };
      break;
    }
    case 'map':
      if (ok || back) mode = { kind: 'pause', sel: 0 };
      break;
    case 'journal': {
      const n = game.notesRead.size;
      if (input.pressed('left') && n) mode.page = (mode.page - 1 + n) % n;
      if (input.pressed('right') && n) mode.page = (mode.page + 1) % n;
      if (ok || back) mode = { kind: 'pause', sel: 0 };
      break;
    }
    case 'ending': {
      mode.t++;
      const k = Math.max(0, Math.min(1, (mode.t - 60) / 360));
      scene.dawn = k;
      const ease = k * k * (3 - 2 * k);
      camera.y = mode.baseY - ease * 150;
      scene.effects.update();
      scene.update(game.player);
      audio.tick();
      if (mode.t > 760 && ok) mode = { kind: 'credits', t: 0 };
      break;
    }
    case 'credits':
      mode.t++;
      if ((mode.t > 120 && ok) || mode.t > 1200) {
        scene.dawn = 0;
        game = new Game(world);
        camera.snapTo(game.player.centerY);
        mode = { kind: 'title', sel: 0 };
      }
      break;
  }
}

/** Indices of carried items a picker offers. */
function pickOptions(what: 'lift' | 'favour'): number[] {
  return game.carried.map((c, i) => [c, i] as const).filter(([c]) => what === 'lift' || ITEMS[c.id].kind === 'relic').map(([, i]) => i);
}

function titleItems(): string[] {
  return readSave() ? ['Continue', 'New Climb', 'Options'] : ['New Climb', 'Options'];
}

function pauseItems(): string[] {
  return ['Resume', 'Journal', ...(game.has('map') ? ['Map'] : []), 'Options', 'Quit to title'];
}

function render(): void {
  const ctx = renderer.view;
  scene.hideClimber = mode.kind === 'title' || mode.kind === 'confirmNew';
  scene.draw(ctx, camera, game);
  const camY = Math.round(camera.y);
  if (showHitboxes) {
    const b = game.player.body;
    ctx.strokeStyle = '#ff00ff';
    ctx.strokeRect(b.x + 0.5, b.y - camY + 0.5, b.w - 1, b.h - 1);
  }
  const hint = (a: string, b: string) => `${input.label(a as never)} ${b}`;
  switch (mode.kind) {
    case 'title':
    case 'confirmNew': {
      ctx.fillStyle = 'rgba(10, 6, 16, 0.35)';
      ctx.fillRect(0, 0, 480, 270);
      drawLogo(ctx, 240, 64, uiT);
      drawTextCentered(ctx, 'A tower. A crown. Everything you carry.', 240, 100, UI.dim);
      if (mode.kind === 'title') drawMenu(ctx, titleItems(), mode.sel, 240, 150, uiT);
      else {
        dimScreen(ctx, 0.5);
        drawTextCentered(ctx, 'Start a new climb?', 240, 120, UI.ink);
        drawTextCentered(ctx, 'Your current climb will be lost.', 240, 134, UI.dim);
        drawMenu(ctx, ['No', 'Yes'], mode.sel, 240, 156, uiT);
      }
      drawTextCentered(ctx, `${input.label('jump')} choose`, 240, 252, UI.dim);
      break;
    }
    case 'intro':
      drawStoryLines(ctx, INTRO_LINES, mode.t, 150, Math.max(0, 0.85 - Math.max(0, mode.t - INTRO_LINES.length * 150) / 140));
      break;
    case 'play': {
      const it = game.interaction();
      if (it) drawPrompt(ctx, it, camY, input);
      if (options.alwaysMeter) drawPackBar(ctx, game, input, scene.objects, camY);
      else drawWeightMeter(ctx, game.stones, meterT / 30);
      if (toast) drawToast(ctx, toast.text, toast.t);
      break;
    }
    case 'inventory':
      drawInventory(ctx, game, mode.sel, input, scene.objects, mode.message);
      break;
    case 'note': {
      const n = game.noteText(mode.id);
      drawNote(ctx, n.title, n.text, input);
      break;
    }
    case 'pause':
      dimScreen(ctx, 0.6);
      drawTextCentered(ctx, 'Paused', 240, 70, UI.gold);
      drawMenu(ctx, pauseItems(), mode.sel, 240, 96, uiT);
      drawTextCentered(
        ctx,
        input.lastDevice === 'pad'
          ? 'Stick walk  A hold to jump  X take/use  B drop  Y pack  RB hook  Start pause'
          : 'Arrows walk  Space hold to jump  E take/use  Q drop  Tab pack  F hook  Esc pause',
        240,
        236,
        UI.dim,
      );
      break;
    case 'options':
      drawOptions(ctx, options, mode.sel, !!document.fullscreenElement, uiT);
      break;
    case 'map':
      drawMap(ctx, game, (b) => (game.discovered.has(b) ? scene.band(b).canvas : null));
      break;
    case 'journal':
      drawJournal(ctx, [...game.notesRead], mode.page, `${input.label('left')}/${input.label('right')} turn   ${input.label('pause')} close`);
      break;
    case 'ending':
      if (mode.t > 300) drawStoryLines(ctx, ENDING_LINES, mode.t - 300, 140, 0.2);
      if (mode.t > 640) drawStats(ctx, mode.stats, (mode.t - 640) / 60, mode.t > 760 ? hint('jump', 'continue') : '');
      break;
    case 'credits':
      drawStoryLines(ctx, CREDITS, mode.t, 25, Math.min(0.9, mode.t / 60));
      break;
    case 'talk': {
      const view = mode.runner.view();
      if (view) {
        const portrait = scene.objects.portrait(mode.runner.def.sprite);
        const typedOut = mode.typed >= view.text.length;
        const hint = !typedOut ? `${input.label('interact')} skip` : view.choices.length ? `${input.label('up')}/${input.label('down')} choose  ${input.label('interact')} select` : `${input.label('interact')} continue`;
        drawDialogue(ctx, view, mode.typed, mode.sel, portrait, hint);
      }
      if (toast) drawToast(ctx, toast.text, toast.t);
      break;
    }
    case 'pick': {
      const entries = pickOptions(mode.what).map((i) => ({ icon: scene.objects.itemCanvas(game.carried[i].id), label: `${ITEMS[game.carried[i].id].name} (${ITEMS[game.carried[i].id].weight} st)` }));
      const title = mode.what === 'lift' ? 'Send what up the lift? (10 gold)' : 'Which relic will he carry for you?';
      const note = mode.what === 'lift' ? `You carry ${game.gold} gold.` : 'He will set it on the altar at the summit.';
      drawPicker(ctx, title, entries, Math.min(mode.sel, Math.max(0, entries.length - 1)), `${input.label('left')}/${input.label('right')} choose  ${input.label('interact')} send  ${input.label('pause')} cancel`, note);
      break;
    }
  }
  if (card && mode.kind === 'play') drawTitleCard(ctx, card.numeral, card.title, card.t);
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
    run(frames: number, inp: { left?: boolean; right?: boolean; jump?: boolean; up?: boolean; down?: boolean; hook?: boolean } = {}) {
      for (let i = 0; i < frames; i++) step(!!inp.left, !!inp.right, !!inp.jump, !!inp.up, !!inp.down, !!inp.hook);
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
    /** Advances the whole main loop (menus included) n frames with no input. */
    frames(n: number) {
      for (let i = 0; i < n; i++) update();
      render();
      return mode.kind;
    },
    /** Puts the three relics on the altar and lifts the crown. */
    finish() {
      mode = { kind: 'play' };
      const li = world.levels.findIndex((l) => l.id === 5);
      const p = game.player;
      p.body.x = 29 * 8;
      p.body.y = (world.bandLevel.indexOf(li) * 34 + 7) * 8 - 18;
      p.state = 'ground';
      camera.snapTo(p.centerY);
      for (const id of ['orb', 'scepter', 'seal']) game.carried.push({ uid: 7000 + game.carried.length, id: id as never });
      game.updateLoadout();
      for (let i = 0; i < 4; i++) {
        game.interact();
        scene.onStep(game);
        if (game.events.some((e) => e.type === 'crown')) startEnding();
      }
      render();
      return mode.kind;
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
    audio,
  };
}
