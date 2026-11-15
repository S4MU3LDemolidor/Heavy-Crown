import { PixelBuffer } from '../art/buffer';
import { hex, mix, toHex, withAlpha } from '../art/color';
import { bayer, fbm, rng } from '../art/noise';
import type { Tuft, Vine } from '../art/terrain';
import type { Theme, ThemeId } from '../content/themes';
import type { World } from '../game/level';
import type { Player } from '../game/player';
import { SCREEN_H, TILE, VIEW_H, VIEW_W } from '../game/tuning';
import { toCanvas } from './canvas';

const CLOUD_W = 960;

const CLOUD_COLORS: Partial<Record<ThemeId, [string, string, string]>> = {
  overgrown: ['#7a4a68', '#c27a78', '#f2b48a'],
  bells: ['#8a4a4a', '#d08a60', '#f6c890'],
  frozen: ['#141c3a', '#202c52', '#33467a'],
};

/** A horizontally tileable band of dithered clouds, lit from below-right by the low sun. */
function paintClouds(theme: Theme, h: number, seed: number, cover: number): PixelBuffer | null {
  const cols = CLOUD_COLORS[theme.id];
  if (!cols) return null;
  const [dark, midc, light] = cols.map((c) => hex(c));
  const buf = new PixelBuffer(CLOUD_W, h);
  const f = (x: number, y: number) => fbm(x * 0.45, y * 1.7, 46, 4, seed);
  const n = (x: number, y: number) => f(x, y) * ((CLOUD_W - x) / CLOUD_W) + f(x - CLOUD_W, y) * (x / CLOUD_W);
  for (let y = 0; y < h; y++) {
    const fade = Math.sin((y / h) * Math.PI);
    for (let x = 0; x < CLOUD_W; x++) {
      const v = (n(x, y) - (1 - cover)) * 3 * fade;
      if (v <= bayer(x, y) * 0.9) continue;
      const below = (n(x, y + 3) - (1 - cover)) * 3;
      const lit = v - below;
      const c = lit > 0.25 ? light : lit > -0.05 ? midc : dark;
      buf.set(x, y, withAlpha(v > 0.9 ? c : mix(c, dark, 0.2), 230));
    }
  }
  return buf;
}

interface Bird {
  x: number;
  y: number;
  vx: number;
  phase: number;
}

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  seed: number;
}

/** Things that move on their own: clouds, birds, particles and foliage (so the tower is never still). */
export class Ambient {
  private readonly world: World;
  private readonly clouds = new Map<ThemeId, [HTMLCanvasElement, HTMLCanvasElement] | null>();
  private birds: Bird[] = [];
  private birdTimer = 240;
  private motes: Mote[] = [];
  private moteBand = -1;
  private readonly r = rng(2024);
  private readonly dripSources = new Map<number, number[][]>();

  constructor(world: World) {
    this.world = world;
  }

  private cloudPair(theme: Theme): [HTMLCanvasElement, HTMLCanvasElement] | null {
    if (!this.clouds.has(theme.id)) {
      const far = paintClouds(theme, 70, 3, 0.42);
      const near = paintClouds(theme, 60, 9, 0.38);
      this.clouds.set(theme.id, far && near ? [toCanvas(far), toCanvas(near)] : null);
    }
    return this.clouds.get(theme.id) ?? null;
  }

  /** Clouds drifting across the sky (between the sky gradient and the far layer). */
  drawClouds(ctx: CanvasRenderingContext2D, theme: Theme, t: number): void {
    const pair = this.cloudPair(theme);
    if (!pair) return;
    const [far, near] = pair;
    const fx = -((t * 0.05) % CLOUD_W);
    ctx.drawImage(far, Math.round(fx), 26);
    ctx.drawImage(far, Math.round(fx) + CLOUD_W, 26);
    const nx = -((t * 0.13) % CLOUD_W);
    ctx.drawImage(near, Math.round(nx), 88);
    ctx.drawImage(near, Math.round(nx) + CLOUD_W, 88);
  }

  /** Small flocks crossing the far sky (drawn just in front of the far layer). */
  drawBirds(ctx: CanvasRenderingContext2D, theme: Theme, t: number): void {
    if (theme.id !== 'overgrown' && theme.id !== 'bells') {
      this.birds = [];
      return;
    }
    if (--this.birdTimer <= 0) {
      this.birdTimer = 500 + Math.floor(this.r() * 700);
      const dir = this.r() > 0.5 ? 1 : -1;
      const y = 40 + this.r() * 90;
      const n = 3 + Math.floor(this.r() * 4);
      const speed = 0.35 + this.r() * 0.35;
      for (let i = 0; i < n; i++) {
        this.birds.push({ x: (dir > 0 ? -10 : VIEW_W + 10) - dir * i * (6 + this.r() * 5), y: y + (i % 2) * 3 + this.r() * 4 + i * 1.5, vx: speed * dir, phase: this.r() * 6 });
      }
    }
    ctx.fillStyle = theme.near[0];
    this.birds = this.birds.filter((b) => {
      b.x += b.vx;
      b.y += Math.sin((t + b.phase * 20) * 0.03) * 0.08;
      const up = Math.sin(t * 0.25 + b.phase) > 0;
      const x = Math.round(b.x);
      const y = Math.round(b.y);
      ctx.fillRect(x, y, 1, 1);
      ctx.fillRect(x - 1, y + (up ? -1 : 0), 1, 1);
      ctx.fillRect(x + 1, y + (up ? -1 : 0), 1, 1);
      if (up) {
        ctx.fillRect(x - 2, y - 2, 1, 1);
        ctx.fillRect(x + 2, y - 2, 1, 1);
      } else {
        ctx.fillRect(x - 2, y + 1, 1, 1);
        ctx.fillRect(x + 2, y + 1, 1, 1);
      }
      return b.x > -30 && b.x < VIEW_W + 30;
    });
  }

