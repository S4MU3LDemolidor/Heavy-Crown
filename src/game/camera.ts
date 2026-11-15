import { SCREEN_H, TUNING, VIEW_CROP } from './tuning';

/** Shows one screen at a time and slides between screens. Bands are counted from the top of the tower. */
export class Camera {
  readonly bandCount: number;
  band: number;
  /** World y of the top of the view in pixels (fractional during a slide). */
  y: number;
  private fromY = 0;
  private toY = 0;
  private slideFrame = 0;
  private slideTotal = 0;

  constructor(bandCount: number, startBand = bandCount - 1) {
    this.bandCount = bandCount;
    this.band = startBand;
    this.y = this.bandTop(startBand);
  }

  bandTop(band: number): number {
    return band * SCREEN_H + VIEW_CROP;
  }

  bandAt(worldY: number): number {
    return Math.min(this.bandCount - 1, Math.max(0, Math.floor(worldY / SCREEN_H)));
  }

  /** Screen number counted from the bottom of the tower, starting at 0. */
  get screenFromBottom(): number {
    return this.bandCount - 1 - this.band;
  }

  snapTo(worldY: number): void {
    this.band = this.bandAt(worldY);
    this.y = this.bandTop(this.band);
    this.slideFrame = this.slideTotal;
  }

  update(focusY: number): void {
    const target = this.bandAt(focusY);
    if (target !== this.band) {
      this.band = target;
      this.fromY = this.y;
      this.toY = this.bandTop(target);
      this.slideFrame = 0;
      this.slideTotal = TUNING.cameraSlideFrames;
    }
    if (this.slideFrame < this.slideTotal) {
      this.slideFrame++;
      const t = this.slideFrame / this.slideTotal;
      const eased = 1 - Math.pow(1 - t, 3);
      this.y = this.fromY + (this.toY - this.fromY) * eased;
    }
  }
}
