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

/** The remake's scale: the climber and every distance and speed of movement are 1.5× the MVP's (remake spec 5.1). */
export const SCALE = 1.5;

/**
 * Movement constants at weight 0 (spec section 4, scaled by SCALE). Units: pixels, frames (60 per second).
 * Kept mutable so tuning and debug tools can change them live.
 */
export const TUNING = {
  gravity: 0.3 * SCALE,
  maxFall: 9 * SCALE,
  walkSpeed: 1.0 * SCALE,
  chargeFrames: 36,
  minJump: 12 * SCALE,
  maxJump: 80 * SCALE,
  jumpSpeedX: 2.2 * SCALE,
  wallBounce: 0.5,
  hardLandingFall: 136 * SCALE,
  stumbleFrames: 40,
  overloadedHop: 14 * SCALE,
  bodyW: 14,
  bodyH: 27,
  cameraSlideFrames: 11,
};
