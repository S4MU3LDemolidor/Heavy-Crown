import type { Theme } from '../content/themes';
import type { GameEvent } from '../game/game';
import type { Player, PlayerEvent } from '../game/player';
import { VIEW_H, VIEW_W } from '../game/tuning';
import { loadTier } from '../game/weight';
import * as aurora from '../vendor/pixelfx/fx/weather/aurora.js';
import * as godRays from '../vendor/pixelfx/fx/weather/god-rays.js';
import * as heal from '../vendor/pixelfx/fx/holy/heal.js';
import * as sunburst from '../vendor/pixelfx/fx/holy/sunburst.js';
import * as featherBurst from '../vendor/pixelfx/fx/holy/feather-burst.js';
import { clearFrame, composite, createFrame, createFx, type Frame, type FxInstance, type FxModule } from '../vendor/pixelfx/index.js';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  drag: number;
  life: number;
  max: number;
  colors: string[];
  size: number;
  /** 'ring' particles draw an expanding dotted ellipse instead of a dot. */
  ring?: { rx: number; ry: number };
}

/** A pixelfx frame rendered into a canvas. */
class FxCanvas {
  readonly frame: Frame;
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly img: ImageData;

  constructor(w: number, h: number) {
    this.frame = createFrame(w, h);
    this.canvas = document.createElement('canvas');
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d')!;
    this.img = this.ctx.createImageData(w, h);
  }

  render(fxs: FxInstance[], ox: number, oy: number): void {
    this.frame.ox = ox;
    this.frame.oy = oy;
    clearFrame(this.frame);
    for (const fx of fxs) fx.draw(this.frame);
    composite(this.frame, this.img.data, null);
    this.ctx.putImageData(this.img, 0, 0);
  }
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Event effects (own small particles, sized to the climber) plus pixelfx for the big moments. */
export class Effects {
  private parts: Particle[] = [];
  private shots: { fx: FxInstance; layer: 'world' }[] = [];
  private readonly shotCanvas = new FxCanvas(VIEW_W, VIEW_H);
  private readonly skyCanvas = new FxCanvas(VIEW_W, 190);
  private readonly rayCanvas = new FxCanvas(VIEW_W, VIEW_H);
  private readonly auroras: FxInstance[];
  private readonly rays: FxInstance[];
  private tick = 0;
  private walkDust = 0;
  /** Remaining frames of screen shake and its strength. */
  shakeT = 0;
  shakeK = 0;
  /** A held, looping effect (the crown's sunburst) that follows a world point. */
  private halo: { fx: FxInstance; x: number; y: number } | null = null;

  constructor() {
    this.auroras = [createFx(aurora as unknown as FxModule, { x: 150, y: 186, seed: 3 }), createFx(aurora as unknown as FxModule, { x: 340, y: 176, seed: 8 })];
    this.rays = [createFx(godRays as unknown as FxModule, { x: 170, y: 250, seed: 3, light: 1 }), createFx(godRays as unknown as FxModule, { x: 390, y: 262, seed: 9, light: 0.8 })];
  }

  private add(p: Partial<Particle> & { x: number; y: number }): void {
    this.parts.push({ vx: 0, vy: 0, g: 0, drag: 0.92, life: 0, max: 20, colors: ['#ffffff'], size: 1, ...p });
  }

  private dust(x: number, y: number, n: number, colors: string[], spread = 1.4, up = 0.5): void {
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? 1 : -1;
      this.add({ x: x + rand(-3, 3), y: y - rand(0, 2), vx: dir * rand(0.3, spread), vy: -rand(0.05, up), drag: 0.9, max: Math.round(rand(14, 26)), colors, size: Math.random() > 0.6 ? 2 : 1 });
    }
  }

