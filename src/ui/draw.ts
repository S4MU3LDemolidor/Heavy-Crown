import { LINE_H, rasterText, textWidth, wrapText } from '../art/font';

export const UI = {
  ink: '#ece6f4',
  dim: '#9a92ae',
  gold: '#f6d27a',
  red: '#ff8a7a',
  shadow: '#0a0710',
  panel: '#17121f',
  panelEdge: '#4a3f63',
  panelLight: '#6e6290',
  paper: '#e8dcbc',
  paperEdge: '#8a7650',
  paperInk: '#3a2a20',
};

export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = UI.ink, shadow: string | null = UI.shadow): void {
  if (shadow) {
    ctx.fillStyle = shadow;
    rasterText(text, x + 1, y + 1, (px, py) => ctx.fillRect(px, py, 1, 1));
  }
  ctx.fillStyle = color;
  rasterText(text, x, y, (px, py) => ctx.fillRect(px, py, 1, 1));
}

export function drawTextCentered(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, color = UI.ink, shadow: string | null = UI.shadow): void {
  drawText(ctx, text, Math.round(cx - textWidth(text) / 2), y, color, shadow);
}

/** Wrapped text; returns the height used. */
export function drawParagraph(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, color: string, shadow: string | null = null): number {
  const lines = wrapText(text, maxW);
  lines.forEach((line, i) => drawText(ctx, line, x, y + i * LINE_H, color, shadow));
  return lines.length * LINE_H;
}

/** A dark panel with a bevelled border and clipped corners. */
export function drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = UI.panel, edge = UI.panelEdge, light = UI.panelLight): void {
  ctx.fillStyle = edge;
  ctx.fillRect(x + 1, y, w - 2, h);
  ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = light;
  ctx.fillRect(x + 2, y + 1, w - 4, 1);
}

export function dimScreen(ctx: CanvasRenderingContext2D, alpha = 0.55): void {
  ctx.fillStyle = `rgba(6, 4, 10, ${alpha})`;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export { textWidth, LINE_H };
