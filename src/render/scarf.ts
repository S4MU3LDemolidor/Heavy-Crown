/** A short pixel chain that trails from the neck and streams during falls (spec section 10). */
export class Scarf {
  readonly pts: { x: number; y: number; px: number; py: number }[] = [];
  private readonly seg = 2.2;

  constructor(x: number, y: number, n = 5) {
    for (let i = 0; i < n; i++) this.pts.push({ x: x - i * this.seg, y, px: x - i * this.seg, py: y });
  }

  /** Moves the root to the neck and steps the chain. `facing` picks which way it hangs at rest. */
  update(nx: number, ny: number, facing: number, vx: number, vy: number, t: number): void {
    const p0 = this.pts[0];
    p0.x = p0.px = nx;
    p0.y = p0.py = ny;
    for (let i = 1; i < this.pts.length; i++) {
      const p = this.pts[i];
      const dx = (p.x - p.px) * 0.82;
      const dy = (p.y - p.py) * 0.82;
      p.px = p.x;
      p.py = p.y;
      // drift behind the body, a little wind sway, gravity; air drag pulls against motion
      const sway = Math.sin(t * 0.08 + i * 0.9) * 0.05;
      p.x += dx - facing * 0.12 - vx * 0.08 + sway;
      p.y += dy + 0.1 - vy * 0.06;
    }
    for (let k = 0; k < 3; k++) {
      for (let i = 1; i < this.pts.length; i++) {
        const a = this.pts[i - 1];
        const b = this.pts[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = (d - this.seg) / d;
        b.x -= dx * f;
        b.y -= dy * f;
      }
    }
  }
}
