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
