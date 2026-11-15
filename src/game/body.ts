import type { CollisionWorld } from './tiles';

/** An axis-aligned box at whole-pixel coordinates, with sub-pixel remainders. */
export interface Body {
  x: number;
  y: number;
  w: number;
  h: number;
  remX: number;
  remY: number;
}

export function makeBody(x: number, y: number, w: number, h: number): Body {
  return { x, y, w, h, remX: 0, remY: 0 };
}

/** Moves horizontally one pixel at a time. Returns true if a wall stopped the move. */
export function moveX(body: Body, amount: number, world: CollisionWorld): boolean {
  body.remX += amount;
  let move = Math.round(body.remX);
  if (move === 0) return false;
  body.remX -= move;
  const step = Math.sign(move);
  while (move !== 0) {
    if (world.solidRect(body.x + step, body.y, body.w, body.h)) {
      body.remX = 0;
      return true;
    }
    body.x += step;
    move -= step;
  }
  return false;
}

/** Moves vertically one pixel at a time. Returns true if a floor or ceiling stopped the move. */
export function moveY(body: Body, amount: number, world: CollisionWorld): boolean {
  body.remY += amount;
  let move = Math.round(body.remY);
  if (move === 0) return false;
  body.remY -= move;
  const step = Math.sign(move);
  while (move !== 0) {
    if (world.solidRect(body.x, body.y + step, body.w, body.h)) {
      body.remY = 0;
      return true;
    }
    body.y += step;
    move -= step;
  }
  return false;
}

/** True if something solid is directly under the body's feet. */
export function onGround(body: Body, world: CollisionWorld): boolean {
  return world.solidRect(body.x, body.y + body.h, body.w, 1);
}
