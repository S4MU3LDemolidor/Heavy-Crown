import { layerHeight, paintLayer, paintSky, type LayerName } from '../art/backdrop';
import { PixelBuffer } from '../art/buffer';
import { BODY_FRAMES, buildClimberSheet, FEET_X, FEET_Y, FRAME_H, FRAME_W, type BodyFrame, type ClimberSheet } from '../art/climber';
import { paintScreen, type BakedLight } from '../art/terrain';
import { THEMES, type Theme } from '../content/themes';
import type { Camera } from '../game/camera';
import type { World } from '../game/level';
import type { Game } from '../game/game';
import type { Player } from '../game/player';
import { SCREEN_H, VIEW_H, VIEW_W } from '../game/tuning';
import { loadTier } from '../game/weight';
import { toCanvas } from './canvas';
import { layerY, levelSpan } from './parallaxMath';
import { ObjectRenderer } from './objects';
import { PackGear } from './packGear';
import { Scarf } from './scarf';

const LAYERS: LayerName[] = ['far', 'mid', 'near'];

interface LevelArt {
  theme: Theme;
  sky: HTMLCanvasElement;
  layers: Record<LayerName, { canvas: HTMLCanvasElement; h: number }>;
}

/** Picks the climber's animation frame from its state and a few timers. */
export class ClimberAnimator {
  private t = 0;
  private walkT = 0;
  private landT = 0;
  private bonkT = 0;

  update(p: Player): void {
    this.t++;
    if (p.state === 'ground' && p.vx !== 0) this.walkT += Math.abs(p.vx);
    for (const e of p.events) {
      if (e.type === 'land' && !e.hard) this.landT = 6;
      if (e.type === 'bonkWall' || e.type === 'bonkCeiling') this.bonkT = 8;
    }
    if (this.landT > 0) this.landT--;
    if (this.bonkT > 0) this.bonkT--;
  }

  frame(p: Player): BodyFrame {
    switch (p.state) {
      case 'charge':
        return p.charge < 0.34 ? 'charge0' : p.charge < 0.67 ? 'charge1' : 'charge2';
      case 'air':
        if (this.bonkT > 0) return 'bonk';
        if (p.vy < -1.4) return 'rise';
        if (p.vy < 1.4) return 'apex';
        return (this.t >> 3) % 2 ? 'fall1' : 'fall0';
      case 'stumble': {
        const k = p.stumbleLeft;
        return k > 24 ? 'stumble0' : k > 16 ? 'stumble1' : k > 8 ? 'stumble2' : 'stumble3';
      }
      default:
        if (this.landT > 0) return 'land';
        if (p.vx !== 0) return `walk${Math.floor(this.walkT / 4) % 6}` as BodyFrame;
        return (this.t >> 5) % 2 ? 'idle1' : 'idle0';
    }
  }

  get time(): number {
    return this.t;
  }
}

/** Draws the world: sky, parallax, baked screens, climber. */
export class Scene {
  private readonly world: World;
  private readonly levelArt: LevelArt[];
  private readonly bands = new Map<number, { canvas: HTMLCanvasElement; lights: BakedLight[] }>();
  private readonly climber: ClimberSheet;
  private readonly sheetR: HTMLCanvasElement;
  private readonly sheetL: HTMLCanvasElement;
  readonly anim = new ClimberAnimator();
  private scarf: Scarf | null = null;
  readonly objects = new ObjectRenderer();
  private readonly gear = new PackGear();

  constructor(world: World) {
    this.world = world;
    this.levelArt = world.levels.map((level, li) => {
      const theme = THEMES[level.theme];
      const span = levelSpan(world, li);
      const layers = {} as LevelArt['layers'];
      for (const name of LAYERS) {
        const h = layerHeight(name, span);
        layers[name] = { canvas: toCanvas(paintLayer(theme, name, h)), h };
      }
      return { theme, sky: toCanvas(paintSky(theme)), layers };
    });
    this.climber = buildClimberSheet();
    this.sheetR = toCanvas(this.climber.sheet);
    this.sheetL = toCanvas(mirrorFrames(this.climber.sheet));
  }

  /** The baked canvas of a band, painting it on first use. */
  band(b: number): { canvas: HTMLCanvasElement; lights: BakedLight[] } {
    let baked = this.bands.get(b);
    if (!baked) {
      const theme = THEMES[this.world.levels[this.world.bandLevel[b]].theme];
      const s = paintScreen(this.world, b, theme);
      baked = { canvas: toCanvas(s.buf), lights: s.lights };
      this.bands.set(b, baked);
    }
    return baked;
  }