  /** Grass tufts and ivy, swaying; grass leans away from the climber's feet. */
  drawFoliage(ctx: CanvasRenderingContext2D, tufts: Tuft[], vines: Vine[], camY: number, t: number, player: Player, gust: number): void {
    const breeze = 1 + gust * 1.8;
    for (const v of vines) {
      const y0 = v.y - camY;
      if (y0 > VIEW_H || y0 + v.path.length < 0) continue;
      const n = v.path.length;
      for (let k = 0; k < n; k++) {
        const f = (k / n) ** 1.3;
        const dx = v.path[k] + Math.round(Math.sin(t * 0.03 + v.seed + k * 0.12) * f * 2.2 * breeze);
        const x = v.x + dx;
        ctx.fillStyle = toHex(k % 4 === 3 ? v.light : v.dark);
        ctx.fillRect(x, y0 + k, 1, 1);
        if (k % 4 === 2) {
          const side = Math.floor(k / 4) % 2 === 0 ? 1 : -1;
          ctx.fillStyle = toHex(v.leaf);
          ctx.fillRect(x + side, y0 + k, 1, 1);
          ctx.fillStyle = toHex(v.light);
          ctx.fillRect(x + side, y0 + k - 1, 1, 1);
        }
      }
    }
    const pcx = player.body.x + player.body.w / 2;
    const pfy = player.feetY;
    const grounded = player.state === 'ground' || player.state === 'charge';
    let lastColor = -1;
    for (const g of tufts) {
      const y0 = g.y - camY;
      if (y0 < -4 || y0 > VIEW_H + 4) continue;
      let lean = Math.sin(t * 0.045 + g.x * 0.31) * 0.8 + Math.sin(t * 0.017 + g.x * 0.05) * 0.6;
      lean *= breeze;
      const dx = g.x - pcx;
      if (grounded && Math.abs(dx) < 8 && Math.abs(pfy - g.y) < 3) lean += Math.sign(dx || 1) * (8 - Math.abs(dx)) * 0.35;
      for (let k = 1; k <= g.len; k++) {
        const c = k === g.len ? g.tip : g.body;
        if (c !== lastColor) {
          ctx.fillStyle = toHex(c);
          lastColor = c;
        }
        const off = g.len === 1 ? 0 : Math.round(lean * (k / g.len));
        ctx.fillRect(g.x + off, y0 - k, 1, 1);
      }
      if (g.flower) {
        const off = Math.round(lean);
        ctx.fillStyle = toHex(g.flower);
        ctx.fillRect(g.x + off, y0 - g.len - 1, 1, 1);
        lastColor = -1;
      }
    }
  }

  /** Where drips can fall from in a band: undersides of stone with open space below. */
  private drips(band: number): number[][] {
    let list = this.dripSources.get(band);
    if (!list) {
      list = [];
      const grid = this.world.grid;
      const ty0 = band * (SCREEN_H / TILE);
      for (let ty = ty0; ty < ty0 + SCREEN_H / TILE; ty++)
        for (let tx = 0; tx < grid.cols; tx++) if (grid.isSolid(tx, ty) && !grid.isSolid(tx, ty + 1)) list.push([tx * TILE + 2 + ((tx * 7 + ty) % 5), (ty + 1) * TILE]);
      this.dripSources.set(band, list);
    }
    return list;
  }

