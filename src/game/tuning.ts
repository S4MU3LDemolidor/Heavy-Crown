/** Size of one tile in pixels. */
export const TILE = 8;
/** One screen is 60×34 tiles (480×272 px). */
export const SCREEN_COLS = 60;
export const SCREEN_ROWS = 34;
export const SCREEN_W = TILE * SCREEN_COLS;
export const SCREEN_H = TILE * SCREEN_ROWS;
/** The view is 480×270: one pixel row of each screen is hidden at the top and bottom. */
export const VIEW_W = 480;
export const VIEW_H = 270;
export const VIEW_CROP = 1;

/**
 * Movement constants at weight 0 (spec section 4). Units: pixels, frames (60 per second).
 * Kept mutable so tuning and debug tools can change them live.
 */
export const TUNING = {
  gravity: 0.3,
  maxFall: 9,
  walkSpeed: 1.0,
  chargeFrames: 36,
  minJump: 12,
  maxJump: 80,
  jumpSpeedX: 2.2,
  wallBounce: 0.5,
  hardLandingFall: 136,
  stumbleFrames: 40,
  overloadedHop: 14,
  bodyW: 10,
  bodyH: 18,
  cameraSlideFrames: 11,
};
