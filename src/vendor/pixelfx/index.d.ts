/** Minimal types for the vendored pixelfx runtime (https://github.com/patch-gg/pixelfx, MIT). */
export interface Frame {
  w: number;
  h: number;
  ox: number;
  oy: number;
  color: Uint32Array;
  light: Uint32Array;
}
export interface FxModule {
  meta: { duration?: number; loop?: boolean; size?: [number, number]; origin?: [number, number]; options?: Record<string, unknown> };
}
export interface FxInstance {
  update(dt: number): void;
  draw(frame: Frame, layer?: 'back' | 'front'): void;
  stop(): void;
  done(): boolean;
  readonly t: number;
}
export function createFrame(w: number, h: number, ox?: number, oy?: number): Frame;
export function clearFrame(f: Frame): Frame;
export function createFx(mod: FxModule, o?: Record<string, unknown>): FxInstance;
export function composite(f: Frame, out: Uint8ClampedArray, bg?: number | Uint32Array | null, lightK?: number): Uint8ClampedArray;