  /** Turns game and player events into effects. */
  spawn(events: GameEvent[], pevents: PlayerEvent[], player: Player, theme: Theme, inWater: boolean): void {
    const fx = player.body.x + player.body.w / 2;
    const fy = player.feetY;
    const dustCols = theme.id === 'frozen' ? ['#ffffff', '#dce8f6', '#b8cce4'] : theme.id === 'cistern' ? ['#a8e8e0', '#5ab0b0'] : [theme.stone[5], theme.stone[4], theme.stone[3]];
    const tier = loadTier(player.loadout.stones);
    for (const e of pevents) {
      if (e.type === 'jump') this.dust(fx, fy, 3 + tier, dustCols, 0.9, 0.3);
      if (e.type === 'land') {
        if (inWater) {
          for (let i = 0; i < 10; i++) this.add({ x: fx + rand(-4, 4), y: fy - 2, vx: rand(-1.2, 1.2), vy: -rand(1, 2.6), g: 0.15, drag: 0.98, max: 30, colors: ['#d0f6ff', '#8ad8f0'] });
          this.add({ x: fx, y: fy - 1, max: 24, colors: ['#d0f6ff'], ring: { rx: 14, ry: 2 } });
        } else if (e.hard) {
          this.dust(fx, fy, 12 + tier * 2, dustCols, 2.4, 0.8);
          this.shakeT = 10;
          this.shakeK = 2;
        } else this.dust(fx, fy, 3 + tier * 2, dustCols, 1 + tier * 0.25, 0.4);
      }
      if (e.type === 'bonkWall' || e.type === 'bonkCeiling') {
        const sx = e.type === 'bonkWall' ? (player.vx > 0 ? player.body.x : player.body.x + player.body.w) : fx;
        const sy = e.type === 'bonkWall' ? player.body.y + 6 : player.body.y;
        for (let i = 0; i < 5; i++) this.add({ x: sx, y: sy, vx: rand(-1.5, 1.5), vy: rand(-1.5, 1.2), drag: 0.85, max: 10, colors: ['#ffffff', '#fff0a0', '#f8a030'] });
      }
    }
    if (player.state === 'ground' && player.vx !== 0 && tier >= 2 && ++this.walkDust % Math.max(6, 16 - tier * 2) === 0) this.dust(fx - player.facing * 3, fy, 1 + (tier >> 1), dustCols, 0.4, 0.2);

    for (const e of events) {
      switch (e.type) {
        case 'pickup':
          for (let i = 0; i < 8; i++) this.add({ x: e.x + rand(-3, 3), y: e.y, vx: rand(-0.4, 0.4), vy: -rand(0.4, 1.2), drag: 0.95, max: 30, colors: ['#ffffff', '#fff0a0', '#f6d27a'] });
          this.add({ x: e.x, y: e.y, max: 14, colors: ['#fff6c8'], ring: { rx: 10, ry: 10 } });
          break;
        case 'drop':
          this.dust(e.x, e.y + 4, 5, ['#bdb6cc', '#9088a4'], 0.8, 0.3);
          break;
        case 'unlock':
        case 'gateMove':
          for (let i = 0; i < 8; i++) this.add({ x: e.x + rand(-4, 4), y: e.y + rand(0, 4), vx: rand(-0.3, 0.3), vy: rand(0, 0.6), g: 0.06, max: 40, colors: [theme.stone[4], theme.stone[3]] });
          break;
        case 'break':
          for (let i = 0; i < 6; i++) this.add({ x: e.x + rand(-3, 3), y: e.y + rand(-3, 3), vx: rand(-1.6, 1.6), vy: -rand(0.5, 2.5), g: 0.22, drag: 0.99, max: 50, colors: [theme.stone[4], theme.stone[2]], size: Math.random() > 0.5 ? 2 : 1 });
          this.dust(e.x, e.y + 4, 3, dustCols, 1, 0.5);
          this.shakeT = 6;
          this.shakeK = 1;
          break;
        case 'bell':
          for (let k = 0; k < (e.big ? 3 : 2); k++) this.add({ x: e.x, y: e.y, life: -k * 8, max: 34, colors: ['#f6d27a', '#c08a2a'], ring: { rx: 30 + k * 10, ry: 18 + k * 6 } });
          break;
        case 'plank':
          if (e.down) for (let i = 0; i < 6; i++) this.add({ x: e.x + rand(-16, 16), y: e.y, vx: rand(-0.6, 0.6), vy: rand(0, 1), g: 0.15, max: 40, colors: ['#a07a48', '#7a5232'] });
          break;
        case 'rope':
          this.dust(e.x, e.y + 8, 4, ['#a87a48', '#c8ac78'], 0.6, 0.2);
          break;
        case 'relic':
          this.shots.push({ fx: createFx(heal as unknown as FxModule, { x: e.x, y: e.y + 8, seed: Math.floor(Math.random() * 100) }), layer: 'world' });
          this.shakeT = 8;
          this.shakeK = 1;
          break;
        case 'crown':
          this.shots.push({ fx: createFx(featherBurst as unknown as FxModule, { x: e.x, y: e.y - 6 }), layer: 'world' });
          this.halo = { fx: createFx(sunburst as unknown as FxModule, { x: e.x, y: e.y - 16 }), x: e.x, y: e.y - 16 };
          this.shakeT = 20;
          this.shakeK = 2;
          break;
      }
    }
  }

