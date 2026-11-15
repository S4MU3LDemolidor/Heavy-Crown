import { layerHeight, paintLayer, paintSky, type LayerName } from '../art/backdrop';
import { PixelBuffer } from '../art/buffer';
import { BODY_FRAMES, buildClimberSheet, FEET_X, FEET_Y, FRAME_H, FRAME_W, type BodyFrame, type ClimberSheet } from '../art/climber';
import { paintScreen, type BakedLight, type Tuft, type Vine } from '../art/terrain';
import { THEMES, type Theme } from '../content/themes';
import type { Camera } from '../game/camera';
import type { World } from '../game/level';
import type { Game } from '../game/game';
import type { Player } from '../game/player';
import { SCREEN_H, VIEW_H, VIEW_W } from '../game/tuning';
import { loadTier } from '../game/weight';
import { Ambient } from './ambient';
import { Effects } from './effects';
import { Fog, makeVignette } from './fog';
import { toCanvas } from './canvas';
import { layerY, levelSpan } from './parallaxMath';
import { Lighting } from './lighting';
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
  private readonly bands = new Map<number, { canvas: HTMLCanvasElement; lights: BakedLight[]; tufts: Tuft[]; vines: Vine[] }>();
  private readonly ambient: Ambient;
  private readonly climber: ClimberSheet;
  private readonly sheetR: HTMLCanvasElement;
  private readonly sheetL: HTMLCanvasElement;
  readonly anim = new ClimberAnimator();
  private scarf: Scarf | null = null;
  readonly objects = new ObjectRenderer();
  private readonly gear = new PackGear();
  private readonly lighting = new Lighting();
  readonly effects = new Effects();
  private readonly fog = new Fog();
  private readonly vignette = makeVignette();
  /** The level whose backdrop is fading out, and how far the fade has gone (0..1). */
  private fadeFrom = -1;
  private fadeK = 1;
  private shownLevel = -1;
  /** Wind streak particles (gust warnings). */
  private streaks: { x: number; y: number; len: number; v: number }[] = [];

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
    this.ambient = new Ambient(world);
    this.climber = buildClimberSheet();
    this.sheetR = toCanvas(this.climber.sheet);
    this.sheetL = toCanvas(mirrorFrames(this.climber.sheet));
  }

  /** The baked canvas of a band, painting it on first use. */
  band(b: number): { canvas: HTMLCanvasElement; lights: BakedLight[]; tufts: Tuft[]; vines: Vine[] } {
    let baked = this.bands.get(b);
    if (!baked) {
      const theme = THEMES[this.world.levels[this.world.bandLevel[b]].theme];
      const s = paintScreen(this.world, b, theme);
      baked = { canvas: toCanvas(s.buf), lights: s.lights, tufts: s.tufts, vines: s.vines };
      this.bands.set(b, baked);
    }
    return baked;
  }

  /** Paints the bands around `b` ahead of time so screen changes never stall. */
  warm(b: number): void {
    for (const k of [b - 1, b, b + 1]) if (k >= 0 && k < this.world.screenCount) this.band(k);
  }

  /** Feeds this step's events to the effects (call after each game step). */
  onStep(game: Game): void {
    const p = game.player;
    const theme = THEMES[this.world.levels[this.world.bandLevel[Math.max(0, Math.min(this.world.screenCount - 1, Math.floor(p.centerY / SCREEN_H)))]].theme];
    this.effects.spawn(game.events, p.events, p, theme, game.waterAt(p.body.x, p.body.y, p.body.w, p.body.h + 1));
    this.effects.update();
    if (this.fadeK < 1) this.fadeK = Math.min(1, this.fadeK + 1 / 45);
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
    const camY = Math.round(camera.y) + this.effects.shake;
    const topBand = Math.max(0, Math.floor(camY / SCREEN_H));
    const li = this.world.bandLevel[camera.band];
    if (li !== this.shownLevel) {
      if (this.shownLevel >= 0) {
        this.fadeFrom = this.shownLevel;
        this.fadeK = 0;
      }
      this.shownLevel = li;
    }
    const art = this.levelArt[li];
    const t = this.anim.time;
    const backdrop = (a: LevelArt, lvl: number) => {
      ctx.drawImage(a.sky, 0, 0);
      this.effects.drawSky(ctx, a.theme);
      this.ambient.drawClouds(ctx, a.theme, t);
      for (const name of LAYERS) {
        const L = a.layers[name];
        ctx.drawImage(L.canvas, 0, layerY(this.world, lvl, name, L.h, camY));
        if (name === 'far') this.ambient.drawBirds(ctx, a.theme, t);
      }
    };
    // the backdrop of the level being left fades into the new one
    if (this.fadeK < 1 && this.fadeFrom >= 0) {
      backdrop(this.levelArt[this.fadeFrom], this.fadeFrom);
      ctx.save();
      ctx.globalAlpha = this.fadeK;
      backdrop(art, li);
      ctx.restore();
    } else backdrop(art, li);
    const gust = game.gust();
    const windHere = this.world.bandWind[camera.band] ?? 0;
    const gustK = windHere === 0 ? 0 : gust.phase === 'gust' ? 1 : gust.phase === 'telegraph' ? 0.4 : 0;
    for (let b = topBand; b <= topBand + 1 && b < this.world.screenCount; b++) {
      const y = b * SCREEN_H - camY;
      if (y >= VIEW_H || y + SCREEN_H <= 0) continue;
      const baked = this.band(b);
      ctx.drawImage(baked.canvas, 0, y);
      this.ambient.drawFoliage(ctx, baked.tufts, baked.vines, camY, t, player, gustK);
    }
    this.fog.drawHaze(ctx, art.theme, t);
    this.drawWater(ctx, camY, t);
    this.objects.drawBack(ctx, game, camY, t);
    this.objects.drawItems(ctx, game, camY);
    const carried = game.carried.map((c) => c.id);
    this.drawClimber(ctx, player, camY, carried);
    this.drawWind(ctx, game, camY);
    this.effects.drawRays(ctx, art.theme);
    this.effects.drawWorld(ctx, camY);
    this.fog.drawMist(ctx, art.theme, t);
    // lighting: the camera's level sets the ambient; skipped where the level is fully lit
    const theme = art.theme;
    if (theme.ambient < 1) {
      this.lighting.begin(theme.ambient, theme.tint);
      const cx = player.body.x + player.body.w / 2;
      const cy = player.body.y + player.body.h / 2 - camY;
      this.lighting.add(cx, cy, 18, '#c8c0e0', 0.45);
      if (carried.includes('lantern')) {
        const flicker = Math.sin(t * 0.21) * 2 + Math.sin(t * 0.53) * 1.5;
        const lx = cx - player.facing * 7;
        this.lighting.add(lx, cy + 3, 72 + flicker, '#ffd890', 1);
        this.lighting.add(lx, cy + 3, 26, '#fff0c0', 0.6);
      }
      for (const id of carried) {
        if (id === 'orb' || id === 'scepter' || id === 'seal' || id === 'crown') this.lighting.add(cx - player.facing * 6, cy - 6, 26, '#ffe8a0', 0.7);
        if (id === 'ruby') this.lighting.add(cx, cy, 12, '#ff6070', 0.5);
      }
      for (const L of this.objects.lights(game)) {
        const y = L.y - camY;
        if (y < -L.r || y > VIEW_H + L.r) continue;
        this.lighting.add(L.x, y, L.r, L.color, L.k ?? 1);
      }
      for (let b = topBand; b <= topBand + 1 && b < this.world.screenCount; b++) {
        for (const L of this.band(b).lights) this.lighting.add(L.x, L.y - camY, L.r, L.color, 0.7);
      }
      for (const L of this.ambient.particleLights(theme)) this.lighting.add(L.x, L.y - camY, L.r, L.color, 0.6);
      this.lighting.apply(ctx);
    }
    this.ambient.drawParticles(ctx, theme, camera.band, camY, game.windAt(0, camY + VIEW_H / 2));
    this.objects.drawGlints(ctx, game, camY, t);
    this.effects.drawStun(ctx, player, camY, t);
    ctx.drawImage(this.vignette, 0, 0);
  }

  /** Moving highlights on water surfaces. */
  private drawWater(ctx: CanvasRenderingContext2D, camY: number, t: number): void {
    const grid = this.world.grid;
    const ty0 = Math.floor(camY / 8);
    const ty1 = Math.floor((camY + VIEW_H) / 8);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = 0; tx < grid.cols; tx++) {
        if (grid.get(tx, ty) !== 2 || grid.get(tx, ty - 1) === 2) continue;
        for (let px = 0; px < 8; px++) {
          const x = tx * 8 + px;
          const w = Math.sin(x * 0.35 + t * 0.06) + Math.sin(x * 0.11 - t * 0.04);
          if (w > 1.2) {
            ctx.fillStyle = 'rgba(216, 248, 255, 0.9)';
            ctx.fillRect(x, ty * 8 - camY, 1, 1);
          } else if (w > 0.6) {
            ctx.fillStyle = 'rgba(168, 232, 224, 0.5)';
            ctx.fillRect(x, ty * 8 - camY + 1, 1, 1);
          }
        }
      }
    }
  }

  private drawWind(ctx: CanvasRenderingContext2D, game: Game, camY: number): void {
    const band = Math.floor((camY + VIEW_H / 2) / SCREEN_H);
    const dir = this.world.bandWind[band] ?? 0;
    const gust = game.gust();
    if (dir !== 0 && gust.phase !== 'calm' && this.streaks.length < (gust.phase === 'gust' ? 40 : 12) && this.anim.time % 2 === 0) {
      this.streaks.push({ x: dir > 0 ? -20 : VIEW_W + 20, y: Math.random() * VIEW_H, len: 6 + Math.random() * 14, v: (gust.phase === 'gust' ? 7 : 4) + Math.random() * 3 });
    }
    ctx.fillStyle = 'rgba(230, 240, 255, 0.55)';
    this.streaks = this.streaks.filter((s) => {
      s.x += s.v * (dir || 1);
      s.y += Math.sin((s.x + s.y) * 0.05) * 0.3;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), Math.round(s.len), 1);
      return s.x > -40 && s.x < VIEW_W + 40;
    });
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
