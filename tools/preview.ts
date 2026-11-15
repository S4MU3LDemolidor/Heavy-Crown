import { PixelBuffer } from '../src/art/buffer';
import { buildClimberSheet, FRAME_H, FRAME_W, type BodyFrame } from '../src/art/climber';
import { savePng } from './png';

const which = process.argv[2] ?? 'all';

if (which === 'all' || which === 'climber') {
  const { sheet, frames } = buildClimberSheet();
  savePng(sheet, 'previews/climber.png', 4, '#6a7a8a');
  // close-up of key frames: [tier, frame]
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