  /** Paints the bands around `b` ahead of time so screen changes never stall. */
  warm(b: number): void {
    for (const k of [b - 1, b, b + 1]) if (k >= 0 && k < this.world.screenCount) this.band(k);
  }

  update(player: Player): void {
    this.anim.update(player);
    const info = this.frameInfo(player);
    const nx = this.frameX(player) + (player.facing > 0 ? info.neck[0] : FRAME_W - 1 - info.neck[0]);
    const ny = this.frameY(player) + info.neck[1];
    if (!this.scarf) this.scarf = new Scarf(nx, ny);
    this.scarf.update(nx, ny, player.facing, player.vx, player.vy, this.anim.time);
  }

  private frameInfo(p: Player) {
    return this.climber.frames[loadTier(p.loadout.stones)][this.anim.frame(p)];
  }

  private frameX(p: Player): number {
    const cx = p.body.x + (p.body.w >> 1);
    return p.facing > 0 ? cx - FEET_X : cx - (FRAME_W - 1 - FEET_X);
  }

  private frameY(p: Player): number {
    let y = p.feetY - 1 - FEET_Y;
    if (p.state === 'charge' && p.charge >= 1 && this.anim.time % 4 < 2) y += 0;
    return y;
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera, game: Game): void {
    const player = game.player;
    const camY = Math.round(camera.y);
    const topBand = Math.max(0, Math.floor(camY / SCREEN_H));
    const li = this.world.bandLevel[camera.band];
    const art = this.levelArt[li];
    // backdrop of the camera's level (crossfades between levels come with the atmosphere pass)
    ctx.drawImage(art.sky, 0, 0);
    for (const name of LAYERS) {
      const L = art.layers[name];
      ctx.drawImage(L.canvas, 0, layerY(this.world, li, name, L.h, camY));
    }
    for (let b = topBand; b <= topBand + 1 && b < this.world.screenCount; b++) {
      const y = b * SCREEN_H - camY;
      if (y >= VIEW_H || y + SCREEN_H <= 0) continue;
      ctx.drawImage(this.band(b).canvas, 0, y);
    }
    const t = this.anim.time;
    this.objects.drawBack(ctx, game, camY, t);
    this.objects.drawItems(ctx, game, camY, t);
    this.drawClimber(ctx, player, camY, game.carried.map((c) => c.id));
  }

  private drawClimber(ctx: CanvasRenderingContext2D, p: Player, camY: number, carried: import('../content/items').ItemId[]): void {
    const info = this.frameInfo(p);
    let x = this.frameX(p);
    const y = this.frameY(p) - camY;
    if (p.state === 'charge' && p.charge >= 1 && this.anim.time % 4 < 2) x += 1;
    // scarf behind the body
    if (this.scarf) {
      const pts = this.scarf.pts;
      for (let i = pts.length - 1; i >= 1; i--) {
        const a = pts[i - 1];
        const b = pts[i];
        const steps = 3;
        for (let s = 0; s <= steps; s++) {
          const px = Math.round(a.x + ((b.x - a.x) * s) / steps);
          const py = Math.round(a.y + ((b.y - a.y) * s) / steps) - camY;
          ctx.fillStyle = '#120d18';
          ctx.fillRect(px - 1, py, 3, 2);
          ctx.fillRect(px, py - 1, 1, 4);
        }
      }
      for (let i = pts.length - 1; i >= 1; i--) {
        const a = pts[i - 1];
        const b = pts[i];
        for (let s = 0; s <= 3; s++) {
          const px = Math.round(a.x + ((b.x - a.x) * s) / 3);
          const py = Math.round(a.y + ((b.y - a.y) * s) / 3) - camY;
          ctx.fillStyle = i >= pts.length - 1 ? '#962838' : '#d6453b';
          ctx.fillRect(px, py, 1, 2);
        }
      }
    }
    const sheet = p.facing > 0 ? this.sheetR : this.sheetL;
    ctx.drawImage(sheet, info.sx, info.sy, FRAME_W, FRAME_H, x, y, FRAME_W, FRAME_H);
    this.gear.draw(ctx, carried, info.pack, x, y, p.facing, this.anim.time);
  }
}

/** Mirrors every frame of a climber sheet in place (same frame positions). */
function mirrorFrames(src: PixelBuffer): PixelBuffer {
  const out = new PixelBuffer(src.w, src.h);
  const cols = BODY_FRAMES.length;
  for (let r = 0; r < src.h / FRAME_H; r++)
    for (let c = 0; c < cols; c++) out.blit(src, c * FRAME_W, r * FRAME_H, true, c * FRAME_W, r * FRAME_H, FRAME_W, FRAME_H);
  return out;
}

export { VIEW_W };