  update(): void {
    this.tick++;
    for (const p of this.parts) {
      p.life++;
      if (p.life < 0) continue;
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.g;
      p.x += p.vx;
      p.y += p.vy;
    }
    this.parts = this.parts.filter((p) => p.life < p.max);
    for (const s of this.shots) s.fx.update(1 / 60);
    this.shots = this.shots.filter((s) => !s.fx.done());
    this.halo?.fx.update(1 / 60);
    if (this.shakeT > 0) this.shakeT--;
  }

  /** Vertical shake offset for the camera this frame. */
  get shake(): number {
    return this.shakeT > 0 ? Math.round((Math.random() * 2 - 1) * this.shakeK) : 0;
  }

  /** The aurora over the Frozen Spire (behind clouds and layers). */
  drawSky(ctx: CanvasRenderingContext2D, theme: Theme, alpha = 1): void {
    if (theme.id !== 'frozen' || alpha <= 0) return;
    if (this.tick % 2 === 0) {
      for (const a of this.auroras) a.update(2 / 60);
      this.skyCanvas.render(this.auroras, 0, 0);
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(this.skyCanvas.canvas, 0, 0);
    ctx.restore();
  }

  /** Light beams through the Bell Hall's windows (over the scene, before lighting). */
  drawRays(ctx: CanvasRenderingContext2D, theme: Theme): void {
    if (theme.id !== 'bells') return;
    if (this.tick % 2 === 0) {
      for (const r of this.rays) r.update(2 / 60);
      this.rayCanvas.render(this.rays, 0, 0);
    }
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(this.rayCanvas.canvas, 0, 0);
    ctx.restore();
  }

  /** Particles and one-shot pixelfx effects, in world coordinates. */
  drawWorld(ctx: CanvasRenderingContext2D, camY: number): void {
    for (const p of this.parts) {
      if (p.life < 0) continue;
      const t = p.life / p.max;
      const c = p.colors[Math.min(p.colors.length - 1, Math.floor(t * p.colors.length))];
      ctx.fillStyle = c;
      ctx.globalAlpha = t > 0.6 ? Math.max(0, (1 - t) / 0.4) : 1;
      if (p.ring) {
        const rx = p.ring.rx * (0.3 + t * 0.7);
        const ry = p.ring.ry * (0.3 + t * 0.7);
        const n = Math.max(8, Math.round(rx * 1.2));
        for (let i = 0; i < n; i++) {
          if ((i + p.life) % 3 === 0) continue;
          const a = (i / n) * Math.PI * 2;
          ctx.fillRect(Math.round(p.x + Math.cos(a) * rx), Math.round(p.y - camY + Math.sin(a) * ry), 1, 1);
        }
      } else ctx.fillRect(Math.round(p.x), Math.round(p.y - camY), p.size, p.size);
    }
    ctx.globalAlpha = 1;
    const fxs = this.shots.map((s) => s.fx);
    if (this.halo) fxs.push(this.halo.fx);
    if (fxs.length) {
      this.shotCanvas.render(fxs, 0, camY);
      ctx.drawImage(this.shotCanvas.canvas, 0, 0);
    }
  }

  /** Little stars circling the head while stumbling. */
  drawStun(ctx: CanvasRenderingContext2D, player: Player, camY: number, t: number): void {
    if (player.state !== 'stumble' || player.stumbleLeft > 30) return;
    const cx = player.body.x + player.body.w / 2;
    const cy = player.feetY - 14 - camY;
    for (let i = 0; i < 3; i++) {
      const a = t * 0.15 + (i * Math.PI * 2) / 3;
      const x = Math.round(cx + Math.cos(a) * 7);
      const y = Math.round(cy + Math.sin(a) * 2);
      ctx.fillStyle = '#ffe36e';
      ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = 'rgba(255, 246, 200, 0.8)';
      ctx.fillRect(x - 1, y, 1, 1);
      ctx.fillRect(x + 1, y, 1, 1);
      ctx.fillRect(x, y - 1, 1, 1);
      ctx.fillRect(x, y + 1, 1, 1);
    }
  }
}