  /** Level particles: fireflies, dust motes, drips, wisps, snow. Drawn over the lit scene. */
  drawParticles(ctx: CanvasRenderingContext2D, theme: Theme, band: number, camY: number, wind: number): void {
    if (band !== this.moteBand) {
      this.moteBand = band;
      this.motes = [];
    }
    const top = band * SCREEN_H;
    const want = { fireflies: 22, motes: 46, drips: 10, wisps: 6, snow: 110 }[theme.particles];
    while (this.motes.length < want) {
      const fresh = this.motes.length === 0 || theme.particles !== 'snow';
      this.motes.push({
        x: this.r() * VIEW_W,
        y: top + (theme.particles === 'snow' && !fresh ? -4 : this.r() * SCREEN_H),
        vx: 0,
        vy: 0,
        life: Math.floor(this.r() * 400),
        seed: this.r() * 100,
      });
    }
    const style = theme.particles;
    for (const m of this.motes) {
      m.life++;
      switch (style) {
        case 'fireflies': {
          m.x += Math.sin(m.life * 0.021 + m.seed) * 0.25;
          m.y += Math.cos(m.life * 0.017 + m.seed * 2) * 0.18;
          const glow = (Math.sin(m.life * 0.05 + m.seed) + 1) / 2;
          if (glow < 0.25) break;
          const x = Math.round(m.x);
          const y = Math.round(m.y - camY);
          ctx.fillStyle = `rgba(214, 255, 90, ${(glow * 0.35).toFixed(2)})`;
          ctx.fillRect(x - 1, y, 3, 1);
          ctx.fillRect(x, y - 1, 1, 3);
          ctx.fillStyle = `rgba(244, 255, 184, ${glow.toFixed(2)})`;
          ctx.fillRect(x, y, 1, 1);
          break;
        }
        case 'motes': {
          m.x += Math.sin(m.life * 0.01 + m.seed) * 0.12 + 0.05;
          m.y -= 0.05 + Math.sin(m.seed) * 0.03;
          if (m.y < top) m.y = top + SCREEN_H;
          if (m.x > VIEW_W) m.x = 0;
          const a = 0.25 + ((Math.sin(m.life * 0.03 + m.seed) + 1) / 2) * 0.45;
          ctx.fillStyle = `rgba(255, 230, 170, ${a.toFixed(2)})`;
          ctx.fillRect(Math.round(m.x), Math.round(m.y - camY), 1, 1);
          break;
        }
        case 'drips': {
          const src = this.drips(band);
          if (m.vy === 0 && src.length) {
            if (this.r() < 0.004) {
              const s = src[Math.floor(this.r() * src.length)];
              m.x = s[0];
              m.y = s[1];
              m.vy = 0.1;
            } else break;
          }
          if (m.vy > 0) {
            m.vy = Math.min(5, m.vy + 0.18);
            m.y += m.vy;
            const tx = Math.floor(m.x / TILE);
            const ty = Math.floor(m.y / TILE);
            const g = this.world.grid;
            if (g.isSolid(tx, ty) || g.get(tx, ty) === 2) {
              m.vy = 0;
              m.seed = 6; // splash frames
              m.life = 0;
            }
            ctx.fillStyle = 'rgba(168, 232, 224, 0.85)';
            ctx.fillRect(Math.round(m.x), Math.round(m.y - camY), 1, 2);
          }
          if (m.vy === 0 && m.seed > 0 && m.seed <= 6 && m.life < 6) {
            ctx.fillStyle = 'rgba(168, 232, 224, 0.6)';
            const y = Math.round(m.y - camY) - 1;
            ctx.fillRect(Math.round(m.x) - 1 - (m.life >> 1), y, 1, 1);
            ctx.fillRect(Math.round(m.x) + 1 + (m.life >> 1), y, 1, 1);
          }
          break;
        }
        case 'wisps': {
          m.x += Math.sin(m.life * 0.008 + m.seed) * 0.3;
          m.y += Math.cos(m.life * 0.006 + m.seed) * 0.2;
          const x = Math.round(m.x);
          const y = Math.round(m.y - camY);
          const a = 0.5 + Math.sin(m.life * 0.04 + m.seed) * 0.3;
          ctx.fillStyle = `rgba(42, 208, 184, ${(a * 0.35).toFixed(2)})`;
          ctx.fillRect(x - 2, y - 1, 5, 3);
          ctx.fillRect(x - 1, y - 2, 3, 5);
          ctx.fillStyle = `rgba(154, 255, 230, ${a.toFixed(2)})`;
          ctx.fillRect(x, y, 1, 1);
          for (let k = 1; k < 5; k++) {
            ctx.fillStyle = `rgba(42, 208, 184, ${(a * (0.4 - k * 0.08)).toFixed(2)})`;
            ctx.fillRect(Math.round(x - Math.sin(m.life * 0.008 + m.seed) * k * 2), y + k, 1, 1);
          }
          break;
        }
        case 'snow': {
          m.vy = 0.35 + (m.seed % 1) * 0.3;
          m.vx = Math.sin(m.life * 0.02 + m.seed) * 0.2 + wind * 40;
          m.x += m.vx;
          m.y += m.vy;
          if (m.x < -4) m.x += VIEW_W + 8;
          if (m.x > VIEW_W + 4) m.x -= VIEW_W + 8;
          if (m.y > top + SCREEN_H) m.y = top - 2;
          const big = m.seed % 1 > 0.7;
          ctx.fillStyle = big ? 'rgba(240, 246, 255, 0.95)' : 'rgba(210, 225, 250, 0.7)';
          ctx.fillRect(Math.round(m.x), Math.round(m.y - camY), big ? 2 : 1, big ? 2 : 1);
          break;
        }
      }
    }
  }

  /** Light sources from particles that glow (wisps). */
  particleLights(theme: Theme): { x: number; y: number; r: number; color: string }[] {
    if (theme.particles !== 'wisps') return [];
    return this.motes.map((m) => ({ x: m.x, y: m.y, r: 20, color: '#2ad0b8' }));
  }
}

