import { layerHeight, paintLayer, paintSky, type LayerName } from '../src/art/backdrop';
import { PixelBuffer } from '../src/art/buffer';
import { buildClimberSheet, FEET_X, FEET_Y, FRAME_H, FRAME_W, type BodyFrame } from '../src/art/climber';
import { paintScreen } from '../src/art/terrain';
import { LEVELS } from '../src/content/levels';
import { THEMES } from '../src/content/themes';
import { buildWorld } from '../src/game/level';
import { SCREEN_H, TUNING, VIEW_CROP, VIEW_H, VIEW_W } from '../src/game/tuning';
import { layerY, levelSpan } from '../src/render/parallaxMath';
import { savePng } from './png';

const which = process.argv[2] ?? 'all';

if (which === 'all' || which === 'climber') {
  const { sheet, frames } = buildClimberSheet();
  savePng(sheet, 'previews/climber.png', 4, '#6a7a8a');
  const picks: [number, BodyFrame][] = [
    [0, 'idle0'], [1, 'walk1'], [2, 'idle0'], [3, 'charge2'], [4, 'idle0'], [1, 'rise'], [1, 'fall1'], [2, 'stumble2'],
  ];
  const close = new PixelBuffer(picks.length * FRAME_W, FRAME_H);
  picks.forEach(([t, f], i) => {
    const info = frames[t][f];
    close.blit(sheet, i * FRAME_W, 0, false, info.sx, info.sy, FRAME_W, FRAME_H);
  });
  savePng(close, 'previews/climber-close.png', 8, '#3a4048');
  console.log('previews/climber.png, previews/climber-close.png');
}

if (which === 'all' || which === 'screens') {
  const world = buildWorld(LEVELS);
  const { sheet, frames } = buildClimberSheet();
  const layers = new Map<string, PixelBuffer>();
  for (let band = 0; band < world.screenCount; band++) {
    const li = world.bandLevel[band];
    const theme = THEMES[world.levels[li].theme];
    const camY = band * SCREEN_H + VIEW_CROP;
    const view = new PixelBuffer(VIEW_W, VIEW_H);
    view.blit(paintSky(theme), 0, 0);
    for (const name of ['far', 'mid', 'near'] as LayerName[]) {
      const key = `${li}:${name}`;
      const h = layerHeight(name, levelSpan(world, li));
      if (!layers.has(key)) layers.set(key, paintLayer(theme, name, h));
      view.blit(layers.get(key)!, 0, layerY(world, li, name, h, camY));
    }
    const baked = paintScreen(world, band, theme);
    view.blit(baked.buf, 0, -VIEW_CROP);
    // climber at the start, if it is on this screen
    const s = world.start;
    if (s.y >= band * SCREEN_H && s.y < (band + 1) * SCREEN_H) {
      const f = frames[1].idle0;
      const x = s.x + Math.floor(TUNING.bodyW / 2) - FEET_X;
      const y = s.y + TUNING.bodyH - 1 - FEET_Y - camY + 1;
      view.blit(sheet, x, y, false, f.sx, f.sy, FRAME_W, FRAME_H);
    }
    const n = world.screenCount - 1 - band;
    savePng(view, `previews/screen-${n}.png`, 2);
    console.log(`previews/screen-${n}.png`);
  }
}

if (which === 'all' || which === 'items') {
  const { itemSprites, ITEM_SIZE, gateTile, ROPE_HOOK, ladderTile, NOTE } = await import('../src/art/items');
  const sprites = itemSprites();
  const ids = Object.keys(sprites) as (keyof typeof sprites)[];
  const sheet = new PixelBuffer(ids.length * (ITEM_SIZE + 2) + 60, ITEM_SIZE + 26);
  ids.forEach((id, i) => sheet.blit(sprites[id], 1 + i * (ITEM_SIZE + 2), 1));
  const ox = ids.length * (ITEM_SIZE + 2);
  sheet.blit(gateTile('top'), ox, 0);
  sheet.blit(gateTile('mid'), ox, 8);
  sheet.blit(gateTile('bottom'), ox, 16);
  sheet.blit(ROPE_HOOK, ox + 10, 0);
  sheet.blit(ladderTile(true), ox + 10, 8);
  sheet.blit(ladderTile(true), ox + 10, 16);
  sheet.blit(NOTE, ox + 20, 2);
  savePng(sheet, 'previews/items.png', 6, '#4a5260');
  console.log('previews/items.png');
}

if (which === 'all' || which === 'npcs') {
  const { npcSprites, scareSprites, liftSprite } = await import('../src/art/npcs');
  const npcs = npcSprites();
  const scares = scareSprites();
  const all = [...Object.values(npcs).map((a) => a.frames[0]), ...Object.values(scares), liftSprite()];
  const w = all.reduce((s, b) => s + b.w + 4, 4);
  const h = Math.max(...all.map((b) => b.h)) + 8;
  const sheet = new PixelBuffer(w, h);
  let x = 4;
  for (const b of all) {
    sheet.blit(b, x, h - 4 - b.h);
    x += b.w + 4;
  }
  savePng(sheet, 'previews/npcs.png', 6, '#4a4458');
  console.log('previews/npcs.png');
}

if (which === 'level') {
  // whole levels as one tall image each, with objects marked: npm run art:preview level 2 3 4
  const ids = process.argv.slice(3).map(Number);
  const world = buildWorld(LEVELS, { requireStart: false });
  const MARK: Record<string, number> = { bell: 0xff30a0d0, item: 0xff3fd0ff, npc: 0xff4040ff, ring: 0xffffff40, note: 0xffffffff, lift: 0xff40a0ff, scare: 0xffff00ff, gate: 0xff0080ff };
  for (const id of ids) {
    const li = world.levels.findIndex((l) => l.id === id);
    if (li < 0) continue;
    const bands = world.bandLevel.map((b, i) => [b, i]).filter(([b]) => b === li).map(([, i]) => i);
    const theme = THEMES[world.levels[li].theme];
    const img = new PixelBuffer(VIEW_W, bands.length * SCREEN_H);
    bands.forEach((band, k) => {
      const camY = band * SCREEN_H;
      const view = new PixelBuffer(VIEW_W, SCREEN_H);
      view.blit(paintSky(theme), 0, 0);
      for (const name of ['far', 'mid', 'near'] as LayerName[]) {
        const h = layerHeight(name, levelSpan(world, li));
        view.blit(paintLayer(theme, name, h), 0, layerY(world, li, name, h, camY));
      }
      view.blit(paintScreen(world, band, theme).buf, 0, 0);
      img.blit(view, 0, k * SCREEN_H);
    });
    const y0 = bands[0] * SCREEN_H;
    for (const s of world.spawns) {
      const y = s.ty * 8 - y0;
      if (y < 0 || y >= img.h) continue;
      const kind = s.entry.kind === 'object' ? (s.entry.object === 'rope_hook' ? 'gate' : s.entry.object) : s.entry.kind;
      const col = MARK[kind];
      if (!col) continue;
      for (let dy = 1; dy < 7; dy++) for (let dx = 1; dx < 7; dx++) if (dx === 1 || dy === 1 || dx === 6 || dy === 6) img.set(s.tx * 8 + dx, y + dy, col);
    }
    savePng(img, `previews/level-${String(id).padStart(2, '0')}.png`, 1);
    console.log(`previews/level-${String(id).padStart(2, '0')}.png`);
  }
}
