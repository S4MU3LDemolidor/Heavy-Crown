import { VIEW_H, VIEW_W } from '../game/tuning';

/** Draws into a 480×270 view, then copies it to the page canvas at the largest whole-number scale. */
export class Renderer {
  readonly view: CanvasRenderingContext2D;
  scale = 1;
  private readonly canvas: HTMLCanvasElement;
  private readonly viewCanvas: HTMLCanvasElement;
  private readonly out: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.viewCanvas = document.createElement('canvas');
    this.viewCanvas.width = VIEW_W;
    this.viewCanvas.height = VIEW_H;
    const view = this.viewCanvas.getContext('2d');
    const out = canvas.getContext('2d');
    if (!view || !out) throw new Error('Canvas 2D is not available');
    this.view = view;
    this.out = out;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const fit = Math.min((window.innerWidth * dpr) / VIEW_W, (window.innerHeight * dpr) / VIEW_H);
    this.scale = Math.max(1, Math.floor(fit));
    this.canvas.width = VIEW_W * this.scale;
    this.canvas.height = VIEW_H * this.scale;
    this.canvas.style.width = `${(VIEW_W * this.scale) / dpr}px`;
    this.canvas.style.height = `${(VIEW_H * this.scale) / dpr}px`;
  }

  present(): void {
    this.out.imageSmoothingEnabled = false;
    this.out.drawImage(this.viewCanvas, 0, 0, this.canvas.width, this.canvas.height);
  }
}
